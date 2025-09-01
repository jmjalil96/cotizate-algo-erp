import React from 'react';

import { TopNavBar, SecondaryNavBar } from '../navigation';

interface AppShellProps {
  children: React.ReactNode;
  currentModule?: string;
  currentPage?: string;
  userName?: string;
  onModuleNavigate?: (module: string) => void;
  onPageNavigate?: (page: string) => void;
  onSettingsClick?: () => void;
  onSignOut?: () => void;
}

export function AppShell({
  children,
  currentModule = 'dashboard',
  currentPage,
  userName,
  onModuleNavigate,
  onPageNavigate,
  onSettingsClick,
  onSignOut,
}: AppShellProps): React.JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Primary Navigation */}
      <TopNavBar
        currentModule={currentModule}
        userName={userName}
        onNavigate={onModuleNavigate}
        onSettingsClick={onSettingsClick}
        onSignOut={onSignOut}
      />

      {/* Secondary Navigation - Shows only for modules with sub-pages */}
      <SecondaryNavBar
        currentModule={currentModule}
        currentPage={currentPage}
        onNavigate={onPageNavigate}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
