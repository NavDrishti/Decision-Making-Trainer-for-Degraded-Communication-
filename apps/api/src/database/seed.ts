import { prisma } from './prisma.js';
import { hashPassword } from '../common/utils/security.js';
import { defaultScenarioData } from '../modules/scenarios/default-scenario.js';
import { generateAarReport } from '../modules/aar/aar.service.js';

export async function seedDatabase() {
  console.log('🌱 Starting NavDrishtiAI database seed...');

  const commonPasswordHash = await hashPassword('ChangeMe!NavDrishti2026');

  const demoUsers = [
    { fullName: 'System Administrator', email: 'admin@navdrishti.local', role: 'SUPER_ADMIN', avatarInitials: 'SA' },
    { fullName: 'Chief Instructor Sharma', email: 'instructor@navdrishti.local', role: 'INSTRUCTOR', avatarInitials: 'IS' },
    { fullName: 'Commander Vikram Rathore', email: 'commander@navdrishti.local', role: 'COMMANDER', avatarInitials: 'CR' },
    { fullName: 'Alpha Scout Lead', email: 'alpha@navdrishti.local', role: 'TEAM_OPERATOR', avatarInitials: 'TA' },
    { fullName: 'Bravo Patrol Lead', email: 'bravo@navdrishti.local', role: 'TEAM_OPERATOR', avatarInitials: 'TB' },
    { fullName: 'Air Recon Specialist', email: 'air@navdrishti.local', role: 'TEAM_OPERATOR', avatarInitials: 'AO' },
    { fullName: 'Logistics Convoy Officer', email: 'logistics@navdrishti.local', role: 'TEAM_OPERATOR', avatarInitials: 'LO' },
    { fullName: 'Senior Military Observer', email: 'observer@navdrishti.local', role: 'OBSERVER', avatarInitials: 'OB' },
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const created = await prisma.user.create({
        data: {
          fullName: u.fullName,
          email: u.email,
          passwordHash: commonPasswordHash,
          role: u.role,
          avatarInitials: u.avatarInitials,
          emailVerifiedAt: new Date(),
          isActive: true,
        },
      });
      createdUsers[u.email] = created;
      console.log(`  ✓ Created user: ${u.email} (${u.role})`);
    } else {
      createdUsers[u.email] = existing;
    }
  }

  const instructor = createdUsers['instructor@navdrishti.local'];

  // 2. Create Default Scenario
  let scenario = await prisma.scenario.findFirst({ where: { title: defaultScenarioData.title } });
  if (!scenario) {
    scenario = await prisma.scenario.create({
      data: {
        title: defaultScenarioData.title,
        fictionalLocation: defaultScenarioData.fictionalLocation,
        description: defaultScenarioData.description,
        objective: defaultScenarioData.objective,
        difficulty: defaultScenarioData.difficulty,
        durationSeconds: defaultScenarioData.durationSeconds,
        status: 'PUBLISHED',
        configurationJson: JSON.stringify(defaultScenarioData),
        scoreWeightsJson: JSON.stringify(defaultScenarioData.scoreWeights),
        createdById: instructor.id,
      },
    });
    console.log(`  ✓ Seeded default scenario: ${scenario.title}`);
  }

  // 3. Seed A Completed Demo Session with Rich Logs & AAR for immediate instant review
  let completedSession = await prisma.trainingSession.findFirst({
    where: { joinCode: 'ND-DEMO-AAR' },
  });

  if (!completedSession) {
    completedSession = await prisma.trainingSession.create({
      data: {
        joinCode: 'ND-DEMO-AAR',
        scenarioId: scenario.id,
        createdById: instructor.id,
        status: 'COMPLETED',
        startedAt: new Date(Date.now() - 600 * 1000),
        endedAt: new Date(),
        currentSimulationSecond: 600,
        configurationSnapshotJson: JSON.stringify(defaultScenarioData),
        groundTruthStateJson: JSON.stringify({
          simulationSecond: 600,
          status: 'COMPLETED',
          routes: {
            'route-north': { status: 'BLOCKED', reason: 'Confirmed rockfall debris' },
            'route-central': { status: 'DEGRADED', reason: 'Flash rainstorm flooding' },
            'route-south': { status: 'CLEAR', reason: 'Safe valley transit' },
          },
          channels: {
            PRIMARY: { status: 'NORMAL', delaySeconds: 0, dropProbability: 0 },
            BACKUP: { status: 'NORMAL', available: true },
          },
        }),
      },
    });

    // Add participants
    const participantRoles = [
      { email: 'instructor@navdrishti.local', role: 'INSTRUCTOR' },
      { email: 'commander@navdrishti.local', role: 'COMMANDER' },
      { email: 'alpha@navdrishti.local', role: 'TEAM_ALPHA' },
      { email: 'bravo@navdrishti.local', role: 'TEAM_BRAVO' },
      { email: 'air@navdrishti.local', role: 'AIR_OBSERVATION' },
      { email: 'logistics@navdrishti.local', role: 'LOGISTICS' },
      { email: 'observer@navdrishti.local', role: 'OBSERVER' },
    ];

    const seededParticipants: Record<string, any> = {};
    for (const p of participantRoles) {
      const u = createdUsers[p.email];
      const part = await prisma.sessionParticipant.create({
        data: {
          sessionId: completedSession.id,
          userId: u.id,
          assignedRole: p.role,
          status: 'READY',
        },
      });
      seededParticipants[p.role] = part;
    }

    // Seed Messages
    await prisma.message.createMany({
      data: [
        {
          sessionId: completedSession.id,
          senderParticipantId: seededParticipants['TEAM_ALPHA'].id,
          recipientRole: 'COMMANDER',
          channel: 'PRIMARY',
          body: 'Team Alpha observing debris rockfall at North Ridge pass. Recommend caution.',
          simulationSecond: 60,
          scheduledDeliverySecond: 60,
          deliveredSecond: 60,
          status: 'DELIVERED',
          delaySeconds: 0,
        },
        {
          sessionId: completedSession.id,
          senderParticipantId: seededParticipants['AIR_OBSERVATION'].id,
          recipientRole: 'COMMANDER',
          channel: 'PRIMARY',
          body: 'Recon feed shows North Route appears clear. (Stale Imagery - 85s ago).',
          simulationSecond: 90,
          scheduledDeliverySecond: 90,
          deliveredSecond: 90,
          status: 'DELIVERED',
          delaySeconds: 0,
          isStale: true,
        },
        {
          sessionId: completedSession.id,
          senderParticipantId: seededParticipants['TEAM_ALPHA'].id,
          recipientRole: 'COMMANDER',
          channel: 'PRIMARY',
          body: 'Confirmed severe landslide at North Ridge km 14. Road totally impassable.',
          simulationSecond: 195,
          scheduledDeliverySecond: 240,
          deliveredSecond: 240,
          status: 'DELIVERED',
          delaySeconds: 45,
        },
        {
          sessionId: completedSession.id,
          senderParticipantId: seededParticipants['TEAM_BRAVO'].id,
          recipientRole: 'COMMANDER',
          channel: 'PRIMARY',
          body: 'Team Bravo confirms South Valley perimeter clear and weather dry.',
          simulationSecond: 270,
          scheduledDeliverySecond: 270,
          status: 'DROPPED',
          delaySeconds: 0,
        },
        {
          sessionId: completedSession.id,
          senderParticipantId: seededParticipants['LOGISTICS'].id,
          recipientRole: 'COMMANDER',
          channel: 'PRIMARY',
          body: 'Medical convoy standing by at Base Orion. Requesting finalized departure route.',
          simulationSecond: 280,
          scheduledDeliverySecond: 280,
          deliveredSecond: 280,
          status: 'DELIVERED',
        },
      ],
    });

    // Seed Orders
    const order1 = await prisma.order.create({
      data: {
        sessionId: completedSession.id,
        issuerParticipantId: seededParticipants['COMMANDER'].id,
        recipientRole: 'LOGISTICS',
        content: 'Logistics Convoy: Standby at Base Orion. Hold until scout reports resolve conflicting overhead intel.',
        status: 'ACKNOWLEDGED',
        simulationSecond: 120,
        acknowledgedSecond: 135,
        acknowledgedAt: new Date(),
      },
    });

    const order2 = await prisma.order.create({
      data: {
        sessionId: completedSession.id,
        issuerParticipantId: seededParticipants['COMMANDER'].id,
        recipientRole: 'LOGISTICS',
        content: 'EXECUTE: Dispatch supply convoy via Route South (South Valley Bypass). AVOID North and Central.',
        status: 'ACKNOWLEDGED',
        simulationSecond: 360,
        acknowledgedSecond: 372,
        acknowledgedAt: new Date(),
        relatedRouteId: 'route-south',
      },
    });

    // Seed Decisions with rationale & snapshot
    await prisma.decision.create({
      data: {
        sessionId: completedSession.id,
        participantId: seededParticipants['COMMANDER'].id,
        decisionType: 'HOLD_POSITION',
        action: 'Hold Convoy Departure at Base Orion',
        rationale: 'Conflicting reports between Team Alpha (ground debris) and Air Unit (clear imagery). Awaiting ground verification.',
        simulationSecond: 110,
        perceivedStateSnapshotJson: JSON.stringify({
          visibleRoutes: { 'route-north': 'CONFLICTING', 'route-central': 'CLEAR', 'route-south': 'CLEAR' },
          unresolvedConflicts: ['North route physical status vs aerial imagery'],
          channelCondition: 'PRIMARY_NORMAL',
        }),
        resultJson: JSON.stringify({ outcome: 'AVOIDED_DISASTER' }),
        scoreExplanationJson: JSON.stringify({
          alignedWithPerception: true,
          penalizedForHiddenTruth: false,
          feedback: 'Sound tactical caution. Did not gamble on unverified aerial report.',
        }),
      },
    });

    await prisma.decision.create({
      data: {
        sessionId: completedSession.id,
        participantId: seededParticipants['COMMANDER'].id,
        decisionType: 'ROUTE_SELECTION',
        action: 'Commit Convoy to South Valley Bypass',
        rationale: 'Alpha verified North is completely blocked. Central Highway is flooding. South Valley is clear and provides optimal protection.',
        simulationSecond: 360,
        perceivedStateSnapshotJson: JSON.stringify({
          visibleRoutes: { 'route-north': 'BLOCKED', 'route-central': 'DEGRADED', 'route-south': 'CLEAR' },
          unresolvedConflicts: [],
          channelCondition: 'PRIMARY_DELAYED_45S',
        }),
        resultJson: JSON.stringify({ outcome: 'SUCCESSFUL_DELIVERY' }),
        scoreExplanationJson: JSON.stringify({
          alignedWithPerception: true,
          penalizedForHiddenTruth: false,
          feedback: 'Optimal adaptive routing under multi-point degraded communication.',
        }),
      },
    });

    // Generate AAR
    await generateAarReport(completedSession.id);
    console.log(`  ✓ Seeded completed demo session with AAR: ND-DEMO-AAR`);
  }

  // 4. Seed Live Ready-to-Run Session
  let liveSession = await prisma.trainingSession.findFirst({
    where: { joinCode: 'ND-SIGNAL-88' },
  });

  if (!liveSession) {
    liveSession = await prisma.trainingSession.create({
      data: {
        joinCode: 'ND-SIGNAL-88',
        scenarioId: scenario.id,
        createdById: instructor.id,
        status: 'LOBBY',
        currentSimulationSecond: 0,
        configurationSnapshotJson: JSON.stringify(defaultScenarioData),
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
        }),
      },
    });

    // Add instructor participant
    await prisma.sessionParticipant.create({
      data: {
        sessionId: liveSession.id,
        userId: instructor.id,
        assignedRole: 'INSTRUCTOR',
        status: 'READY',
      },
    });

    console.log(`  ✓ Seeded live ready-to-run session with join code: ND-SIGNAL-88`);
  }

  console.log('✅ NavDrishtiAI database seeding complete!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
