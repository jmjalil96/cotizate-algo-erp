import React from 'react';

import { createRootRoute, Outlet } from '@tanstack/react-router';

import { useAuthStore } from '@/shared/store/auth';

// Dev-only devtools
const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : React.lazy(() =>
      import('@tanstack/router-devtools').then((res) => ({
        default: res.TanStackRouterDevtools,
      }))
    );

export const Route = createRootRoute({
  // Critical: Initialize auth BEFORE any child routes
  beforeLoad: async () => {
    try {
      const { isInitialized, initializeAuth } = useAuthStore.getState();
      if (!isInitialized) {
        await initializeAuth();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Continue anyway - let the app handle unauthenticated state
    }
  },
  component: RootComponent,
});

function RootComponent(): React.JSX.Element {
  return (
    <>
      <Outlet />
      <React.Suspense>
        <TanStackRouterDevtools />
      </React.Suspense>
    </>
  );
}
