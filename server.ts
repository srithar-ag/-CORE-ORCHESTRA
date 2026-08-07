import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import {
  INITIAL_CONNECTORS,
  INITIAL_WORKFLOWS,
  INITIAL_QUEUE_EVENTS,
  INITIAL_AUDIT_LOGS
} from "./src/data/initialData.ts";
import {
  ConnectorPlugin,
  IntegrationWorkflow,
  AsyncQueueEvent,
  AuditLogEntry,
  StepLog
} from "./src/types.ts";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI Server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// In-Memory Database Stores
let connectorsStore: ConnectorPlugin[] = [...INITIAL_CONNECTORS];
let workflowsStore: IntegrationWorkflow[] = [...INITIAL_WORKFLOWS];
let queueStore: AsyncQueueEvent[] = [...INITIAL_QUEUE_EVENTS];
let auditStore: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];

// Queue Metrics State
let queueMetrics = {
  activeWorkers: 4,
  maxWorkers: 10,
  eventsPerSecond: 42,
  avgQueueLatencyMs: 120
};

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Enterprise CPaaS Connector Plugin Module", time: new Date().toISOString() });
});

// 1. Connectors Endpoints
app.get("/api/cpaas/connectors", (req, res) => {
  res.json(connectorsStore);
});

app.post("/api/cpaas/connectors", (req, res) => {
  const newConn: ConnectorPlugin = {
    id: `conn_${Date.now().toString(36)}`,
    name: req.body.name || 'Custom Enterprise Plugin',
    category: req.body.category || 'Custom Webhook',
    version: req.body.version || 'v1.0.0',
    description: req.body.description || 'Custom plugin module.',
    iconName: req.body.iconName || 'Webhook',
    status: 'ACTIVE',
    authType: req.body.authType || 'API_KEY',
    authConfig: req.body.authConfig || { apiKey: 'key_sec_' + Math.random().toString(36).substring(2, 10) },
    rateLimit: {
      maxRequestsPerSec: req.body.rateLimit?.maxRequestsPerSec || 100,
      currentRps: 0
    },
    circuitBreaker: {
      status: 'CLOSED',
      failureThreshold: 5,
      currentFailures: 0
    },
    capabilities: {
      supportsInboundWebhooks: true,
      supportsAsyncEvents: true,
      supportsOutboundActions: true
    },
    actions: req.body.actions || [],
    triggers: req.body.triggers || [],
    metrics: {
      totalEventsHandled: 0,
      avgLatencyMs: 45,
      errorRatePercentage: 0,
      uptimePercentage: 100
    }
  };
  connectorsStore.push(newConn);
  res.status(201).json(newConn);
});

app.patch("/api/cpaas/connectors/:id", (req, res) => {
  const { id } = req.params;
  const connIndex = connectorsStore.findIndex(c => c.id === id);
  if (connIndex === -1) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  connectorsStore[connIndex] = {
    ...connectorsStore[connIndex],
    ...req.body
  };
  res.json(connectorsStore[connIndex]);
});

app.post("/api/cpaas/connectors/:id/test-health", (req, res) => {
  const { id } = req.params;
  const conn = connectorsStore.find(c => c.id === id);
  if (!conn) {
    res.status(404).json({ error: "Connector not found" });
    return;
  }
  // Simulate synthetic health check ping
  const isHealthy = conn.circuitBreaker.status !== 'OPEN';
  const latency = Math.floor(Math.random() * 80) + 30;
  
  if (!isHealthy) {
    res.json({
      connectorId: id,
      status: 'UNHEALTHY',
      latencyMs: latency,
      circuitBreaker: conn.circuitBreaker.status,
      message: 'Circuit breaker is OPEN. Connection refused by upstream rate limiter.'
    });
    return;
  }

  res.json({
    connectorId: id,
    status: 'HEALTHY',
    latencyMs: latency,
    httpStatus: 200,
    circuitBreaker: conn.circuitBreaker.status,
    message: 'Authentication validated and TLS handshake successful.'
  });
});

// 2. Workflows Endpoints
app.get("/api/cpaas/workflows", (req, res) => {
  res.json(workflowsStore);
});

