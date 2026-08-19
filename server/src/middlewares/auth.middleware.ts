import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { AppError } from '../utils/appError';
import { UserRole } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    permissions?: string[];
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Unauthorized: No authentication token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
      name: string;
      permissions?: string[];
    };
    req.user = decoded;
    next();
  } catch (error) {
    return next(new AppError('Unauthorized: Invalid or expired token', 401));
  }
};

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized: Not logged in', 401));
    }
    // DIRECTOR automatically has access to any ADMIN role protected endpoint
    const effectiveRoles = roles.includes(UserRole.ADMIN) ? [...roles, UserRole.DIRECTOR] : roles;
    if (!effectiveRoles.includes(req.user.role)) {
      return next(
        new AppError(`Forbidden: Role '${req.user?.role}' is not authorized to access this resource`, 403)
      );
    }
    next();
  };
};

export const checkPermission = (...requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // DIRECTOR role has all permissions implicitly
    if (req.user?.role === UserRole.DIRECTOR) {
      return next();
    }

    const userPermissions = req.user?.permissions || [];
    const hasPermission = requiredPermissions.every((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return next(
        new AppError('Forbidden: You do not possess the required permissions to perform this action', 403)
      );
    }
    next();
  };
};
