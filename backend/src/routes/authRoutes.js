import { Router } from 'express';
import { register, login, me, logout } from '../controllers/authController.js';
import { googleLogin } from '../controllers/googleAuthController.js';
import { protect } from '../middleware/auth.js';
import { authRateLimiter, loginRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', authRateLimiter, register); // bootstrap super admin only
router.post('/login', loginRateLimiter, login);
router.post('/google', authRateLimiter, googleLogin);
router.get('/me', protect, me);
router.post('/logout', protect, logout);

export default router;
