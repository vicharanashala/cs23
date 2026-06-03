import type { ReactNode } from 'react';
import {
  Router,
  Route,
  RootRoute,
} from '@tanstack/react-router';
import { AdminShell } from '../components/AdminShell';
import AdminLogin from '../pages/AdminLogin';
import AdminDashboard from '../pages/AdminDashboard';
import TicketQueue from '../pages/TicketQueue';
import QuestionQueue from '../pages/QuestionQueue';
import ContentGaps from '../pages/ContentGaps';
import SearchAnalytics from '../pages/SearchAnalytics';

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = new RootRoute({});

// ─── Login page ──────────────────────────────────────────────────────────────

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: AdminLogin,
});

// ─── Shell wrapper (auth guard) ───────────────────────────────────────────────

function AdminLayout({ children }: { children?: ReactNode }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  return <AdminShell>{children}</AdminShell>;
}

// ─── Page routes ──────────────────────────────────────────────────────────────

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <AdminLayout><AdminDashboard /></AdminLayout>,
});

const ticketsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/tickets',
  component: () => <AdminLayout><TicketQueue /></AdminLayout>,
});

const questionsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/questions',
  component: () => <AdminLayout><QuestionQueue /></AdminLayout>,
});

const gapsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/gaps',
  component: () => <AdminLayout><SearchAnalytics /></AdminLayout>,
});

// ─── Build tree ───────────────────────────────────────────────────────────────

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