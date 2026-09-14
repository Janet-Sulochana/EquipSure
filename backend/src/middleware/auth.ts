import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'biomedical_engineer' | 'hospital_staff';
  department: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'equipsure_super_secret_jwt_key_2026_healthcare_security';

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
}

export function requireRole(allowedRoles: Array<'admin' | 'biomedical_engineer' | 'hospital_staff'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized for this resource. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
