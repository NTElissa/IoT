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
  enablePortalAccess,
  disablePortalAccess,
} from '../controllers/patientController.js';
import { getMessages, sendMessage, markMessagesRead } from '../controllers/chatController.js';
import { getVitals, createVital } from '../controllers/vitalsController.js';
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

// Patient portal access
router.post('/:id/portal-access', authorize('admin', 'doctor', 'nurse'), enablePortalAccess);
router.delete('/:id/portal-access', authorize('admin', 'doctor', 'nurse'), disablePortalAccess);

// Care-team chat (doctor, nurse, delegated staff, and the patient themselves)
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.patch('/:id/messages/read', markMessagesRead);

// Vitals
router.get('/:id/vitals', getVitals);
router.post('/:id/vitals', authorize('admin', 'doctor', 'nurse'), createVital);

export default router;
