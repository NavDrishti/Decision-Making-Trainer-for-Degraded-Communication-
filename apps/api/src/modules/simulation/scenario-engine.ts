import { prisma } from '../../database/prisma.js';
import { recordAuditLog } from '../../common/utils/audit.js';

export interface GroundTruthState {
  simulationSecond: number;
  status: 'LOBBY' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  routes: Record<string, { status: string; reason?: string }>;
  channels: {
    PRIMARY: { status: 'NORMAL' | 'DEGRADED' | 'DISABLED'; delaySeconds: number; dropProbability: number };
    BACKUP: { status: 'NORMAL' | 'DEGRADED' | 'DISABLED'; available: boolean };
  };
  units: Record<
    string,
    {
      role: string;
      name: string;
      position: [number, number];
      status: string;
      assignedRoute?: string;
    }
  >;
  resources: {
    supplyPackages: number;
    vehicles: number;
    aerialSensors: number;
    aerialFeedActive: boolean;
  };
  activeIncidents: string[];
}

export class ScenarioEngine {
  private static activeEngines = new Map<string, ScenarioEngine>();
  private timerInterval: NodeJS.Timeout | null = null;
  public sessionId: string;
  public groundTruth: GroundTruthState;
  public scenarioConfig: any;
  private ioCallback?: (event: string, data: any, room?: string) => void;

  constructor(sessionId: string, scenarioConfig: any, initialGroundTruth?: GroundTruthState) {
    this.sessionId = sessionId;
    this.scenarioConfig = scenarioConfig;
    this.groundTruth = initialGroundTruth || {
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
    };
  }

  public static getEngine(sessionId: string): ScenarioEngine | undefined {
    return ScenarioEngine.activeEngines.get(sessionId);
  }

  public static registerEngine(sessionId: string, engine: ScenarioEngine): void {
    ScenarioEngine.activeEngines.set(sessionId, engine);
  }

  public setIoCallback(cb: (event: string, data: any, room?: string) => void) {
    this.ioCallback = cb;
  }

  private broadcast(event: string, data: any, room?: string) {
    if (this.ioCallback) {
      this.ioCallback(event, data, room);
    }
  }

  public async start() {
    this.groundTruth.status = 'RUNNING';
    await prisma.trainingSession.update({
      where: { id: this.sessionId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        groundTruthStateJson: JSON.stringify(this.groundTruth),
      },
    });

    await this.logSimulationEvent('SESSION_STARTED', 'INSTRUCTOR', null, { second: this.groundTruth.simulationSecond }, 'ALL');
    this.broadcast('session:status-updated', { status: 'RUNNING', simulationSecond: this.groundTruth.simulationSecond });

    this.startClock();
  }

  public async pause() {
    this.groundTruth.status = 'PAUSED';
    if (this.timerInterval) clearInterval(this.timerInterval);

    await prisma.trainingSession.update({
      where: { id: this.sessionId },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
        currentSimulationSecond: this.groundTruth.simulationSecond,
        groundTruthStateJson: JSON.stringify(this.groundTruth),
      },
    });

