import { Router } from 'express';
import {
  getDashboardStats,
  getSystemActivity
} from '../controllers/dashboard.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas
router.get('/stats', authenticateToken, getDashboardStats);
router.get('/activity', authenticateToken, requireAdmin, getSystemActivity);

export default router;
