import { Router } from 'express';
import {
  createParty,
  getPartiesByElection,
  getPartyById,
  updateParty,
  deleteParty,
  getPartyStatistics
} from '../controllers/party.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, createParty);
router.get('/election/:electionId', authenticateToken, getPartiesByElection);
router.get('/election/:electionId/statistics', authenticateToken, getPartyStatistics);
router.get('/:partyId', authenticateToken, getPartyById);
router.put('/:partyId', authenticateToken, updateParty);
router.delete('/:partyId', authenticateToken, deleteParty);

export default router;
