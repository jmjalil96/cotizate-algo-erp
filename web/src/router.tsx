import { createRouter } from '@tanstack/react-router';

import { ErrorComponent, NotFoundComponent } from '@/shared/components/router';

import { routeTree } from './routeTree.gen';

// Create router instance
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultErrorComponent: ErrorComponent,
  defaultNotFoundComponent: NotFoundComponent,
});

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
