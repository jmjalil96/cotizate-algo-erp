import React from 'react';

import { createFileRoute, Outlet, redirect, useRouter, useLocation } from '@tanstack/react-router';

import { AppShell } from '@/shared/components/layouts';
import { useAuthStore } from '@/shared/store/auth';

export const Route = createFileRoute('/_protected')({
  beforeLoad: async ({ location }) => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }
  },
  component: ProtectedLayout,
});

// Known modules for type safety
const MODULES = ['dashboard', 'core', 'sac', 'billing', 'commissions'] as const;
type Module = (typeof MODULES)[number];

// Default page for each module
const MODULE_DEFAULT_PAGES: Record<Module, string | null> = {
  dashboard: null, // Dashboard has no sub-pages
  core: 'clients',
  sac: 'reimbursements',
  billing: 'pre-settlements',
  commissions: 'settlements',
};

function ProtectedLayout(): React.JSX.Element {
  const router = useRouter();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();

  // Reactively check auth status and redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.navigate({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }
  }, [isAuthenticated, router, location.pathname]);

  // Extract module with type safety
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentModule = (
    MODULES.includes(pathSegments[0] as Module) ? pathSegments[0] : 'dashboard'
  ) as Module;
  const currentPage = pathSegments[1];

  const handleModuleNavigate = (module: string): void => {
    // Navigate to module's default page or just the module if it's dashboard
    if (module === 'dashboard') {
      router.navigate({ to: '/dashboard' });
    } else {
      const defaultPage = MODULE_DEFAULT_PAGES[module as Module];
      if (defaultPage) {
        router.navigate({ to: `/${module}/${defaultPage}` });
      }
    }
  };

  const handlePageNavigate = (page: string): void => {
    router.navigate({ to: `/${currentModule}/${page}` });
  };

  const handleSignOut = async (): Promise<void> => {
    await logout();
    // Navigation to login is handled by the useEffect watching isAuthenticated
  };

  return (
    <AppShell
      currentModule={currentModule}
      currentPage={currentPage}
      userName={user ? `${user.firstName} ${user.lastName}` : undefined}
      onModuleNavigate={handleModuleNavigate}
      onPageNavigate={handlePageNavigate}
      onSettingsClick={() => router.navigate({ to: '/settings' })}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AppShell>
  );
}
