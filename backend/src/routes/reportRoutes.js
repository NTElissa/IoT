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
// Doctors and nurses get the same report set as admins, automatically
// scoped to their own patients/tasks/rooms inside the controller.
router.get('/response-times', authorize('admin', 'doctor', 'nurse'), responseTimes);
router.get('/complications', authorize('admin', 'doctor', 'nurse'), complications);
router.get('/workload', authorize('admin'), workload);
router.get('/task-completion', authorize('admin', 'doctor', 'nurse'), taskCompletion);
router.get('/iv-usage', authorize('admin', 'doctor', 'nurse'), ivUsage);

export default router;
