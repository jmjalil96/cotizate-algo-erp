import React from 'react';

import { createLazyFileRoute, Navigate } from '@tanstack/react-router';

import { useAuthStore } from '@/shared/store/auth';

export const Route = createLazyFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute(): React.JSX.Element {
  const { isAuthenticated } = useAuthStore();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} />;
}
