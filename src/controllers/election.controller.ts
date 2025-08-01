import { Response } from 'express';
import Election from '../schemas/election.schema';
import Candidate from '../schemas/candidate.schema';
import Party from '../schemas/party.schema';
import Vote from '../schemas/vote.schema';
import { AuthenticatedRequest } from './user.controller';

/**
 * Crear una nueva elección
 */
export const createElection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { name, description, startDate, endDate, qr_code, isByParty } = req.body;

    // Validar campos requeridos
    if (!name || !startDate || !endDate || !qr_code) {
      res.status(400).json({
        success: false,
        message: 'Nombre, fecha de inicio, fecha de fin y código QR son campos obligatorios'
      });
      return;
    }

    // Validar que la fecha de inicio sea anterior a la fecha de fin
    if (new Date(startDate) >= new Date(endDate)) {
      res.status(400).json({
        success: false,
        message: 'La fecha de inicio debe ser anterior a la fecha de fin'
      });
      return;
    }

    // Validar que las fechas no sean en el pasado
    const now = new Date();
    if (new Date(startDate) < now) {
      res.status(400).json({
        success: false,
        message: 'La fecha de inicio no puede ser en el pasado'
      });
      return;
    }

    // Crear la elección
    const newElection = new Election({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      qr_code,
      isByParty: isByParty || false,
      createdBy: req.user.userId
    });

    const savedElection = await newElection.save();

    res.status(201).json({
      success: true,
      message: 'Elección creada exitosamente',
      data: savedElection
    });

  } catch (error) {
    console.error('Error al crear elección:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear elección'
    });
  }
};

/**
 * Obtener todas las elecciones
 */
export const getAllElections = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    let filter: any = {};

    // Filtrar por estado si se proporciona
    if (status) {
      const now = new Date();
      switch (status) {
        case 'upcoming':
          filter.startDate = { $gt: now };
          break;
        case 'active':
          filter.startDate = { $lte: now };
          filter.endDate = { $gt: now };
          break;
        case 'finished':
          filter.endDate = { $lte: now };
          break;
      }
    }

    const elections = await Election.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const totalElections = await Election.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Elecciones obtenidas exitosamente',
      data: elections,
      pagination: {
        current: Number(page),
        pages: Math.ceil(totalElections / Number(limit)),
        count: elections.length,
        total: totalElections
      }
    });

  } catch (error) {
    console.error('Error al obtener elecciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener elecciones'
    });
  }
};

/**
 * Obtener una elección por ID
 */
export const getElectionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId)
      .populate('createdBy', 'name email');

    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    // Obtener candidatos de la elección
    const candidates = await Candidate.find({ election: electionId })
      .populate('party', 'name description logo_url');

    // Obtener partidos si la elección es por partidos
    let parties = [];
    if (election.isByParty) {
      parties = await Party.find({ election: electionId });
    }

    // Obtener estadísticas básicas
    const totalVotes = await Vote.countDocuments({ election: electionId });

    const electionData = {
      ...election.toObject(),
      candidates,
      parties,
      statistics: {
        totalVotes,
        totalCandidates: candidates.length,
        totalParties: parties.length
      }
    };

    res.status(200).json({
      success: true,
      message: 'Elección obtenida exitosamente',
      data: electionData
    });

  } catch (error) {
    console.error('Error al obtener elección:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener elección'
    });
  }
};

/**
 * Actualizar una elección
 */
export const updateElection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { electionId } = req.params;
    const { name, description, startDate, endDate, qr_code, isByParty } = req.body;

    // Buscar la elección
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    // Verificar que el usuario sea el creador o admin
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar esta elección'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se puede modificar una elección que ya ha comenzado'
      });
      return;
    }

    // Validar fechas si se proporcionan
    if (startDate && endDate) {
      if (new Date(startDate) >= new Date(endDate)) {
        res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
        return;
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (qr_code) updateData.qr_code = qr_code;
    if (isByParty !== undefined) updateData.isByParty = isByParty;

    const updatedElection = await Election.findByIdAndUpdate(
      electionId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Elección actualizada exitosamente',
      data: updatedElection
    });

  } catch (error) {
    console.error('Error al actualizar elección:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar elección'
    });
  }
};

/**
 * Eliminar una elección
 */
