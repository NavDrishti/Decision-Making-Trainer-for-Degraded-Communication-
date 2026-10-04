import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/security.js';
import { prisma } from '../../database/prisma.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarInitials: string;
  twoFactorEnabled: boolean;
  themePreference: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarInitials: true,
        isActive: true,
        isLocked: true,
        twoFactorEnabled: true,
        themePreference: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'User account is inactive or not found.' });
    }

    if (user.isLocked) {
      return res.status(403).json({ success: false, error: 'Account is temporarily locked for security.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarInitials: user.avatarInitials,
      twoFactorEnabled: user.twoFactorEnabled,
      themePreference: user.themePreference,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired access token.' });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    // SUPER_ADMIN has access to all routes
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`,
      });
    }

    return next();
  };
}

export function requireSessionAccess(paramName: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const sessionId = req.params[paramName] || req.params.sessionId || req.params.id;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required.' });
    }

    // Super admin has universal access
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check if session exists
    const isJoinCode = sessionId.startsWith('ND-');
    const session = await prisma.trainingSession.findFirst({
      where: isJoinCode ? { joinCode: sessionId } : { id: sessionId },
      include: {
        participants: {
          where: { userId: req.user.id },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Training session not found.' });
    }

    // Instructors can access sessions
    if (req.user.role === 'INSTRUCTOR') {
      return next();
    }

    // Trainees must be assigned participants
    if (session.participants.length === 0) {
      return res.status(403).json({ success: false, error: 'You are not assigned to this training session.' });
    }

    return next();
  };
}
