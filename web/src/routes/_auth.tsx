import React from 'react';

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { useAuthStore } from '@/shared/store/auth';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      // Preserve redirect param if coming from protected route
      const redirectTo = new URLSearchParams(location.search).get('redirect');
      throw redirect({ to: redirectTo ?? '/dashboard' });
    }
  },
  component: AuthLayoutWrapper,
});

function AuthLayoutWrapper(): React.JSX.Element {
  return <Outlet />;
}
