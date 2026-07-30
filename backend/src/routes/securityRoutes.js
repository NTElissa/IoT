import { Router } from 'express';
import { getLoginEvents } from '../controllers/securityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('admin', 'super_admin'));
router.get('/login-events', getLoginEvents);

export default router;
