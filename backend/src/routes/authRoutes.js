import { Router } from 'express';
import { register, login, me, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/register', register); // bootstrap first admin only
router.post('/login', login);
router.get('/me', protect, me);
router.post('/logout', protect, logout);

export default router;
