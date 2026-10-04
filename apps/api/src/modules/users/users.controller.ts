import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { authenticateUser } from '../../common/middleware/auth.js';
import { recordAuditLog } from '../../common/utils/audit.js';

export const usersRouter = Router();

usersRouter.get('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarInitials: true,
        themePreference: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    return res.json({ success: true, user });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
});

usersRouter.patch('/me', authenticateUser, async (req: Request, res: Response) => {
  try {
    const parse = updateProfileSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, errors: parse.error.format() });

    const { fullName } = parse.data;
    const initials = fullName
      ? fullName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2)
      : undefined;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(fullName && { fullName }),
        ...(initials && { avatarInitials: initials }),
      },
    });

    await recordAuditLog(req.user!.id, 'PROFILE_UPDATED', { fullName }, req.ip, req.headers['user-agent']);
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

usersRouter.patch('/me/theme', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { theme } = req.body;
    if (!['dark', 'light', 'system'].includes(theme)) {
      return res.status(400).json({ success: false, error: 'Invalid theme.' });
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { themePreference: theme },
    });

    return res.json({ success: true, theme });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to save theme preference.' });
  }
});

usersRouter.get('/me/security-events', authenticateUser, async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, events: logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch security events.' });
  }
});
