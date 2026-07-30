import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  changeRole,
  resetPassword,
  deleteUser,
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/role', changeRole);
router.patch('/:id/reset-password', resetPassword);
router.delete('/:id', deleteUser);

export default router;
