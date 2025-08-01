import { Response } from 'express';
import Election from '../schemas/election.schema';
import Candidate from '../schemas/candidate.schema';
import Party from '../schemas/party.schema';
import Vote from '../schemas/vote.schema';
import Voter from '../schemas/voter.schema';
import User from '../schemas/user.schema';
import { AuthenticatedRequest } from './user.controller';

/**
 * Obtener estadísticas generales del dashboard
 */
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const isAdmin = req.user.role === 'admin';
    const userId = req.user.userId;

    // Filtro base para las consultas
    const electionFilter = isAdmin ? {} : { createdBy: userId };

    // Estadísticas generales
    const totalElections = await Election.countDocuments(electionFilter);
    const totalUsers = isAdmin ? await User.countDocuments() : 1;

    // Obtener IDs de elecciones del usuario/admin
    const userElections = await Election.find(electionFilter).select('_id');
    const electionIds = userElections.map(e => e._id);

    const totalCandidates = await Candidate.countDocuments({ 
      election: { $in: electionIds } 
    });
    const totalParties = await Party.countDocuments({ 
      election: { $in: electionIds } 
    });
    const totalVoters = await Voter.countDocuments({ 
      election: { $in: electionIds } 
    });
    const totalVotes = await Vote.countDocuments({ 
      election: { $in: electionIds } 
    });

    // Estados de elecciones
    const now = new Date();
    const upcomingElections = await Election.countDocuments({
      ...electionFilter,
      startDate: { $gt: now }
    });
    const activeElections = await Election.countDocuments({
      ...electionFilter,
      startDate: { $lte: now },
      endDate: { $gt: now }
    });
    const finishedElections = await Election.countDocuments({
      ...electionFilter,
      endDate: { $lte: now }
    });

    // Elecciones recientes
    const recentElections = await Election.find(electionFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name email');

    // Agregar estadísticas básicas a elecciones recientes
    const electionsWithStats = await Promise.all(
      recentElections.map(async (election) => {
        const voteCount = await Vote.countDocuments({ election: election._id });
        const candidateCount = await Candidate.countDocuments({ election: election._id });
        const voterCount = await Voter.countDocuments({ election: election._id });

        let status = 'upcoming';
        if (now >= election.startDate && now <= election.endDate) {
          status = 'active';
        } else if (now > election.endDate) {
          status = 'finished';
        }

        return {
          ...election.toObject(),
          statistics: {
            voteCount,
            candidateCount,
            voterCount,
            status
          }
        };
      })
    );

    // Actividad reciente (votos de los últimos 7 días)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentVotes = await Vote.countDocuments({
      election: { $in: electionIds },
      timestamp: { $gte: last7Days }
    });

    // Participación promedio
    const participationStats = await Election.aggregate([
      { $match: electionFilter },
      {
        $lookup: {
          from: 'voters',
          localField: '_id',
          foreignField: 'election',
          as: 'voters'
        }
      },
      {
        $lookup: {
          from: 'votes',
          localField: '_id',
          foreignField: 'election',
          as: 'votes'
        }
      },
      {
        $project: {
          voterCount: { $size: '$voters' },
          voteCount: { $size: '$votes' },
          participationRate: {
            $cond: {
              if: { $eq: [{ $size: '$voters' }, 0] },
              then: 0,
              else: {
                $multiply: [
                  { $divide: [{ $size: '$votes' }, { $size: '$voters' }] },
                  100
                ]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          avgParticipation: { $avg: '$participationRate' },
          totalVoters: { $sum: '$voterCount' },
          totalVotes: { $sum: '$voteCount' }
        }
      }
    ]);

    const avgParticipation = participationStats.length > 0 
      ? participationStats[0].avgParticipation 
      : 0;

    const dashboardData = {
      overview: {
        totalElections,
        totalCandidates,
        totalParties,
        totalVoters,
        totalVotes,
        totalUsers,
        avgParticipation: Math.round(avgParticipation * 100) / 100
      },
      electionStates: {
        upcoming: upcomingElections,
        active: activeElections,
        finished: finishedElections
      },
      recentActivity: {
        recentVotes,
        recentElections: electionsWithStats
      },
      userInfo: {
        isAdmin,
        canSeeAllData: isAdmin
      }
    };

    res.status(200).json({
      success: true,
      message: 'Estadísticas del dashboard obtenidas exitosamente',
      data: dashboardData
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener estadísticas'
    });
  }
};

/**
 * Obtener resumen de actividad del sistema
 */
export const getSystemActivity = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
      return;
    }

    const { days = 7 } = req.query;
    const daysNumber = Number(days);
    const startDate = new Date(Date.now() - daysNumber * 24 * 60 * 60 * 1000);

    // Actividad de votos por día
    const voteActivity = await Vote.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Registro de votantes por día
    const voterActivity = await Voter.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Elecciones creadas por día
    const electionActivity = await Election.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Usuarios más activos (por elecciones creadas)
    const activeUsers = await Election.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$createdBy',
          electionCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          userName: '$userInfo.name',
          userEmail: '$userInfo.email',
          electionCount: 1
        }
      },
      { $sort: { electionCount: -1 } },
      { $limit: 10 }
    ]);

    const activityData = {
      period: {
        days: daysNumber,
        startDate,
        endDate: new Date()
      },
      voteActivity,
      voterActivity,
      electionActivity,
      activeUsers
    };

    res.status(200).json({
      success: true,
      message: 'Actividad del sistema obtenida exitosamente',
      data: activityData
    });

  } catch (error) {
    console.error('Error al obtener actividad del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener actividad'
    });
  }
};
