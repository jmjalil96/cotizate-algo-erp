import React, { useState } from 'react';

import { type LucideIcon } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
  content: React.ReactNode;
}

interface DetailTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function DetailTabs({
  tabs,
  defaultTab,
  onChange,
  className = '',
}: DetailTabsProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '');

  const handleTabChange = (tabId: string): void => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const currentTab = tabs.find((tab) => tab.id === activeTab);

  if (tabs.length === 0) {
    return <div>No tabs available</div>;
  }

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                style={isActive ? { borderColor: '#093FB4', color: '#093FB4' } : {}}
                onClick={() => handleTabChange(tab.id)}
              >
                {TabIcon && (
                  <TabIcon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                    style={isActive ? { color: '#093FB4' } : {}}
                  />
                )}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                      ${
                        isActive
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">{currentTab?.content}</div>
    </div>
  );
}