    await this.logSimulationEvent('SESSION_PAUSED', 'INSTRUCTOR', null, { second: this.groundTruth.simulationSecond }, 'ALL');
    this.broadcast('session:status-updated', { status: 'PAUSED', simulationSecond: this.groundTruth.simulationSecond });
  }

  public async resume() {
    this.groundTruth.status = 'RUNNING';
    await prisma.trainingSession.update({
      where: { id: this.sessionId },
      data: {
        status: 'RUNNING',
        pausedAt: null,
      },
    });

    await this.logSimulationEvent('SESSION_RESUMED', 'INSTRUCTOR', null, { second: this.groundTruth.simulationSecond }, 'ALL');
    this.broadcast('session:status-updated', { status: 'RUNNING', simulationSecond: this.groundTruth.simulationSecond });
    this.startClock();
  }

  public async end() {
    this.groundTruth.status = 'COMPLETED';
    if (this.timerInterval) clearInterval(this.timerInterval);

    await prisma.trainingSession.update({
      where: { id: this.sessionId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        currentSimulationSecond: this.groundTruth.simulationSecond,
        groundTruthStateJson: JSON.stringify(this.groundTruth),
      },
    });

    await this.logSimulationEvent('SESSION_ENDED', 'SYSTEM', null, { second: this.groundTruth.simulationSecond }, 'ALL');
    this.broadcast('session:status-updated', { status: 'COMPLETED', simulationSecond: this.groundTruth.simulationSecond });
    this.broadcast('aar:ready', { sessionId: this.sessionId });
  }

  private startClock() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(async () => {
      if (this.groundTruth.status !== 'RUNNING') return;

      this.groundTruth.simulationSecond += 1;
      const second = this.groundTruth.simulationSecond;

      // Broadcast clock tick
      this.broadcast('timer:update', { simulationSecond: second });

      // Check scheduled events
      if (this.scenarioConfig && Array.isArray(this.scenarioConfig.scheduledEvents)) {
        for (const evt of this.scenarioConfig.scheduledEvents) {
          if (evt.triggerAtSeconds === second) {
            await this.executeScheduledEvent(evt);
          }
        }
      }

      // Check delayed messages ready for delivery
      await this.deliverPendingDelayedMessages(second);

      // Periodically persist ground truth state
      if (second % 10 === 0) {
        await prisma.trainingSession.update({
          where: { id: this.sessionId },
          data: {
            currentSimulationSecond: second,
            groundTruthStateJson: JSON.stringify(this.groundTruth),
          },
        });
      }

      // Check auto completion
      if (this.scenarioConfig?.durationSeconds && second >= this.scenarioConfig.durationSeconds) {
        await this.end();
      }
    }, 1000);
  }

  private async deliverPendingDelayedMessages(currentSecond: number) {
    const delayedMessages = await prisma.message.findMany({
      where: {
        sessionId: this.sessionId,
        status: 'DELAYED',
        scheduledDeliverySecond: { lte: currentSecond },
      },
      include: {
        sender: { include: { user: true } },
      },
    });

    for (const msg of delayedMessages) {
      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: 'DELIVERED',
          deliveredSecond: currentSecond,
          deliveredAt: new Date(),
        },
      });

      const payload = {
        id: msg.id,
        senderRole: msg.sender.assignedRole,
        senderName: msg.sender.user.fullName,
        recipientRole: msg.recipientRole,
        channel: msg.channel,
        content: msg.body,
        status: 'DELIVERED',
        simulationSecond: currentSecond,
        delayedBySeconds: msg.delaySeconds,
        isStale: msg.isStale,
      };

      // Deliver to recipient role room and instructor
      if (msg.recipientRole && msg.recipientRole !== 'ALL') {
        this.broadcast('message:delivered', payload, `session:${this.sessionId}:role:${msg.recipientRole}`);
      } else {
        this.broadcast('message:delivered', payload, `session:${this.sessionId}`);
      }
      this.broadcast('message:delivered', payload, `session:${this.sessionId}:instructors`);

      await this.logSimulationEvent('MESSAGE_DELIVERED', 'SYSTEM', msg.recipientRole, payload, 'ALL');
    }
  }

  private async executeScheduledEvent(eventDef: any) {
    const second = this.groundTruth.simulationSecond;

    switch (eventDef.type) {
      case 'REPORT_CREATED':
      case 'CONFLICTING_REPORT_INJECTED': {
        const payload = eventDef.payload;
        const delayed = payload.delayedBySeconds || this.groundTruth.channels.PRIMARY.delaySeconds;

        // Create message in DB
        const sender = await prisma.sessionParticipant.findFirst({
          where: { sessionId: this.sessionId, assignedRole: payload.senderRole },
          include: { user: true },
        });

        if (sender) {
          const message = await prisma.message.create({
            data: {
              sessionId: this.sessionId,
              senderParticipantId: sender.id,
              recipientRole: payload.recipientRole || 'COMMANDER',
              channel: payload.channel || 'PRIMARY',
              body: payload.content,
              relatedSubject: payload.relatedSubject,
              confidenceLevel: payload.confidence || 'HIGH',
              simulationSecond: second,
              scheduledDeliverySecond: second + (delayed || 0),
              status: delayed > 0 ? 'DELAYED' : 'DELIVERED',
              delaySeconds: delayed || 0,
              isStale: !!payload.isStale,
              deliveredSecond: delayed > 0 ? null : second,
              deliveredAt: delayed > 0 ? null : new Date(),
            },
          });

          const msgPayload = {
            id: message.id,
            senderRole: payload.senderRole,
            senderName: sender.user.fullName,
            recipientRole: payload.recipientRole,
            channel: payload.channel,
            content: payload.content,
            status: message.status,
            simulationSecond: second,
            delaySeconds: message.delaySeconds,
            isStale: message.isStale,
          };

          if (delayed > 0) {
            // Only instructor knows it was sent and delayed
            this.broadcast('message:queued', { ...msgPayload, note: `Delayed by ${delayed}s` }, `session:${this.sessionId}:instructors`);
            await this.logSimulationEvent('MESSAGE_DELAYED', 'SYSTEM', payload.senderRole, msgPayload, 'INSTRUCTOR_ONLY');
          } else {
            this.broadcast('message:delivered', msgPayload, `session:${this.sessionId}:role:${payload.recipientRole}`);
            this.broadcast('message:delivered', msgPayload, `session:${this.sessionId}:instructors`);
            await this.logSimulationEvent('MESSAGE_DELIVERED', 'SYSTEM', payload.recipientRole, msgPayload, 'ALL');
          }
        }
        break;
      }

      case 'CHANNEL_DEGRADED': {
        const payload = eventDef.payload;
        this.groundTruth.channels.PRIMARY.status = 'DEGRADED';
        this.groundTruth.channels.PRIMARY.delaySeconds = payload.delaySeconds || 45;
        this.broadcast('channel:status', { channels: this.groundTruth.channels });
        await this.logSimulationEvent('CHANNEL_DEGRADED', 'SYSTEM', payload.targetRole, payload, 'ALL');
        break;
      }

      case 'MESSAGE_DROPPED': {
        const payload = eventDef.payload;
        const sender = await prisma.sessionParticipant.findFirst({
          where: { sessionId: this.sessionId, assignedRole: payload.senderRole },
        });

        if (sender) {
          await prisma.message.create({
            data: {
              sessionId: this.sessionId,
              senderParticipantId: sender.id,
              recipientRole: payload.recipientRole || 'COMMANDER',
              channel: 'PRIMARY',
              body: payload.content,
              simulationSecond: second,
              scheduledDeliverySecond: second,
              status: 'DROPPED',
              delaySeconds: 0,
            },
          });
        }

        // Notify only instructor that message was dropped
        this.broadcast(
          'message:dropped',
          {
            senderRole: payload.senderRole,
            recipientRole: payload.recipientRole,
            content: payload.content,
            second,
          },
          `session:${this.sessionId}:instructors`
        );

        await this.logSimulationEvent('MESSAGE_DROPPED', 'SYSTEM', payload.senderRole, payload, 'INSTRUCTOR_ONLY');
        break;
      }

      case 'ROUTE_STATUS_CHANGED': {
        const { routeId, newStatus, reason } = eventDef.payload;
        if (this.groundTruth.routes[routeId]) {
          this.groundTruth.routes[routeId].status = newStatus;
          this.groundTruth.routes[routeId].reason = reason;
        }

        // Ground truth updated immediately; visible to instructors
        this.broadcast('map:state-updated', { groundTruth: this.groundTruth }, `session:${this.sessionId}:instructors`);
        await this.logSimulationEvent('ROUTE_STATUS_CHANGED', 'SYSTEM', null, eventDef.payload, 'INSTRUCTOR_ONLY');
        break;
      }

      case 'BACKUP_CHANNEL_ENABLED': {
        this.groundTruth.channels.BACKUP.available = true;
        this.groundTruth.channels.BACKUP.status = 'NORMAL';
        this.broadcast('channel:status', { channels: this.groundTruth.channels });
        await this.logSimulationEvent('BACKUP_CHANNEL_ENABLED', 'SYSTEM', null, eventDef.payload, 'ALL');
        break;
      }

      case 'SESSION_ENDED': {
        await this.end();
        break;
      }

      default:
        await this.logSimulationEvent(eventDef.type, 'SYSTEM', eventDef.targetRole, eventDef.payload, 'ALL');
        break;
    }
  }

  // Instructor Manual Injections
  public async injectDisruption(actionType: string, params: Record<string, any>, instructorUserId: string) {
    const second = this.groundTruth.simulationSecond;

    switch (actionType) {
      case 'INJECT_DELAY': {
        const { role, delaySeconds } = params;
        this.groundTruth.channels.PRIMARY.status = 'DEGRADED';
        this.groundTruth.channels.PRIMARY.delaySeconds = Number(delaySeconds) || 45;
        this.broadcast('channel:status', { channels: this.groundTruth.channels });
        await this.logSimulationEvent('CHANNEL_DEGRADED', 'INSTRUCTOR', role, { role, delaySeconds }, 'ALL');
        break;
      }

      case 'DROP_NEXT_MESSAGE': {
        const { role } = params;
        this.groundTruth.channels.PRIMARY.dropProbability = 1.0;
        await this.logSimulationEvent('INSTRUCTOR_NOTE_ADDED', 'INSTRUCTOR', role, { note: `Next message from ${role} flagged to drop.` }, 'INSTRUCTOR_ONLY');
        break;
      }

      case 'TOGGLE_CHANNEL': {
        const { channel, status } = params;
        if (channel === 'PRIMARY') {
          this.groundTruth.channels.PRIMARY.status = status;
          if (status === 'NORMAL') this.groundTruth.channels.PRIMARY.delaySeconds = 0;
        } else if (channel === 'BACKUP') {
          this.groundTruth.channels.BACKUP.status = status;
          this.groundTruth.channels.BACKUP.available = status !== 'DISABLED';
        }
        this.broadcast('channel:status', { channels: this.groundTruth.channels });
        await this.logSimulationEvent(status === 'NORMAL' ? 'CHANNEL_RESTORED' : 'CHANNEL_DISABLED', 'INSTRUCTOR', null, { channel, status }, 'ALL');
        break;
      }

      case 'INJECT_CONTRADICTORY_REPORT': {
        const { senderRole, content, relatedSubject } = params;
        const sender = await prisma.sessionParticipant.findFirst({
          where: { sessionId: this.sessionId, assignedRole: senderRole || 'AIR_OBSERVATION' },
          include: { user: true },
        });

        if (sender) {
          const msg = await prisma.message.create({
            data: {
              sessionId: this.sessionId,
              senderParticipantId: sender.id,
              recipientRole: 'COMMANDER',
              channel: 'PRIMARY',
              body: content || 'Contradictory route status: Recon reports path is clear of obstacles.',
              relatedSubject: relatedSubject || 'ROUTE_STATUS',
              simulationSecond: second,
              scheduledDeliverySecond: second,
              deliveredSecond: second,
              status: 'DELIVERED',
              isStale: true,
            },
          });

          const msgPayload = {
            id: msg.id,
            senderRole: sender.assignedRole,
            senderName: sender.user.fullName,
            recipientRole: 'COMMANDER',
            channel: 'PRIMARY',
            content: msg.body,
            status: 'DELIVERED',
            simulationSecond: second,
            isStale: true,
          };

          this.broadcast('message:delivered', msgPayload, `session:${this.sessionId}:role:COMMANDER`);
          this.broadcast('message:delivered', msgPayload, `session:${this.sessionId}:instructors`);
        }
        await this.logSimulationEvent('CONFLICTING_REPORT_INJECTED', 'INSTRUCTOR', senderRole, params, 'ALL');
        break;
      }

      case 'TOGGLE_AERIAL_FEED': {
        this.groundTruth.resources.aerialFeedActive = !this.groundTruth.resources.aerialFeedActive;
        const active = this.groundTruth.resources.aerialFeedActive;
        await this.logSimulationEvent(active ? 'SENSOR_FEED_RESTORED' : 'SENSOR_FEED_DISABLED', 'INSTRUCTOR', 'AIR_OBSERVATION', { active }, 'ALL');
        this.broadcast('simulation:event', { type: active ? 'SENSOR_FEED_RESTORED' : 'SENSOR_FEED_DISABLED', active });
        break;
      }

      case 'CHANGE_ROUTE_STATUS': {
        const { routeId, status, reason } = params;
        if (this.groundTruth.routes[routeId]) {
          this.groundTruth.routes[routeId].status = status;
          this.groundTruth.routes[routeId].reason = reason;
        }
        await this.logSimulationEvent('ROUTE_STATUS_CHANGED', 'INSTRUCTOR', null, { routeId, status, reason }, 'INSTRUCTOR_ONLY');
        this.broadcast('map:state-updated', { groundTruth: this.groundTruth }, `session:${this.sessionId}:instructors`);
        break;
      }

      case 'ADD_INSTRUCTOR_NOTE': {
        const { content, targetRole } = params;
        await prisma.instructorNote.create({
          data: {
            sessionId: this.sessionId,
            authorId: instructorUserId,
            content,
            targetRole,
            simulationSecond: second,
          },
        });
        await this.logSimulationEvent('INSTRUCTOR_NOTE_ADDED', 'INSTRUCTOR', targetRole, { content, targetRole }, 'INSTRUCTOR_ONLY');
        this.broadcast('instructor:note', { content, targetRole, simulationSecond: second }, `session:${this.sessionId}:instructors`);
        break;
      }
    }
  }

  // Get Perceived State for a Specific Role
  public getPerceivedStateForRole(role: string): any {
    // If Instructor or Super Admin, return full ground truth
    if (role === 'INSTRUCTOR' || role === 'SUPER_ADMIN') {
      return {
        groundTruth: this.groundTruth,
        role: 'INSTRUCTOR',
        isGroundTruth: true,
      };
    }

    // Role-filtered view: Trainees only see what their role has received / knows
    const routesPerception: Record<string, string> = {
      'route-north': 'CLEAR',
      'route-central': 'CLEAR',
      'route-south': 'CLEAR',
    };

    if (role === 'TEAM_ALPHA') {
      // Alpha directly observed North route blockage
      routesPerception['route-north'] = 'BLOCKED';
    }

    return {
      simulationSecond: this.groundTruth.simulationSecond,
      role,
      isGroundTruth: false,
      channels: {
        PRIMARY: {
          status: this.groundTruth.channels.PRIMARY.status,
          delayObserved: this.groundTruth.channels.PRIMARY.delaySeconds > 0,
        },
        BACKUP: {
          available: this.groundTruth.channels.BACKUP.available,
          status: this.groundTruth.channels.BACKUP.status,
        },
      },
      routes: routesPerception,
      units: this.groundTruth.units,
      resources: {
        supplyPackages: this.groundTruth.resources.supplyPackages,
        aerialFeedActive: role === 'AIR_OBSERVATION' ? this.groundTruth.resources.aerialFeedActive : true,
      },
    };
  }

  public async logSimulationEvent(
    type: string,
    source: string,
    targetRole: string | null,
    payload: Record<string, any>,
    visibilityScope: string = 'ALL'
  ) {
    try {
      await prisma.simulationEvent.create({
        data: {
          sessionId: this.sessionId,
          type,
          source,
          targetRole,
          payloadJson: JSON.stringify(payload),
          simulationSecond: this.groundTruth.simulationSecond,
          visibilityScope,
        },
      });
    } catch (err) {
      console.error('Error logging simulation event:', err);
    }
  }
}
