import React, { useState } from 'react';
import { AsyncQueueEvent, QueueSystemMetrics } from '../types';
import {
  Layers,
  Cpu,
  RefreshCw,
  Trash2,
  Play,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Zap,
  RotateCcw
} from 'lucide-react';

interface EventQueueCenterProps {
  events: AsyncQueueEvent[];
  metrics: QueueSystemMetrics;
  onEnqueueEvent: (payload?: any) => void;
  onRetryDlq: (eventId: string) => void;
  onPurgeDlq: () => void;
}

export const EventQueueCenter: React.FC<EventQueueCenterProps> = ({
  events,
  metrics,
  onEnqueueEvent,
  onRetryDlq,
  onPurgeDlq
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<AsyncQueueEvent | null>(null);

  const filteredEvents = events.filter((e) => {
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    const matchesSearch =
      e.traceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.connectorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">Workers Pool</span>
          <div className="flex items-center space-x-2 mt-1">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span className="font-mono text-base font-bold text-slate-800">
              {metrics.activeWorkers}/{metrics.maxWorkers}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">Queued</span>
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="font-mono text-base font-bold text-indigo-700">
              {metrics.queuedCount}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">Processing</span>
          <div className="flex items-center space-x-2 mt-1">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-mono text-base font-bold text-amber-700">
              {metrics.processingCount}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">Completed</span>
          <div className="flex items-center space-x-2 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-mono text-base font-bold text-emerald-700">
              {metrics.completedCount}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] text-slate-500 uppercase font-bold block tracking-wider">Avg Latency</span>
          <div className="flex items-center space-x-2 mt-1">
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            <span className="font-mono text-base font-bold text-slate-800">
              {metrics.avgQueueLatencyMs} ms
            </span>
          </div>
        </div>

        <div className={`border p-4 rounded-xl shadow-xs ${metrics.dlqCount > 0 ? 'bg-amber-50/50 border-amber-300' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] text-amber-800 uppercase font-bold block tracking-wider">Dead Letter Queue</span>
          <div className="flex items-center space-x-2 mt-1">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="font-mono text-base font-bold text-amber-800">
              {metrics.dlqCount}
            </span>
          </div>
        </div>
      </div>

      {/* Control Actions & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search trace ID, connector, or workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'DLQ'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-md font-bold transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEnqueueEvent()}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Enqueue Test Message</span>
          </button>

          {metrics.dlqCount > 0 && (
            <button
              onClick={onPurgeDlq}
              className="px-3 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge DLQ</span>
            </button>
          )}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            Async Event Stream ({filteredEvents.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-500 font-medium">
            Auto-consuming with exponential backoff & DLQ retry policy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 font-bold">
              <tr>
                <th className="px-4 py-3">Trace ID</th>
                <th className="px-4 py-3">Workflow & Connector</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Queued Time</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredEvents.map((evt) => (
                <tr
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-indigo-700 font-bold">{evt.traceId}</td>
                  <td className="px-4 py-3 font-sans">
                    <div className="font-bold text-slate-800 text-xs">{evt.workflowName}</div>
                    <div className="text-[10px] text-slate-500 font-semibold">{evt.connectorName}</div>
                  </td>
                  <td className="px-4 py-3">
                    {evt.status === 'COMPLETED' && (
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold">
                        COMPLETED
                      </span>
                    )}
                    {evt.status === 'QUEUED' && (
                      <span className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold">
                        QUEUED
                      </span>
                    )}
                    {evt.status === 'PROCESSING' && (
                      <span className="px-2 py-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold animate-pulse">
                        PROCESSING
                      </span>
                    )}
                    {evt.status === 'DLQ' && (
                      <span className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold">
                        DLQ POISONED
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-semibold">
                    {evt.attempts}/{evt.maxAttempts}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-sans text-[11px]">
                    {new Date(evt.queuedAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">
                    {evt.latencyMs ? `${evt.latencyMs} ms` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {evt.status === 'DLQ' && (
                      <button
                        onClick={() => onRetryDlq(evt.id)}
                        className="px-2.5 py-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 rounded-md cursor-pointer flex items-center space-x-1 ml-auto font-sans font-bold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Requeue</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Event Detail Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base font-mono">Trace: {selectedEvent.traceId}</h3>
                <p className="text-xs text-slate-500 font-sans">{selectedEvent.workflowName}</p>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono text-slate-700 max-h-[70vh] overflow-y-auto">
              {selectedEvent.error && (
                <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-800 font-sans">
                  <div className="font-bold text-xs mb-1">Execution Failure Exception:</div>
                  <div className="font-mono text-[11px]">{selectedEvent.error}</div>
                </div>
              )}

              <div>
                <span className="text-slate-500 font-bold block uppercase mb-1 font-sans">Inbound Payload</span>
                <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 overflow-x-auto text-[11px] text-indigo-300">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-slate-500 font-bold block uppercase mb-1 font-sans">Consumer Processing Steps</span>
                <div className="space-y-2 font-sans">
                  {selectedEvent.stepLogs.map((s, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-800">{s.nodeTitle}</span>
                        <span className="text-emerald-700 font-mono text-[11px]">{s.durationMs}ms</span>
                      </div>
                      {s.output && (
                        <pre className="mt-1 text-[10px] text-slate-700 font-mono bg-white p-2 rounded-lg border border-slate-200">
                          {JSON.stringify(s.output, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer font-sans"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
