# Sprint 08 Report — Ticket Routes + Auth Middleware

**Date:** 2026-06-01
**Sprint:** Ticket Submission & Tracking Routes
**Status:** ✅ Complete — All endpoints verified

---

## Objective

Build ticket submission and tracking endpoints, and verify the existing admin auth middleware.

---

## Files Created

### `apps/server/src/routes/ticket.routes.js`

**POST /api/tickets** — Submit a support ticket

| Field | Validation |
|---|---|
| `email` | Zod `.email()` format |
| `category` | Must be one of 4 enum values |
| `description` | Minimum 20 characters |

On validation failure → `400 { success: false, errors: [{ field, message }] }`

Tracking ID generated via `nanoid(8).toUpperCase()`: `TKT-2026-A3X9B2QR`

Saved with `status: 'pending'` and `history: [{ status: 'pending', changedAt, note: 'Submitted' }]`

Returns `201 { success: true, trackingId, message: '...' }`

---

**GET /api/tickets/:trackingId** — Lookup by `trackingId` field

Returns: `{ trackingId, subject (first 60 chars of description), status, category, description, adminNote, history, createdAt, updatedAt }`

Not found → `404 { success: false, message: 'Ticket not found' }`

---

### `apps/server/src/middleware/auth.js`

Already existed and fully implemented:

- **`verifyAdmin(req, res, next)`** — reads `Authorization: Bearer <token>`, verifies JWT against `JWT_SECRET`, returns `401` on invalid/expired, `403` if not admin role, attaches `req.admin` on success
- **`signAdminToken(admin)`** — creates 7-day expiry JWT for admin login routes

---

### `apps/server/src/index.js`

Added `ticketRouter` import and mounted at `/api`.

---

## Test Results

All tests against live server on `http://localhost:3001`:

| Test | Method | Status | Expected | Result |
|---|---|---|---|---|
| Valid ticket submission | POST | 201 ✅ | `TKT-2026-*` returned | `TKT-2026-_ONMX8HH` |
| Bad email | POST | 400 ✅ | Field error | `Invalid email address` |
| Bad category | POST | 400 ✅ | Field error | Shows 4 valid categories |
| Description too short | POST | 400 ✅ | Field error | `Description must be at least 20 characters` |
| Get ticket by trackingId | GET | 200 ✅ | Full ticket object | `subject`, `status: 'pending'`, `history` |
| Unknown trackingId | GET | 404 ✅ | Not found message | `Ticket not found` |

---

## Notes

- `nanoid` is already in `package.json` dependencies (`^3.3.7`)
- Ticket `history` array uses `changedAt` (not `updatedAt`) to track each status transition timestamp
- `auth.js` was already complete — `verifyAdmin` and `signAdminToken` ready to use for admin routes

---

*Previous: sprint-07-report.md (FAQ Routes)*
*Next: Sprint 09 — Admin Auth Routes (login, logout, me)*