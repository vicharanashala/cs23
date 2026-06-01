import {
  Router,
  Route,
  RootRoute,
} from '@tanstack/react-router';
import { AppShell } from '../layouts/AppShell';
import MainDashboard from '../pages/MainDashboard';

// Placeholder page components (to be built in future sprints)
import BrowseSearch from '../pages/BrowseSearch';
import SubmitTicket from '../pages/SubmitTicket';
import TicketTracking from '../pages/TicketTracking';

// Root route with AppShell layout
const rootRoute = new RootRoute({
  component: AppShell,
});

// Route tree
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: MainDashboard,
});

const browseRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/browse',
  component: BrowseSearch,
});

const submitRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/submit',
  component: SubmitTicket,
});

const trackRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/track',
  component: TicketTracking,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  browseRoute,
  submitRoute,
  trackRoute,
]);

export const router = new Router({ routeTree });

// Type-safe navigation
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}