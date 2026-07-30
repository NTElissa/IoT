import { Router } from 'express';
import {
  getHospitals,
  getHospital,
  createHospital,
  updateHospital,
  deleteHospital,
} from '../controllers/hospitalController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('super_admin'));

router.get('/', getHospitals);
router.get('/:id', getHospital);
router.post('/', createHospital);
router.put('/:id', updateHospital);
router.delete('/:id', deleteHospital);

export default router;