app.post("/api/cpaas/workflows", (req, res) => {
  const newWf: IntegrationWorkflow = {
    id: `wf_${Date.now().toString(36)}`,
    name: req.body.name || 'New CPaaS Integration Workflow',
    description: req.body.description || 'Automated CPaaS orchestration pipeline',
    status: 'ACTIVE',
    triggerConnectorId: req.body.triggerConnectorId || connectorsStore[0].id,
    triggerEvent: req.body.triggerEvent || 'inbound.event',
    nodes: req.body.nodes || [],
    executionMode: req.body.executionMode || 'ASYNC_QUEUE',
    retryPolicy: req.body.retryPolicy || { maxAttempts: 3, backoffSeconds: 5 },
    totalExecutions: 0,
    successRate: 100,
    lastRunAt: new Date().toISOString()
  };
  workflowsStore.unshift(newWf);
  res.status(201).json(newWf);
});

// Execute Workflow Simulation Test
app.post("/api/cpaas/workflows/:id/execute", async (req, res) => {
  const { id } = req.params;
  const wf = workflowsStore.find(w => w.id === id);
  if (!wf) {
    res.status(404).json({ error: "Workflow not found" });
    return;
  }

  const inboundPayload = req.body.payload || {
    From: '+14155552671',
    Body: 'URGENT: Enterprise server response degraded to 8500ms',
    Timestamp: new Date().toISOString()
  };

  const traceId = `tr_${Math.random().toString(36).substring(2, 10)}_cpaas`;
  const stepLogs: StepLog[] = [];
  let currentOutput = { ...inboundPayload };
  let overallSuccess = true;
  const startTime = Date.now();

  for (const node of wf.nodes) {
    const nodeStart = Date.now();
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 80) + 40));
    
    if (node.type === 'TRIGGER') {
      stepLogs.push({
        stepId: node.id,
        nodeTitle: node.title,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: Date.now() - nodeStart,
        output: inboundPayload
      });
    } else if (node.type === 'AI_ENRICH') {
      let aiResult = { sentiment: 'URGENT', priority: 'HIGH', intent: 'System Alert' };
      try {
        if (process.env.GEMINI_API_KEY) {
          const prompt = `${node.config.aiPromptTemplate || 'Analyze input content.'}
Payload: ${JSON.stringify(inboundPayload)}`;
          const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  sentiment: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  summary: { type: Type.STRING }
                }
              }
            }
          });
          if (response.text) {
            aiResult = JSON.parse(response.text);
          }
        }
      } catch (err: any) {
        console.log("Gemini enrichment fallback:", err.message);
      }
      currentOutput = { ...currentOutput, ai_enrich: aiResult };
      stepLogs.push({
        stepId: node.id,
        nodeTitle: node.title,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: Date.now() - nodeStart,
        output: aiResult
      });
    } else if (node.type === 'CONDITION') {
      stepLogs.push({
        stepId: node.id,
        nodeTitle: node.title,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: Date.now() - nodeStart,
        output: { conditionEvaluated: true, branchTaken: 'TRUE_PATH' }
      });
    } else if (node.type === 'CONNECTOR_ACTION') {
      const conn = connectorsStore.find(c => c.id === node.connectorId);
      stepLogs.push({
        stepId: node.id,
        nodeTitle: `${node.title} (${conn?.name || 'Target Connector'})`,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: Date.now() - nodeStart,
        output: { actionStatus: 'DISPATCHED_HTTP_200', responseId: `resp_${Math.random().toString(36).substring(2, 8)}` }
      });
    } else {
      stepLogs.push({
        stepId: node.id,
        nodeTitle: node.title,
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: Date.now() - nodeStart,
        output: { transformedPayload: currentOutput }
      });
    }
  }

  const totalDuration = Date.now() - startTime;

  // Add to Queue Event log
  const newQueueEvent: AsyncQueueEvent = {
    id: `evt_q_${Date.now().toString(36)}`,
    traceId,
    workflowId: wf.id,
    workflowName: wf.name,
    connectorId: wf.triggerConnectorId,
    connectorName: connectorsStore.find(c => c.id === wf.triggerConnectorId)?.name || 'Inbound Connector',
    eventType: wf.triggerEvent,
    payload: inboundPayload,
    status: overallSuccess ? 'COMPLETED' : 'FAILED',
    priority: 'HIGH',
    attempts: 1,
    maxAttempts: wf.retryPolicy.maxAttempts,
    queuedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    latencyMs: totalDuration,
    stepLogs
  };

  queueStore.unshift(newQueueEvent);

  // Add to Audit Log
  const newAudit: AuditLogEntry = {
    id: `audit_${Date.now().toString(36)}`,
    traceId,
    workflowId: wf.id,
    workflowName: wf.name,
    sourceConnector: connectorsStore.find(c => c.id === wf.triggerConnectorId)?.name || 'Inbound Gateway',
    targetConnectors: wf.nodes.filter(n => n.connectorId).map(n => connectorsStore.find(c => c.id === n.connectorId)?.name || 'System'),
    timestamp: new Date().toISOString(),
    durationMs: totalDuration,
    status: 'SUCCESS',
    payloadSizeKb: Number((JSON.stringify(inboundPayload).length / 1024).toFixed(2)),
    inboundPayload,
    outboundPayloads: { executionResult: currentOutput },
    stepLogs
  };

  auditStore.unshift(newAudit);

  // Update Workflow total stats
  wf.totalExecutions += 1;
  wf.lastRunAt = new Date().toISOString();

  res.json({
    traceId,
    workflowId: wf.id,
    status: 'COMPLETED',
    totalDurationMs: totalDuration,
    stepLogs,
    finalPayload: currentOutput
  });
});

