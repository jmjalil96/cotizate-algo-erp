import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_protected/settings')({
  component: SettingsPage,
});

// Placeholder settings page
function SettingsPage(): React.JSX.Element {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
      <p className="text-gray-600">Settings page coming soon...</p>
    </div>
  );
}
