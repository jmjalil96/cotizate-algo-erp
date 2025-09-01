import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_protected/sac/reimbursements')({
  component: ReimbursementsPage,
});

function ReimbursementsPage(): React.JSX.Element {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Reembolsos</h1>
      <p className="text-gray-600">Esta página está en construcción.</p>
    </div>
  );
}
