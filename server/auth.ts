import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fixmate_jwt_super_secret_production_key_2026';

export interface AuthPayload {
  id: number;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  full_name: string;
  avatar_url?: string;
  provider_id?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

// Authentication middleware to extract and verify JWT
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing or invalid Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}

// Role-Based Access Control (RBAC) middleware
export function requireRole(...allowedRoles: Array<'customer' | 'provider' | 'admin'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'`,
      });
      return;
    }

    next();
  };
}
