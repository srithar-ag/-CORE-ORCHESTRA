export type ConnectorCategory = 
  | 'CRM' 
  | 'Messaging' 
  | 'Voice/SMS' 
  | 'ERP' 
  | 'ITSM' 
  | 'Collaboration' 
  | 'Custom Webhook';

export type ConnectorStatus = 'ACTIVE' | 'DEGRADED' | 'DISABLED' | 'MAINTENANCE';

export type AuthType = 'OAUTH2' | 'API_KEY' | 'HMAC_SECRET' | 'MUTUAL_TLS';

export interface ActionSchema {
  id: string;
  name: string;
  description: string;
  samplePayload: Record<string, any>;
}

export interface TriggerSchema {
  id: string;
  name: string;
  eventType: string;
  sampleSchema: Record<string, any>;
}

export interface ConnectorPlugin {
  id: string;
  name: string;
  category: ConnectorCategory;
  version: string;
  description: string;
  iconName: string;
  status: ConnectorStatus;
  authType: AuthType;
  authConfig: {
    apiKey?: string;
    clientId?: string;
    endpointUrl?: string;
    webhookSecret?: string;
    tokenExpiry?: string;
  };
  rateLimit: {
    maxRequestsPerSec: number;
    currentRps: number;
  };
  circuitBreaker: {
    status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureThreshold: number;
    currentFailures: number;
    lastTripTime?: string;
  };
  capabilities: {
    supportsInboundWebhooks: boolean;
    supportsAsyncEvents: boolean;
    supportsOutboundActions: boolean;
  };
  actions: ActionSchema[];
  triggers: TriggerSchema[];
  metrics: {
    totalEventsHandled: number;
    avgLatencyMs: number;
    errorRatePercentage: number;
    uptimePercentage: number;
  };
}

export type NodeType = 'TRIGGER' | 'CONNECTOR_ACTION' | 'TRANSFORM' | 'CONDITION' | 'AI_ENRICH' | 'PARALLEL_SPLIT';

export interface WorkflowNode {
  id: string;
  title: string;
  type: NodeType;
  connectorId?: string;
  actionId?: string;
  config: {
    fieldMappings?: Record<string, string>;
    conditionExpression?: string;
    aiPromptTemplate?: string;
    retryCount?: number;
    timeoutMs?: number;
  };
  nextNodes?: string[];
}

export interface IntegrationWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  triggerConnectorId: string;
  triggerEvent: string;
  nodes: WorkflowNode[];
  executionMode: 'ASYNC_QUEUE' | 'REALTIME_SYNC' | 'BATCH';
  retryPolicy: {
    maxAttempts: number;
    backoffSeconds: number;
  };
  totalExecutions: number;
  successRate: number;
  lastRunAt?: string;
}

export type EventQueueStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'DLQ';

export interface StepLog {
  stepId: string;
  nodeTitle: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  timestamp: string;
  durationMs: number;
  output?: any;
  error?: string;
}

export interface AsyncQueueEvent {
  id: string;
  traceId: string;
  workflowId: string;
  workflowName: string;
  connectorId: string;
  connectorName: string;
  eventType: string;
  payload: Record<string, any>;
  status: EventQueueStatus;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  attempts: number;
  maxAttempts: number;
  queuedAt: string;
  processedAt?: string;
  latencyMs?: number;
  error?: string;
  stepLogs: StepLog[];
}

export interface AuditLogEntry {
  id: string;
  traceId: string;
  workflowId: string;
  workflowName: string;
  sourceConnector: string;
  targetConnectors: string[];
  timestamp: string;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  payloadSizeKb: number;
  inboundPayload: any;
  outboundPayloads: Record<string, any>;
  stepLogs: StepLog[];
}

export interface QueueSystemMetrics {
  activeWorkers: number;
  maxWorkers: number;
  queuedCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  dlqCount: number;
  eventsPerSecond: number;
  avgQueueLatencyMs: number;
}
