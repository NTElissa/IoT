import { Router } from 'express';
import { getAlerts } from '../controllers/alertController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', getAlerts);

export default router;