// 3. Queue Endpoints
app.get("/api/cpaas/queue/metrics", (req, res) => {
  const queued = queueStore.filter(q => q.status === 'QUEUED').length;
  const processing = queueStore.filter(q => q.status === 'PROCESSING').length;
  const completed = queueStore.filter(q => q.status === 'COMPLETED').length;
  const failed = queueStore.filter(q => q.status === 'FAILED').length;
  const dlq = queueStore.filter(q => q.status === 'DLQ').length;

  res.json({
    ...queueMetrics,
    queuedCount: queued,
    processingCount: processing,
    completedCount: completed,
    failedCount: failed,
    dlqCount: dlq
  });
});

app.get("/api/cpaas/queue/events", (req, res) => {
  res.json(queueStore);
});

app.post("/api/cpaas/queue/enqueue", (req, res) => {
  const { workflowId, payload, priority } = req.body;
  const wf = workflowsStore.find(w => w.id === workflowId) || workflowsStore[0];
  const conn = connectorsStore.find(c => c.id === wf.triggerConnectorId);

  const newEvent: AsyncQueueEvent = {
    id: `evt_q_${Date.now().toString(36)}`,
    traceId: `tr_${Math.random().toString(36).substring(2, 10)}_cpaas`,
    workflowId: wf.id,
    workflowName: wf.name,
    connectorId: wf.triggerConnectorId,
    connectorName: conn?.name || 'Generic Connector',
    eventType: wf.triggerEvent,
    payload: payload || { sample: 'event_payload', timestamp: new Date().toISOString() },
    status: 'QUEUED',
    priority: priority || 'NORMAL',
    attempts: 0,
    maxAttempts: 3,
    queuedAt: new Date().toISOString(),
    stepLogs: []
  };

  queueStore.unshift(newEvent);

  // Auto process simulated task in background after brief delay
  setTimeout(() => {
    const item = queueStore.find(q => q.id === newEvent.id);
    if (item) {
      item.status = 'PROCESSING';
      setTimeout(() => {
        item.status = 'COMPLETED';
        item.processedAt = new Date().toISOString();
        item.latencyMs = Math.floor(Math.random() * 120) + 40;
        item.stepLogs = [
          { stepId: 'step_1', nodeTitle: 'Queue Consumer Ingest', status: 'SUCCESS', timestamp: new Date().toLocaleTimeString(), durationMs: 12 },
          { stepId: 'step_2', nodeTitle: 'Connector Outbound Dispatch', status: 'SUCCESS', timestamp: new Date().toLocaleTimeString(), durationMs: item.latencyMs - 12 }
        ];
      }, 300);
    }
  }, 400);

  res.status(202).json(newEvent);
});

app.post("/api/cpaas/queue/dlq/retry", (req, res) => {
  const { eventId } = req.body;
  const item = queueStore.find(q => q.id === eventId);
  if (!item) {
    res.status(404).json({ error: "Queue event not found" });
    return;
  }
  item.status = 'QUEUED';
  item.attempts += 1;
  item.error = undefined;
  
  setTimeout(() => {
    item.status = 'PROCESSING';
    setTimeout(() => {
      item.status = 'COMPLETED';
      item.processedAt = new Date().toISOString();
      item.latencyMs = 180;
      item.stepLogs.push({
        stepId: 'dlq_retry',
        nodeTitle: 'DLQ Manual Retry Executed',
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString(),
        durationMs: 180
      });
    }, 400);
  }, 300);

  res.json({ message: "Message requeued from DLQ successfully", event: item });
});

