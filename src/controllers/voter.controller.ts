import { Response } from 'express';
import Voter from '../schemas/voter.schema';
import Election from '../schemas/election.schema';
import Vote from '../schemas/vote.schema';
import { AuthenticatedRequest } from './user.controller';

/**
 * Registrar un nuevo votante
 */
export const registerVoter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { electionId, cedula, face_url } = req.body;

    // Validar campos requeridos
    if (!electionId || !cedula || !face_url) {
      res.status(400).json({
        success: false,
        message: 'ID de elección, cédula y URL de foto son campos obligatorios'
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
        message: 'No tienes permisos para registrar votantes en esta elección'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se pueden registrar votantes una vez que la elección ha comenzado'
      });
      return;
    }

    // Verificar que no exista un votante con la misma cédula en esta elección
    const existingVoter = await Voter.findOne({ 
      election: electionId, 
      cedula 
    });
    if (existingVoter) {
      res.status(409).json({
        success: false,
        message: 'Ya existe un votante con esta cédula en esta elección'
      });
      return;
    }

    // Crear el votante
    const newVoter = new Voter({
      election: electionId,
      cedula,
      face_url,
      hasVoted: false
    });

    const savedVoter = await newVoter.save();
    const populatedVoter = await Voter.findById(savedVoter._id)
      .populate('election', 'name description');

    res.status(201).json({
      success: true,
      message: 'Votante registrado exitosamente',
      data: populatedVoter
    });

  } catch (error) {
    console.error('Error al registrar votante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar votante'
    });
  }
};

/**
 * Obtener votantes de una elección
 */
export const getVotersByElection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { electionId } = req.params;
    const { hasVoted, limit = 50, page = 1 } = req.query;

    // Verificar que la elección existe
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver los votantes de esta elección'
      });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);
    let filter: any = { election: electionId };

    // Filtrar por estado de votación si se proporciona
    if (hasVoted !== undefined) {
      filter.hasVoted = hasVoted === 'true';
    }

    const voters = await Voter.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip)
      .select('-face_url'); // No incluir la URL de la foto por privacidad

    const totalVoters = await Voter.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Votantes obtenidos exitosamente',
      data: voters,
      pagination: {
        current: Number(page),
        pages: Math.ceil(totalVoters / Number(limit)),
        count: voters.length,
        total: totalVoters
      }
    });

  } catch (error) {
    console.error('Error al obtener votantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener votantes'
    });
  }
};

/**
 * Obtener un votante por ID
 */
export const getVoterById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { voterId } = req.params;

    const voter = await Voter.findById(voterId)
      .populate('election', 'name description startDate endDate');

    if (!voter) {
      res.status(404).json({
        success: false,
        message: 'Votante no encontrado'
      });
      return;
    }

    const election = voter.election as any;

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este votante'
      });
      return;
    }

    // Si ya votó, obtener información del voto (sin revelar por quién votó)
    let voteInfo = null;
    if (voter.hasVoted) {
      const vote = await Vote.findOne({ voter: voterId })
        .select('timestamp');
      voteInfo = vote ? { timestamp: vote.timestamp } : null;
    }

    const voterData = {
      ...voter.toObject(),
      voteInfo
    };

    res.status(200).json({
      success: true,
      message: 'Votante obtenido exitosamente',
      data: voterData
    });

  } catch (error) {
    console.error('Error al obtener votante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener votante'
    });
  }
};

/**
 * Buscar votante por cédula
 */
export const findVoterByCedula = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { electionId, cedula } = req.params;

    // Verificar que la elección existe
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Elección no encontrada'
      });
      return;
    }

    // Buscar votante por cédula en la elección específica
    const voter = await Voter.findOne({ 
      election: electionId, 
      cedula 
    }).populate('election', 'name startDate endDate');

    if (!voter) {
      res.status(404).json({
        success: false,
        message: 'Votante no encontrado con esta cédula en esta elección'
      });
      return;
    }

    // Determinar si puede votar
    const now = new Date();
    const canVote = now >= election.startDate && 
                   now <= election.endDate && 
                   !voter.hasVoted;

    const voterInfo = {
      id: voter._id,
      cedula: voter.cedula,
      hasVoted: voter.hasVoted,
      canVote,
      election: {
        id: election._id,
        name: election.name,
        startDate: election.startDate,
        endDate: election.endDate
      }
    };

    res.status(200).json({
      success: true,
      message: 'Votante encontrado',
      data: voterInfo
    });

  } catch (error) {
    console.error('Error al buscar votante por cédula:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al buscar votante'
    });
  }
};

