import { Request, Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import User from '../schemas/user.schema';

// Interfaz para el token payload
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Interfaz para request con usuario autenticado
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Registrar un nuevo usuario
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    // Validar campos requeridos
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Nombre, email y contraseña son campos obligatorios'
      });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con este email'
      });
      return;
    }

    // Encriptar la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'admin'
    });

    const savedUser = await newUser.save();

    // Respuesta sin incluir la contraseña
    const userResponse = {
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: userResponse
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar usuario'
    });
  }
};

/**
 * Iniciar sesión de usuario
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email y contraseña son campos obligatorios'
      });
      return;
    }

    // Buscar el usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    // Verificar la contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
      return;
    }

    // Generar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al iniciar sesión'
    });
  }
};

/**
 * Obtener perfil de usuario autenticado
 */
export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: user
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener perfil'
    });
  }
};

/**
 * Obtener todos los usuarios (solo para admins)
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
      return;
    }

    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener usuarios'
    });
  }
};

/**
 * Actualizar perfil de usuario
 */
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { name, email } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) {
      // Verificar que el email no esté en uso por otro usuario
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user.userId } 
      });
      
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'Este email ya está en uso por otro usuario'
        });
        return;
      }
      updateData.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar perfil'
    });
  }
};

/**
 * Cambiar contraseña de usuario
 */
export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva contraseña son campos obligatorios'
      });
      return;
    }

    // Buscar el usuario
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Verificar la contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
      return;
    }

    // Encriptar la nueva contraseña
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar la contraseña
    await User.findByIdAndUpdate(req.user.userId, {
      password: hashedNewPassword
    });

    res.status(200).json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al cambiar contraseña'
    });
  }
};

/**
 * Eliminar usuario (solo para admins)
 */
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
      return;
    }

    const { userId } = req.params;

    // No permitir que un admin se elimine a sí mismo
    if (userId === req.user.userId) {
      res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
      return;
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar usuario'
    });
  }
};