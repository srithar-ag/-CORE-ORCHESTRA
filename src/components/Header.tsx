import React from 'react';
import { Network, Activity, Cpu, ShieldCheck, Zap } from 'lucide-react';

interface HeaderProps {
  activeConnectorsCount: number;
  eventsPerSec: number;
  dlqCount: number;
  onOpenNewConnector: () => void;
  onOpenTestRun: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeConnectorsCount,
  eventsPerSec,
  dlqCount,
  onOpenNewConnector,
  onOpenTestRun
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shadow-xs">
            <div className="w-4 h-4 border-2 border-white rotate-45" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight text-slate-800">
                CORE:ORCHESTRA
              </h1>
              <span className="ml-2 text-[10px] font-semibold font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                v2.4.0-STABLE
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEM_ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-sans">
              Enterprise CPaaS Integration Module • Async Event Bus • AI Schema Transformer
            </p>
          </div>
        </div>

        {/* Live System Telemetry */}
        <div className="hidden md:flex items-center space-x-6 text-xs text-slate-600">
          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="text-slate-400 block text-[9px] leading-3 uppercase font-bold tracking-wider">Active Plugins</span>
              <span className="font-mono text-slate-800 font-bold">{activeConnectorsCount} Connected</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
            <div>
              <span className="text-slate-400 block text-[9px] leading-3 uppercase font-bold tracking-wider">Throughput</span>
              <span className="font-mono text-slate-800 font-bold">{eventsPerSec} req/s</span>
            </div>
          </div>

          {dlqCount > 0 && (
            <div className="flex items-center space-x-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-800">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-amber-600/80 block text-[9px] leading-3 uppercase font-bold tracking-wider">DLQ Attention</span>
                <span className="font-mono font-bold">{dlqCount} In Queue</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenTestRun}
            className="px-3.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Test Pipeline</span>
          </button>
          <button
            onClick={onOpenNewConnector}
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
          >
            <span>+ Deploy Plugin</span>
          </button>
        </div>
      </div>
    </header>
  );
};

