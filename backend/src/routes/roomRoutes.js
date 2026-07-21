import { Router } from 'express';
import {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  assignStaff,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/', authorize('admin'), createRoom);
router.put('/:id', authorize('admin'), updateRoom);
router.patch('/:id/assign-staff', authorize('admin'), assignStaff);
router.delete('/:id', authorize('admin'), deleteRoom);

export default router;
