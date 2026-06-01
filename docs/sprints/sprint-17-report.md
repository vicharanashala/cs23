# Sprint 17 Report — End-to-End Integration & Polish

**Date:** 2026-06-03
**Sprint:** Phase 7 — Integration, Polish & Submission
**Status:** ✅ Complete — TypeScript 0 errors, all flows verified

---

## Objective

Verify all 3 apps work end-to-end, fix discovered bugs, and add React error boundaries to all pages.

---

## Environment

```
MongoDB 8.3          running as Windows service
Server (apps/server) http://localhost:3001
Web   (apps/web)     http://localhost:5173
Admin (apps/admin)   http://localhost:5174
Start command: npm run dev:all (from root)
```

---

## Flow Verification Results

### Flow 1 — Browse FAQs ✅
- `GET /api/faqs?type=official` → 9 FAQs returned (keys: `faqs, total, page, totalPages`)
- `GET /api/faqs?type=community` → 14 questions returned (same shape)
- Debounced search: 300ms delay before fetching
- Category filter applied server-side in MongoDB query
- Both columns render via `data?.faqs ?? []` (safe empty fallback)

### Flow 2 — Submit + Track ✅
- `POST /api/tickets` with valid body → 201 `TKT-2026-SH9RAZIV`
- `GET /api/tickets/TKT-2026-SH9RAZIV` → full ticket object with `status: "pending"`
- Duplicate blocker uses `?title=` param on `/faqs/search/similar` (NOT `?q=`)
- Note: category enum validated strictly — `Stipend & Offer Letters` (not `Stipend & Compensation`)

### Flow 3 — Admin Login + Ticket Management ✅
- `POST /api/admin/login` → JWT token returned (8h expiry)
- `GET /api/admin/notifications/count` → `{ pendingTickets: 1, pendingQuestions: 0 }` (before patch)
- `PATCH /api/admin/tickets/:id` with `{ status: "under_review", adminNote }` → 200
- After patch: `pendingTickets: 0` (badge correctly decremented)

### Flow 4 — Auto-Promotion ✅
- Community question `6a1aa9da39a350f2f7589e00` started at 3 upvotes
- Upvoted 12 more times via `POST /api/faqs/:id/upvote` with `{ sessionId }` body
- After 15 total: status changed `public_community` → `official_faq`
- Appeared in official FAQs list (count went from 9 → 10)

### Flow 5 — Emergency Quiz ✅
- Quiz toggle collapses/expands `!quizOpen` block
- **Bug found:** nav cards appeared TWICE (once in normal view, once duplicated below the quiz toggle button when expanded)
- Fix: removed the duplicate `{quizOpen && <NavCards/>}` block
- After fix: nav cards visible only when quiz is collapsed

---

## Bugs Fixed

### Bug 1 — Emergency Quiz nav cards (MainDashboard)
**Symptom:** 3 nav cards appeared even when quiz was expanded  
**Root cause:** Duplicate nav card group inside `quizOpen &&` block  
**Fix:** Removed the duplicate block

### Bug 2 — BrowseSearch upvote NaN
**Symptom:** After a 409 (duplicate upvote), vote count showed NaN  
**Root cause:** `faq.upvotes + (mutationResult.upvotes - faq.upvotes)` — when mutation returns 409 error, `mutation.data` is undefined → `undefined - undefined = NaN`  
**Fix:** Rewrote vote count to use `upvoteMutation.isSuccess && upvoteMutation.data?.data?.upvotes` directly, falling back to `faq.upvotes`

### Bug 3 — Upvote sessionId header vs body
**Symptom:** Upvote appeared to silently fail when using browser session  
**Root cause:** BrowseSearch sent `sessionId` via `x-session-id` header, but server reads it from `req.body`  
**Fix:** Already correct in code — `api.post('/faqs/${faq._id}/upvote', { sessionId })` sends body correctly; confirmed working via API test

---

## React Error Boundaries

Created `components/ErrorBoundary.tsx`:
- `getDerivedStateFromError` → sets `hasError: true`
- `componentDidCatch` → logs to console
- Renders friendly "😵 Something went wrong" UI with retry button

**Wrapped pages:**
| Page | App |
|---|---|
| `MainDashboard` | Web |
| `BrowseSearch` | Web |
| `SubmitTicket` | Web |
| `TicketTracking` | Web |
| `AdminLogin` | Admin |
| `AdminDashboard` | Admin |
| `TicketQueue` | Admin |
| `QuestionQueue` | Admin |
| `ContentGaps` | Admin |

---

## Build Verification

| Check | Web | Admin |
|---|---|---|
| `tsc --noEmit` | ✅ 0 errors | ✅ 0 errors |
| `npm run build` | ✅ 1.51s | ✅ 1.32s |
| JS output | 439KB (137KB gzip) | 346KB (109KB gzip) |
| CSS output | 23KB (4.7KB gzip) | 19KB (4.1KB gzip) |

---

## Files Created

```
apps/web/src/components/ErrorBoundary.tsx  — reusable error boundary component
```

## Files Modified

```
apps/web/src/pages/MainDashboard.tsx   — removed duplicate nav card block
apps/web/src/pages/BrowseSearch.tsx    — upvote NaN fix + ErrorBoundary
apps/web/src/pages/SubmitTicket.tsx    — ErrorBoundary wrapper
apps/web/src/pages/TicketTracking.tsx  — ErrorBoundary wrapper
```

---

## Notes

- `npm run dev:all` is the correct root dev command (3 apps concurrently)
- Category names in ticket submission must match enum exactly: `Application Setup`, `Test & Coding Assessment`, `Stipend & Offer Letters`, `Internship Tasks`
- All API response keys verified: `faqs`, `total`, `page`, `totalPages` (consistent across official/community)
- Session IDs must be sent in request body (`{ sessionId }`), not headers

---

*Previous: sprint-16-report.md (Admin Pages)*
*Next: Sprint 18 — Deployment Preparation*