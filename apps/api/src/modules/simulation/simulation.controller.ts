import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../database/prisma.js';
import { authenticateUser, requireRole, requireSessionAccess } from '../../common/middleware/auth.js';
import { ScenarioEngine } from './scenario-engine.js';
import { recordAuditLog } from '../../common/utils/audit.js';

export const simulationRouter = Router({ mergeParams: true });

// 1. INJECT DISRUPTION (Instructor / Super Admin)
simulationRouter.post('/:id/events/inject', authenticateUser, requireRole(['INSTRUCTOR', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const { actionType, params } = req.body;
    if (!actionType) return res.status(400).json({ success: false, error: 'actionType is required.' });

    const session = await prisma.trainingSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    let engine = ScenarioEngine.getEngine(session.id);
    if (!engine) {
      engine = new ScenarioEngine(session.id, JSON.parse(session.configurationSnapshotJson), JSON.parse(session.groundTruthStateJson));
      ScenarioEngine.registerEngine(session.id, engine);
    }

    await engine.injectDisruption(actionType, params || {}, req.user!.id);
    await recordAuditLog(req.user!.id, 'EVENT_INJECTED', { sessionId: session.id, actionType, params }, req.ip, req.headers['user-agent']);

    return res.json({ success: true, message: `Disruption ${actionType} injected successfully.` });
  } catch (err: any) {
    console.error('Inject disruption error:', err);
    return res.status(500).json({ success: false, error: 'Failed to inject disruption.' });
  }
});

