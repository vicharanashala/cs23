# Sprint 10 Report — Frontend Foundation

**Date:** 2026-06-02
**Sprint:** Frontend Foundation & Shared UI
**Status:** ✅ Complete — TypeScript clean, Vite build successful

---

## Objective

Build the shared frontend foundation: Axios client, TanStack Router, UI component library, and AppShell layout with static header + floating chatbot button.

---

## Files Created

```
apps/web/src/
├── lib/
│   └── api.ts                          # Axios instance, response interceptor
├── router/
│   └── index.tsx                       # TanStack Router v7, 4 routes
├── layouts/
│   └── AppShell.tsx                    # Sticky header + floating chatbot
├── components/
│   └── ui/
│       ├── Button.tsx                  # primary|secondary|ghost|danger + loading
│       ├── Input.tsx                   # label + error + hint, forwardRef
│       ├── Badge.tsx                   # pending|review|resolved|official|community|rejected
│       ├── Card.tsx                    # Card + CardHeader + CardBody, hoverable
│       ├── Spinner.tsx                 # sm|md|lg, accessible role=status
│       └── Accordion.tsx               # click-to-expand, aria-expanded, allowMultiple
├── hooks/
│   └── useDebounce.ts                  # generic debounce hook, configurable delay
├── vite-env.d.ts                       # Vite ImportMeta env types
└── main.tsx                            # QueryClientProvider + RouterProvider (staleTime: 60s)
```

---

## Key Design Decisions

### TanStack Router v7
Uses the class-based API (`RootRoute`, `Route`, `Router`) as per the existing package version (`^1.56.0`). Routes defined with `getParentRoute` pattern. `AppShell` used as `RootRoute` component — `<Outlet />` is the router slot rendering child routes.

### AppShell
- **Header:** sticky, white, border-b + shadow-sm. Left: icon + "Samagama FAQ Hub" (links to `/`). Right: "Admin Portal" → opens `VITE_ADMIN_URL` in new tab.
- **Floating button:** fixed bottom-right, blue-600, hover scale, `window.alert('AI Chatbot coming soon!')` on click.
- **Content area:** `<Outlet />` rendered below header, max-w-5xl, responsive padding.

### Axios (`lib/api.ts`)
- `baseURL`: `VITE_API_URL` env var or `http://localhost:3001/api`
- Response interceptor: rejects on 4xx/5xx with extracted `error.response.data.message` — cleaner than raw axios error objects.
- Session ID header NOT set here — handled per-request in components using a context or localStorage.

### UI Components
All use **TailwindCSS** (no extra CSS files). Accessible: `aria-invalid`, `aria-expanded`, `aria-describedby`, `aria-label`, `role`, focus rings. `forwardRef` on Input for form library compatibility.

### TypeScript
`tsconfig.json` strict mode: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. All errors resolved. Custom `vite-env.d.ts` provides `ImportMetaEnv` with `VITE_API_URL` and `VITE_ADMIN_URL`.

---

## Build Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ 1.91s, 261KB JS (83KB gzip), 13KB CSS (3KB gzip) |

---

## Routes Wired Up

| Path | Component | Notes |
|---|---|---|
| `/` | `MainDashboard` | Placeholder — layout built in next sprint |
| `/browse` | `BrowseSearch` | Placeholder — layout built in next sprint |
| `/submit` | `SubmitTicket` | Placeholder — layout built in next sprint |
| `/track` | `TicketTracking` | Placeholder — layout built in next sprint |

---

## Notes

- `VITE_ADMIN_URL` falls back to `http://localhost:5174` — must be set in `.env` for production
- TanStack Router v7 uses `new Router({ routeTree })` — not the newer `createRouter` + `link` API
- `QueryClient` `staleTime` set to **60 seconds** (per spec `staleTime: 60000`)
- Placeholder pages are simple `div` text — real components coming in next sprint

---

*Previous: sprint-09-report.md (Admin API)*
*Next: Sprint 11 — Layout 1: Main Dashboard*