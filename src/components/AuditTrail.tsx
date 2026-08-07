import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { FileText, Search, Filter, Clock, CheckCircle2, XCircle, ArrowRight, Activity, Shield } from 'lucide-react';

interface AuditTrailProps {
  logs: AuditLogEntry[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAudit, setSelectedAudit] = useState<AuditLogEntry | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    const matchesSearch =
      log.traceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sourceConnector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Search & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search trace correlation ID, source connector, workflow..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {['ALL', 'SUCCESS', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-[11px] font-mono rounded-md font-bold transition-colors cursor-pointer ${
                statusFilter === st ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            Integration Audit Trail & Observability ({filteredLogs.length})
          </h3>
          <span className="text-[11px] font-mono text-slate-500 font-medium">
            Cryptographically signed execution traces
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase border-b border-slate-200 font-bold">
              <tr>
                <th className="px-4 py-3">Trace ID</th>
                <th className="px-4 py-3">Workflow Name</th>
                <th className="px-4 py-3">Source → Target Connectors</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedAudit(log)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-indigo-700 font-bold">{log.traceId}</td>
                  <td className="px-4 py-3 font-sans font-bold text-slate-800 text-xs">
                    {log.workflowName}
                  </td>
                  <td className="px-4 py-3 font-sans text-xs">
                    <span className="text-slate-700 font-medium">{log.sourceConnector}</span>
                    <span className="text-slate-400 mx-1.5">→</span>
                    <span className="text-indigo-700 font-bold">{log.targetConnectors.join(', ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    {log.status === 'SUCCESS' ? (
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold">
                        SUCCESS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold">
                        FAILED
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-semibold">{log.durationMs} ms</td>
                  <td className="px-4 py-3 text-slate-500 font-medium">{log.payloadSizeKb} KB</td>
                  <td className="px-4 py-3 text-slate-500 font-sans text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base font-mono">
                  Execution Trace: {selectedAudit.traceId}
                </h3>
                <p className="text-xs text-slate-500 font-sans">{selectedAudit.workflowName}</p>
              </div>
              <button
                onClick={() => setSelectedAudit(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono text-slate-700 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-bold block uppercase mb-1 font-sans">
                    Inbound Payload ({selectedAudit.sourceConnector})
                  </span>
                  <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto">
                    {JSON.stringify(selectedAudit.inboundPayload, null, 2)}
                  </pre>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block uppercase mb-1 font-sans">
                    Outbound Payloads ({selectedAudit.targetConnectors.join(', ')})
                  </span>
                  <pre className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] text-emerald-300 overflow-x-auto">
                    {JSON.stringify(selectedAudit.outboundPayloads, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block uppercase mb-2 font-sans">
                  Step Timing Breakdown
                </span>
                <div className="space-y-2 font-sans">
                  {selectedAudit.stepLogs.map((s, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{s.nodeTitle}</span>
                      <span className="text-emerald-700 font-mono text-xs font-bold">{s.durationMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedAudit(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer font-sans"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
