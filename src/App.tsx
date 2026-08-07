import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { ConnectorRegistry } from './components/ConnectorRegistry';
import { WorkflowOrchestrator } from './components/WorkflowOrchestrator';
import { EventQueueCenter } from './components/EventQueueCenter';
import { PayloadMapper } from './components/PayloadMapper';
import { AuditTrail } from './components/AuditTrail';
import { WebhookTester } from './components/WebhookTester';

import {
  ConnectorPlugin,
  IntegrationWorkflow,
  AsyncQueueEvent,
  AuditLogEntry,
  QueueSystemMetrics
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('connectors');
  const [connectors, setConnectors] = useState<ConnectorPlugin[]>([]);
  const [workflows, setWorkflows] = useState<IntegrationWorkflow[]>([]);
  const [queueEvents, setQueueEvents] = useState<AsyncQueueEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<QueueSystemMetrics>({
    activeWorkers: 4,
    maxWorkers: 10,
    queuedCount: 0,
    processingCount: 0,
    completedCount: 0,
    failedCount: 0,
    dlqCount: 0,
    eventsPerSecond: 42,
    avgQueueLatencyMs: 120
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      const [connRes, wfRes, queueRes, auditRes, metricsRes] = await Promise.all([
        fetch('/api/cpaas/connectors'),
        fetch('/api/cpaas/workflows'),
        fetch('/api/cpaas/queue/events'),
        fetch('/api/cpaas/audit-logs'),
        fetch('/api/cpaas/queue/metrics')
      ]);

      if (connRes.ok) setConnectors(await connRes.json());
      if (wfRes.ok) setWorkflows(await wfRes.json());
      if (queueRes.ok) setQueueEvents(await queueRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (metricsRes.ok) setQueueMetrics(await metricsRes.json());
    } catch (err) {
      console.error('Error fetching backend CPaaS data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(async () => {
      try {
        const [mRes, qRes] = await Promise.all([
          fetch('/api/cpaas/queue/metrics'),
          fetch('/api/cpaas/queue/events')
        ]);
        if (mRes.ok) setQueueMetrics(await mRes.json());
        if (qRes.ok) setQueueEvents(await qRes.json());
      } catch (err) {
        // silent polling catch
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleUpdateConnector = async (id: string, updates: Partial<ConnectorPlugin>) => {
    try {
      const res = await fetch(`/api/cpaas/connectors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setConnectors((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch (err) {
      console.error('Failed to update connector:', err);
    }
  };

  const handleAddConnector = async (newConn: Partial<ConnectorPlugin>) => {
    try {
      const res = await fetch('/api/cpaas/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConn)
      });
      if (res.ok) {
        const added = await res.json();
        setConnectors((prev) => [...prev, added]);
      }
    } catch (err) {
      console.error('Failed to add connector:', err);
    }
  };

  const handleCreateWorkflow = (wf: IntegrationWorkflow) => {
    setWorkflows((prev) => [wf, ...prev]);
  };

  const handleExecuteWorkflow = async (workflowId: string, payload: any) => {
    const res = await fetch(`/api/cpaas/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload })
    });
    const result = await res.json();
    fetchData(); // Refresh logs
    return result;
  };

  const handleEnqueueEvent = async (payload?: any) => {
    try {
      const res = await fetch('/api/cpaas/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: workflows[0]?.id,
          payload: payload || {
            From: '+14155552671',
            Body: 'CPaaS Queue Simulation Test Message ' + new Date().toLocaleTimeString()
          }
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to enqueue event:', err);
    }
  };

  const handleRetryDlq = async (eventId: string) => {
    try {
      const res = await fetch('/api/cpaas/queue/dlq/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to retry DLQ event:', err);
    }
  };

  const handlePurgeDlq = async () => {
    try {
      const res = await fetch('/api/cpaas/queue/dlq/purge', {
        method: 'POST'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to purge DLQ:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* App Header */}
      <Header
        activeConnectorsCount={connectors.filter((c) => c.status === 'ACTIVE').length}
        eventsPerSec={queueMetrics.eventsPerSecond}
        dlqCount={queueMetrics.dlqCount}
        onOpenNewConnector={() => setActiveTab('connectors')}
        onOpenTestRun={() => setActiveTab('orchestrator')}
      />

      {/* Navigation Bar */}
      <NavigationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connectorCount={connectors.length}
        workflowCount={workflows.length}
        dlqCount={queueMetrics.dlqCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-mono">Initializing Enterprise CPaaS Connectors Cluster...</span>
          </div>
        ) : (
          <>
            {activeTab === 'connectors' && (
              <ConnectorRegistry
                connectors={connectors}
                onUpdateConnector={handleUpdateConnector}
                onAddConnector={handleAddConnector}
              />
            )}

            {activeTab === 'orchestrator' && (
              <WorkflowOrchestrator
                workflows={workflows}
                connectors={connectors}
                onExecuteWorkflow={handleExecuteWorkflow}
                onCreateWorkflow={handleCreateWorkflow}
              />
            )}

            {activeTab === 'queue' && (
              <EventQueueCenter
                events={queueEvents}
                metrics={queueMetrics}
                onEnqueueEvent={handleEnqueueEvent}
                onRetryDlq={handleRetryDlq}
                onPurgeDlq={handlePurgeDlq}
              />
            )}

            {activeTab === 'mapper' && <PayloadMapper />}

            {activeTab === 'audit' && <AuditTrail logs={auditLogs} />}

            {activeTab === 'webhook' && <WebhookTester />}
          </>
        )}
      </main>

      {/* System Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-xs text-slate-500 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Enterprise CPaaS Integration Module • Modular Connector Plugin Framework & API Orchestration
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Node: <span className="text-indigo-400">us-east1-cluster-prod</span> • HMAC-SHA256 • Gemini API Powered
          </div>
        </div>
      </footer>
    </div>
  );
}
