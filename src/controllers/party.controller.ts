import { Response } from 'express';
import Party from '../schemas/party.schema';
import Election from '../schemas/election.schema';
import Candidate from '../schemas/candidate.schema';
import Vote from '../schemas/vote.schema';
import { AuthenticatedRequest } from './user.controller';

/**
 * Crear un nuevo partido
 */
export const createParty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { electionId, name, description, logo_url } = req.body;

    // Validar campos requeridos
    if (!electionId || !name) {
      res.status(400).json({
        success: false,
        message: 'ID de elección y nombre del partido son campos obligatorios'
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
        message: 'No tienes permisos para agregar partidos a esta elección'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se pueden agregar partidos a una elección que ya ha comenzado'
      });
      return;
    }

    // Verificar que la elección esté configurada para partidos
    if (!election.isByParty) {
      res.status(400).json({
        success: false,
        message: 'Esta elección no está configurada para manejar partidos políticos'
      });
      return;
    }

    // Verificar que no exista un partido con el mismo nombre en esta elección
    const existingParty = await Party.findOne({ 
      election: electionId, 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    if (existingParty) {
      res.status(409).json({
        success: false,
        message: 'Ya existe un partido con este nombre en esta elección'
      });
      return;
    }

    // Crear el partido
    const newParty = new Party({
      election: electionId,
      name,
      description,
      logo_url
    });

    const savedParty = await newParty.save();
    const populatedParty = await Party.findById(savedParty._id)
      .populate('election', 'name description');

    res.status(201).json({
      success: true,
      message: 'Partido creado exitosamente',
      data: populatedParty
    });

  } catch (error) {
    console.error('Error al crear partido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear partido'
    });
  }
};

/**
 * Obtener partidos de una elección
 */
export const getPartiesByElection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const parties = await Party.find({ election: electionId })
      .sort({ name: 1 });

    // Agregar estadísticas a cada partido
    const partiesWithStats = await Promise.all(
      parties.map(async (party) => {
        // Obtener candidatos del partido
        const candidateCount = await Candidate.countDocuments({ 
          election: electionId,
          party: party._id 
        });

        // Obtener votos del partido
        const candidates = await Candidate.find({ 
          election: electionId,
          party: party._id 
        }).select('_id');
        
        const candidateIds = candidates.map(c => c._id);
        const voteCount = await Vote.countDocuments({ 
          election: electionId,
          candidate: { $in: candidateIds }
        });

        return {
          ...party.toObject(),
          statistics: {
            candidateCount,
            voteCount
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      message: 'Partidos obtenidos exitosamente',
      data: partiesWithStats,
      count: partiesWithStats.length
    });

  } catch (error) {
    console.error('Error al obtener partidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener partidos'
    });
  }
};

/**
 * Obtener un partido por ID
 */
export const getPartyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { partyId } = req.params;

    const party = await Party.findById(partyId)
      .populate('election', 'name description startDate endDate isByParty');

    if (!party) {
      res.status(404).json({
        success: false,
        message: 'Partido no encontrado'
      });
      return;
    }

    // Obtener candidatos del partido
    const candidates = await Candidate.find({ 
      election: party.election,
      party: party._id 
    });

    // Obtener estadísticas del partido
    const candidateIds = candidates.map(c => c._id);
    const voteCount = await Vote.countDocuments({ 
      election: party.election,
      candidate: { $in: candidateIds }
    });

    const totalElectionVotes = await Vote.countDocuments({ 
      election: party.election 
    });

    const partyData = {
      ...party.toObject(),
      candidates,
      statistics: {
        candidateCount: candidates.length,
        voteCount,
        percentage: totalElectionVotes > 0 ? (voteCount / totalElectionVotes) * 100 : 0
      }
    };

    res.status(200).json({
      success: true,
      message: 'Partido obtenido exitosamente',
      data: partyData
    });

  } catch (error) {
    console.error('Error al obtener partido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener partido'
    });
  }
};

/**
 * Actualizar un partido
 */
