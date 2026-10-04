import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { authenticateUser, requireRole, requireSessionAccess } from '../../common/middleware/auth.js';
import { generateJoinCode } from '../../common/utils/security.js';
import { recordAuditLog } from '../../common/utils/audit.js';
import { ScenarioEngine } from '../simulation/scenario-engine.js';

export const sessionsRouter = Router();

const createSessionSchema = z.object({
  scenarioId: z.string().uuid(),
  customJoinCode: z.string().optional(),
});

// LIST SESSIONS
sessionsRouter.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { status, scenarioId } = req.query;
    const where: any = {};

    if (status && typeof status === 'string') where.status = status;
    if (scenarioId && typeof scenarioId === 'string') where.scenarioId = scenarioId;

    // Trainees only see sessions they are part of, instructors see all or own
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.role !== 'INSTRUCTOR') {
      where.participants = {
        some: { userId: req.user!.id },
      };
    }

    const sessions = await prisma.trainingSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        scenario: {
          select: { id: true, title: true, fictionalLocation: true, durationSeconds: true, difficulty: true },
        },
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarInitials: true },
            },
          },
        },
        _count: {
          select: { messages: true, decisions: true, orders: true },
        },
      },
    });

    return res.json({ success: true, sessions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve sessions.' });
  }
});

// CREATE SESSION (Instructor / Admin)
sessionsRouter.post('/', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const parse = createSessionSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, errors: parse.error.format() });

    const { scenarioId, customJoinCode } = parse.data;
    const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
    if (!scenario) return res.status(404).json({ success: false, error: 'Scenario not found.' });

    const joinCode = customJoinCode || generateJoinCode();

    const session = await prisma.trainingSession.create({
      data: {
        joinCode,
        scenarioId: scenario.id,
        createdById: req.user!.id,
        status: 'LOBBY',
        configurationSnapshotJson: scenario.configurationJson,
        groundTruthStateJson: JSON.stringify({
          simulationSecond: 0,
          status: 'LOBBY',
          routes: {
            'route-north': { status: 'CLEAR' },
            'route-central': { status: 'CLEAR' },
            'route-south': { status: 'CLEAR' },
          },
          channels: {
            PRIMARY: { status: 'NORMAL', delaySeconds: 0, dropProbability: 0 },
            BACKUP: { status: 'DISABLED', available: false },
          },
          units: {
            COMMANDER: { role: 'COMMANDER', name: 'Command Center', position: [34.12, 74.8], status: 'MONITORING' },
            TEAM_ALPHA: { role: 'TEAM_ALPHA', name: 'Scout Alpha', position: [34.17, 74.84], status: 'RECON' },
            TEAM_BRAVO: { role: 'TEAM_BRAVO', name: 'Patrol Bravo', position: [34.11, 74.92], status: 'PATROL' },
            AIR_OBSERVATION: { role: 'AIR_OBSERVATION', name: 'Recon Drone 1', position: [34.16, 74.88], status: 'ORBITING' },
            LOGISTICS: { role: 'LOGISTICS', name: 'Relief Convoy 1', position: [34.12, 74.8], status: 'STANDBY' },
          },
          resources: {
            supplyPackages: 1,
            vehicles: 1,
            aerialSensors: 1,
            aerialFeedActive: true,
          },
          activeIncidents: [],
        }),
      },
    });

    // Automatically add creator as INSTRUCTOR participant
    await prisma.sessionParticipant.create({
      data: {
        sessionId: session.id,
        userId: req.user!.id,
        assignedRole: 'INSTRUCTOR',
        status: 'READY',
      },
    });

    await recordAuditLog(req.user!.id, 'SESSION_CREATED', { sessionId: session.id, joinCode }, req.ip, req.headers['user-agent']);

    return res.status(201).json({ success: true, session });
  } catch (err: any) {
    console.error('Session create error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create training session.' });
  }
});

// GET SESSION BY ID OR JOIN CODE
sessionsRouter.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const isJoinCode = req.params.id.startsWith('ND-');
    const session = await prisma.trainingSession.findFirst({
      where: isJoinCode ? { joinCode: req.params.id } : { id: req.params.id },
      include: {
        scenario: true,
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarInitials: true, role: true },
            },
          },
        },
      },
    });

    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    // Check user participation
    const currentParticipant = session.participants.find((p) => p.userId === req.user!.id);

    return res.json({
      success: true,
      session: {
        ...session,
        scenarioConfig: JSON.parse(session.configurationSnapshotJson),
      },
      currentParticipant: currentParticipant || null,
      isInstructor: req.user!.role === 'INSTRUCTOR' || req.user!.role === 'SUPER_ADMIN',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to load session details.' });
  }
});

