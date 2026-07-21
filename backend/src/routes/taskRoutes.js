import { Router } from 'express';
import {
  getTasks,
  createTask,
  updateTaskStatus,
  completeTask,
  escalateTask,
} from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getTasks);
router.post('/', authorize('admin', 'doctor', 'nurse'), createTask);
router.put('/:id', updateTaskStatus);
router.patch('/:id/complete', completeTask);
router.patch('/:id/escalate', authorize('admin', 'doctor', 'nurse'), escalateTask);

export default router;