export const updateParty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { partyId } = req.params;
    const { name, description, logo_url } = req.body;

    // Buscar el partido
    const party = await Party.findById(partyId).populate('election');
    if (!party) {
      res.status(404).json({
        success: false,
        message: 'Partido no encontrado'
      });
      return;
    }

    const election = party.election as any;

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este partido'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se puede modificar un partido cuando la elección ya ha comenzado'
      });
      return;
    }

    // Verificar que no exista otro partido con el mismo nombre
    if (name && name !== party.name) {
      const existingParty = await Party.findOne({ 
        election: election._id,
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: partyId }
      });
      if (existingParty) {
        res.status(409).json({
          success: false,
          message: 'Ya existe otro partido con este nombre en esta elección'
        });
        return;
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo_url !== undefined) updateData.logo_url = logo_url;

    const updatedParty = await Party.findByIdAndUpdate(
      partyId,
      updateData,
      { new: true, runValidators: true }
    ).populate('election', 'name description');

    res.status(200).json({
      success: true,
      message: 'Partido actualizado exitosamente',
      data: updatedParty
    });

  } catch (error) {
    console.error('Error al actualizar partido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar partido'
    });
  }
};

/**
 * Eliminar un partido
 */
export const deleteParty = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { partyId } = req.params;

    // Buscar el partido
    const party = await Party.findById(partyId).populate('election');
    if (!party) {
      res.status(404).json({
        success: false,
        message: 'Partido no encontrado'
      });
      return;
    }

    const election = party.election as any;

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este partido'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar un partido cuando la elección ya ha comenzado'
      });
      return;
    }

    // Verificar si hay candidatos asociados al partido
    const candidateCount = await Candidate.countDocuments({ party: partyId });
    if (candidateCount > 0) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar un partido que tiene candidatos asociados'
      });
      return;
    }

    await Party.findByIdAndDelete(partyId);

    res.status(200).json({
      success: true,
      message: 'Partido eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar partido:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar partido'
    });
  }
};

/**
 * Obtener estadísticas de partidos de una elección
 */
export const getPartyStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { electionId } = req.params;

    // Verificar que la elección existe y es por partidos
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    if (!election.isByParty) {
      res.status(400).json({
        success: false,
        message: 'Esta elección no está configurada para partidos'
      });
      return;
    }

    // Obtener estadísticas por partido usando agregación
    const partyStats = await Vote.aggregate([
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
          partyDescription: { $first: '$partyInfo.description' },
          partyLogo: { $first: '$partyInfo.logo_url' },
          totalVotes: { $sum: 1 },
          candidates: { $addToSet: '$candidateInfo._id' }
        }
      },
      {
        $project: {
          partyId: '$_id',
          partyName: 1,
          partyDescription: 1,
          partyLogo: 1,
          totalVotes: 1,
          candidateCount: { $size: '$candidates' }
        }
      },
      { $sort: { totalVotes: -1 } }
    ]);

    // Calcular porcentajes
    const totalElectionVotes = await Vote.countDocuments({ election: electionId });
    const statsWithPercentages = partyStats.map(party => ({
      ...party,
      percentage: totalElectionVotes > 0 ? (party.totalVotes / totalElectionVotes) * 100 : 0
    }));

    // Obtener partidos sin votos
    const partiesWithVotes = partyStats.map(p => p.partyId?.toString()).filter(Boolean);
    const partiesWithoutVotes = await Party.find({
      election: electionId,
      _id: { $nin: partiesWithVotes }
    });

    const partiesWithoutVotesFormatted = partiesWithoutVotes.map(party => ({
      partyId: party._id,
      partyName: party.name,
      partyDescription: party.description,
      partyLogo: party.logo_url,
      totalVotes: 0,
      candidateCount: 0,
      percentage: 0
    }));

    const allStats = [...statsWithPercentages, ...partiesWithoutVotesFormatted]
      .sort((a, b) => b.totalVotes - a.totalVotes);

    res.status(200).json({
      success: true,
      message: 'Estadísticas de partidos obtenidas exitosamente',
      data: {
        election: {
          id: election._id,
          name: election.name,
          totalVotes: totalElectionVotes
        },
        parties: allStats,
        summary: {
          totalParties: allStats.length,
          partiesWithVotes: statsWithPercentages.length,
          partiesWithoutVotes: partiesWithoutVotesFormatted.length
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de partidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener estadísticas'
    });
  }
};
