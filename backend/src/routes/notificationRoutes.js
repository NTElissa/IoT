import { Router } from 'express';
import { getNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getNotifications);
router.patch('/:id/read', markRead);
router.patch('/read-all', markAllRead);

export default router;
