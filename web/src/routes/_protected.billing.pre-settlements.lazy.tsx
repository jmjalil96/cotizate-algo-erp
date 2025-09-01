import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_protected/billing/pre-settlements')({
  component: PreSettlementsPage,
});

function PreSettlementsPage(): React.JSX.Element {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pre-liquidaciones</h1>
      <p className="text-gray-600">Esta página está en construcción.</p>
    </div>
  );
}
