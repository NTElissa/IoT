import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import User from '../models/User.js';
import env from '../config/env.js';
import { completeLogin, checkHospitalActive } from './authController.js';
import { recordLoginEvent } from '../services/loginAudit.js';
import { success, failure } from '../utils/apiResponse.js';

// -- Registering a new passkey for the currently logged-in user ------------

export const getRegistrationOptions = async (req, res) => {
  const user = req.user;

  const options = await generateRegistrationOptions({
    rpName: env.rpName,
    rpID: env.rpId,
    userID: Buffer.from(user._id.toString()),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    excludeCredentials: user.webauthnCredentials.map((c) => ({
      id: Buffer.from(c.credentialId, 'base64url'),
      type: 'public-key',
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  user.currentChallenge = options.challenge;
  await user.save();

  return success(res, { data: options });
};

export const verifyRegistration = async (req, res) => {
  const user = await User.findById(req.user._id).select('+currentChallenge');
  if (!user.currentChallenge) {
    return failure(res, { message: 'No registration in progress. Please try again.', status: 400 });
  }

  const { credential, deviceName } = req.body;

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: env.webauthnOrigin,
      expectedRPID: env.rpId,
    });
  } catch (err) {
    return failure(res, { message: `Passkey registration failed: ${err.message}`, status: 400 });
  }

  const { verified, registrationInfo } = verification;
  if (!verified || !registrationInfo) {
    return failure(res, { message: 'Passkey registration could not be verified', status: 400 });
  }

  const { credentialID, credentialPublicKey, counter } = registrationInfo;
  user.webauthnCredentials.push({
    credentialId: Buffer.from(credentialID).toString('base64url'),
    publicKey: Buffer.from(credentialPublicKey).toString('base64'),
    counter,
    deviceName: deviceName || 'Passkey',
    transports: credential.response?.transports || [],
  });
  user.currentChallenge = undefined;
  await user.save();

  return success(res, { message: 'Passkey registered', data: user.toSafeObject(), status: 201 });
};

export const listCredentials = async (req, res) => {
  return success(res, { data: req.user.toSafeObject().webauthnCredentials });
};

export const removeCredential = async (req, res) => {
  const user = await User.findById(req.user._id);
  const before = user.webauthnCredentials.length;
  user.webauthnCredentials = user.webauthnCredentials.filter((c) => c._id.toString() !== req.params.credentialId);
  if (user.webauthnCredentials.length === before) {
    return failure(res, { message: 'Passkey not found', status: 404 });
  }
  await user.save();
  return success(res, { message: 'Passkey removed' });
};

// -- Signing in with an existing passkey (no password) ----------------------

export const getAuthenticationOptions = async (req, res) => {
  const { email } = req.body;
  if (!email) return failure(res, { message: 'Email is required', status: 400 });

  const user = await User.findOne({ email: email.toLowerCase() }).select('+currentChallenge');
  if (!user || !user.isActive || !user.webauthnCredentials.length) {
    // Deliberately vague - don't reveal whether the account exists or has
    // passkeys registered.
    return failure(res, { message: 'No passkey available for this account', status: 400 });
  }

  const options = await generateAuthenticationOptions({
    rpID: env.rpId,
    userVerification: 'preferred',
    allowCredentials: user.webauthnCredentials.map((c) => ({
      id: Buffer.from(c.credentialId, 'base64url'),
      type: 'public-key',
      transports: c.transports,
    })),
  });

  user.currentChallenge = options.challenge;
  await user.save();

  return success(res, { data: options });
};

export const verifyAuthentication = async (req, res) => {
  const { email, credential } = req.body;
  if (!email || !credential) {
    return failure(res, { message: 'Email and credential are required', status: 400 });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+currentChallenge');
  if (!user || !user.isActive || !user.currentChallenge) {
    await recordLoginEvent(req, { email, success: false, method: 'webauthn', reason: 'no_challenge' });
    return failure(res, { message: 'Passkey sign-in failed', status: 400 });
  }

  const storedCredential = user.webauthnCredentials.find((c) => c.credentialId === credential.id);
  if (!storedCredential) {
    await recordLoginEvent(req, { user, success: false, method: 'webauthn', reason: 'unknown_credential' });
    return failure(res, { message: 'Passkey not recognized for this account', status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: env.webauthnOrigin,
      expectedRPID: env.rpId,
      authenticator: {
        credentialID: Buffer.from(storedCredential.credentialId, 'base64url'),
        credentialPublicKey: Buffer.from(storedCredential.publicKey, 'base64'),
        counter: storedCredential.counter,
      },
    });
  } catch (err) {
    await recordLoginEvent(req, { user, success: false, method: 'webauthn', reason: err.message });
    return failure(res, { message: `Passkey sign-in failed: ${err.message}`, status: 400 });
  }

  const { verified, authenticationInfo } = verification;
  if (!verified) {
    await recordLoginEvent(req, { user, success: false, method: 'webauthn', reason: 'not_verified' });
    return failure(res, { message: 'Passkey sign-in failed', status: 400 });
  }

  storedCredential.counter = authenticationInfo.newCounter;
  user.currentChallenge = undefined;
  await user.save();

  if (!(await checkHospitalActive(user, res))) {
    await recordLoginEvent(req, { user, success: false, method: 'webauthn', reason: 'hospital_suspended' });
    return;
  }

  return completeLogin(req, res, user, 'webauthn');
};

export default {
  getRegistrationOptions,
  verifyRegistration,
  listCredentials,
  removeCredential,
  getAuthenticationOptions,
  verifyAuthentication,
};