/**
 * Actualizar un votante
 */
export const updateVoter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { voterId } = req.params;
    const { cedula, face_url } = req.body;

    // Buscar el votante
    const voter = await Voter.findById(voterId).populate('election');
    if (!voter) {
      res.status(404).json({
        success: false,
        message: 'Votante no encontrado'
      });
      return;
    }

    const election = voter.election as any;

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este votante'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se puede modificar un votante cuando la elección ya ha comenzado'
      });
      return;
    }

    // Verificar que no exista otro votante con la misma cédula
    if (cedula && cedula !== voter.cedula) {
      const existingVoter = await Voter.findOne({ 
        election: election._id,
        cedula,
        _id: { $ne: voterId }
      });
      if (existingVoter) {
        res.status(409).json({
          success: false,
          message: 'Ya existe otro votante con esta cédula en esta elección'
        });
        return;
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (cedula) updateData.cedula = cedula;
    if (face_url) updateData.face_url = face_url;

    const updatedVoter = await Voter.findByIdAndUpdate(
      voterId,
      updateData,
      { new: true, runValidators: true }
    ).populate('election', 'name description');

    res.status(200).json({
      success: true,
      message: 'Votante actualizado exitosamente',
      data: updatedVoter
    });

  } catch (error) {
    console.error('Error al actualizar votante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar votante'
    });
  }
};

/**
 * Eliminar un votante
 */
export const deleteVoter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { voterId } = req.params;

    // Buscar el votante
    const voter = await Voter.findById(voterId).populate('election');
    if (!voter) {
      res.status(404).json({
        success: false,
        message: 'Votante no encontrado'
      });
      return;
    }

    const election = voter.election as any;

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este votante'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar un votante cuando la elección ya ha comenzado'
      });
      return;
    }

    // Verificar si el votante ya votó
    if (voter.hasVoted) {
      res.status(400).json({
        success: false,
        message: 'No se puede eliminar un votante que ya ha ejercido su voto'
      });
      return;
    }

    await Voter.findByIdAndDelete(voterId);

    res.status(200).json({
      success: true,
      message: 'Votante eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar votante:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar votante'
    });
  }
};

/**
 * Registrar múltiples votantes desde un archivo CSV/JSON
 */
export const bulkRegisterVoters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { electionId, voters } = req.body;

    // Validar campos requeridos
    if (!electionId || !voters || !Array.isArray(voters)) {
      res.status(400).json({
        success: false,
        message: 'ID de elección y array de votantes son campos obligatorios'
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

    // Verificar permisos
    if (req.user.role !== 'admin' && election.createdBy.toString() !== req.user.userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permisos para registrar votantes en esta elección'
      });
      return;
    }

    // Verificar que la elección no haya comenzado
    if (new Date() >= election.startDate) {
      res.status(400).json({
        success: false,
        message: 'No se pueden registrar votantes una vez que la elección ha comenzado'
      });
      return;
    }

    const results = {
      successful: [],
      failed: [],
      total: voters.length
    };

    // Procesar cada votante
    for (const voterData of voters) {
      try {
        const { cedula, face_url } = voterData;

        if (!cedula || !face_url) {
          results.failed.push({
            data: voterData,
            error: 'Cédula y URL de foto son campos obligatorios'
          });
          continue;
        }

        // Verificar si ya existe
        const existingVoter = await Voter.findOne({ 
          election: electionId, 
          cedula 
        });

        if (existingVoter) {
          results.failed.push({
            data: voterData,
            error: 'Ya existe un votante con esta cédula'
          });
          continue;
        }

        // Crear el votante
        const newVoter = new Voter({
          election: electionId,
          cedula,
          face_url,
          hasVoted: false
        });

        const savedVoter = await newVoter.save();
        results.successful.push(savedVoter);

      } catch (error) {
        results.failed.push({
          data: voterData,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Registro masivo completado. ${results.successful.length} exitosos, ${results.failed.length} fallidos`,
      data: results
    });

  } catch (error) {
    console.error('Error en registro masivo de votantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor en registro masivo'
    });
  }
};
