import React, { useState } from 'react';
import { Sparkles, ArrowRight, Workflow, Code2, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';

export const PayloadMapper: React.FC = () => {
  const [sourceJson, setSourceJson] = useState<string>(
    JSON.stringify(
      {
        From: '+14155552671',
        Body: 'URGENT: Customer order #9821 payment declined on checkout gateway',
        AccountSid: 'AC88102930',
        Timestamp: '2026-08-07T12:00:00Z',
        Customer: {
          FirstName: 'Alexander',
          LastName: 'Vance',
          Company: 'AeroTech Systems'
        }
      },
      null,
      2
    )
  );

  const [targetJson, setTargetJson] = useState<string>(
    JSON.stringify(
      {
        LeadSource: 'CPaaS Inbound SMS',
        CustomerPhone: '',
        ContactLastName: '',
        Company: '',
        CasePriority: '',
        IssueTranscript: '',
        SentimentScore: ''
      },
      null,
      2
    )
  );

  const [mappings, setMappings] = useState<Record<string, string>>({
    CustomerPhone: '{{inbound.From}}',
    ContactLastName: '{{inbound.Customer.LastName}}',
    Company: '{{inbound.Customer.Company}}',
    IssueTranscript: '{{inbound.Body}}',
    CasePriority: 'HIGH'
  });

  const [aiExplanations, setAiExplanations] = useState<string[]>([
    "Mapped 'CustomerPhone' to inbound 'From' number.",
    "Extracted nested customer fields 'LastName' and 'Company' for CRM record creation."
  ]);

  const [isAutoMapping, setIsAutoMapping] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const handleAutoMapWithGemini = async () => {
    setIsAutoMapping(true);
    setMapError(null);

    try {
      let srcObj = {};
      let tgtObj = {};
      try {
        srcObj = JSON.parse(sourceJson);
        tgtObj = JSON.parse(targetJson);
      } catch {
        throw new Error('Invalid JSON input in Source or Target fields.');
      }

      const res = await fetch('/api/gemini/auto-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSchema: srcObj,
          targetSchema: tgtObj,
          context: 'Enterprise CPaaS CRM and Incident Sync'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Auto mapping failed');

      if (data.fieldMappings) {
        setMappings(data.fieldMappings);
      }
      if (data.explanations) {
        setAiExplanations(data.explanations);
      }
    } catch (err: any) {
      setMapError(err.message);
    } finally {
      setIsAutoMapping(false);
    }
  };

  const handleUpdateMapping = (key: string, value: string) => {
    setMappings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg font-bold">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              Enterprise Field & Payload Mapper
              <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-50 text-indigo-700 rounded border border-indigo-200 font-bold">
                AI Schema Transformer
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Visually align inbound CPaaS events with target enterprise APIs using template expressions or Gemini AI.
            </p>
          </div>
        </div>

        <button
          onClick={handleAutoMapWithGemini}
          disabled={isAutoMapping}
          className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isAutoMapping ? 'animate-spin' : ''}`} />
          <span>{isAutoMapping ? 'Mapping Schema with Gemini...' : 'Auto-Map Fields with Gemini AI'}</span>
        </button>
      </div>

      {mapError && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 text-xs rounded-lg font-medium">
          {mapError}
        </div>
      )}

      {/* Side-by-Side Schema Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Payload */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-indigo-600" />
            Source Inbound Payload (JSON)
          </h3>
          <textarea
            rows={12}
            value={sourceJson}
            onChange={(e) => setSourceJson(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Center: Mappings Expression Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-indigo-600" />
            Active Field Transformations ({Object.keys(mappings).length})
          </h3>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {Object.entries(mappings).map(([targetKey, sourceExpr]) => (
              <div key={targetKey} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">{targetKey}</span>
                <input
                  type="text"
                  value={sourceExpr}
                  onChange={(e) => handleUpdateMapping(targetKey, e.target.value)}
                  className="w-full mt-1 bg-white border border-slate-200 text-indigo-700 font-mono text-[11px] font-bold rounded-md px-2.5 py-1 focus:outline-none focus:border-indigo-600"
                />
              </div>
            ))}
          </div>

          {aiExplanations.length > 0 && (
            <div className="mt-3 p-3 bg-indigo-50/70 rounded-lg border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <span className="font-bold text-[10px] uppercase text-indigo-700 block tracking-wider">AI Transformation Insights</span>
              {aiExplanations.map((exp, i) => (
                <div key={i} className="text-[11px] text-slate-700 font-medium">• {exp}</div>
              ))}
            </div>
          )}
        </div>

        {/* Target Payload */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-indigo-600" />
            Target Outbound Schema (JSON)
          </h3>
          <textarea
            rows={12}
            value={targetJson}
            onChange={(e) => setTargetJson(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
