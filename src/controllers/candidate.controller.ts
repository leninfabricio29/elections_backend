import { Response } from 'express';
import Candidate from '../schemas/candidate.schema';
import Election from '../schemas/election.schema';
import Party from '../schemas/party.schema';
import Vote from '../schemas/vote.schema';
import { AuthenticatedRequest } from './user.controller';

/**
 * Crear un nuevo candidato
 */
export const createCandidate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { electionId, name, description, partyId } = req.body;

    // Validar campos requeridos
    if (!electionId || !name) {
      res.status(400).json({
        success: false,
        message: 'ID de elección y nombre del candidato son campos obligatorios'
      });
      return;
    }

    // Verificar que la elección existe
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    // Verificar permisos (creador de la elección o admin)
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para agregar candidatos a esta elección'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se pueden agregar candidatos a una elección que ya ha comenzado'
      });
      return;
    }

    // Verificar que el partido existe si se proporciona
    if (partyId) {
      const party = await Party.findOne({ _id: partyId, election: electionId });
      if (!party) {
        res.status(404).json({
          success: false,
          message: 'Partido no encontrado en esta elección'
        });
        return;
      }
    }

    // Crear el candidato
    const newCandidate = new Candidate({
      election: electionId,
      name,
      description,
      party: partyId || null
    });

    const savedCandidate = await newCandidate.save();
    const populatedCandidate = await Candidate.findById(savedCandidate._id)
      .populate('election', 'name')
      .populate('party', 'name description');

    res.status(201).json({
      success: true,
      message: 'Candidato creado exitosamente',
      data: populatedCandidate
    });

  } catch (error) {
    console.error('Error al crear candidato:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear candidato'
    });
  }
};

/**
 * Obtener candidatos de una elección
 */
export const getCandidatesByElection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { electionId } = req.params;

    // Verificar que la elección existe
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    const candidates = await Candidate.find({ election: electionId })
      .populate('party', 'name description logo_url')
      .sort({ name: 1 });

    // Agregar estadísticas de votos a cada candidato
    const candidatesWithVotes = await Promise.all(
      candidates.map(async (candidate) => {
        const voteCount = await Vote.countDocuments({ 
          election: electionId, 
          candidate: candidate._id 
        });
        
        return {
          ...candidate.toObject(),
          voteCount
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Candidatos obtenidos exitosamente',
      data: candidatesWithVotes,
      count: candidatesWithVotes.length
    });

  } catch (error) {
    console.error('Error al obtener candidatos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener candidatos'
    });
  }
};

/**
 * Obtener un candidato por ID
 */
export const getCandidateById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId)
      .populate('election', 'name description startDate endDate')
      .populate('party', 'name description logo_url');

    if (!candidate) {
      res.status(404).json({
        success: false,
        message: 'Candidato no encontrado'
      });
      return;
    }

    // Obtener estadísticas del candidato
    const voteCount = await Vote.countDocuments({ candidate: candidateId });
    const totalElectionVotes = await Vote.countDocuments({ election: candidate.election });

    const candidateData = {
      ...candidate.toObject(),
      statistics: {
        voteCount,
        percentage: totalElectionVotes > 0 ? (voteCount / totalElectionVotes) * 100 : 0
      }
    };

    res.status(200).json({
      success: true,
      message: 'Candidato obtenido exitosamente',
      data: candidateData
    });

  } catch (error) {
    console.error('Error al obtener candidato:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener candidato'
    });
  }
};

/**
 * Actualizar un candidato
 */
export const updateCandidate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { candidateId } = req.params;
    const { name, description, partyId } = req.body;

    // Buscar el candidato
    const candidate = await Candidate.findById(candidateId).populate('election');
    if (!candidate) {
      res.status(404).json({
        success: false,
        message: 'Candidato no encontrado'
      });
      return;
    }

    const election = candidate.election as any;

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este candidato'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se puede modificar un candidato cuando la elección ya ha comenzado'
      });
      return;
    }

    // Verificar que el partido existe si se proporciona
    if (partyId) {
      const party = await Party.findOne({ _id: partyId, election: election._id });
      if (!party) {
        res.status(404).json({
          success: false,
          message: 'Partido no encontrado en esta elección'
        });
        return;
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (partyId !== undefined) updateData.party = partyId || null;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      updateData,
      { new: true, runValidators: true }
    ).populate('election', 'name')
     .populate('party', 'name description');

    res.status(200).json({
      success: true,
      message: 'Candidato actualizado exitosamente',
      data: updatedCandidate
    });

  } catch (error) {
    console.error('Error al actualizar candidato:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar candidato'
    });
  }
};

/**
 * Eliminar un candidato
 */
export const deleteCandidate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { candidateId } = req.params;

    // Buscar el candidato
    const candidate = await Candidate.findById(candidateId).populate('election');
    if (!candidate) {
      res.status(404).json({
        success: false,
        message: 'Candidato no encontrado'
      });
      return;
    }

    const election = candidate.election as any;

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este candidato'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar un candidato cuando la elección ya ha comenzado'
      });
      return;
    }

    // Verificar si hay votos para este candidato
    const voteCount = await Vote.countDocuments({ candidate: candidateId });
    if (voteCount > 0) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar un candidato que ya tiene votos registrados'
      });
      return;
    }

    await Candidate.findByIdAndDelete(candidateId);

    res.status(200).json({
      success: true,
      message: 'Candidato eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar candidato:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar candidato'
    });
  }
};
