import React from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { ClientsPage } from '@/features/clients/pages/ClientsPage';

export const Route = createLazyFileRoute('/_protected/core/clients/')({
  component: ClientsPageWrapper,
});

function ClientsPageWrapper(): React.JSX.Element {
  const navigate = useNavigate();

  const handleClientSelect = (clientId: string): void => {
    navigate({ to: '/core/clients/$clientId', params: { clientId } });
  };

  return <ClientsPage onClientSelect={handleClientSelect} />;
}
