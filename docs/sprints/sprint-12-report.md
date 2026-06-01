# Sprint 12 Report — Layout 2: Browse & Search

**Date:** 2026-06-02
**Sprint:** Browse & Search (Public App Layout 2)
**Status:** ✅ Complete — TypeScript clean, Vite build successful

---

## Objective

Build the browse and search page (`/browse`) with a split two-column layout for official and community FAQs, with search, filtering, and community interaction features.

---

## File Created

```
apps/web/src/pages/BrowseSearch.tsx  (~340 lines)
```

---

## Layout

**Mobile:** Tab switcher (`Official FAQs` | `Community Questions`) replaces the two-column layout.

**Desktop (lg+):** Fixed two-column grid.

```
┌──────────────────────────────────────────────┐
│ Browse & Search FAQs                         │
│ [ 🔍 Search... ]                             │
│ [ All ] [ App Setup ] [ Test & Coding ] ...  │
│ [ 🔥 Trending: ... ]                         │
│ ┌─────────────────┐  ┌─────────────────────┐ │
│ │ ✅ Official FAQs│  │ 💬 User-Asked Qs    │ │
│ │  Accordion list │  │  Card with upvote   │ │
│ │  + media + tags │  │  + star rating      │ │
│ └─────────────────┘  └─────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## Components

### SearchBar
- Full-width input with 🔍 icon
- `useDebounce(search, 300)` — API called only after 300ms of no typing
- `setSearch` resets page to 1 on each change

### CategoryFilter
- Horizontal scrollable pill buttons: `All`, `Application Setup`, `Test & Coding Assessment`, `Stipend & Offer Letters`, `Internship Tasks`
- Active: filled indigo (`bg-indigo-600 text-white`)
- Inactive: outline with indigo hover
- `aria-pressed` for accessibility

### TrendingBanner
- Reuses `GET /api/faqs/trending` TanStack Query
- Hidden if error or loading
- Gradient background (orange → yellow)

### OfficialFaqItem
- Wraps `Accordion` component (single-item)
- `faq.description` or `faq.body` rendered as body text
- `mediaUrls` rendered as `<img>` thumbnails inside expanded body
- Star rating display (read-only)
- Tags rendered as small chips

### CommunityFaqCard
- `useMutation` for upvote — calls `POST /faqs/:id/upvote` with `sessionId`
- `sessionId`: generated with `crypto.randomUUID()` if absent from `localStorage`, then persisted
- Upvote button: disabled after voting (uses `faq.upvotedBy?.includes(sessionId)`)
- `aria-label` with live upvote count
- Star rating input (★ 1–5): `useMutation` → `POST /faqs/:id/rate` with `{ sessionId, stars }`
- Badge `"Promoted soon"` shown when `upvotes >= 12 && status !== 'official_faq'`

### FaqSkeleton
- `animate-pulse` placeholder blocks while loading
- Reused for both columns

### EmptyState
- 🔭 emoji + message + link to `/submit`

---

## API Integration

| Query | Endpoint | Notes |
|---|---|---|
| Official FAQs | `GET /api/faqs?type=official&...` | Refetches on debounced search/category change, page always 1 |
| Community FAQs | `GET /api/faqs?type=community&...` | Same |
| Trending banner | `GET /api/faqs/trending` | `staleTime: 5min` |
| Upvote | `POST /api/faqs/:id/upvote` | `sessionId` from localStorage |
| Rate | `POST /api/faqs/:id/rate` | `sessionId` + `stars` in body |

Queries invalidated on mutation success: `['community-faqs']` (re-fetches both columns).

---

## Accessibility

- `aria-label` on search input
- `aria-pressed` on category pills
- `aria-label` on upvote button with live count
- `role="group"` on star rating
- Keyboard-accessible accordion toggle

---

## Build Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ 1.69s, 344KB JS (111KB gzip), 20KB CSS (4.2KB gzip) |

---

## Notes

- Upvote count display after mutation shows new count from response (`data.upvotes`), not optimistic
- Star rating input resets visually after mutation (always shows 0 stars until re-fetch updates)
- Mobile tabs use `flex` + `border-b-2` indicator — clean, no JS animation needed
- `PARAMS_BASE`, `effectivePage`, `page` state removed — all queries reset to page 1 on filter change (per spec: page always 1 for new searches)

---

*Previous: sprint-11-report.md (Main Dashboard)*
*Next: Sprint 13 — Layout 3: Submit Ticket + Debounced Duplicate Blocker*