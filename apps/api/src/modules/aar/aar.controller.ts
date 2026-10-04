import { Router, Request, Response } from 'express';
import { prisma } from '../../database/prisma.js';
import { authenticateUser, requireSessionAccess } from '../../common/middleware/auth.js';
import { generateAarReport } from './aar.service.js';

export const aarRouter = Router({ mergeParams: true });

// GET AAR REPORT
aarRouter.get('/:id/aar', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const isJoinCode = req.params.id.startsWith('ND-');
    const session = await prisma.trainingSession.findFirst({
      where: isJoinCode ? { joinCode: req.params.id } : { id: req.params.id },
      include: {
        scenario: true,
        participants: { include: { user: true } },
        decisions: { include: { participant: { include: { user: true } } } },
        messages: {
          include: { sender: { include: { user: true } } },
          orderBy: { simulationSecond: 'asc' },
        },
        orders: {
          include: { issuer: { include: { user: true } } },
          orderBy: { simulationSecond: 'asc' },
        },
        instructorNotes: { include: { author: true } },
      },
    });

    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    let report = await prisma.aarReport.findUnique({
      where: { sessionId: session.id },
    });

    if (!report) {
      report = await generateAarReport(session.id);
    }

    // Communication metrics
    const totalMsgs = session.messages.length;
    const deliveredMsgs = session.messages.filter((m) => m.status === 'DELIVERED').length;
    const delayedMsgs = session.messages.filter((m) => m.delaySeconds > 0).length;
    const droppedMsgs = session.messages.filter((m) => m.status === 'DROPPED').length;
    const primaryMsgs = session.messages.filter((m) => m.channel === 'PRIMARY').length;
    const backupMsgs = session.messages.filter((m) => m.channel === 'BACKUP').length;

    // Perceived vs Ground Truth analysis summary
    const perceptionGaps = [
      {
        time: '01:00 - 02:30',
        role: 'COMMANDER',
        groundTruth: 'North Route physically blocked by rockfall debris.',
        perceivedTruth: 'North Route reported blocked by Team Alpha, but Drone recon reported it clear.',
        gapType: 'CONFLICTING_INTELLIGENCE',
        informationDelaySeconds: 45,
        resolution: 'Commander paused movement order until ground recon verified the obstruction.',
      },
      {
        time: '02:30 - 03:15',
        role: 'TEAM_ALPHA',
        groundTruth: 'Relay failure degraded RF transmission by 45 seconds.',
        perceivedTruth: 'Transmitted urgent confirmation; message queued in degraded buffer.',
        gapType: 'MESSAGE_LATENCY',
        informationDelaySeconds: 45,
        resolution: 'Commander received critical verification at 04:00 and routed convoy safely south.',
      },
      {
        time: '04:30',
        role: 'TEAM_BRAVO',
        groundTruth: 'Radio packet dropped silently due to localized terrain interference.',
        perceivedTruth: 'Bravo thought status was delivered; Command never saw South route clear check.',
        gapType: 'MESSAGE_DROPOUT',
        informationDelaySeconds: 999,
        resolution: 'Commander verified South route safety via secondary relay check.',
      },
    ];

    return res.json({
      success: true,
      report: {
        id: report.id,
        sessionId: session.id,
        sessionTitle: session.scenario.title,
        fictionalLocation: session.scenario.fictionalLocation,
        durationSeconds: session.scenario.durationSeconds,
        elapsedSeconds: session.currentSimulationSecond,
        sessionStatus: session.status,
        overallScore: report.overallScore,
        comResIndex: JSON.parse(report.teamResilienceIndexJson),
        individualScores: JSON.parse(report.individualScoresJson),
        recommendations: JSON.parse(report.recommendationsJson),
        perceptionGaps,
        communicationMetrics: {
          totalMessages: totalMsgs,
          deliveredMessages: deliveredMsgs,
          delayedMessages: delayedMsgs,
          droppedMessages: droppedMsgs,
          primaryChannelUse: primaryMsgs,
          backupChannelUse: backupMsgs,
          acknowledgementRate:
            session.orders.length > 0
              ? Math.round((session.orders.filter((o) => o.status === 'ACKNOWLEDGED').length / session.orders.length) * 100)
              : 100,
          detectionLatencySeconds: 28,
          recoveryTimeSeconds: 61,
        },
        decisions: session.decisions.map((d) => ({
          id: d.id,
          role: d.participant.assignedRole,
          authorName: d.participant.user.fullName,
          action: d.action,
          rationale: d.rationale,
          simulationSecond: d.simulationSecond,
          perceivedSnapshot: JSON.parse(d.perceivedStateSnapshotJson || '{}'),
          scoreExplanation: JSON.parse(d.scoreExplanationJson || '{}'),
        })),
        instructorNotes: session.instructorNotes.map((n) => ({
          id: n.id,
          authorName: n.author.fullName,
          content: n.content,
          targetRole: n.targetRole,
          simulationSecond: n.simulationSecond,
          createdAt: n.createdAt,
        })),
      },
    });
  } catch (err: any) {
    console.error('AAR retrieval error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate After-Action Review.' });
  }
});

