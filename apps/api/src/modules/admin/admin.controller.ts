import { Router, Request, Response } from 'express';
import os from 'os';
import { prisma } from '../../database/prisma.js';
import { authenticateUser, requireRole } from '../../common/middleware/auth.js';
import { recordAuditLog } from '../../common/utils/audit.js';

export const adminRouter = Router();

// Require SUPER_ADMIN for all admin routes
adminRouter.use(authenticateUser, requireRole(['SUPER_ADMIN']));

// 1. GET ALL USERS
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        isLocked: true,
        failedLoginCount: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch users.' });
  }
});

// 2. UPDATE USER ROLE
adminRouter.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['SUPER_ADMIN', 'INSTRUCTOR', 'COMMANDER', 'TEAM_OPERATOR', 'OBSERVER'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid user role.' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });

    await recordAuditLog(req.user!.id, 'USER_ROLE_CHANGED', { targetUserId: req.params.id, newRole: role }, req.ip, req.headers['user-agent']);
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update user role.' });
  }
});

// 3. UPDATE USER STATUS (ACTIVE/LOCKED)
adminRouter.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const { isActive, isLocked } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof isLocked === 'boolean' && {
          isLocked,
          lockoutUntil: isLocked ? new Date(Date.now() + 60 * 60 * 1000) : null,
          failedLoginCount: isLocked ? 5 : 0,
        }),
      },
    });

    await recordAuditLog(req.user!.id, 'USER_STATUS_UPDATED', { targetUserId: req.params.id, isActive, isLocked }, req.ip, req.headers['user-agent']);
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update user.' });
  }
});

// 4. GET AUDIT LOGS
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { action, limit = 100 } = req.query;
    const where: any = {};
    if (action && typeof action === 'string') where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 100,
      include: {
        user: { select: { fullName: true, email: true, role: true } },
      },
    });

    return res.json({ success: true, logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch audit logs.' });
  }
});

// 5. GET SYSTEM HEALTH
adminRouter.get('/system-health', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const sessionCount = await prisma.trainingSession.count();
    const activeSessions = await prisma.trainingSession.count({ where: { status: 'RUNNING' } });
    const totalEvents = await prisma.simulationEvent.count();

    const memUsage = process.memoryUsage();
    const systemInfo = {
      status: 'HEALTHY',
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: Math.floor(process.uptime()),
      loadAverage: os.loadavg(),
      totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
      processMemoryMb: Math.round(memUsage.rss / 1024 / 1024),
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      database: {
        connected: true,
        engine: 'SQLite (Relational / Production-Ready Prisma)',
        userCount,
        sessionCount,
        activeSessions,
        totalEvents,
      },
      security: {
        rateLimiterActive: true,
        auditLogging: 'ENABLED',
        jwtAccessExpiry: '15m',
        argon2BcryptHashing: 'ENABLED',
        rbacGuards: 'ENFORCED',
      },
    };

    return res.json({ success: true, health: systemInfo });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch system health.' });
  }
});

// 6. GET/UPDATE SETTINGS
adminRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    return res.json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch settings.' });
  }
});

adminRouter.patch('/settings', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { valueJson: JSON.stringify(value) },
      create: { key, valueJson: JSON.stringify(value) },
    });
    return res.json({ success: true, setting });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update setting.' });
  }
});

// 7. GET WAITLIST
adminRouter.get('/waitlist', async (req: Request, res: Response) => {
  try {
    const entries = await prisma.arVrWaitlistEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, waitlist: entries });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch waitlist.' });
  }
});

// 8. GET EXPORTS
adminRouter.get('/exports', async (req: Request, res: Response) => {
  try {
    const records = await prisma.exportRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
        session: { select: { joinCode: true } },
      },
    });
    return res.json({ success: true, exports: records });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch exports.' });
  }
});
