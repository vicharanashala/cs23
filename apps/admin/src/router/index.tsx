import type { ReactNode } from 'react';
import {
  Router,
  Route,
  RootRoute,
  Outlet,
} from '@tanstack/react-router';
import { AdminShell } from '../components/AdminShell';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import TicketQueue from '../pages/TicketQueue';
import QuestionQueue from '../pages/QuestionQueue';
import ContentGaps from '../pages/ContentGaps';

// ─── Layout wrapper ───────────────────────────────────────────────────────────

function AdminLayout(): ReactNode | null {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = new RootRoute({
  component: () => <Outlet />,
});

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: AdminLogin,
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: AdminLayout,
});

const ticketsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/tickets',
  component: AdminLayout,
});

const questionsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/questions',
  component: AdminLayout,
});

const gapsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/gaps',
  component: AdminLayout,
});

// Mount pages as children of the AdminLayout route
const indexPageRoute = new Route({
  getParentRoute: () => indexRoute,
  id: 'index',
  component: AdminDashboard,
});

const ticketsPageRoute = new Route({
  getParentRoute: () => ticketsRoute,
  id: 'index',
  component: TicketQueue,
});

const questionsPageRoute = new Route({
  getParentRoute: () => questionsRoute,
  id: 'index',
  component: QuestionQueue,
});

const gapsPageRoute = new Route({
  getParentRoute: () => gapsRoute,
  id: 'index',
  component: ContentGaps,
});

indexRoute.addChildren([indexPageRoute]);
ticketsRoute.addChildren([ticketsPageRoute]);
questionsRoute.addChildren([questionsPageRoute]);
gapsRoute.addChildren([gapsPageRoute]);

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  ticketsRoute,
  questionsRoute,
  gapsRoute,
]);

export const router = new Router({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}