import { Router } from 'express';
import {
  createElection,
  getAllElections,
  getElectionById,
  updateElection,
  deleteElection,
  getElectionStatistics,
  getMyElections
} from '../controllers/election.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, createElection);
router.get('/', authenticateToken, getAllElections);
router.get('/my-elections', authenticateToken, getMyElections);
router.get('/:electionId', authenticateToken, getElectionById);
router.get('/:electionId/statistics', authenticateToken, getElectionStatistics);
router.put('/:electionId', authenticateToken, updateElection);
router.delete('/:electionId', authenticateToken, deleteElection);

export default router;
