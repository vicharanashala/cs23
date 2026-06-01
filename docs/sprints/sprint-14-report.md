# Sprint 14 Report — Layout 4: Ticket Tracking

**Date:** 2026-06-03
**Sprint:** Ticket Tracking (Public App Layout 4)
**Status:** ✅ Complete — TypeScript clean, Vite build successful

---

## Objective

Build the ticket status lookup page (`/track`) with on-demand TanStack Query fetch, URL query param pre-fill, and a rich result card with timeline.

---

## File Created

```
apps/web/src/pages/TicketTracking.tsx  (~290 lines)
```

---

## Layout

```
┌────────────────────────────────────────────┐
│ Track Your Ticket                          │
│ Enter your Ticket Tracking ID              │
│ ┌──────────────────────────┐ [Fetch Status]│
│ │ TKT-2026-XXXXXXXX        │              │
│ └──────────────────────────┘              │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ Ticket ID: TKT-2026-_ONMX8HH         │  │
│ │ [🟡 Pending]                         │  │
│ │ Subject: First 60 chars of desc...   │  │
│ │ Category: Application Setup          │  │
│ │ ● Submitted 3 hours ago              │  │
│ │   Admin note: (if present)           │  │
│ └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## Input Section

- `input[type=text]` with monospace font, auto-uppercase onChange
- "Fetch Status" button: disabled when input empty or already fetching
- `onKeyDown Enter` triggers fetch
- Placeholder: `TKT-2026-XXXXXXXX`
- `aria-label` on input

---

## TanStack Query Integration

```ts
useQuery({
  queryKey: ['ticket', activeId],
  queryFn: () => api.get<Ticket>(`/tickets/${activeId}`).then(r => r.data),
  enabled: activeId.length > 0,  // disabled by default, enabled on demand
  staleTime: 30_000,
  retry: false,
})
```

- `handleFetch()` reads `queryClient` to `removeQueries` before setting new `activeId` — clears stale result
- Input auto-uppercased; server expects uppercase tracking ID
- `isFetching` used (not `isLoading`) for the spinner — query is fast once enabled

---

## URL Query Param Pre-fill

```ts
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    setInputValue(id);
    setActiveId(id.trim().toUpperCase()); // fires query immediately
  }
}, []);
```

When a tracking link from the submit success page (`/track?id=TKT-2026-XXXXXXXX`) is visited, the query runs immediately without requiring a button click.

---

## Result Card

| Field | Source |
|---|---|
| Ticket ID | `ticket.trackingId` in monospace bold |
| Status | `StatusBadge` component — pending=yellow, under_review=blue, resolved=green |
| Subject | First 60 chars of `description` |
| Category | `ticket.category` |
| Timeline | `relativeTime(ticket.createdAt)`, admin note in italic block |
| Nav | "Submit another question →" link to `/submit` |

---

## States

| State | Trigger | UI |
|---|---|---|
| Default | No query run yet | Input + button |
| Loading | `isFetching === true` | Input + button + centered `Spinner lg` |
| Error | `isError === true` | Red card: "🔍 Ticket not found. Double-check your tracking ID." |
| Result | `ticket !== undefined` | `ResultCard` component |

---

## Build Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ 1.74s, 439KB JS (137KB gzip), 23KB CSS (4.6KB gzip) |

---

## Notes

- `Badge` has no `closed` variant — `closed` status maps to `variant='pending'` (gray/yellow) which is the closest semantic match
- `TimelineItem` shows a dot for submission time, a vertical connector if the ticket was later updated, and an `adminNote` block when present
- `handleFetch` clears prior query with `queryClient.removeQueries({ queryKey: ['ticket', activeId] })` so a new fetch always shows loading, not stale data
- `useNavigate({ from: '/track' })` in `ResultCard` for correct relative navigation to `/submit`

---

*Previous: sprint-13-report.md (Submit Ticket + Duplicate Blocker)*
*Next: Sprint 15 — Admin Portal Foundation*