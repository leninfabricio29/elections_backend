import { Response } from 'express';
import Vote from '../schemas/vote.schema';
import Voter from '../schemas/voter.schema';
import Election from '../schemas/election.schema';
import Candidate from '../schemas/candidate.schema';
import { AuthenticatedRequest } from './user.controller';

/**
 * Registrar un voto
 */
export const castVote = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { voterId, electionId, candidateId } = req.body;

    // Validar campos requeridos
    if (!voterId || !electionId || !candidateId) {
      res.status(400).json({
        success: false,
        message: 'ID del votante, elección y candidato son campos obligatorios'
      });
      return;
    }

    // Verificar que la elección existe y está activa
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    const now = new Date();
    if (now < election.startDate) {
      res.status(400).json({
        success: false,
        message: 'La elección aún no ha comenzado'
      });
      return;
    }

    if (now > election.endDate) {
      res.status(400).json({
        success: false,
        message: 'La elección ya ha finalizado'
      });
      return;
    }

    // Verificar que el votante existe y pertenece a esta elección
    const voter = await Voter.findOne({ _id: voterId, election: electionId });
    if (!voter) {
      res.status(404).json({
        success: false,
        message: 'Votante no encontrado o no autorizado para esta elección'
      });
      return;
    }

    // Verificar que el votante no haya votado ya
    if (voter.hasVoted) {
      res.status(400).json({
        success: false,
        message: 'Este votante ya ha ejercido su voto'
      });
      return;
    }

    // Verificar que el candidato existe y pertenece a esta elección
    const candidate = await Candidate.findOne({ _id: candidateId, election: electionId });
    if (!candidate) {
      res.status(404).json({
        success: false,
        message: 'Candidato no encontrado o no pertenece a esta elección'
      });
      return;
    }

    // Registrar el voto
    const newVote = new Vote({
      voter: voterId,
      election: electionId,
      candidate: candidateId,
      timestamp: new Date()
    });

    const savedVote = await newVote.save();

    // Marcar al votante como que ya votó
    await Voter.findByIdAndUpdate(voterId, { hasVoted: true });

    res.status(201).json({
      success: true,
      message: 'Voto registrado exitosamente',
      data: {
        voteId: savedVote._id,
        timestamp: savedVote.timestamp
      }
    });

  } catch (error) {
    console.error('Error al registrar voto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar voto'
    });
  }
};

/**
 * Verificar si un votante ya votó
 */
export const checkVoterStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { voterId, electionId } = req.params;

    // Verificar que el votante existe
    const voter = await Voter.findOne({ _id: voterId, election: electionId })
      .populate('election', 'name startDate endDate');

    if (!voter) {
      res.status(404).json({
        success: false,
        message: 'Votante no encontrado'
      });
      return;
    }

    const election = voter.election as any;
    const now = new Date();

    // Determinar estado de la elección
    let electionStatus = 'upcoming';
    if (now >= election.startDate && now <= election.endDate) {
      electionStatus = 'active';
    } else if (now > election.endDate) {
      electionStatus = 'finished';
    }

    res.status(200).json({
      success: true,
      message: 'Estado del votante obtenido exitosamente',
      data: {
        voterId: voter._id,
        cedula: voter.cedula,
        hasVoted: voter.hasVoted,
        electionStatus,
        election: {
          id: election._id,
          name: election.name,
          startDate: election.startDate,
          endDate: election.endDate
        },
        canVote: electionStatus === 'active' && !voter.hasVoted
      }
    });

  } catch (error) {
    console.error('Error al verificar estado del votante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al verificar estado'
    });
  }
};

/**
 * Obtener estadísticas de votación de una elección
 */