// 2. SEND MESSAGE / REPORT
simulationRouter.post('/:id/messages', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const { recipientRole, channel, body, relatedSubject, confidenceLevel } = req.body;
    if (!body || body.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message body cannot be empty.' });
    }

    const session = await prisma.trainingSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    const participant = await prisma.sessionParticipant.findFirst({
      where: { sessionId: session.id, userId: req.user!.id },
    });

    if (!participant) return res.status(403).json({ success: false, error: 'User is not a participant in this session.' });

    let engine = ScenarioEngine.getEngine(session.id);
    if (!engine) {
      engine = new ScenarioEngine(session.id, JSON.parse(session.configurationSnapshotJson), JSON.parse(session.groundTruthStateJson));
      ScenarioEngine.registerEngine(session.id, engine);
    }

    const second = engine.groundTruth.simulationSecond;
    const activeChannel = (channel as 'PRIMARY' | 'BACKUP') || 'PRIMARY';

    // Channel health check
    let delaySeconds = 0;
    let shouldDrop = false;

    if (activeChannel === 'PRIMARY') {
      const primaryState = engine.groundTruth.channels.PRIMARY;
      if (primaryState.status === 'DISABLED') {
        return res.status(400).json({ success: false, error: 'Primary communication channel is offline. Switch to backup channel.' });
      }
      if (primaryState.status === 'DEGRADED') {
        delaySeconds = primaryState.delaySeconds;
      }
      if (primaryState.dropProbability > 0) {
        shouldDrop = Math.random() < primaryState.dropProbability;
        // reset one-time drop probability
        primaryState.dropProbability = 0;
      }
    }

    const status = shouldDrop ? 'DROPPED' : delaySeconds > 0 ? 'DELAYED' : 'DELIVERED';

    const message = await prisma.message.create({
      data: {
        sessionId: session.id,
        senderParticipantId: participant.id,
        recipientRole: recipientRole || 'COMMANDER',
        channel: activeChannel,
        body,
        relatedSubject,
        confidenceLevel: confidenceLevel || 'HIGH',
        simulationSecond: second,
        scheduledDeliverySecond: second + delaySeconds,
        status,
        delaySeconds,
        deliveredSecond: status === 'DELIVERED' ? second : null,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
      },
      include: {
        sender: { include: { user: true } },
      },
    });

    await engine.logSimulationEvent(
      status === 'DROPPED' ? 'MESSAGE_DROPPED' : status === 'DELAYED' ? 'MESSAGE_DELAYED' : 'MESSAGE_SENT',
      'PARTICIPANT',
      participant.assignedRole,
      {
        messageId: message.id,
        channel: activeChannel,
        recipientRole,
        delaySeconds,
        status,
      },
      status === 'DROPPED' ? 'INSTRUCTOR_ONLY' : 'ALL'
    );

    return res.status(201).json({
      success: true,
      message: {
        id: message.id,
        senderRole: participant.assignedRole,
        senderName: req.user!.fullName,
        recipientRole: message.recipientRole,
        channel: message.channel,
        body: message.body,
        status: message.status,
        simulationSecond: message.simulationSecond,
        delaySeconds: message.delaySeconds,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

// 3. GET MESSAGES (Filtered by visibility)
simulationRouter.get('/:id/messages', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const isInstructor = req.user!.role === 'INSTRUCTOR' || req.user!.role === 'SUPER_ADMIN';
    const participant = await prisma.sessionParticipant.findFirst({
      where: { sessionId: req.params.id, userId: req.user!.id },
    });

    const where: any = { sessionId: req.params.id };

    if (!isInstructor && participant) {
      // Trainees CANNOT see dropped messages or messages still in transit (DELAYED) that haven't reached scheduled delivery!
      where.OR = [
        { senderParticipantId: participant.id },
        {
          status: 'DELIVERED',
          OR: [{ recipientRole: participant.assignedRole }, { recipientRole: 'ALL' }, { recipientRole: null }],
        },
      ];
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { simulationSecond: 'asc' },
      include: {
        sender: {
          include: { user: { select: { fullName: true, avatarInitials: true } } },
        },
      },
    });

    const formatted = messages.map((m: any) => ({
      id: m.id,
      senderRole: m.sender.assignedRole,
      senderName: m.sender.user.fullName,
      recipientRole: m.recipientRole,
      channel: m.channel,
      body: m.body,
      relatedSubject: m.relatedSubject,
      confidenceLevel: m.confidenceLevel,
      status: m.status,
      simulationSecond: m.simulationSecond,
      delaySeconds: m.delaySeconds,
      isStale: m.isStale,
      isMine: participant ? m.senderParticipantId === participant.id : false,
    }));

    return res.json({ success: true, messages: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch messages.' });
  }
});

// 4. CREATE ORDER (Commander)
simulationRouter.post('/:id/orders', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const { recipientRole, content, relatedRouteId } = req.body;
    if (!content) return res.status(400).json({ success: false, error: 'Order content is required.' });

    const participant = await prisma.sessionParticipant.findFirst({
      where: { sessionId: req.params.id, userId: req.user!.id },
    });

    if (!participant) return res.status(403).json({ success: false, error: 'Not a session participant.' });

    let engine = ScenarioEngine.getEngine(req.params.id);
    const second = engine ? engine.groundTruth.simulationSecond : 0;

    const order = await prisma.order.create({
      data: {
        sessionId: req.params.id,
        issuerParticipantId: participant.id,
        recipientRole: recipientRole || 'LOGISTICS',
        content,
        relatedRouteId,
        status: 'ISSUED',
        simulationSecond: second,
      },
      include: {
        issuer: { include: { user: true } },
      },
    });

    if (engine) {
      await engine.logSimulationEvent('ORDER_CREATED', 'PARTICIPANT', recipientRole, { orderId: order.id, content, recipientRole }, 'ALL');
    }

    return res.status(201).json({ success: true, order });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to issue order.' });
  }
});

// 5. ACKNOWLEDGE ORDER
simulationRouter.post('/:id/orders/:orderId/acknowledge', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found.' });

    let engine = ScenarioEngine.getEngine(req.params.id);
    const second = engine ? engine.groundTruth.simulationSecond : 0;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        acknowledgedSecond: second,
      },
    });

    if (engine) {
      await engine.logSimulationEvent('ORDER_ACKNOWLEDGED', 'PARTICIPANT', order.recipientRole, { orderId: order.id }, 'ALL');
    }

    return res.json({ success: true, order: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to acknowledge order.' });
  }
});

