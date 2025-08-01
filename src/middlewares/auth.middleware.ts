import { Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../controllers/user.controller';

/**
 * Middleware para verificar la autenticación del usuario
 */
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
    
    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        res.status(403).json({
          success: false,
          message: 'Token de acceso inválido o expirado'
        });
        return;
      }

      req.user = decoded as any;
      next();
    });

  } catch (error) {
    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor en la autenticación'
    });
  }
};

/**
 * Middleware para verificar que el usuario tenga rol de administrador
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
    return;
  }

  next();
};
