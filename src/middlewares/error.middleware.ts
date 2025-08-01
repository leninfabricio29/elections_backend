import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para manejo global de errores
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error capturado por middleware:', error);

  // Error de validación de MongoDB
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: messages
    });
    return;
  }

  // Error de cast de MongoDB (ID inválido)
  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'ID de recurso inválido'
    });
    return;
  }

  // Error de clave duplicada (MongoDB)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    res.status(409).json({
      success: false,
      message: `El valor para el campo '${field}' ya existe`
    });
    return;
  }

  // Error de JWT
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token de acceso inválido'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token de acceso expirado'
    });
    return;
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
};

/**
 * Middleware para rutas no encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada`
  });
};

/**
 * Middleware para validar parámetros de paginación
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction): void => {
  const { page, limit } = req.query;

  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    res.status(400).json({
      success: false,
      message: 'El parámetro "page" debe ser un número mayor a 0'
    });
    return;
  }

  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    res.status(400).json({
      success: false,
      message: 'El parámetro "limit" debe ser un número entre 1 y 100'
    });
    return;
  }

  next();
};

/**
 * Middleware para logging de requests
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};
