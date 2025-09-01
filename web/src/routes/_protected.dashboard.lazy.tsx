import { createLazyFileRoute } from '@tanstack/react-router';

import { DashboardPage } from '@/features/home/pages/DashboardPage';

export const Route = createLazyFileRoute('/_protected/dashboard')({
  component: DashboardPage,
});
