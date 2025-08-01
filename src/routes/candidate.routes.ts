import { Router } from 'express';
import {
  createCandidate,
  getCandidatesByElection,
  getCandidateById,
  updateCandidate,
  deleteCandidate
} from '../controllers/candidate.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, createCandidate);
router.get('/election/:electionId', authenticateToken, getCandidatesByElection);
router.get('/:candidateId', authenticateToken, getCandidateById);
router.put('/:candidateId', authenticateToken, updateCandidate);
router.delete('/:candidateId', authenticateToken, deleteCandidate);

export default router;
