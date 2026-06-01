# API Documentation — Samagama FAQ Platform

**Base URL:** `http://localhost:3001/api`  
**Content-Type:** `application/json`

---

## Public Endpoints

### FAQ Browsing

#### `GET /faqs`
List official FAQs and community questions with optional filters.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `official` \| `community` | — | Filter by FAQ tier |
| `category` | string | — | Filter by category (exact match) |
| `search` | string (min 3 chars) | — | Full-text search on title + description |
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Results per page (max 100) |

**Response `200`:**
```json
{
  "faqs": [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "body": "string",
      "category": "string",
      "status": "official_faq | public_community | pending | rejected",
      "upvotes": 0,
      "starRating": 4.2,
      "ratingCount": 10,
      "isOfficialFAQ": true,
      "upvotedBy": ["sessionId"],
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ],
  "total": 14,
  "page": 1,
  "totalPages": 1
}
```

---

#### `GET /faqs/trending`
Returns the most-upvoted active question in the last 24 hours.

**Response `200`:**
```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "category": "string",
  "upvotes": 42
}
```

---

#### `GET /faqs/search/similar`
Find similar questions by title prefix (used by the duplicate blocker).

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Question title to match against (min 3 chars) |

**Response `200`:**
```json
{
  "results": [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "status": "official_faq | public_community",
      "upvotes": 8
    }
  ]
}
```

---

#### `GET /faqs/:id`
Get a single FAQ question by its MongoDB `_id`.

