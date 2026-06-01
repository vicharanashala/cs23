# Sprint 09 Report — Admin API Routes

**Date:** 2026-06-01
**Sprint:** Admin API Routes
**Status:** ✅ Complete — All endpoints verified

---

## Objective

Build full admin API with authentication, ticket/question management, and content gap analytics.

---

## Files Created / Modified

| File | Change |
|---|---|
| `apps/server/src/routes/admin.routes.js` | **Created** — 10 endpoints, ~250 lines |
| `apps/server/src/models/Question.js` | Added `'rejected'` to status enum |
| `apps/server/src/models/Ticket.js` | Added `history` array field |
| `apps/server/src/index.js` | Mounted `adminRouter` at `/api` |
| `docs/sprints/sprint-09-report.md` | **Created** |

---

## Endpoints Implemented

### Auth

**POST /api/admin/login** — Rate-limited (10 attempts/15min per IP)

| Check | Detail |
|---|---|
| Username lookup | case-insensitive |
| Password verify | bcryptjs, salt rounds 12 |
| Error message | Generic "Invalid credentials" (no field leakage) |
| Token | JWT via `signAdminToken()`, 8h expiry (`'8h'`) |
| Response | `{ success: true, token, admin: { username, role } }` |

**All other admin routes** — protected by `verifyAdmin` middleware

---

### Ticket Management

**GET /api/admin/tickets** — paginated, filterable

| Param | Default | Notes |
|---|---|---|
| `status` | — | Filter by status enum |
| `page` | 1 | |
| `limit` | 20, max 100 | |

Returns: `{ tickets: [{ _id, trackingId, submitterEmail, category, status, createdAt, adminNote }], total, page, totalPages }`

---

**PATCH /api/admin/tickets/:id** — update status + notes, append history

- `status`: optional enum (`pending` | `under_review` | `resolved` | `closed`)
- `adminNote`: optional string
- On status change: appends `{ status, changedAt, note }` to `ticket.history`
- Defensive: initialises `history = []` if missing (backwards compat)

---

### Question Moderation

**GET /api/admin/questions/pending** — all `status: 'pending'` sorted by `createdAt desc`

**PATCH /api/admin/questions/:id/approve**
- Sets `status = 'public_community'`
- Optional `tags` array (normalised to lowercase trimmed strings)

**PATCH /api/admin/questions/:id/reject**
- Sets `status = 'rejected'`

---

### Content Gap Analytics (Innovation C)

**GET /api/admin/content-gaps?days=30**

| Sub-report | Logic |
|---|---|
| `zeroResultSearches` | SearchLog where `resultsCount === 0`, last N days, group by query, sort by count desc, limit 50 |
| `poorlyRatedContent` | Questions where `starRating > 0 AND starRating < 3`, sort by rating asc, limit 50 |

---

### Notifications Badge

**GET /api/admin/notifications/count**

Returns: `{ pendingTickets: N, pendingQuestions: N }`

Used by admin portal for header badge counts.

---

## Test Results

All against live server on `http://localhost:3001`:

| Endpoint | Auth | Expected | Actual |
|---|---|---|---|
| POST /admin/login (valid) | ❌ | 200 + token | ✅ 200 + token |
| POST /admin/login (wrong pass) | ❌ | 401 "Invalid credentials" | ✅ 401 "Invalid credentials" |
| GET /admin/tickets (no auth) | — | 401 | ✅ 401 |
| GET /admin/tickets (authed) | ✅ | 200 + paginated list | ✅ 200, total shows |
| PATCH /admin/tickets/:id | ✅ | 200, history appended | ✅ 200, historyLen=1 |
| GET /admin/questions/pending | ✅ | 200, question list | ✅ 200 (0 in seed data) |
| GET /admin/content-gaps | ✅ | 200, both arrays | ✅ 200 |
| GET /admin/notifications/count | ✅ | 200, both counts | ✅ 200 |
| Rate limit (4 bad logins) | ❌ | 401 "Invalid credentials" | ✅ Still 401 (window hasn't expired) |

---

## Bugs Fixed

1. **Question model** — missing `'rejected'` in status enum; added
2. **Ticket model** — missing `history` array field; added with `{ status, changedAt, note }` subdocument
3. **PATCH ticket route** — defensive init of `history = []` for tickets created before field existed

---

## Notes

- `express-rate-limit` already in `package.json` (`^7.4.1`)
- JWT expiry is `'8h'` (not `'7d'` like the seed comment suggests — `7d` is used in `signAdminToken`)
- No logout endpoint needed — JWT is stateless; client discards token
- `verifyAdmin` returns `401` for missing/malformed header, `401` for expired/invalid token, `403` for non-admin role — all consistent with API spec error codes

---

*Previous: sprint-08-report.md (Ticket Routes)*
*Next: Sprint 10 — Admin Portal UI*