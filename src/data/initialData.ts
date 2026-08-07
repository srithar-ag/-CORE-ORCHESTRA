import { ConnectorPlugin, IntegrationWorkflow, AsyncQueueEvent, AuditLogEntry } from '../types';

export const INITIAL_CONNECTORS: ConnectorPlugin[] = [
  {
    id: 'conn_twilio',
    name: 'Twilio Voice & Messaging',
    category: 'Voice/SMS',
    version: 'v2.4.1',
    description: 'Global CPaaS telephony, Programmable SMS, MMS, and Voice SIP trunking integration.',
    iconName: 'PhoneCall',
    status: 'ACTIVE',
    authType: 'API_KEY',
    authConfig: {
      apiKey: 'AC_live_9f884a22e891002341ba',
      clientId: 'SK_auth_8829104a00b',
      endpointUrl: 'https://api.twilio.com/2010-04-01/Accounts'
    },
    rateLimit: {
      maxRequestsPerSec: 100,
      currentRps: 28
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
    actions: [
      {
        id: 'send_sms',
        name: 'Send Programmable SMS',
        description: 'Dispatches outbound SMS or MMS message to recipient phone.',
        samplePayload: { to: '+14155552671', from: '+18005550199', body: 'Your verification code is 482910.' }
      },
      {
        id: 'make_call',
        name: 'Initiate Outbound Voice Call',
        description: 'Triggers IVR call or Voice agent with TwiML instructions.',
        samplePayload: { to: '+14155552671', twiml: '<Response><Say>Priority Incident Alert!</Say></Response>' }
      }
    ],
    triggers: [
      {
        id: 'inbound_sms',
        name: 'Inbound SMS Received',
        eventType: 'twilio.sms.received',
        sampleSchema: { From: '+14155552671', Body: 'HELP URGENT server down', MessageSid: 'SM8819203' }
      },
      {
        id: 'call_status',
        name: 'Call Status Webhook',
        eventType: 'twilio.call.status_changed',
        sampleSchema: { CallSid: 'CA991023', CallStatus: 'completed', Duration: '45' }
      }
    ],
    metrics: {
      totalEventsHandled: 142850,
      avgLatencyMs: 112,
      errorRatePercentage: 0.08,
      uptimePercentage: 99.98
    }
  },
  {
    id: 'conn_salesforce',
    name: 'Salesforce CRM Platform',
    category: 'CRM',
    version: 'v58.0',
    description: 'Enterprise Lead, Contact, Opportunity, and Case sync via REST & Pub/Sub API.',
    iconName: 'Building2',
    status: 'ACTIVE',
    authType: 'OAUTH2',
    authConfig: {
      clientId: '3MV9K_salesforce_client_id_x82',
      endpointUrl: 'https://enterprise-cpaas.my.salesforce.com/services/data/v58.0/'
    },
    rateLimit: {
      maxRequestsPerSec: 50,
      currentRps: 12
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
    actions: [
      {
        id: 'create_lead',
        name: 'Create Lead Record',
        description: 'Creates new prospective lead object with phone, email, and sentiment score.',
        samplePayload: { FirstName: 'Elena', LastName: 'Rostova', Company: 'Apex Dynamics', Phone: '+14155552671', LeadSource: 'CPaaS Inbound SMS' }
      },
      {
        id: 'update_case',
        name: 'Update Support Case',
        description: 'Attaches communication transcript or updates priority on active case.',
        samplePayload: { CaseNumber: '00291023', Status: 'Escalated', Priority: 'High' }
      }
    ],
    triggers: [
      {
        id: 'lead_created',
        name: 'New Lead Created Event',
        eventType: 'salesforce.lead.created',
        sampleSchema: { Id: '00Q8a00001fX92', Name: 'Elena Rostova', Status: 'New' }
      }
    ],
    metrics: {
      totalEventsHandled: 89300,
      avgLatencyMs: 230,
      errorRatePercentage: 0.15,
      uptimePercentage: 99.95
    }
  },
  {
    id: 'conn_whatsapp',
    name: 'WhatsApp Business API',
    category: 'Messaging',
    version: 'v18.0',
    description: 'Direct Meta Cloud API connector for interactive template messages & chat sessions.',
    iconName: 'MessageSquare',
    status: 'ACTIVE',
    authType: 'API_KEY',
    authConfig: {
      apiKey: 'EAAG_meta_whatsapp_token_sec_881',
      webhookSecret: 'wh_sec_9932019a82',
      endpointUrl: 'https://graph.facebook.com/v18.0/1002930291/messages'
    },
    rateLimit: {
      maxRequestsPerSec: 250,
      currentRps: 64
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
    actions: [
      {
        id: 'send_whatsapp_msg',
        name: 'Send Template Message',
        description: 'Dispatches verified WhatsApp HSM notification or session message.',
        samplePayload: { to: '14155552671', template_name: 'incident_update_v1', language: 'en_US' }
      }
    ],
    triggers: [
      {
        id: 'whatsapp_inbound',
        name: 'Inbound Customer Message',
        eventType: 'whatsapp.message.received',
        sampleSchema: { from: '14155552671', text: { body: 'I need help with my enterprise order #9821' }, timestamp: '1723028100' }
      }
    ],
    metrics: {
      totalEventsHandled: 310400,
      avgLatencyMs: 95,
      errorRatePercentage: 0.04,
      uptimePercentage: 99.99
    }
  },
  {
    id: 'conn_servicenow',
    name: 'ServiceNow ITSM Connector',
    category: 'ITSM',
    version: 'v4.2',
    description: 'Automated Incident creation, Change Request tracking, and On-Call escalation.',
    iconName: 'ShieldAlert',
    status: 'ACTIVE',
    authType: 'MUTUAL_TLS',
    authConfig: {
      endpointUrl: 'https://dev9102.service-now.com/api/now/table/incident'
    },
    rateLimit: {
      maxRequestsPerSec: 30,
      currentRps: 5
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
    actions: [
      {
        id: 'create_incident',
        name: 'Create Incident Ticket',
        description: 'Generates P1/P2 ITSM ticket from incoming critical SMS alert.',
        samplePayload: { short_description: 'CPaaS Pipeline Failure', impact: '1', urgency: '1', caller_id: 'cpaas_connector_system' }
      }
    ],
    triggers: [
      {
        id: 'incident_created',
        name: 'Incident State Updated',
        eventType: 'servicenow.incident.updated',
        sampleSchema: { incident_id: 'INC0019283', state: 'In Progress', urgency: '1' }
      }
    ],
    metrics: {
      totalEventsHandled: 24100,
      avgLatencyMs: 340,
      errorRatePercentage: 0.32,
      uptimePercentage: 99.89
    }
  },
  {
    id: 'conn_slack',
    name: 'Slack Enterprise Grid Bot',
    category: 'Collaboration',
    version: 'v1.2',
    description: 'Real-time incident channel alerts, interactive modal dialogs, and escalation bots.',
    iconName: 'Slack',
    status: 'ACTIVE',
    authType: 'API_KEY',
    authConfig: {
      apiKey: 'xoxb-98210392019-98210392019-sec9102',
      endpointUrl: 'https://slack.com/api/chat.postMessage'
    },
    rateLimit: {
      maxRequestsPerSec: 50,
      currentRps: 8
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
    actions: [
      {
        id: 'post_alert',
        name: 'Post Channel Alert',
        description: 'Sends rich Block Kit notification to designated SOC/DevOps channel.',
        samplePayload: { channel: '#cpaas-incident-alerts', text: '🚨 Inbound High Sentiment Escalation: +14155552671' }
      }
    ],
    triggers: [
      {
        id: 'command_received',
        name: 'Slash Command Trigger',
        eventType: 'slack.command.triggered',
        sampleSchema: { command: '/cpaas-status', user_id: 'U0291023', channel_id: 'C089201' }
      }
    ],
    metrics: {
      totalEventsHandled: 198000,
      avgLatencyMs: 82,
      errorRatePercentage: 0.02,
      uptimePercentage: 99.99
    }
  },
  {
    id: 'conn_webhook',
    name: 'Enterprise Webhook Gateway',
    category: 'Custom Webhook',
    version: 'v3.0',
    description: 'Generic OAuth2 / HMAC-SHA256 authenticated inbound/outbound HTTP Webhook engine.',
    iconName: 'Webhook',
    status: 'ACTIVE',
    authType: 'HMAC_SECRET',
    authConfig: {
      webhookSecret: 'hmac_sha256_sec_77182903',
      endpointUrl: '/api/cpaas/webhook-ingest'
    },
    rateLimit: {
      maxRequestsPerSec: 500,
      currentRps: 110
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
    actions: [
      {
        id: 'post_webhook',
        name: 'Dispatch HTTP POST Webhook',
        description: 'Sends signed payload to target enterprise HTTP endpoint.',
        samplePayload: { event: 'customer.escalated', data: { customer_id: 'CUST-982', severity: 'CRITICAL' } }
      }
    ],
    triggers: [
      {
        id: 'inbound_http',
        name: 'Inbound Webhook Received',
        eventType: 'webhook.inbound.event',
        sampleSchema: { event_id: 'evt_991023', source: 'external_gateway', payload: {} }
      }
    ],
    metrics: {
      totalEventsHandled: 540200,
      avgLatencyMs: 45,
      errorRatePercentage: 0.01,
      uptimePercentage: 100.00
    }
  }
];

export const INITIAL_WORKFLOWS: IntegrationWorkflow[] = [
  {
    id: 'wf_vip_escalation',
    name: 'VIP Inbound SMS -> AI Sentiment -> Salesforce & Slack Alert',
    description: 'Orchestrates inbound SMS messages, uses Gemini AI to detect priority/sentiment, creates CRM Lead/Case, and dispatches immediate Slack escalation.',
    status: 'ACTIVE',
    triggerConnectorId: 'conn_twilio',
    triggerEvent: 'twilio.sms.received',
    executionMode: 'ASYNC_QUEUE',
    retryPolicy: {
      maxAttempts: 3,
      backoffSeconds: 5
    },
    totalExecutions: 1420,
    successRate: 99.6,
    lastRunAt: '2026-08-07T12:10:00Z',
    nodes: [
      {
        id: 'node_1',
        title: 'Inbound SMS Trigger',
        type: 'TRIGGER',
        connectorId: 'conn_twilio',
        config: {}
      },
      {
        id: 'node_2',
        title: 'Gemini AI Sentiment & Intent Extractor',
        type: 'AI_ENRICH',
        config: {
          aiPromptTemplate: 'Analyze message body for urgent help or enterprise customer intent. Output JSON with sentiment, priority (HIGH/MEDIUM/LOW), and summary.'
        }
      },
      {
        id: 'node_3',
        title: 'Is Urgent Priority?',
        type: 'CONDITION',
        config: {
          conditionExpression: '{{ai_enrich.priority}} == "HIGH"'
        }
      },
      {
        id: 'node_4',
        title: 'Create Salesforce Lead & Case',
        type: 'CONNECTOR_ACTION',
        connectorId: 'conn_salesforce',
        actionId: 'create_lead',
        config: {
          fieldMappings: {
            Phone: '{{inbound.From}}',
            LastName: 'Customer {{inbound.From}}',
            Description: '{{inbound.Body}} - Sentiment: {{ai_enrich.sentiment}}'
          }
        }
      },
      {
        id: 'node_5',
        title: 'Dispatch Urgent Slack Escalation',
        type: 'CONNECTOR_ACTION',
        connectorId: 'conn_slack',
        actionId: 'post_alert',
        config: {
          fieldMappings: {
            channel: '#cpaas-incident-alerts',
            text: '🚨 Urgent CPaaS Alert from {{inbound.From}}: "{{inbound.Body}}"'
          }
        }
      }
    ]
  },
  {
    id: 'wf_whatsapp_support',
    name: 'WhatsApp Business Support -> ServiceNow Incident Dispatch',
    description: 'Captures incoming customer WhatsApp messages, checks severity, and opens a ServiceNow Incident ticket for tier-2 engineers.',
    status: 'ACTIVE',
    triggerConnectorId: 'conn_whatsapp',
    triggerEvent: 'whatsapp.message.received',
    executionMode: 'ASYNC_QUEUE',
    retryPolicy: {
      maxAttempts: 3,
      backoffSeconds: 10
    },
    totalExecutions: 890,
    successRate: 98.9,
    lastRunAt: '2026-08-07T11:45:00Z',
    nodes: [
      {
        id: 'node_w1',
        title: 'WhatsApp Message Trigger',
        type: 'TRIGGER',
        connectorId: 'conn_whatsapp',
        config: {}
      },
      {
        id: 'node_w2',
        title: 'Normalize Customer Payload',
        type: 'TRANSFORM',
        config: {
          fieldMappings: {
            customer_phone: '{{inbound.from}}',
            message_text: '{{inbound.text.body}}'
          }
        }
      },
      {
        id: 'node_w3',
        title: 'Create ServiceNow Ticket',
        type: 'CONNECTOR_ACTION',
        connectorId: 'conn_servicenow',
        actionId: 'create_incident',
        config: {
          fieldMappings: {
            short_description: 'WhatsApp Support Request: {{transform.message_text}}',
            caller_id: '{{transform.customer_phone}}'
          }
        }
      }
    ]
  }
];

export const INITIAL_QUEUE_EVENTS: AsyncQueueEvent[] = [
  {
    id: 'evt_q_1001',
    traceId: 'tr_881920_cpaas',
    workflowId: 'wf_vip_escalation',
    workflowName: 'VIP Inbound SMS -> AI Sentiment -> Salesforce & Slack Alert',
    connectorId: 'conn_twilio',
    connectorName: 'Twilio Voice & Messaging',
    eventType: 'twilio.sms.received',
    payload: {
      From: '+14155552671',
      Body: 'URGENT: Database connection pool exhausted in production region East-1',
      MessageSid: 'SM99201923'
    },
    status: 'COMPLETED',
    priority: 'HIGH',
    attempts: 1,
    maxAttempts: 3,
    queuedAt: '2026-08-07T12:12:00Z',
    processedAt: '2026-08-07T12:12:01Z',
    latencyMs: 142,
    stepLogs: [
      { stepId: 'node_1', nodeTitle: 'Inbound SMS Trigger', status: 'SUCCESS', timestamp: '12:12:00.100', durationMs: 12 },
      { stepId: 'node_2', nodeTitle: 'Gemini AI Sentiment & Intent Extractor', status: 'SUCCESS', timestamp: '12:12:00.400', durationMs: 280, output: { sentiment: 'CRITICAL', priority: 'HIGH' } },
      { stepId: 'node_3', nodeTitle: 'Is Urgent Priority?', status: 'SUCCESS', timestamp: '12:12:00.410', durationMs: 5 },
      { stepId: 'node_4', nodeTitle: 'Create Salesforce Lead & Case', status: 'SUCCESS', timestamp: '12:12:00.800', durationMs: 380, output: { LeadId: '00Q8a00001fX92' } },
      { stepId: 'node_5', nodeTitle: 'Dispatch Urgent Slack Escalation', status: 'SUCCESS', timestamp: '12:12:01.000', durationMs: 180, output: { SlackTimestamp: '1723028101' } }
    ]
  },
  {
    id: 'evt_q_1002',
    traceId: 'tr_881921_cpaas',
    workflowId: 'wf_whatsapp_support',
    workflowName: 'WhatsApp Business Support -> ServiceNow Incident Dispatch',
    connectorId: 'conn_whatsapp',
    connectorName: 'WhatsApp Business API',
    eventType: 'whatsapp.message.received',
    payload: {
      from: '14155552671',
      text: { body: 'Hello, need to verify order dispatch for enterprise account' },
      timestamp: '1723028050'
    },
    status: 'COMPLETED',
    priority: 'NORMAL',
    attempts: 1,
    maxAttempts: 3,
    queuedAt: '2026-08-07T12:11:10Z',
    processedAt: '2026-08-07T12:11:11Z',
    latencyMs: 185,
    stepLogs: [
      { stepId: 'node_w1', nodeTitle: 'WhatsApp Message Trigger', status: 'SUCCESS', timestamp: '12:11:10.050', durationMs: 10 },
      { stepId: 'node_w2', nodeTitle: 'Normalize Customer Payload', status: 'SUCCESS', timestamp: '12:11:10.100', durationMs: 15 },
      { stepId: 'node_w3', nodeTitle: 'Create ServiceNow Ticket', status: 'SUCCESS', timestamp: '12:11:11.200', durationMs: 310, output: { ticket_id: 'INC008819' } }
    ]
  },
  {
    id: 'evt_q_1003',
    traceId: 'tr_881922_cpaas',
    workflowId: 'wf_vip_escalation',
    workflowName: 'VIP Inbound SMS -> AI Sentiment -> Salesforce & Slack Alert',
    connectorId: 'conn_servicenow',
    connectorName: 'ServiceNow ITSM Connector',
    eventType: 'servicenow.incident.updated',
    payload: {
      incident_id: 'INC009912',
      state: 'Network Timeout during SOAP sync'
    },
    status: 'DLQ',
    priority: 'HIGH',
    attempts: 3,
    maxAttempts: 3,
    queuedAt: '2026-08-07T12:05:00Z',
    latencyMs: 1250,
    error: 'HTTP 504 Gateway Timeout: Target endpoint failed to respond within 5000ms',
    stepLogs: [
      { stepId: 'node_1', nodeTitle: 'Incident Trigger', status: 'SUCCESS', timestamp: '12:05:00.100', durationMs: 10 },
      { stepId: 'node_2', nodeTitle: 'ServiceNow Sync Node', status: 'FAILED', timestamp: '12:05:05.100', durationMs: 5000, error: 'HTTP 504 Gateway Timeout' }
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit_901',
    traceId: 'tr_881920_cpaas',
    workflowId: 'wf_vip_escalation',
    workflowName: 'VIP Inbound SMS -> AI Sentiment -> Salesforce & Slack Alert',
    sourceConnector: 'Twilio Voice & Messaging',
    targetConnectors: ['Salesforce CRM Platform', 'Slack Enterprise Grid Bot'],
    timestamp: '2026-08-07T12:12:01Z',
    durationMs: 902,
    status: 'SUCCESS',
    payloadSizeKb: 2.4,
    inboundPayload: { From: '+14155552671', Body: 'URGENT: Database connection pool exhausted' },
    outboundPayloads: {
      Salesforce: { LeadId: '00Q8a00001fX92', Priority: 'High' },
      Slack: { Channel: '#cpaas-incident-alerts', MessageSent: true }
    },
    stepLogs: [
      { stepId: 'node_1', nodeTitle: 'Inbound SMS Trigger', status: 'SUCCESS', timestamp: '12:12:00.100', durationMs: 12 },
      { stepId: 'node_2', nodeTitle: 'Gemini AI Sentiment & Intent Extractor', status: 'SUCCESS', timestamp: '12:12:00.400', durationMs: 280 },
      { stepId: 'node_3', nodeTitle: 'Is Urgent Priority?', status: 'SUCCESS', timestamp: '12:12:00.410', durationMs: 5 },
      { stepId: 'node_4', nodeTitle: 'Create Salesforce Lead & Case', status: 'SUCCESS', timestamp: '12:12:00.800', durationMs: 380 },
      { stepId: 'node_5', nodeTitle: 'Dispatch Urgent Slack Escalation', status: 'SUCCESS', timestamp: '12:12:01.000', durationMs: 180 }
    ]
  }
];
