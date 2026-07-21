import { Router } from 'express';
import {
  responseTimes,
  complications,
  workload,
  taskCompletion,
  ivUsage,
  overview,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/overview', overview);
router.get('/response-times', authorize('admin'), responseTimes);
router.get('/complications', authorize('admin', 'doctor'), complications);
router.get('/workload', authorize('admin'), workload);
router.get('/task-completion', authorize('admin'), taskCompletion);
router.get('/iv-usage', authorize('admin'), ivUsage);

export default router;
