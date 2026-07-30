import { Router } from 'express';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientHistory,
  getPatientNotes,
  createPatientNote,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getPatients);
router.get('/:id', getPatient);
router.get('/:id/history', authorize('admin', 'doctor', 'nurse'), getPatientHistory);
router.get('/:id/notes', authorize('admin', 'doctor', 'nurse'), getPatientNotes);
router.post('/:id/notes', authorize('admin', 'doctor', 'nurse'), createPatientNote);
router.post('/', authorize('admin', 'doctor'), createPatient);
router.put('/:id', authorize('admin', 'doctor', 'nurse'), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);

export default router;
