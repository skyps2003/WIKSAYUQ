import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or JWT_ACCESS_SECRET must be configured');
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    rol: string;
  };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No autorizado, no hay token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      rol: decoded.rol
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'No autorizado, token fallido' });
  }
};