export const getVotingStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

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

    // Verificar permisos (creador o admin)
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver estas estadísticas'
      });
      return;
    }

    // Obtener estadísticas generales
    const totalVoters = await Voter.countDocuments({ election: electionId });
    const votersWhoVoted = await Voter.countDocuments({ 
      election: electionId, 
      hasVoted: true 
    });
    const totalVotes = await Vote.countDocuments({ election: electionId });

    // Participación por hora (últimas 24 horas)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const votesByHour = await Vote.aggregate([
      {
        $match: {
          election: election._id,
          timestamp: { $gte: last24Hours }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1, '_id.hour': 1 } }
    ]);

    // Votos por candidato
    const votesByCandidate = await Vote.aggregate([
      { $match: { election: election._id } },
      {
        $group: {
          _id: '$candidate',
          voteCount: { $sum: 1 }
        }
      },
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
          voteCount: 1,
          percentage: {
            $cond: {
              if: { $eq: [totalVotes, 0] },
              then: 0,
              else: { $multiply: [{ $divide: ['$voteCount', totalVotes] }, 100] }
            }
          }
        }
      },
      { $sort: { voteCount: -1 } }
    ]);

    const statistics = {
      general: {
        totalVoters,
        votersWhoVoted,
        totalVotes,
        participationRate: totalVoters > 0 ? (votersWhoVoted / totalVoters) * 100 : 0,
        pendingVoters: totalVoters - votersWhoVoted
      },
      votesByCandidate,
      participationByHour: votesByHour,
      election: {
        id: election._id,
        name: election.name,
        startDate: election.startDate,
        endDate: election.endDate,
        status: (() => {
          const now = new Date();
          if (now < election.startDate) return 'upcoming';
          if (now > election.endDate) return 'finished';
          return 'active';
        })()
      }
    };

    res.status(200).json({
      success: true,
      message: 'Estadísticas de votación obtenidas exitosamente',
      data: statistics
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de votación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener estadísticas'
    });
  }
};

/**
 * Obtener resultados finales de una elección
 */
export const getFinalResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Solo mostrar resultados si la elección ha finalizado (opcional, puede mostrarse en tiempo real)
    const now = new Date();
    const electionFinished = now > election.endDate;

    // Obtener todos los candidatos con sus votos
    const results = await Vote.aggregate([
      { $match: { election: election._id } },
      {
        $group: {
          _id: '$candidate',
          voteCount: { $sum: 1 }
        }
      },
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
        $lookup: {
          from: 'parties',
          localField: 'candidateInfo.party',
          foreignField: '_id',
          as: 'partyInfo'
        }
      },
      {
        $project: {
          candidateId: '$_id',
          candidateName: '$candidateInfo.name',
          candidateDescription: '$candidateInfo.description',
          party: {
            $cond: {
              if: { $gt: [{ $size: '$partyInfo' }, 0] },
              then: { $arrayElemAt: ['$partyInfo', 0] },
              else: null
            }
          },
          voteCount: 1
        }
      },
      { $sort: { voteCount: -1 } }
    ]);

    // Agregar candidatos sin votos
    const candidatesWithVotes = results.map(r => r.candidateId.toString());
    const candidatesWithoutVotes = await Candidate.find({
      election: electionId,
      _id: { $nin: candidatesWithVotes }
    }).populate('party');

    const candidatesWithZeroVotes = candidatesWithoutVotes.map(candidate => ({
      candidateId: candidate._id,
      candidateName: candidate.name,
      candidateDescription: candidate.description,
      party: candidate.party,
      voteCount: 0
    }));

    const allResults = [...results, ...candidatesWithZeroVotes]
      .sort((a, b) => b.voteCount - a.voteCount);

    // Calcular porcentajes
    const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);
    const resultsWithPercentages = allResults.map((result, index) => ({
      ...result,
      percentage: totalVotes > 0 ? (result.voteCount / totalVotes) * 100 : 0,
      position: index + 1
    }));

    // Estadísticas generales
    const totalVoters = await Voter.countDocuments({ election: electionId });
    const participationRate = totalVoters > 0 ? (totalVotes / totalVoters) * 100 : 0;

    res.status(200).json({
      success: true,
      message: 'Resultados obtenidos exitosamente',
      data: {
        election: {
          id: election._id,
          name: election.name,
          description: election.description,
          startDate: election.startDate,
          endDate: election.endDate,
          isFinished: electionFinished,
          isByParty: election.isByParty
        },
        results: resultsWithPercentages,
        summary: {
          totalVotes,
          totalVoters,
          participationRate,
          totalCandidates: allResults.length,
          winner: resultsWithPercentages.length > 0 ? resultsWithPercentages[0] : null
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener resultados finales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener resultados'
    });
  }
};
