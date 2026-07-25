import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or JWT_ACCESS_SECRET must be configured');
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado', errors: [] });
      }
      (req as any).user = user;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'No se proporcionó token de autenticación', errors: [] });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para esta acción', errors: [] });
    }
    next();
  };
};
