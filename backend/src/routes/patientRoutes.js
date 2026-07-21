import { Router } from 'express';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getPatients);
router.get('/:id', getPatient);
router.post('/', authorize('admin'), createPatient);
router.put('/:id', authorize('admin', 'doctor', 'nurse'), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);

export default router;
