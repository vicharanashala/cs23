# Sprint 15 Report — Admin Portal Foundation

**Date:** 2026-06-03
**Sprint:** Admin Portal — Auth & Shell (Phase 6)
**Status:** ✅ Complete — TypeScript clean, Vite build successful

---

## Objective

Set up the isolated admin portal (`apps/admin`) with auth routing, Axios client with JWT interceptors, an auth hook, a sidebar shell with notification polling, and all five admin pages.

---

## Files Created / Modified

```
apps/admin/src/
├── router/index.tsx          — TanStack Router v1 class API, 5 routes + nested layout
├── lib/api.ts                — Axios instance + request/response interceptors
├── hooks/useAdminAuth.ts     — { token, isAuthenticated, login, logout }
├── components/
│   └── AdminShell.tsx        — Sidebar + header + notification polling
├── pages/
│   ├── AdminLogin.tsx        — Username/password → POST /admin/login
│   ├── AdminDashboard.tsx    — Stats grid + quick links
│   ├── TicketQueue.tsx       — Paginated ticket list + PATCH status+note
│   ├── QuestionQueue.tsx     — Paginated pending questions + approve/reject
│   └── ContentGaps.tsx       — Zero-result searches + poorly-rated content
├── vite-env.d.ts             — VITE_API_URL type
└── main.tsx                  — RouterProvider + QueryClientProvider

Deleted:
└── src/App.tsx               — Replaced by router
```

---

## Router Structure

```
RootRoute (anonymous outlet)
├── /login           → AdminLogin (public, no auth guard)
├── /                → AdminLayout (auth guard) → AdminDashboard
├── /tickets         → AdminLayout → TicketQueue
├── /questions       → AdminLayout → QuestionQueue
└── /gaps            → AdminLayout → ContentGaps
```

- `AdminLayout` checks `localStorage.admin_token` on every route render
- If token absent → `window.location.href = '/login'` (full-page redirect)
- `AdminShell` renders sidebar nav + header + `<Outlet />` for the page content

---

## Axios Client (`lib/api.ts`)

- `baseURL`: `VITE_API_URL` env var or `http://localhost:3001/api`
- **Request interceptor**: attaches `Authorization: Bearer {token}` from `localStorage.admin_token`
- **Response interceptor**: on HTTP 401 → removes token, redirects to `/login`

---

## `useAdminAuth` Hook

```ts
const TOKEN_KEY = 'admin_token';
// login(token)     → localStorage.setItem(TOKEN_KEY, token)
// logout()         → localStorage.removeItem(TOKEN_KEY) + redirect to /login
// token            → localStorage.getItem(TOKEN_KEY) ?? null
// isAuthenticated  → !!token
```

---

## AdminShell

**Sidebar (fixed 14rem width, dark bg):**
- Brand: "Samagama FAQ — Admin Portal"
- Nav links with emoji icons: Dashboard / Ticket Queue / Question Queue / Content Gaps
- Red badge with count on "Ticket Queue" and "Question Queue" when `pendingTickets` / `pendingQuestions` > 0
- Logout button at bottom

**Header (sticky):**
- Hamburger (mobile) / page title (desktop)
- "🔴 N pending" pill when there are outstanding items

**Notification polling:**
```ts
useQuery({
  queryKey: ['admin-notifications'],
  queryFn: () => api.get('/admin/notifications/count').then((r) => r.data),
  refetchInterval: 30_000,
  staleTime: 15_000,
})
```

---

## Pages

### AdminLogin
- Username + password form
- `POST /api/admin/login` with `{ username, password }`
- On success: calls `login(token)` + `window.location.href = '/'` (router auto-handled)
- On error: "Invalid credentials. Please try again." inline error
- Background: minimal centered card, brand at top, back link

### AdminDashboard
- Stats grid: Pending Tickets, Pending Questions, Official FAQs, Content Gaps (4 cards)
- Quick links: 3 cards linking to Ticket Queue / Question Queue / Content Gaps
- Links to `/tickets`, `/questions`, `/gaps` + `/browse` (public)

### TicketQueue
- Paginated table: Tracking ID · Email · Category · Status · Submitted · Action
- Skeleton loading rows
- "Review →" opens inline review panel:
  - Description text
  - Admin note textarea
  - 3 buttons: `In Review` / `Resolved` / `Closed`
  - `PATCH /admin/tickets/:id` with `{ status, adminNote }`
- Pagination: Prev / Next buttons

### QuestionQueue
- Same table pattern as TicketQueue
- Columns: Question · Category · Upvotes · Rating · Submitted · Action
- Review panel:
  - Description + tags display
  - Tags input (comma-separated)
  - `PATCH /admin/questions/:id/approve` with optional `{ tags }`
  - `PATCH /admin/questions/:id/reject` (no body)
  - "Approved → public_community" note

### ContentGaps
- Period selector (7/14/30/90 days)
- Summary cards: zero-result count + poorly-rated count
- Zero-result section: search term + "Write answer →" link
- Poor-rating section: question title + status + rating + "Improve answer →" link

---

## Build Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ 1.56s, 341KB JS (108KB gzip), 17KB CSS (3.9KB gzip) |

---

## Notes

- TanStack Router v1 class API used throughout (same pattern as public app)
- Nested routes (AdminLayout parent → page child) used for shared shell rendering
- `AdminLayout` redirect uses `window.location.href` (not `router.navigate`) because the auth check runs outside the React tree during route resolution
- `vite-env.d.ts` added to fix `ImportMeta.env` TypeScript error
- `App.tsx` deleted — all routing now handled by `main.tsx` → `RouterProvider`
- `noUnusedLocals: true` forced careful removal of all unused imports/variables

---

*Previous: sprint-14-report.md (Ticket Tracking)*
*Next: Sprint 16 — Daily Trending Widget + Final Polish*