**Response `200`:**
```json
{
  "faq": {
    "_id": "string",
    "title": "string",
    "description": "string",
    "body": "string",
    "category": "string",
    "status": "official_faq",
    "upvotes": 12,
    "starRating": 4.5,
    "ratingCount": 8,
    "isOfficialFAQ": true,
    "upvotedBy": [],
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Response `404`:**
```json
{ "message": "Question not found" }
```

---

#### `POST /faqs/:id/upvote`
Upvote a community question (session-based, one vote per session).

**Request Body:**
```json
{ "sessionId": "string" }
```

**Response `200`:**
```json
{
  "success": true,
  "upvotes": 16,
  "promoted": false
}
```

**Response `409`** — Already upvoted by this session:
```json
{ "success": false, "message": "Already upvoted" }
```

> **Auto-promotion:** When upvotes reach 15 and status is `public_community`, the question is automatically promoted to `official_faq`. The `promoted` field in the response will be `true`.

---

#### `POST /faqs/:id/rate`
Rate a question with 1–5 stars (upsert — one rating per session).

**Request Body:**
```json
{ "sessionId": "string", "stars": 4 }
```

**Response `200`:**
```json
{
  "success": true,
  "starRating": 4.2,
  "ratingCount": 11
}
```

**Response `400`** — Invalid star value:
```json
{ "success": false, "message": "Stars must be 1–5" }
```

---

### Ticket Submission

#### `POST /tickets`
Submit a unique support ticket. Validated with Zod.

**Request Body:**
```json
{
  "email": "user@example.com",
  "category": "Application Setup | Test & Coding Assessment | Stipend & Offer Letters | Internship Tasks",
  "description": "string (min 20 characters)"
}
```

**Response `201`:**
```json
{
  "success": true,
  "trackingId": "TKT-2026-A1B2C3D4"
}
```

**Response `400`** — Validation error:
```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Please enter a valid email address" },
    { "field": "description", "message": "Description must be at least 20 characters" }
  ]
}
```

---

#### `GET /tickets/:trackingId`
Look up a ticket by its tracking ID.

**Response `200`:**
```json
{
  "ticket": {
    "_id": "string",
    "trackingId": "TKT-2026-A1B2C3D4",
    "email": "user@example.com",
    "category": "Application Setup",
    "description": "Full description text...",
    "status": "pending | under_review | resolved | closed",
    "adminNote": "string | null",
    "history": [
      {
        "status": "under_review",
        "changedAt": "ISO8601",
        "note": "Looking into this"
      }
    ],
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

**Response `404`:**
```json
{ "message": "Ticket not found" }
```

---

### Health Check

#### `GET /health`
Server health check — no authentication required.

**Response `200`:**
```json
{
  "status": "ok",
  "dbState": 1
}
```

---

## Admin Endpoints

> All admin endpoints require `Authorization: Bearer <JWT>` header unless noted.

---

#### `POST /api/admin/login`
Authenticate an admin and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "username": "admin",
    "role": "admin"
  }
}
```

**Response `401`:**
```json
{ "success": false, "message": "Invalid credentials" }
```

> ⚠️ **Rate limited:** 10 attempts per 15-minute window per IP.

---

#### `GET /api/admin/tickets`
List all tickets with optional status filter (paginated).

**Auth:** `Bearer <JWT>` (required)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `pending` \| `under_review` \| `resolved` \| `closed` | — | Filter by status |
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Results per page (max 100) |

**Response `200`:**
```json
{
  "tickets": [
    {
      "_id": "string",
      "trackingId": "TKT-2026-A1B2C3D4",
      "submitterEmail": "user@example.com",
      "category": "Application Setup",
      "status": "pending",
      "createdAt": "ISO8601",
      "adminNote": null
    }
  ],
  "total": 12,
  "page": 1,
  "totalPages": 1
}
```

---

#### `PATCH /api/admin/tickets/:id`
Update a ticket's status and/or add an admin note (appends to history).

**Auth:** `Bearer <JWT>` (required)

**Request Body:**
```json
{
  "status": "under_review | resolved | closed",
  "adminNote": "Optional note visible to the user"
}
```

**Response `200`:**
```json
{
  "success": true,
  "ticket": {
    "_id": "string",
    "trackingId": "TKT-2026-A1B2C3D4",
    "status": "under_review",
    "adminNote": "Looking into this",
    "history": [
      { "status": "under_review", "changedAt": "ISO8601", "note": "Looking into this" }
    ]
  }
}
```

---

#### `GET /api/admin/questions/pending`
List community questions in `pending` status awaiting moderation.

**Auth:** `Bearer <JWT>` (required)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Results per page |

**Response `200`:**
```json
{
  "questions": [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "category": "Application Setup",
      "status": "pending",
      "upvotes": 5,
      "starRating": 0,
      "createdAt": "ISO8601"
    }
  ],
  "total": 3,
  "page": 1,
  "totalPages": 1
}
```

---

#### `PATCH /api/admin/questions/:id/approve`
Approve a pending community question, optionally adding tags.

**Auth:** `Bearer <JWT>` (required)

**Request Body:**
```json
{
  "tags": ["stipend", "onboarding"]
}
```

**Response `200`:**
```json
{
  "success": true,
  "question": {
    "_id": "string",
    "status": "public_community",
    "tags": ["stipend", "onboarding"]
  }
}
```

---

#### `PATCH /api/admin/questions/:id/reject`
Reject a pending community question (sets status to `rejected`).

**Auth:** `Bearer <JWT>` (required)

**Response `200`:**
```json
{
  "success": true,
  "question": {
    "_id": "string",
    "status": "rejected"
  }
}
```

---

#### `GET /api/admin/content-gaps`
Retrieve content gap analytics — zero-result searches and poorly rated questions.

**Auth:** `Bearer <JWT>` (required)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | `7` \| `30` \| `90` | `30` | Analysis window |

**Response `200`:**
```json
{
  "gaps": [
    {
      "type": "zero_results",
      "searchTerm": "visa processing",
      "count": 47
    },
    {
      "type": "poor_rating",
      "question": {
        "_id": "string",
        "title": "How does stipend work?",
        "status": "official_faq",
        "starRating": 2.1
      }
    }
  ],
  "total": 12
}
```

---

#### `GET /api/admin/notifications/count`
Get real-time counts of pending tickets and questions for admin badge display.

**Auth:** `Bearer <JWT>` (required)

**Response `200`:**
```json
{
  "pendingTickets": 2,
  "pendingQuestions": 3
}
```

---

## Status Reference

| Status | Context | Description |
|--------|---------|-------------|
| `official_faq` | Question | Curated, publicly visible official FAQ |
| `public_community` | Question | Approved community question (not yet promoted) |
| `pending` | Question / Ticket | Awaiting admin review |
| `rejected` | Question | Rejected by admin — not visible publicly |
| `under_review` | Ticket | Admin is actively looking into it |
| `resolved` | Ticket | Issue resolved |
| `closed` | Ticket | Ticket closed |

---

## Error Response Format

All error responses follow this shape:

```json
{
  "success": false,
  "message": "Human-readable error description"
}
```

For validation errors (400):

```json
{
  "success": false,
  "errors": [
    { "field": "fieldName", "message": "Validation error message" }
  ]
}
```