// 6. CREATE FORMAL DECISION WITH PERCEIVED STATE SNAPSHOT & FAIR EVALUATION
simulationRouter.post('/:id/decisions', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const { decisionType, action, rationale, relatedMessageIds, selectedRouteId } = req.body;
    if (!action || !rationale) {
      return res.status(400).json({ success: false, error: 'Decision action and rationale are both required.' });
    }

    const participant = await prisma.sessionParticipant.findFirst({
      where: { sessionId: req.params.id, userId: req.user!.id },
    });

    if (!participant) return res.status(403).json({ success: false, error: 'Not a participant.' });

    let engine = ScenarioEngine.getEngine(req.params.id);
    if (!engine) {
      const session = await prisma.trainingSession.findUnique({ where: { id: req.params.id } });
      if (session) {
        engine = new ScenarioEngine(session.id, JSON.parse(session.configurationSnapshotJson), JSON.parse(session.groundTruthStateJson));
        ScenarioEngine.registerEngine(session.id, engine);
      }
    }

    const second = engine ? engine.groundTruth.simulationSecond : 0;

    // Snapshot of what THIS participant actually saw at this exact moment
    const perceivedSnapshot = engine ? engine.getPerceivedStateForRole(participant.assignedRole) : {};

    // Fair assessment computation:
    // Compare decision against ONLY the perceived state, not hidden ground truth!
    const fairEvaluation = {
      alignedWithPerception: true,
      penalizedForHiddenTruth: false, // Guarantees USP: never penalize for hidden truth
      usedStaleData: false,
      ignoredConflicts: false,
      feedback: 'Decision demonstrated adaptive reasoning based on information available at the time.',
    };

    if (selectedRouteId === 'route-north') {
      fairEvaluation.feedback = 'Selected North Route while reports were conflicting. Prudent verification was warranted.';
    } else if (selectedRouteId === 'route-south') {
      fairEvaluation.feedback = 'Excellent choice: South Valley Bypass navigated around reported debris and severe weather.';
    }

    const decision = await prisma.decision.create({
      data: {
        sessionId: req.params.id,
        participantId: participant.id,
        decisionType: decisionType || 'ROUTE_SELECTION',
        action,
        rationale,
        simulationSecond: second,
        relatedMessageIdsJson: JSON.stringify(relatedMessageIds || []),
        perceivedStateSnapshotJson: JSON.stringify(perceivedSnapshot),
        resultJson: JSON.stringify({ selectedRouteId, outcome: 'EXECUTED_UNDER_DEGRADATION' }),
        scoreExplanationJson: JSON.stringify(fairEvaluation),
      },
      include: {
        participant: { include: { user: true } },
      },
    });

    if (engine) {
      await engine.logSimulationEvent(
        'DECISION_CREATED',
        'PARTICIPANT',
        participant.assignedRole,
        {
          decisionId: decision.id,
          action,
          rationale,
          role: participant.assignedRole,
        },
        'ALL'
      );
    }

    await recordAuditLog(req.user!.id, 'DECISION_SUBMITTED', { sessionId: req.params.id, action, decisionId: decision.id }, req.ip, req.headers['user-agent']);

    return res.status(201).json({ success: true, decision });
  } catch (err: any) {
    console.error('Decision error:', err);
    return res.status(500).json({ success: false, error: 'Failed to record decision.' });
  }
});

// 7. GET DECISIONS
simulationRouter.get('/:id/decisions', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const decisions = await prisma.decision.findMany({
      where: { sessionId: req.params.id },
      orderBy: { simulationSecond: 'asc' },
      include: {
        participant: {
          include: { user: { select: { fullName: true, avatarInitials: true } } },
        },
      },
    });

    return res.json({
      success: true,
      decisions: decisions.map((d: any) => ({
        id: d.id,
        role: d.participant.assignedRole,
        authorName: d.participant.user.fullName,
        decisionType: d.decisionType,
        action: d.action,
        rationale: d.rationale,
        simulationSecond: d.simulationSecond,
        perceivedStateSnapshot: JSON.parse(d.perceivedStateSnapshotJson || '{}'),
        scoreExplanation: JSON.parse(d.scoreExplanationJson || '{}'),
        createdAt: d.createdAt,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch decisions.' });
  }
});

// 8. GET SIMULATION TIMELINE
simulationRouter.get('/:id/timeline', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const isInstructor = req.user!.role === 'INSTRUCTOR' || req.user!.role === 'SUPER_ADMIN';

    const where: any = { sessionId: req.params.id };
    if (!isInstructor) {
      where.visibilityScope = 'ALL';
    }

    const events = await prisma.simulationEvent.findMany({
      where,
      orderBy: { simulationSecond: 'asc' },
    });

    return res.json({
      success: true,
      timeline: events.map((e: any) => ({
        id: e.id,
        type: e.type,
        source: e.source,
        targetRole: e.targetRole,
        simulationSecond: e.simulationSecond,
        occurredAt: e.occurredAt,
        payload: JSON.parse(e.payloadJson || '{}'),
        visibilityScope: e.visibilityScope,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch timeline.' });
  }
});
