import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { authenticateUser, requireRole } from '../../common/middleware/auth.js';
import { recordAuditLog } from '../../common/utils/audit.js';
import { defaultScenarioData } from './default-scenario.js';

export const scenariosRouter = Router();

const scenarioSchema = z.object({
  title: z.string().min(3).max(150),
  fictionalLocation: z.string().min(2).max(100),
  description: z.string().min(10),
  objective: z.string().min(5),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  durationSeconds: z.number().int().min(60).max(3600).default(600),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  configurationJson: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Configuration must be valid JSON string'),
  scoreWeightsJson: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Score weights must be valid JSON string'),
});

// GET TEMPLATES
scenariosRouter.get('/templates/default', authenticateUser, (req: Request, res: Response) => {
  return res.json({ success: true, template: defaultScenarioData });
});

// LIST SCENARIOS
scenariosRouter.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { search, difficulty, status } = req.query;

    const where: any = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search } },
        { fictionalLocation: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (difficulty && typeof difficulty === 'string') {
      where.difficulty = difficulty;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    } else {
      where.status = { not: 'ARCHIVED' };
    }

    const scenarios = await prisma.scenario.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    return res.json({ success: true, scenarios });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch scenarios.' });
  }
});

// GET SCENARIO BY ID
scenariosRouter.get('/:id', authenticateUser, async (req: Request, res: Response) => {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!scenario) return res.status(404).json({ success: false, error: 'Scenario not found.' });

    return res.json({
      success: true,
      scenario: {
        ...scenario,
        configuration: JSON.parse(scenario.configurationJson),
        scoreWeights: JSON.parse(scenario.scoreWeightsJson),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve scenario.' });
  }
});

// CREATE SCENARIO (Instructor/Admin)
scenariosRouter.post('/', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const parse = scenarioSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ success: false, errors: parse.error.format() });

    const data = parse.data;
    const scenario = await prisma.scenario.create({
      data: {
        title: data.title,
        fictionalLocation: data.fictionalLocation,
        description: data.description,
        objective: data.objective,
        difficulty: data.difficulty,
        durationSeconds: data.durationSeconds,
        status: data.status,
        configurationJson: data.configurationJson,
        scoreWeightsJson: data.scoreWeightsJson || JSON.stringify(defaultScenarioData.scoreWeights),
        createdById: req.user!.id,
      },
    });

    await recordAuditLog(req.user!.id, 'SCENARIO_CREATED', { scenarioId: scenario.id, title: scenario.title }, req.ip, req.headers['user-agent']);

    return res.status(201).json({ success: true, scenario });
  } catch (err: any) {
    console.error('Create scenario error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create scenario.' });
  }
});

// UPDATE SCENARIO
scenariosRouter.patch('/:id', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Scenario not found.' });

    if (req.user!.role !== 'SUPER_ADMIN' && existing.createdById !== req.user!.id) {
      return res.status(403).json({ success: false, error: 'You can only edit scenarios you authored.' });
    }

    const updated = await prisma.scenario.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await recordAuditLog(req.user!.id, 'SCENARIO_UPDATED', { scenarioId: updated.id }, req.ip, req.headers['user-agent']);
    return res.json({ success: true, scenario: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update scenario.' });
  }
});

// CLONE SCENARIO
scenariosRouter.post('/:id/clone', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const original = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!original) return res.status(404).json({ success: false, error: 'Scenario not found.' });

    const cloned = await prisma.scenario.create({
      data: {
        title: `${original.title} (Copy)`,
        fictionalLocation: original.fictionalLocation,
        description: original.description,
        objective: original.objective,
        difficulty: original.difficulty,
        durationSeconds: original.durationSeconds,
        status: 'DRAFT',
        configurationJson: original.configurationJson,
        scoreWeightsJson: original.scoreWeightsJson,
        createdById: req.user!.id,
      },
    });

    await recordAuditLog(req.user!.id, 'SCENARIO_CLONED', { originalId: original.id, cloneId: cloned.id }, req.ip, req.headers['user-agent']);
    return res.status(201).json({ success: true, scenario: cloned });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to clone scenario.' });
  }
});

// ARCHIVE SCENARIO
scenariosRouter.post('/:id/archive', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const scenario = await prisma.scenario.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    return res.json({ success: true, scenario });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to archive scenario.' });
  }
});

// VALIDATE SCENARIO
scenariosRouter.post('/:id/validate', authenticateUser, async (req: Request, res: Response) => {
  try {
    const scenario = await prisma.scenario.findUnique({ where: { id: req.params.id } });
    if (!scenario) return res.status(404).json({ success: false, error: 'Scenario not found.' });

    const config = JSON.parse(scenario.configurationJson);
    const errors: string[] = [];

    if (!config.zones || config.zones.length < 2) {
      errors.push('Scenario must define at least one BASE and one OBJECTIVE zone.');
    }
    if (!config.routes || config.routes.length < 1) {
      errors.push('Scenario must have at least one route defined.');
    }
    if (!config.scheduledEvents || config.scheduledEvents.length === 0) {
      errors.push('Scenario should include scheduled degradation events.');
    }

    return res.json({
      success: errors.length === 0,
      isValid: errors.length === 0,
      errors,
      warnings: errors.length === 0 ? [] : ['Ensure all participant roles are assigned before starting.'],
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: 'Invalid configuration JSON.' });
  }
});
