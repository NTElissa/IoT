import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import env from '../config/env.js';
import { completeLogin, checkHospitalActive } from './authController.js';
import { recordLoginEvent } from '../services/loginAudit.js';
import { success, failure } from '../utils/apiResponse.js';

const client = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

// Signs in with an existing account whose email matches a verified Google
// account. This never creates a new account - DripWatch accounts are
// always provisioned by a Super Admin or hospital Admin first. This keeps
// the "who can access this hospital's data" decision in the hands of the
// people responsible for it, while still letting staff use Google's
// sign-in UX instead of typing a password.
export const googleLogin = async (req, res) => {
  if (!client) {
    return failure(res, {
      message: 'Google Sign-In is not configured on this server yet',
      status: 501,
    });
  }

  const { idToken } = req.body;
  if (!idToken) return failure(res, { message: 'idToken is required', status: 400 });

  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch (err) {
    await recordLoginEvent(req, { success: false, method: 'google', reason: 'invalid_token' });
    return failure(res, { message: 'Google sign-in could not be verified', status: 401 });
  }

  if (!payload?.email_verified) {
    return failure(res, { message: 'Your Google email address is not verified', status: 401 });
  }

  const user = await User.findOne({ email: payload.email.toLowerCase() });
  if (!user || !user.isActive) {
    await recordLoginEvent(req, {
      email: payload.email,
      success: false,
      method: 'google',
      reason: 'no_matching_account',
    });
    return failure(res, {
      message: 'No DripWatch account matches this Google email. Ask your administrator to create one first.',
      status: 404,
    });
  }

  if (!user.googleId) {
    user.googleId = payload.sub;
    await user.save();
  }

  if (!(await checkHospitalActive(user, res))) {
    await recordLoginEvent(req, { user, success: false, method: 'google', reason: 'hospital_suspended' });
    return;
  }

  return completeLogin(req, res, user, 'google');
};

export default { googleLogin };
