export type UserRole =
  | 'SUPER_ADMIN'
  | 'INSTRUCTOR'
  | 'COMMANDER'
  | 'TEAM_OPERATOR'
  | 'OBSERVER';

export type OperationalRole =
  | 'COMMANDER'
  | 'TEAM_ALPHA'
  | 'TEAM_BRAVO'
  | 'AIR_OBSERVATION'
  | 'LOGISTICS'
  | 'INSTRUCTOR'
  | 'OBSERVER';

export type SessionStatus =
  | 'PENDING'
  | 'LOBBY'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ARCHIVED';

export type ChannelType = 'PRIMARY' | 'BACKUP';

export type ChannelStatus = 'NORMAL' | 'DEGRADED' | 'DISABLED';

export type MessageStatus =
  | 'PENDING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'DELAYED'
  | 'DROPPED'
  | 'STALE';

export type RouteStatus = 'CLEAR' | 'DEGRADED' | 'BLOCKED' | 'UNKNOWN';

export type SimulationEventType =
  | 'MESSAGE_SENT'
  | 'MESSAGE_DELIVERED'
  | 'MESSAGE_DELAYED'
  | 'MESSAGE_DROPPED'
  | 'CHANNEL_DEGRADED'
  | 'CHANNEL_DISABLED'
  | 'CHANNEL_RESTORED'
  | 'BACKUP_CHANNEL_ENABLED'
  | 'REPORT_CREATED'
  | 'REPORT_MARKED_STALE'
  | 'CONFLICTING_REPORT_INJECTED'
  | 'SENSOR_FEED_DISABLED'
  | 'SENSOR_FEED_RESTORED'
  | 'ROUTE_STATUS_CHANGED'
  | 'RESOURCE_STATUS_CHANGED'
  | 'ORDER_CREATED'
  | 'ORDER_ACKNOWLEDGED'
  | 'DECISION_CREATED'
  | 'RATIONALE_SUBMITTED'
  | 'PARTICIPANT_JOINED'
  | 'PARTICIPANT_DISCONNECTED'
  | 'PARTICIPANT_RECONNECTED'
  | 'SESSION_STARTED'
  | 'SESSION_PAUSED'
  | 'SESSION_RESUMED'
  | 'SESSION_ENDED'
  | 'INSTRUCTOR_NOTE_ADDED';

export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'BASE' | 'OBJECTIVE' | 'CHECKPOINT' | 'RELAY' | 'HAZARD';
  description?: string;
}

export interface RouteDefinition {
  id: string;
  name: string;
  waypoints: [number, number][];
  groundTruthStatus: RouteStatus;
  perceivedStatus: Record<string, RouteStatus>; // role -> status
  travelTimeSeconds: number;
  description: string;
}

export interface SimulationUnit {
  id: string;
  name: string;
  role: OperationalRole;
  position: [number, number];
  targetPosition?: [number, number];
  status: 'STATIONARY' | 'MOVING' | 'WAITING_ORDERS' | 'COMM_LOST';
  assignedRouteId?: string;
  lastUpdatedSecond: number;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  fictionalLocation: string;
  description: string;
  objective: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  durationSeconds: number;
  roles: OperationalRole[];
  zones: GeoPoint[];
  routes: RouteDefinition[];
  resources: {
    supplyPackages: number;
    vehicles: number;
    aerialSensors: number;
  };
  scheduledEvents: {
    id: string;
    triggerAtSeconds: number;
    type: SimulationEventType;
    targetRole?: OperationalRole;
    description: string;
    payload: Record<string, any>;
  }[];
  scoreWeights: {
    disruptionDetection: number;
    backupRecovery: number;
    criticalDeliveryAck: number;
    freshnessVerification: number;
    conflictResolution: number;
    decisionTimeliness: number;
    teamCoordination: number;
    adaptability: number;
    resourceEfficiency: number;
  };
}

export interface MessagePayload {
  id: string;
  sessionId: string;
  senderRole: OperationalRole;
  senderName: string;
  recipientRole?: OperationalRole | 'ALL';
  channel: ChannelType;
  content: string;
  relatedSubject?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  simulationSecond: number;
  createdAt: string;
  scheduledDeliverySecond: number;
  deliveredSecond?: number;
  status: MessageStatus;
  delaySeconds: number;
  isStale?: boolean;
  metadata?: Record<string, any>;
}

export interface OrderPayload {
  id: string;
  sessionId: string;
  issuerRole: OperationalRole;
  recipientRole: OperationalRole;
  content: string;
  routeId?: string;
  status: 'ISSUED' | 'ACKNOWLEDGED' | 'EXECUTED';
  simulationSecond: number;
  createdAt: string;
  acknowledgedAtSecond?: number;
}

export interface DecisionPayload {
  id: string;
  sessionId: string;
  decisionMakerRole: OperationalRole;
  decisionType: 'ROUTE_SELECTION' | 'CHANNEL_SWITCH' | 'HOLD_POSITION' | 'REROUTE_SUPPLY' | 'REQUEST_CONFIRMATION';
  action: string;
  rationale: string;
  simulationSecond: number;
  createdAt: string;
  selectedRouteId?: string;
  relatedMessageIds: string[];
  perceivedStateSnapshot: {
    visibleRoutes: Record<string, RouteStatus>;
    channelStatus: Record<ChannelType, ChannelStatus>;
    unresolvedConflicts: string[];
    messagesSeenCount: number;
    lastAerialFeedFreshnessSeconds?: number;
  };
  fairEvaluation?: {
    alignedWithPerception: boolean;
    penalizedForHiddenTruth: boolean; // Always false by design!
    usedStaleData: boolean;
    ignoredConflicts: boolean;
    feedback: string;
  };
}

export interface ComResIndexBreakdown {
  overallScore: number;
  components: {
    disruptionDetection: { score: number; weight: number; explanation: string };
    backupRecovery: { score: number; weight: number; explanation: string };
    criticalDeliveryAck: { score: number; weight: number; explanation: string };
    freshnessVerification: { score: number; weight: number; explanation: string };
    conflictResolution: { score: number; weight: number; explanation: string };
    decisionTimeliness: { score: number; weight: number; explanation: string };
    teamCoordination: { score: number; weight: number; explanation: string };
    adaptability: { score: number; weight: number; explanation: string };
    resourceEfficiency: { score: number; weight: number; explanation: string };
  };
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}
