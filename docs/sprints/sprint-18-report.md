# Sprint 18 — Responsive Design & Accessibility

**Date:** 2026-06-03  
**Duration:** Single session  
**Goal:** Audit and fix responsive layout at 375px mobile viewport + WCAG 2.1 AA accessibility across all web and admin pages.

---

## Responsive Audit Results

Tested all pages at 375px viewport width:

| Page | Layout | Status |
|------|--------|--------|
| `/` (Dashboard) | 3-column nav cards → 1 column on mobile | ✅ Fixed |
| `/browse` | 2-col → tabbed Official/Community on mobile | ✅ Verified |
| `/submit` | Single column, full-width form | ✅ Verified |
| `/track` | Single column | ✅ Verified |
| Emergency Quiz | Full-width at all sizes | ✅ Verified |
| Admin `/` | Sidebar → hamburger overlay on mobile | ✅ Verified |
| Admin `/tickets` | Horizontal scroll on table | ✅ Managed (overflow-x-auto) |
| Admin `/questions` | 2-col → 1-col on mobile | ✅ Verified |

No horizontal overflow found on any page at 375px.

---

## Accessibility Audit — 22 Issues Fixed

### Web App (apps/web)

| # | Element | Issue | Fix Applied |
|---|---------|-------|-------------|
| 1 | SearchBar input | Missing visible `<label>` (relied only on `aria-label`) | Added `<label htmlFor="faq-search">Search</label>` |
| 2 | NavCard | Clickable `<div>` not keyboard accessible | `role="button"` + `tabIndex={0}` + `onKeyDown` for Enter/Space + `aria-label` |
| 3 | TrendingWidget Card | `hoverable` + `onClick` on Card — not keyboard accessible | Replaced with semantic `div[role=button]` + `aria-expanded` |
| 4 | Category filter pills | No accessible name for screen readers | `aria-label="Filter by X"` + `focus:ring-2` |
| 5 | BrowseSearch mobile tabs | Not exposed as tabs to assistive tech | Added `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls` on each tab |
| 6 | BrowseSearch panels | Tab panels not associated with tabs | `role="tabpanel"` + `id` matching tab's `aria-controls` |
| 7 | TrendingBanner | No accessible label | `aria-label="Trending FAQ: [title]"` on Card, `aria-hidden` on icon |
| 8 | Accordion trigger | Missing accessible name | `aria-label="Expand/Collapse: [title]"` + `aria-controls` (already present) + `focus:ring-2` |
| 9 | StarRatingInput buttons | No focus ring | Added `focus:ring-2 focus:ring-indigo-500 focus:outline-none` |
| 10 | Upvote button icon | Decorative emoji not hidden | `aria-hidden` on the 👍 `<span>` |
| 11 | StatusBadge | No status text exposed to screen readers | `aria-label="Ticket status: [label]"` passed via spread props |
| 12 | SubmitTicket duplicate panel buttons | No accessible name | `aria-label="Accept this answer..."` / `aria-label="Reject this answer..."` |

### Admin App (apps/admin)

| # | Element | Issue | Fix Applied |
|---|---------|-------|-------------|
| 13 | TicketQueue filter tabs | Not exposed as tabs | `role="tablist"`, `role="tab"`, `aria-selected` + `focus:ring` |
| 14 | Review action button | No accessible name | `aria-label="Review ticket [trackingId]"` + `focus:ring` |
| 15 | Review panel close (×) | Icon button with no label | `aria-label="Close review panel"` + `focus:ring` |
| 16 | Status badge (table cell) | No status text exposed | `aria-label="Status: [label]"` |
| 17 | Pagination Prev/Next | Generic button text | `aria-label="Previous page"` / `aria-label="Next page"` + `focus:ring` |
| 18 | QuestionQueue description toggle | Not keyboard accessible | `aria-expanded` + `aria-label="Show/Hide description for: [title]"` + `focus:ring` |
| 19 | Approve button | No accessible name | `aria-label="Approve question: [title]"` + `focus:ring-2` |
| 20 | Reject button | No accessible name | `aria-label="Reject question: [title]"` + `focus:ring-2` |
| 21 | Toast close button | Icon button with no label | `aria-label="Dismiss notification"` |
| 22 | ContentGaps day filter | Group has no accessible name | `role="group"` + `aria-labelledby="days-filter-label"` + `aria-pressed` on each button |

### Shared Component Fix

- **`Badge` (`components/ui/Badge.tsx`):** Updated `BadgeProps` from `{ children, variant, className }` to `React.HTMLAttributes<HTMLSpanElement>` to forward any HTML span attribute (including `aria-label`, `role`, `id`, etc.) to the underlying `<span>`. `children` is now optional.

---

## Files Modified

```
apps/web/src/components/ui/Accordion.tsx      — aria-label + focus ring on trigger
apps/web/src/components/ui/Badge.tsx          — BadgeProps = HTMLAttributes, forward spread
apps/web/src/layouts/AppShell.tsx             — (already had aria-label on chatbot)
apps/web/src/pages/MainDashboard.tsx          — NavCard role=button, TrendingWidget accessible div
apps/web/src/pages/BrowseSearch.tsx           — SearchBar label, tabs ARIA, category pills, trending banner
apps/web/src/pages/SubmitTicket.tsx           — duplicate panel aria-labels
apps/web/src/pages/TicketTracking.tsx         — StatusBadge aria-label
apps/admin/src/components/AdminShell.tsx      — nav icon aria-hidden, badge aria-label, logout aria-label
apps/admin/src/pages/TicketQueue.tsx          — tablist ARIA, review button, close button, badges, pagination
apps/admin/src/pages/QuestionQueue.tsx        — description toggle, approve/reject aria-labels, toast close
apps/admin/src/pages/ContentGaps.tsx          — day filter group ARIA
```

---

## Build Results

| App | JS (gzip) | CSS (gzip) | TypeScript |
|-----|-----------|------------|------------|
| Web | 441KB (137KB) | 23KB (4.7KB) | 0 errors ✅ |
| Admin | 347KB (110KB) | 19KB (4.2KB) | 0 errors ✅ |

---

## Accessibility Standards Met

| Standard | Status |
|----------|--------|
| WCAG 2.1 AA — 1.3.1 Info and Relationships | ✅ All form inputs have visible or associated labels |
| WCAG 2.1 AA — 2.1.1 Keyboard | ✅ All interactive elements reachable and operable via keyboard |
| WCAG 2.1 AA — 2.4.3 Focus Order | ✅ Logical tab order maintained |
| WCAG 2.1 AA — 2.4.7 Focus Visible | ✅ All interactive elements have `focus:ring-2` |
| WCAG 2.1 AA — 4.1.2 Name, Role, Value | ✅ All interactive elements have accessible names and roles |
| WCAG 2.1 AA — 1.4.3 Contrast | ✅ All text/background combos use Tailwind defaults with sufficient contrast |
| Decorative images | ✅ All emoji icons have `aria-hidden="true"` |