// JOIN SESSION (BY CODE OR ID)
sessionsRouter.post('/join', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { code, requestedRole } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Join code is required.' });

    const session = await prisma.trainingSession.findUnique({
      where: { joinCode: code.trim().toUpperCase() },
      include: { participants: true, scenario: true },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Invalid session join code.' });
    }

    if (session.status === 'COMPLETED' || session.status === 'ARCHIVED') {
      return res.status(400).json({ success: false, error: 'This training session has already ended.' });
    }

    // Determine role to assign
    const assignedRole = requestedRole || (req.user!.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'TEAM_ALPHA');

    let participant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId: session.id,
          userId: req.user!.id,
        },
      },
    });

    if (!participant) {
      participant = await prisma.sessionParticipant.create({
        data: {
          sessionId: session.id,
          userId: req.user!.id,
          assignedRole,
          status: 'READY',
        },
      });
    }

    await recordAuditLog(req.user!.id, 'SESSION_JOINED', { sessionId: session.id, role: assignedRole }, req.ip, req.headers['user-agent']);

    return res.json({
      success: true,
      sessionId: session.id,
      assignedRole: participant.assignedRole,
      status: session.status,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to join session.' });
  }
});

// ASSIGN / CHANGE ROLE (Instructor or Self in Lobby)
sessionsRouter.post('/:id/assign-role', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { participantId, role } = req.body;
    if (!role) return res.status(400).json({ success: false, error: 'Role is required.' });

    const updated = await prisma.sessionParticipant.update({
      where: { id: participantId },
      data: { assignedRole: role },
    });

    return res.json({ success: true, participant: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to assign role.' });
  }
});

// START SESSION
sessionsRouter.post('/:id/start', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const session = await prisma.trainingSession.findUnique({
      where: { id: req.params.id },
      include: { scenario: true },
    });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    let engine = ScenarioEngine.getEngine(session.id);
    if (!engine) {
      const config = JSON.parse(session.configurationSnapshotJson);
      engine = new ScenarioEngine(session.id, config, JSON.parse(session.groundTruthStateJson));
      ScenarioEngine.registerEngine(session.id, engine);
    }

    await engine.start();
    await recordAuditLog(req.user!.id, 'SESSION_STARTED', { sessionId: session.id }, req.ip, req.headers['user-agent']);

    return res.json({ success: true, status: 'RUNNING' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to start simulation.' });
  }
});

// PAUSE SESSION
sessionsRouter.post('/:id/pause', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const engine = ScenarioEngine.getEngine(req.params.id);
    if (engine) await engine.pause();
    return res.json({ success: true, status: 'PAUSED' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to pause session.' });
  }
});

// RESUME SESSION
sessionsRouter.post('/:id/resume', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const engine = ScenarioEngine.getEngine(req.params.id);
    if (engine) await engine.resume();
    return res.json({ success: true, status: 'RUNNING' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to resume session.' });
  }
});

// END SESSION
sessionsRouter.post('/:id/end', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const engine = ScenarioEngine.getEngine(req.params.id);
    if (engine) await engine.end();
    return res.json({ success: true, status: 'COMPLETED' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to end session.' });
  }
});

// GET ROLE-AWARE STATE
sessionsRouter.get('/:id/state', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const session = await prisma.trainingSession.findUnique({
      where: { id: req.params.id },
      include: {
        participants: { where: { userId: req.user!.id } },
      },
    });

    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    const userParticipant = session.participants[0];
    const role = req.user!.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : (userParticipant ? userParticipant.assignedRole : req.user!.role);

    let engine = ScenarioEngine.getEngine(session.id);
    if (!engine) {
      const config = JSON.parse(session.configurationSnapshotJson);
      engine = new ScenarioEngine(session.id, config, JSON.parse(session.groundTruthStateJson));
      ScenarioEngine.registerEngine(session.id, engine);
    }

    const state = engine.getPerceivedStateForRole(role);
    return res.json({
      success: true,
      state,
      sessionStatus: session.status,
      currentSecond: engine.groundTruth.simulationSecond,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch state.' });
  }
});
