import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  updateUserProfile,
  changePassword,
  deleteUser
} from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);
router.put('/change-password', authenticateToken, changePassword);

// Rutas de administrador (requieren autenticación y rol admin)
router.get('/all', authenticateToken, requireAdmin, getAllUsers);
router.delete('/:userId', authenticateToken, requireAdmin, deleteUser);

export default router;
