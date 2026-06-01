# API Endpoint Specification

> FAQ Platform · Architecture v1.0 · 2026-05-30

**Base URL:** `/api`
**Server Port:** `3001`
**Auth:** JWT for admin routes; email identification for community actions
**Response Format:** Consistent JSON envelope

```json
// Success response
{ "success": true, "data": { ...payload } }

// Error response
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable" } }

// Paginated response
{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 142 } }
```

---

## 1. Public Endpoints (No Auth Required)

### 1.1 FAQ Browsing & Search

#### `GET /api/faq`
Fetch paginated questions with optional filters.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `official_faq \| public_community \| all` | `official_faq` | Question visibility filter |
| `category` | string | all | Category chip filter |
| `sort` | `newest \| top \| trending` | `newest` | Sort order |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 50) |
| `q` | string | — | Full-text search query |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc...",
      "title": "How do I reset my test password?",
      "body": "Go to settings > security...",
      "category": "test-assessment",
      "status": "official_faq",
      "isOfficialFAQ": true,
      "upvoteCount": 42,
      "commentCount": 3,
      "avgRating": 4.5,
      "media": [{ "type": "gif", "url": "https://...", "caption": "Reset walkthrough" }],
      "tags": ["password", "test", "reset"],
      "createdAt": "2026-05-01T...",
      "updatedAt": "2026-05-15T..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 47 }
}
```

---

#### `GET /api/faq/:id`
Get single question with full details.

**Response:** Single question object including `comments` array (top-level only).

---

#### `GET /api/faq/trending/daily`
Get the most-upvoted `public_community` question in the last 24 hours.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "64abc...",
    "title": "...",
    "upvoteCount": 28,
    "category": "test-assessment"
  }
}
```

---

### 1.2 Ticket Submission & Tracking

#### `POST /api/tickets`
Submit a new support ticket.

**Request Body:**
```json
{
  "email": "student@example.com",
  "category": "test-assessment",
  "title": "Test link not working after deadline extension",
  "description": "I was given a 24h extension but the link still shows expired..."
}
```

**Validation (Zod):**
- `email`: valid email format
- `category`: enum of categories
- `title`: 10–300 chars
- `description`: 20–5000 chars

**Response:**
```json
{
  "success": true,
  "data": {
    "trackingCode": "FAQ-X7K9M2LP",
    "status": "open",
    "createdAt": "2026-05-30T12:00:00Z"
  }
}
```

---

#### `GET /api/tickets/:trackingCode`
Track ticket status.

**Response:**
```json
{
  "success": true,
  "data": {
    "trackingCode": "FAQ-X7K9M2LP",
    "status": "in_review",
    "category": "test-assessment",
    "title": "Test link not working...",
    "resolutionNote": null,
    "statusHistory": [
      { "status": "open", "updatedAt": "2026-05-30T12:00:00Z" },
      { "status": "in_review", "updatedAt": "2026-05-30T14:30:00Z", "note": "Escalated to technical team" }
    ],
    "createdAt": "2026-05-30T12:00:00Z",
    "updatedAt": "2026-05-30T14:30:00Z"
  }
}
```

---

### 1.3 Search & Discovery

#### `GET /api/search/similar`
Debounced duplicate detection — called as user types ticket title.

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Partial title to match |
| `category` | string | no | Optional category filter |

**Rate Limit:** 1 req/sec per IP

**Response:**
```json
{
  "success": true,
  "data": {
    "hasMatch": true,
    "matches": [
      {
        "_id": "64abc...",
        "title": "Test link not working after deadline",
        "category": "test-assessment",
        "isOfficialFAQ": true,
        "status": "official_faq",
        "similarity": 0.87
      }
    ]
  }
}
```
> Note: Returns empty `matches` array if no similar question found. `hasMatch` flag lets frontend know whether to show the "Is this your issue?" panel.

---

#### `GET /api/search/suggest`
Auto-suggest dropdown — searches question titles for prediction dropdown.

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Search query |
| `limit` | number | no | Max results (default 5) |

**Response:**
```json
{
  "success": true,
  "data": [
    { "_id": "64abc...", "title": "How to upload resume?", "category": "application-profile" },
    { "_id": "64abd...", "title": "How to update profile photo?", "category": "application-profile" }
  ]
}
```

---

### 1.4 Community Engagement

#### `POST /api/community/upvote`
Upvote a community question.

**Request Body:**
```json
{
  "questionId": "64abc...",
  "email": "student@example.com"
}
```

**Behavior:**
- If `email` maps to a registered `User`, associate with `userId`
- Creates or updates `Vote` document
- Increments `question.upvoteCount`
- Checks promotion threshold → auto-promotes if ≥ 15 upvotes and `status === 'public_community'`

**Response:**
```json
{
  "success": true,
  "data": { "upvoteCount": 16, "promoted": true }
}
```

---

#### `POST /api/community/comment`
Add a comment to a question.

**Request Body:**
```json
{
  "questionId": "64abc...",
  "email": "student@example.com",
  "displayName": "Rohit K",
  "body": "I faced the same issue and the fix worked!",
  "parentCommentId": null
}
```

**Response:** Created comment object.

---

#### `POST /api/community/rate`
Rate a question's helpfulness (1–5 stars).

**Request Body:**
```json
{
  "questionId": "64abc...",
  "email": "student@example.com",
  "stars": 4
}
```

**Behavior:**
- Creates or updates `Rating`
- If `stars ≤ 2`, increments `question.unhelpfulCount`
- Recalculates `question.avgRating`