export const deleteElection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { electionId } = req.params;

    // Buscar la elección
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    // Verificar que el usuario sea el creador o admin
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar esta elección'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar una elección que ya ha comenzado'
      });
      return;
    }

    // Verificar si hay votos registrados
    const voteCount = await Vote.countDocuments({ election: electionId });
    if (voteCount > 0) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar una elección que ya tiene votos registrados'
      });
      return;
    }

    // Eliminar datos relacionados en orden
    await Candidate.deleteMany({ election: electionId });
    await Party.deleteMany({ election: electionId });
    await Election.findByIdAndDelete(electionId);

    res.status(200).json({
      success: true,
      message: 'Elección eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar elección:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar elección'
    });
  }
};

/**
 * Obtener estadísticas de una elección
 */
export const getElectionStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Obtener estadísticas generales
    const totalVotes = await Vote.countDocuments({ election: electionId });
    const totalCandidates = await Candidate.countDocuments({ election: electionId });
    const totalParties = await Party.countDocuments({ election: electionId });

    // Obtener votos por candidato
    const votesByCandidateResult = await Vote.aggregate([
      { $match: { election: election._id } },
      { $group: { _id: '$candidate', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidateInfo'
        }
      },
      { $unwind: '$candidateInfo' },
      {
        $project: {
          candidateId: '$_id',
          candidateName: '$candidateInfo.name',
          description: '$candidateInfo.description',
          votes: '$count',
          percentage: {
            $cond: {
              if: { $eq: [totalVotes, 0] },
              then: 0,
              else: { $multiply: [{ $divide: ['$count', totalVotes] }, 100] }
            }
          }
        }
      },
      { $sort: { votes: -1 } }
    ]);

    // Votos por partido (si aplica)
    let votesByParty = [];
    if (election.isByParty) {
      votesByParty = await Vote.aggregate([
        { $match: { election: election._id } },
        {
          $lookup: {
            from: 'candidates',
            localField: 'candidate',
            foreignField: '_id',
            as: 'candidateInfo'
          }
        },
        { $unwind: '$candidateInfo' },
        {
          $lookup: {
            from: 'parties',
            localField: 'candidateInfo.party',
            foreignField: '_id',
            as: 'partyInfo'
          }
        },
        { $unwind: { path: '$partyInfo', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$partyInfo._id',
            partyName: { $first: '$partyInfo.name' },
            votes: { $sum: 1 }
          }
        },
        {
          $project: {
            partyId: '$_id',
            partyName: 1,
            votes: 1,
            percentage: {
              $cond: {
                if: { $eq: [totalVotes, 0] },
                then: 0,
                else: { $multiply: [{ $divide: ['$votes', totalVotes] }, 100] }
              }
            }
          }
        },
        { $sort: { votes: -1 } }
      ]);
    }

    // Estado de la elección
    const now = new Date();
    let electionStatus = 'upcoming';
    if (now >= election.startDate && now <= election.endDate) {
      electionStatus = 'active';
    } else if (now > election.endDate) {
      electionStatus = 'finished';
    }

    const statistics = {
      general: {
        totalVotes,
        totalCandidates,
        totalParties,
        electionStatus,
        participationRate: totalVotes > 0 ? (totalVotes / totalCandidates * 100) : 0
      },
      votesByCandidate: votesByCandidateResult,
      votesByParty: votesByParty,
      election: {
        id: election._id,
        name: election.name,
        startDate: election.startDate,
        endDate: election.endDate,
        isByParty: election.isByParty
      }
    };

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: statistics
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener estadísticas'
    });
  }
};

/**
 * Obtener elecciones del usuario autenticado
 */
export const getMyElections = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const elections = await Election.find({ createdBy: req.user.userId })
      .sort({ createdAt: -1 });

    // Agregar estadísticas básicas a cada elección
    const electionsWithStats = await Promise.all(
      elections.map(async (election) => {
        const totalVotes = await Vote.countDocuments({ election: election._id });
        const totalCandidates = await Candidate.countDocuments({ election: election._id });
        
        const now = new Date();
        let status = 'upcoming';
        if (now >= election.startDate && now <= election.endDate) {
          status = 'active';
        } else if (now > election.endDate) {
          status = 'finished';
        }

        return {
          ...election.toObject(),
          statistics: {
            totalVotes,
            totalCandidates,
            status
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Elecciones del usuario obtenidas exitosamente',
      data: electionsWithStats,
      count: electionsWithStats.length
    });

  } catch (error) {
    console.error('Error al obtener elecciones del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener elecciones del usuario'
    });
  }
};
