import React from 'react';

import { createLazyFileRoute, useNavigate, useParams } from '@tanstack/react-router';

import { ClientDetailPage } from '@/features/clients/pages/ClientDetailPage';

export const Route = createLazyFileRoute('/_protected/core/clients/$clientId')({
  component: ClientDetailWrapper,
});

function ClientDetailWrapper(): React.JSX.Element {
  const { clientId } = useParams({ from: '/_protected/core/clients/$clientId' });
  const navigate = useNavigate();

  const handleBack = (): void => {
    navigate({ to: '/core/clients' });
  };

  const handleEdit = (): void => {
    navigate({
      to: '/core/clients/edit/$clientId',
      params: { clientId },
    });
  };

  return <ClientDetailPage clientId={clientId} onBack={handleBack} onEdit={handleEdit} />;
}
