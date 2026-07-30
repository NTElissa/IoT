import { Router } from 'express';
import {
  setupTwoFactor,
  confirmTwoFactor,
  disableTwoFactor,
  verifyLoginTwoFactor,
} from '../controllers/twoFactorController.js';
import { protect } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/setup', protect, setupTwoFactor);
router.post('/confirm', protect, confirmTwoFactor);
router.post('/disable', protect, disableTwoFactor);
// Public - this is the second step of login, before a full access token exists.
router.post('/verify-login', authRateLimiter, verifyLoginTwoFactor);

export default router;
