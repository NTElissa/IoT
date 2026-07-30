import { Router } from 'express';
import {
  getIVFluids,
  getIVFluid,
  createIVFluid,
  updateIVFluid,
  toggleActive,
  changeBag,
  removeIVFluid,
  deleteIVFluid,
  acknowledgeAlert,
  recordComplication,
} from '../controllers/ivFluidController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getIVFluids);
router.get('/:id', getIVFluid);
router.post('/', authorize('admin', 'doctor', 'nurse'), createIVFluid);
router.put('/:id', authorize('admin', 'doctor', 'nurse'), updateIVFluid);
router.patch('/:id/toggle-active', authorize('admin', 'doctor', 'nurse'), toggleActive);
router.patch('/:id/change-bag', authorize('admin', 'doctor', 'nurse', 'staff'), changeBag);
router.patch('/:id/remove', authorize('admin', 'doctor', 'nurse'), removeIVFluid);
router.delete('/:id', authorize('admin'), deleteIVFluid);
router.patch('/:id/alerts/:alertId/acknowledge', acknowledgeAlert);
router.post('/:id/complications', authorize('admin', 'doctor', 'nurse'), recordComplication);

export default router;
