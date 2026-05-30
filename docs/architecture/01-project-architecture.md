# Project Architecture

> FAQ Platform · Architecture v1.0 · 2026-05-30

---

## 1. High-Level System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                              │
│   Static Header (always visible)                            │
│   ├── Logo + "FAQ Central Hub" (left)                       │
│   └── Admin Portal Link (right)                             │
│                                                              │
│   Dynamic Workspace (switches between 3 states)             │
│   ├── State 1: Browse & Search FAQs                         │
│   ├── State 2: Submit Ticket + Debounced Duplicate Check    │
│   └── State 3: Ticket Status Tracking                       │
│                                                              │
│   Floating Chatbot Button (corner, sticky → chatbot URL)    │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / REST
┌───────────────────────▼─────────────────────────────────────┐
│                     API GATEWAY / SERVER                     │
│                                                              │
│   Express.js — Middleware Stack:                            │
│   ├── CORS                                                  │
│   ├── Helmet (security headers)                            │
│   ├── Rate Limiter (prevent spam on submissions)           │
│   ├── Validator (input sanitization)                       │
│   └── Auth Middleware (JWT for protected routes)            │
│                                                              │
│   Routes:                                                   │
│   ├── /api/faq          — FAQ CRUD + search                │
│   ├── /api/tickets      — Ticket lifecycle                 │
│   ├── /api/search       — Auto-suggest + zero-result logs  │
│   ├── /api/admin        — Isolated admin operations        │
│   └── /api/diagnostic   — Emergency quiz scoring           │
└───────────────────────┬─────────────────────────────────────┘
                        │ Mongoose ODM
┌───────────────────────▼─────────────────────────────────────┐
│                    DATABASE LAYER (MongoDB)                  │
│                                                              │
│   Collections:                                              │
│   ├── users          — user accounts + roles               │
│   ├── questions      — community Q&A (multi-status)        │
│   ├── tickets        — support tickets + tracking IDs      │
│   ├── comments       — threaded comments on questions      │
│   ├── votes          — upvote tracking (one per user/Q)    │
│   ├── ratings        — answer helpfulness ratings          │
│   ├── searches       — search logs (for content gaps)      │
│   ├── tags           — AI-suggested + admin-assigned tags  │
│   └── notifications  — admin + user notifications          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. System Boundaries & Isolation

### Public-Facing App (`/`)
- Read-only access to Official FAQs and `public_community` questions
- Submit new questions and tickets
- Track ticket status
- Use emergency diagnostic quiz
- Upvote, comment, rate (requires email identification)

### Chatbot Redirect
- Floating chatbot button → external AI chatbot workspace URL
- No chat integration within the FAQ platform itself

### Admin Portal (`/admin`) — Completely Isolated
- Separate auth layer (admin credentials + elevated JWT)
- Cannot be accessed via the same session as public app
- Operates on same API but with `role: admin` permission gate
- Own MongoDB connection with read/write on all collections

---

## 3. Promotion Pipeline State Machine

```
                    ┌──────────────┐
                    │   pending    │ ← initial submission
                    └──────┬───────┘
                           │ admin approves
                           ▼
              ┌────────────────────────┐
              │   public_community     │ ← visible in user-asked stream
              └───────────┬────────────┘
                          │ community engagement
                          │ (upvotes ≥ 15 triggers promotion)
                          ▼
              ┌────────────────────────┐
              │  official_faq (=true)  │ ← visible in Official FAQ section
              └────────────────────────┘

Other transitions:
  public_community → removed_by_admin (admin rejects after approval)
  pending → rejected (admin rejects before approval)
  Any state → deleted (hard delete by admin)
```

---

## 4. Innovation Implementations

### Innovation A — Emergency Diagnostic Quiz
- Single-page React component with 3 wizard steps
- Client-side state machine (no API calls until final submit)
- Final submit → `/api/diagnostic/score` returns action script
- Action script is a structured object (not free text) for consistency

### Innovation B — Debounced Duplicate Detection
- React: `useDeferredValue` or custom debounce hook (300ms)
- On title change → `GET /api/search/similar?title=<string>`
- Backend: MongoDB `$text` search or fuzzy match on `questions.title`
- Frontend renders inline "Is this your issue?" panel if match found
- No ticket created until user confirms "No, mine is different"

### Innovation C — Content Gap Metrics
- Every search: `GET /api/search?q=<query>`
  - If results === 0 → write to `searches` collection with `zeroResults: true`
- Every rating: `POST /api/ratings`
  - If rating ≤ 2 → increment `unhelpfulCount` on the question
- Admin endpoint: `GET /api/admin/content-gaps` aggregates these

---

## 5. Security Model

| Concern | Mitigation |
|---|---|
| Ticket ID enumeration | UUID v4 + short unique code (not sequential) |
| Admin access | Separate admin login, role-based JWT, isolated `/admin` routes |
| Spam / bot submissions | Rate limiter + CAPTCHA (future: hCaptcha integration) |
| XSS in question content | React auto-escapes; DOMPurify on stored content render |
| Rate limiting on duplicate check | 1 req/sec per IP on `/api/search/similar` |
| Auth for public reads | None required (public read is intentional) |
| Auth for writes | Email-based identification (no full account needed for community) |
| Auth for admin | JWT with `role: admin` claim |

---

## 6. Deployment Topology

```
                    ┌─────────────────────┐
                    │  samagama.in        │
                    │  (reverse proxy)    │
                    │                     │
                    │  /internship/faq   │──► FAQ Platform Frontend (React)
                    │  /admin            │──► Admin Portal (React, separate build)
                    └──────────┬──────────┘
                               │ proxied
                    ┌──────────▼──────────┐
                    │    API Server       │
                    │  (Express :3001)    │
                    └──────────┬──────────┘
                               │ Mongoose
                    ┌──────────▼──────────┐
                    │    MongoDB Atlas    │
                    │  (or self-hosted)   │
                    └─────────────────────┘
```

---

## 7. Tech Choices & Rationale

| Component | Choice | Reason |
|---|---|---|
| Routing | TanStack Router v7 | File-based, type-safe, handles complex state transitions cleanly |
| Data fetching | TanStack Query v5 | Auto-caching, background refetch, stale-while-revalidate |
| State | React Context + TanStack Query | No need for Redux — query cache is the state layer |
| CSS | Tailwind CSS | Fast iteration, PRD specifies no heavy UI — utility classes are perfect |
| PDF/media storage | Cloudinary or S3-compatible | Store GIF/video answer enrichments; serve via CDN |
| Auth (admin) | JWT + httpOnly cookie | Standard, avoids localStorage XSS risk |
| Search | MongoDB `$regex` + `$text` index | No Elasticsearch needed at this scale |
| Unique IDs | `nanoid` for ticket tracking codes | Short, URL-safe, collision-resistant |
| Validation | Zod | Shared schemas between frontend and backend |

---

## 8. File Naming Conventions

- Components: `PascalCase.tsx` (e.g., `EmergencyQuiz.tsx`)
- Utilities/hooks: `camelCase.ts` (e.g., `useDebounce.ts`)
- API route files: `kebab-case.ts` (e.g., `ticket-routes.ts`)
- Mongoose schemas: `PascalCase.schema.ts` (e.g., `Question.schema.ts`)
- CSS/Tailwind: co-located with component, e.g., `EmergencyQuiz.css` or Tailwind `@apply`

---

*Next: See `02-folder-structure.md` for the full directory tree.*