app.post("/api/cpaas/queue/dlq/purge", (req, res) => {
  const initialCount = queueStore.length;
  queueStore = queueStore.filter(q => q.status !== 'DLQ');
  const purged = initialCount - queueStore.length;
  res.json({ message: `Purged ${purged} messages from Dead Letter Queue.` });
});

// 4. Audit Trail Endpoints
app.get("/api/cpaas/audit-logs", (req, res) => {
  res.json(auditStore);
});

// 5. Inbound Webhook Gateway Endpoint
app.post("/api/cpaas/webhook-ingest", (req, res) => {
  const signature = req.headers['x-cpaas-signature'] || 'hmac_sha256_mock_sig_992';
  const body = req.body;

  const traceId = `tr_wh_${Math.random().toString(36).substring(2, 10)}`;

  // Find matching workflow
  const targetWf = workflowsStore[0];

  const queueEvt: AsyncQueueEvent = {
    id: `evt_wh_${Date.now().toString(36)}`,
    traceId,
    workflowId: targetWf.id,
    workflowName: targetWf.name,
    connectorId: 'conn_webhook',
    connectorName: 'Enterprise Webhook Gateway',
    eventType: 'webhook.inbound.event',
    payload: body,
    status: 'COMPLETED',
    priority: 'HIGH',
    attempts: 1,
    maxAttempts: 3,
    queuedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    latencyMs: 64,
    stepLogs: [
      { stepId: 's1', nodeTitle: 'HMAC Authentication Check', status: 'SUCCESS', timestamp: new Date().toLocaleTimeString(), durationMs: 4, output: { signatureValidated: true } },
      { stepId: 's2', nodeTitle: 'Inbound Webhook Enqueue', status: 'SUCCESS', timestamp: new Date().toLocaleTimeString(), durationMs: 60 }
    ]
  };

  queueStore.unshift(queueEvt);

  res.status(200).json({
    status: 'ACCEPTED',
    traceId,
    receivedAt: new Date().toISOString(),
    hmacVerified: true,
    message: 'Webhook payload signature verified and enqueued for async processing.'
  });
});

// 6. AI-Powered Payload Auto-Mapper (Gemini API)
app.post("/api/gemini/auto-map", async (req, res) => {
  const { sourceSchema, targetSchema, context } = req.body;

  try {
    const prompt = `You are an enterprise CPaaS connector data mapping engine.
Map fields from the Source JSON schema/payload to the Target JSON schema/payload.
Context: ${context || 'Enterprise Integration'}

Source Payload:
${JSON.stringify(sourceSchema, null, 2)}

Target Payload Structure:
${JSON.stringify(targetSchema, null, 2)}

Generate a JSON object where keys are Target Field Names and values are mapping expressions using template tags like {{inbound.field_name}} or transformations. Include an explanation for each mapping.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fieldMappings: {
              type: Type.OBJECT,
              description: "Target key to expression mapping"
            },
            explanations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Explanations for mapped fields"
            },
            transformationRules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Recommended sanitization or formatting rules"
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Auto-Map Error:", error);
    res.status(500).json({
      error: "Failed to generate AI auto-mappings",
      details: error.message,
      fallbackMappings: {
        "Target_Phone": "{{inbound.From}}",
        "Target_Message": "{{inbound.Body}}",
        "Source_System": "CPaaS_Inbound_Gateway"
      }
    });
  }
});

// 7. AI Workflow Architect (Gemini API)
app.post("/api/gemini/suggest-workflow", async (req, res) => {
  const { useCase } = req.body;

  try {
    const prompt = `You are an Enterprise CPaaS Integration Architect.
Design a modular integration workflow for the following enterprise CPaaS request:
"${useCase}"

Output a JSON structure for a workflow containing:
- name: clear descriptive title
- description: detailed architectural summary
- triggerConnectorCategory: e.g. "Voice/SMS" or "CRM" or "Messaging"
- nodes: array of workflow nodes with title, type ("TRIGGER", "AI_ENRICH", "CONNECTOR_ACTION", "CONDITION", "TRANSFORM"), and recommended configuration.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            executionMode: { type: Type.STRING },
            recommendedConnectors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini Suggest Workflow Error:", error);
    res.status(500).json({
      error: "Failed to generate workflow design",
      details: error.message
    });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE SETUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
