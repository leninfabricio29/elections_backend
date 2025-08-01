import { Router } from 'express';
import {
  registerVoter,
  getVotersByElection,
  getVoterById,
  findVoterByCedula,
  updateVoter,
  deleteVoter,
  bulkRegisterVoters
} from '../controllers/voter.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas (requieren autenticación)
router.post('/', authenticateToken, registerVoter);
router.post('/bulk', authenticateToken, bulkRegisterVoters);
router.get('/election/:electionId', authenticateToken, getVotersByElection);
router.get('/:voterId', authenticateToken, getVoterById);
router.put('/:voterId', authenticateToken, updateVoter);
router.delete('/:voterId', authenticateToken, deleteVoter);

// Ruta pública para buscar votante por cédula (para el proceso de votación)
router.get('/election/:electionId/cedula/:cedula', findVoterByCedula);

export default router;
