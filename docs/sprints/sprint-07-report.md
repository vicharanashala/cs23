# Sprint 07 Report — FAQ Routes (patch-07)

**Date:** 2026-06-01
**Sprint:** FAQ API Routes
**Status:** ✅ Complete — All 6 endpoints verified

---

## Objective

Implement 6 FAQ read/write API endpoints in `apps/server/src/routes/faq.routes.js` and verify them against live data.

---

## Endpoints Implemented

### 1. `GET /api/faqs`
Paginated FAQ listing with optional filters.

| Feature | Detail |
|---|---|
| `category` | Filter by category string |
| `search` | MongoDB `$text` search on title+description (≥3 chars) |
| `type` | `official` → `official_faq`, `community` → `public_community`, `all` → no filter |
| `page` / `limit` | Pagination, defaults 1 and 20 |
| Logging | Writes to `SearchLog` if search term ≥3 chars and has results |
| Sorting | Text score when searching, `createdAt desc` otherwise |

**Verified response shape:**
```json
{ "faqs": [...], "total": 14, "page": 1, "totalPages": 7 }
```

---

### 2. `GET /api/faqs/trending`
Most-upvoted public question in last 24 hours.

| Feature | Detail |
|---|---|
| Filter | `status: { $in: ['public_community', 'official_faq'] }`, `createdAt >= 24h ago` |
| Fallback | Returns all-time most-upvoted if no recent activity |
| Returns | Single question object (or null) |

**Verified:** Returned question with 17 upvotes (`official_faq`, Test portal session issue).

---

### 3. `GET /api/faqs/search/similar`
Used by frontend duplicate blocker (Innovation B).

| Feature | Detail |
|---|---|
| `title` param | Minimum 3 chars — returns `{ results: [] }` if shorter |
| Search | MongoDB `$text` on title field |
| Limit | Top 3 matches |
| Projection | `_id, title, status, upvotes` only |

**Verified:** `?title=password` returned 1 match with `score: 1.14`.

---

### 4. `GET /api/faqs/:id`
Single FAQ by `_id`, returns all fields.

| Feature | Detail |
|---|---|
| Not found | Throws `ApiError(404)` |

**Verified:** Returned full question object including `upvotedBy` array, `starRating`, etc.

---

### 5. `POST /api/faqs/:id/upvote`
Session-scoped upvote with auto-promotion.

| Feature | Detail |
|---|---|
| `sessionId` | Required in body |
| Duplicate guard | Returns `409 Already upvoted` if sessionId already in `upvotedBy` |
| Auto-promotion | If upvotes ≥ 15 AND status === `public_community` → sets `status = official_faq`, `isOfficialFAQ = true` |
| Returns | `{ upvotes: <new count>, promoted: <boolean> }` |

**Verified:**
- Upvote: `200 { upvotes: 19, promoted: false }`
- Duplicate: `409 { success: false, message: "Already upvoted" }`

---

### 6. `POST /api/faqs/:id/rate`
1–5 star rating with upsert and aggregate recalculation.

| Feature | Detail |
|---|---|
| `sessionId` | Required |
| `stars` | Must be integer 1–5; throws `400` otherwise |
| Upsert | One rating per question per session (compound unique index on Rating model) |
| Recalculation | Aggregates all ratings for this question → updates `starRating` (avg) and `ratingCount` on Question |
| Returns | `{ starRating: <avg>, ratingCount: <count> }` |

**Verified:** `{ starRating: 4, ratingCount: 2 }` after rating 5 stars.

---

## Files Modified / Created

| File | Change |
|---|---|
| `apps/server/src/routes/faq.routes.js` | **Created** — all 6 endpoints |
| `apps/server/src/routes/health.js` | Pre-existing |
| `apps/server/src/index.js` | `faqRouter` already mounted at `/api` |

No existing files were modified — `faq.routes.js` was net-new.

---

## Test Summary

All 6 endpoints tested against seeded data (14 questions):

| Endpoint | Method | Status | Notes |
|---|---|---|---|
| `/api/faqs?type=all&limit=2` | GET | 200 ✅ | Paginated, correct shape |
| `/api/faqs/trending` | GET | 200 ✅ | Returned most-upvoted in 24h window |
| `/api/faqs/search/similar?title=password` | GET | 200 ✅ | Text search, 1 result |
| `/api/faqs/:id` | GET | 200 ✅ | Full question object |
| `/api/faqs/:id/upvote` (fresh session) | POST | 200 ✅ | `{ upvotes: 19, promoted: false }` |
| `/api/faqs/:id/upvote` (duplicate) | POST | 409 ✅ | `"Already upvoted"` |
| `/api/faqs/:id/rate` | POST | 200 ✅ | `{ starRating: 4, ratingCount: 2 }` |

---

## Notes

- Server runs on `http://localhost:3001`
- `SearchLog` collection has 30-day TTL index — zero-result queries tracked for Innovation C (Content Gap Matrix)
- Auto-promotion threshold is 15 upvotes — verified functional
- The Question model has a compound text index on `title` and `description` which powers both `search` (full listing) and `similar` (title-only) queries

---

*Previous: sprint-06-report.md (Seed Script)*