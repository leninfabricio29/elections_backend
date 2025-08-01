import { Router } from 'express';
import {
  castVote,
  checkVoterStatus,
  getVotingStatistics,
  getFinalResults
} from '../controllers/vote.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas para votación (pueden necesitar un middleware diferente en producción)
router.post('/cast', castVote);
router.get('/voter/:voterId/election/:electionId/status', checkVoterStatus);
router.get('/election/:electionId/results', getFinalResults);

// Rutas protegidas (requieren autenticación)
router.get('/election/:electionId/statistics', authenticateToken, getVotingStatistics);

export default router;
