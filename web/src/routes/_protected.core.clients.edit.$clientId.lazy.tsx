import React from 'react';

import { createLazyFileRoute, useNavigate, useParams } from '@tanstack/react-router';

import { ClientEditPage } from '@/features/clients/pages/ClientEditPage';

export const Route = createLazyFileRoute('/_protected/core/clients/edit/$clientId')({
  component: ClientEditWrapper,
});

function ClientEditWrapper(): React.JSX.Element {
  const { clientId } = useParams({ from: '/_protected/core/clients/edit/$clientId' });
  const navigate = useNavigate();

  const handleCancel = (): void => {
    navigate({
      to: '/core/clients/$clientId',
      params: { clientId },
    });
  };

  const handleSave = (): void => {
    // After save, go back to detail view
    console.info('Client saved');
    navigate({
      to: '/core/clients/$clientId',
      params: { clientId },
    });
  };

  return <ClientEditPage clientId={clientId} onCancel={handleCancel} onSave={handleSave} />;
}
