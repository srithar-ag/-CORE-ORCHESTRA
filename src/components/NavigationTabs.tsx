import React from 'react';
import { Blocks, GitFork, Layers, Workflow, FileText, Send } from 'lucide-react';

export type TabType = 'connectors' | 'orchestrator' | 'queue' | 'mapper' | 'audit' | 'webhook';

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  connectorCount: number;
  workflowCount: number;
  dlqCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  connectorCount,
  workflowCount,
  dlqCount
}) => {
  const tabs = [
    {
      id: 'connectors' as TabType,
      label: 'Connectors',
      icon: Blocks,
      badge: connectorCount
    },
    {
      id: 'orchestrator' as TabType,
      label: 'Workflows',
      icon: GitFork,
      badge: workflowCount
    },
    {
      id: 'queue' as TabType,
      label: 'Async Event Bus',
      icon: Layers,
      badge: dlqCount > 0 ? `${dlqCount} DLQ` : undefined,
      badgeAlert: dlqCount > 0
    },
    {
      id: 'mapper' as TabType,
      label: 'Schema Mapper',
      icon: Workflow
    },
    {
      id: 'audit' as TabType,
      label: 'Audit & Traces',
      icon: FileText
    },
    {
      id: 'webhook' as TabType,
      label: 'Webhook Gateway',
      icon: Send
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto py-3 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer
                  ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-2 py-0.5 text-[10px] font-mono rounded-md font-bold ${
                      tab.badgeAlert
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : isActive
                        ? 'bg-indigo-100/80 text-indigo-800'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