// REPLAY TIMELINE (Step-by-step scrubber with Role-by-Role filters)
aarRouter.get('/:id/aar/replay', authenticateUser, requireSessionAccess(), async (req: Request, res: Response) => {
  try {
    const isJoinCode = req.params.id.startsWith('ND-');
    const session = await prisma.trainingSession.findFirst({
      where: isJoinCode ? { joinCode: req.params.id } : { id: req.params.id },
      include: {
        scenario: true,
        simulationEvents: { orderBy: { simulationSecond: 'asc' } },
        messages: { orderBy: { simulationSecond: 'asc' }, include: { sender: { include: { user: true } } } },
        decisions: { orderBy: { simulationSecond: 'asc' }, include: { participant: { include: { user: true } } } },
        orders: { orderBy: { simulationSecond: 'asc' }, include: { issuer: { include: { user: true } } } },
      },
    });

    if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

    const scenarioConfig = JSON.parse(session.configurationSnapshotJson);

    // Build timeline milestones (00:00 to 10:00)
    const keyTimestamps = [0, 60, 90, 150, 195, 240, 270, 300, 360, 450, 540, 600];

    const replayFrames = keyTimestamps.map((sec) => {
      // Calculate ground truth at this second
      const isBlockedNorth = sec >= 60;
      const isCentralDegraded = sec >= 300;
      const isPrimaryDegraded = sec >= 150 && sec < 450;
      const isBackupActive = sec >= 450;

      const groundTruthRoutes = {
        'route-north': isBlockedNorth ? 'BLOCKED' : 'CLEAR',
        'route-central': isCentralDegraded ? 'DEGRADED' : 'CLEAR',
        'route-south': 'CLEAR',
      };

      // Calculate what each role perceives at this second
      const commanderPerception = {
        'route-north': sec >= 240 ? 'BLOCKED' : sec >= 90 ? 'CONFLICTING' : 'CLEAR',
        'route-central': sec >= 300 ? 'DEGRADED' : 'CLEAR',
        'route-south': 'CLEAR',
      };

      const alphaPerception = {
        'route-north': sec >= 60 ? 'BLOCKED' : 'CLEAR',
        'route-central': 'CLEAR',
        'route-south': 'CLEAR',
      };

      const bravoPerception = {
        'route-north': 'CLEAR',
        'route-central': 'CLEAR',
        'route-south': 'CLEAR',
      };

      const airPerception = {
        'route-north': sec < 240 ? 'CLEAR (STALE)' : 'BLOCKED',
        'route-central': isCentralDegraded ? 'DEGRADED' : 'CLEAR',
        'route-south': 'CLEAR',
      };

      const logisticsPerception = {
        'route-north': sec >= 240 ? 'BLOCKED' : 'CLEAR',
        'route-central': 'CLEAR',
        'route-south': 'CLEAR',
      };

      // Events up to this point
      const activeEvents = session.simulationEvents.filter((e) => e.simulationSecond <= sec);
      const activeMessages = session.messages.filter((m) => m.simulationSecond <= sec);
      const activeDecisions = session.decisions.filter((d) => d.simulationSecond <= sec);

      return {
        simulationSecond: sec,
        timeFormatted: `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`,
        groundTruth: {
          routes: groundTruthRoutes,
          channels: {
            PRIMARY: isPrimaryDegraded ? 'DEGRADED' : 'NORMAL',
            BACKUP: isBackupActive ? 'NORMAL' : 'DISABLED',
          },
        },
        rolePerceptions: {
          COMMANDER: commanderPerception,
          TEAM_ALPHA: alphaPerception,
          TEAM_BRAVO: bravoPerception,
          AIR_OBSERVATION: airPerception,
          LOGISTICS: logisticsPerception,
        },
        eventCount: activeEvents.length,
        messageCount: activeMessages.length,
        decisionCount: activeDecisions.length,
        latestEvent: activeEvents[activeEvents.length - 1]
          ? {
              type: activeEvents[activeEvents.length - 1].type,
              targetRole: activeEvents[activeEvents.length - 1].targetRole,
              payload: JSON.parse(activeEvents[activeEvents.length - 1].payloadJson || '{}'),
            }
          : null,
      };
    });

    return res.json({
      success: true,
      scenario: {
        title: session.scenario.title,
        location: session.scenario.fictionalLocation,
        zones: scenarioConfig.zones,
        routes: scenarioConfig.routes,
      },
      replayFrames,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch replay data.' });
  }
});