**Response:**
```json
{
  "success": true,
  "data": { "avgRating": 4.2, "ratingCount": 27 }
}
```

---

### 1.5 Emergency Diagnostic

#### `POST /api/diagnostic/score`
Score a completed 3-step emergency quiz and return an action script.

**Request Body:**
```json
{
  "answers": {
    "focusArea": "selection-process",
    "phase": "in-progress",
    "urgency": "just-now"
  },
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "actionScript": {
      "priority": "URGENT",
      "title": "Technical Error: Selection Process — In Progress",
      "steps": [
        {
          "action": "CONTACT_SUPPORT",
          "message": "Your test link issue requires immediate attention. Raise a support ticket with your registered email and test session ID.",
          "contactEmail": "support@yourplatform.com",
          "subject": "URGENT: Test Link Not Working [In Progress]"
        },
        {
          "action": "REFERENCE",
          "title": "Related FAQ",
          "questionId": "64abc..."
        }
      ],
      "expectedResponse": "Within 2 working hours during business days",
      "alternativeChannels": [
        "Raise a ticket: FAQ-X7K9M2LP",
        "Check status at your-domain.com/faq/track — State 3"
      ]
    }
  }
}
```

---

## 2. Admin-Protected Endpoints (`/api/admin/*`)

**All admin routes require:**
- `Authorization: Bearer <admin-jwt-token>` header
- JWT must contain `role: admin`

### 2.1 Admin Auth

#### `POST /api/admin/auth/login`
Admin login.

**Request Body:**
```json
{ "email": "admin@yourplatform.com", "password": "..." }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "admin": { "_id": "...", "email": "admin@yourplatform.com", "displayName": "Admin" }
  }
}
```
> Token expires in 7 days. Stored in httpOnly cookie OR returned for client storage.

---

### 2.2 Question Management

#### `GET /api/admin/questions`
Get all questions (all statuses, for admin review).

**Query Parameters:** Same as `GET /api/faq` + `status=pending` filter default.

---

#### `PATCH /api/admin/questions/:id/approve`
Admin approves a pending question → transitions to `public_community`.

**Response:**
```json
{
  "success": true,
  "data": { "_id": "64abc...", "status": "public_community" }
}
```

---

#### `PATCH /api/admin/questions/:id/reject`
Admin rejects a pending question.

**Request Body:**
```json
{ "reason": "Duplicate of existing question #64xyz" }
```

---

#### `PATCH /api/admin/questions/:id/promote`
Manually force-promote a question to `official_faq` (bypassing auto-promotion).

---

#### `GET /api/admin/questions/:id/tags/suggest`
Get AI-suggested tags for a question (called during admin review).

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": ["password-reset", "test-access", "technical-issue"]
  }
}
```

> **AI tag suggestion:** Calls Notebook LLM API with question `title + body`, asks for 3–5 relevant tags. Results cached in `tags` collection.

---

### 2.3 Ticket Management

#### `GET /api/admin/tickets`
List all tickets with filters (`status`, `category`, `assignedTo`).

---

#### `PATCH /api/admin/tickets/:id`
Update ticket status, assign, or add resolution note.

**Request Body:**
```json
{
  "status": "in_review",
  "assignedTo": "64admin...",
  "note": "Escalated to technical team"
}
```

**Behavior:**
- Appends to `statusHistory`
- If `status === 'resolved'` → triggers notification to ticket email

---

### 2.4 Content Gap (Innovation C)

#### `GET /api/admin/content-gaps`
Get aggregated content gap data for admin dashboard.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `period` | `24h \| 7d \| 30d` | `7d` | Lookback window |
| `limit` | number | `20` | Max results |

**Response:**
```json
{
  "success": true,
  "data": {
    "zeroResultQueries": [
      { "query": "github classroom invite", "count": 14 },
      { "query": "certificate format", "count": 9 }
    ],
    "highUnhelpfulQuestions": [
      {
        "_id": "64abc...",
        "title": "How to join GitHub organization?",
        "unhelpfulCount": 7,
        "ratingCount": 12,
        "ratio": 0.58
      }
    ]
  }
}
```

---

### 2.5 Settings

#### `GET /api/admin/settings`
Get configurable platform settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "upvoteThreshold": 15,
    "requireEmailVerification": false,
    "allowAnonCommunityPosts": true,
    "autoPromoteEnabled": true,
    "searchDebounceMs": 300
  }
}
```

---

#### `PATCH /api/admin/settings`
Update platform settings.

**Request Body:** Partial update of settings object above.

---

### 2.6 Admin Notifications

#### `GET /api/admin/notifications`
Get admin notifications (unread first, paginated).

---

#### `PATCH /api/admin/notifications/:id/read`
Mark notification as read.

---

## 3. Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/query failed Zod validation |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Valid token but insufficient role |
| `DUPLICATE_VOTE` | 409 | User already upvoted this question |
| `DUPLICATE_RATING` | 409 | User already rated this question |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 4. Rate Limits

| Endpoint Pattern | Limit | Window |
|---|---|---|
| `POST /api/tickets` | 5 req | 1 hour per IP |
| `GET /api/search/similar` | 1 req | 1 second per IP |
| `POST /api/community/upvote` | 30 req | 1 hour per email |
| `POST /api/community/comment` | 10 req | 1 hour per email |
| `POST /api/community/rate` | 20 req | 1 hour per email |
| Admin routes | 100 req | 1 minute per admin token |

---

*Previous: `03-database-schema.md`*