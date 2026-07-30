import { Router } from 'express';
import {
  getRegistrationOptions,
  verifyRegistration,
  listCredentials,
  removeCredential,
  getAuthenticationOptions,
  verifyAuthentication,
} from '../controllers/webauthnController.js';
import { protect } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Registering a passkey requires being already signed in.
router.get('/register-options', protect, getRegistrationOptions);
router.post('/register-verify', protect, verifyRegistration);
router.get('/credentials', protect, listCredentials);
router.delete('/credentials/:credentialId', protect, removeCredential);

// Signing in with a passkey - public, but rate-limited like any other
// credential-checking endpoint.
router.post('/login-options', authRateLimiter, getAuthenticationOptions);
router.post('/login-verify', authRateLimiter, verifyAuthentication);

export default router;
