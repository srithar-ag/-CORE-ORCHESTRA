import React, { useState } from 'react';
import {
  ConnectorPlugin,
  ConnectorCategory,
  ConnectorStatus
} from '../types';
import {
  PhoneCall,
  Building2,
  MessageSquare,
  ShieldAlert,
  Slack,
  Webhook,
  Activity,
  Key,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Lock,
  ExternalLink
} from 'lucide-react';

interface ConnectorRegistryProps {
  connectors: ConnectorPlugin[];
  onUpdateConnector: (id: string, updates: Partial<ConnectorPlugin>) => void;
  onAddConnector: (newConn: Partial<ConnectorPlugin>) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  PhoneCall,
  Building2,
  MessageSquare,
  ShieldAlert,
  Slack,
  Webhook
};

export const ConnectorRegistry: React.FC<ConnectorRegistryProps> = ({
  connectors,
  onUpdateConnector,
  onAddConnector
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedConnector, setSelectedConnector] = useState<ConnectorPlugin | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [pingResults, setPingResults] = useState<Record<string, any>>({});
  const [pingingId, setPingingId] = useState<string | null>(null);

  // New Connector Form state
  const [newForm, setNewForm] = useState({
    name: '',
    category: 'CRM' as ConnectorCategory,
    version: 'v1.0.0',
    description: '',
    authType: 'API_KEY' as any,
    apiKey: '',
    endpointUrl: '',
    maxRps: 100
  });

  const categories: string[] = ['ALL', 'CRM', 'Messaging', 'Voice/SMS', 'ITSM', 'Collaboration', 'Custom Webhook'];

  const filteredConnectors = connectors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handlePingHealth = async (connId: string) => {
    setPingingId(connId);
    try {
      const res = await fetch(`/api/cpaas/connectors/${connId}/test-health`, {
        method: 'POST'
      });
      const data = await res.json();
      setPingResults((prev) => ({ ...prev, [connId]: data }));
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [connId]: { status: 'UNHEALTHY', message: err.message }
      }));
    } finally {
      setPingingId(null);
    }
  };

  const handleToggleCircuitBreaker = (conn: ConnectorPlugin) => {
    const newStatus = conn.circuitBreaker.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
    onUpdateConnector(conn.id, {
      circuitBreaker: {
        ...conn.circuitBreaker,
        status: newStatus,
        lastTripTime: newStatus === 'OPEN' ? new Date().toISOString() : undefined
      },
      status: newStatus === 'OPEN' ? 'DEGRADED' : 'ACTIVE'
    });
  };

  const handleCreatePlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name) return;

    onAddConnector({
      name: newForm.name,
      category: newForm.category,
      version: newForm.version,
      description: newForm.description || 'Enterprise integration plugin module',
      iconName: 'Webhook',
      authType: newForm.authType,
      authConfig: {
        apiKey: newForm.apiKey || 'sec_key_' + Math.random().toString(36).substring(2, 8),
        endpointUrl: newForm.endpointUrl || 'https://api.enterprise.domain/v1'
      },
      rateLimit: {
        maxRequestsPerSec: newForm.maxRps,
        currentRps: 0
      },
      actions: [
        {
          id: 'dispatch_action',
          name: 'Dispatch Event Payload',
          description: 'Standard outbound action payload.',
          samplePayload: { event: 'custom_trigger', data: {} }
        }
      ],
      triggers: [
        {
          id: 'inbound_trigger',
          name: 'Inbound Event Webhook',
          eventType: 'custom.event.received',
          sampleSchema: { event_id: 'evt_100', payload: {} }
        }
      ]
    });

    setIsNewModalOpen(false);
    setNewForm({
      name: '',
      category: 'CRM',
      version: 'v1.0.0',
      description: '',
      authType: 'API_KEY',
      apiKey: '',
      endpointUrl: '',
      maxRps: 100
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search connector plugins, APIs, protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy Plugin</span>
        </button>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredConnectors.map((conn) => {
          const IconComp = ICON_MAP[conn.iconName] || Webhook;
          const isCircuitOpen = conn.circuitBreaker.status === 'OPEN';
          const pingRes = pingResults[conn.id];

          return (
            <div
              key={conn.id}
              className={`bg-white border rounded-xl p-5 flex flex-col justify-between shadow-xs transition-all hover:border-slate-300 ${
                isCircuitOpen ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header: Icon, Name, Category & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-800 text-sm">{conn.name}</h3>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">{conn.version}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {conn.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-col items-end">
                    {conn.status === 'ACTIVE' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ACTIVE
                      </span>
                    )}
                    {conn.status === 'DEGRADED' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        DEGRADED
                      </span>
                    )}
                    {conn.status === 'DISABLED' && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 rounded-md flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        DISABLED
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed font-sans">
                  {conn.description}
                </p>

                {/* Auth & Security Details */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Auth Scheme</span>
                    <div className="flex items-center space-x-1.5 mt-0.5 font-mono text-[11px] text-indigo-700 font-bold">
                      <Key className="w-3 h-3 text-indigo-600" />
                      <span>{conn.authType}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Rate Limit</span>
                    <div className="flex items-center space-x-1.5 mt-0.5 font-mono text-[11px] text-slate-800 font-bold">
                      <Zap className="w-3 h-3 text-indigo-600" />
                      <span>{conn.rateLimit.maxRequestsPerSec} req/s</span>
                    </div>
                  </div>
                </div>

                {/* Circuit Breaker Controls */}
                <div className="mt-3 bg-slate-900 text-white p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className={`w-4 h-4 ${isCircuitOpen ? 'text-amber-400' : 'text-emerald-400'}`} />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">
                        Circuit Breaker
                      </span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          isCircuitOpen ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {conn.circuitBreaker.status}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleCircuitBreaker(conn)}
                    className={`px-2.5 py-1 text-[10px] font-bold font-mono rounded-md transition-colors cursor-pointer border ${
                      isCircuitOpen
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                    }`}
                  >
                    {isCircuitOpen ? 'RESET' : 'TRIP TEST'}
                  </button>
                </div>

                {/* Ping Result Output banner */}
                {pingRes && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg text-[11px] font-mono border ${
                      pingRes.status === 'HEALTHY'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>{pingRes.status} ({pingRes.latencyMs}ms)</span>
                      <span>HTTP 200</span>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1">{pingRes.message}</div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedConnector(conn)}
                  className="text-slate-600 hover:text-indigo-600 flex items-center space-x-1 cursor-pointer font-semibold"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Vault & Config</span>
                </button>

                <button
                  onClick={() => handlePingHealth(conn.id)}
                  disabled={pingingId === conn.id}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${pingingId === conn.id ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>{pingingId === conn.id ? 'Pinging...' : 'Health Check'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Vault & Config Drawer */}
      {selectedConnector && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{selectedConnector.name} Vault</h3>
                  <p className="text-xs text-slate-500">Encrypted Credentials & Ingestion Webhook Secrets</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConnector(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">Credential Vault Specs</h4>

                <div>
                  <label className="text-slate-500 block text-[11px] mb-1 font-semibold">Target Endpoint URL</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedConnector.authConfig.endpointUrl || 'https://api.cpaas.connector/v1'}
                    className="w-full bg-white border border-slate-200 text-slate-800 font-mono rounded-lg px-3 py-1.5 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-500 block text-[11px] mb-1 font-semibold">API Key / Token (Masked)</label>
                  <input
                    type="password"
                    readOnly
                    value={selectedConnector.authConfig.apiKey || 'sk_live_9981203912093810293'}
                    className="w-full bg-white border border-slate-200 text-slate-800 font-mono rounded-lg px-3 py-1.5 font-semibold"
                  />
                </div>

                {selectedConnector.authConfig.webhookSecret && (
                  <div>
                    <label className="text-slate-500 block text-[11px] mb-1 font-semibold">Inbound HMAC Webhook Secret</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedConnector.authConfig.webhookSecret}
                      className="w-full bg-white border border-slate-200 text-amber-700 font-mono rounded-lg px-3 py-1.5 font-semibold"
                    />
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Registered Actions ({selectedConnector.actions.length})</h4>
                <div className="space-y-2">
                  {selectedConnector.actions.map((act) => (
                    <div key={act.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">{act.name} <span className="font-mono text-[10px] text-slate-500">({act.id})</span></div>
                      <p className="text-[11px] text-slate-600 mt-1">{act.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedConnector(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Plugin */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-xl">
            <form onSubmit={handleCreatePlugin}>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-base">Register Connector Plugin</h3>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs text-slate-700">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Connector Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zendesk Support Ticket Connector"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Category</label>
                    <select
                      value={newForm.category}
                      onChange={(e) => setNewForm({ ...newForm, category: e.target.value as ConnectorCategory })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      <option value="CRM">CRM</option>
                      <option value="Messaging">Messaging</option>
                      <option value="Voice/SMS">Voice/SMS</option>
                      <option value="ITSM">ITSM</option>
                      <option value="Collaboration">Collaboration</option>
                      <option value="Custom Webhook">Custom Webhook</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 mb-1 font-semibold">Auth Type</label>
                    <select
                      value={newForm.authType}
                      onChange={(e) => setNewForm({ ...newForm, authType: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      <option value="API_KEY">API Key</option>
                      <option value="OAUTH2">OAuth 2.0</option>
                      <option value="HMAC_SECRET">HMAC Signature</option>
                      <option value="MUTUAL_TLS">Mutual TLS</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Target Base URL / Endpoint</label>
                  <input
                    type="url"
                    placeholder="https://api.yourdomain.com/v1"
                    value={newForm.endpointUrl}
                    onChange={(e) => setNewForm({ ...newForm, endpointUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of enterprise plugin capability..."
                    value={newForm.description}
                    onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer shadow-xs"
                >
                  Register Plugin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
