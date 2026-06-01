# Samagama Crowdsourced FAQ Platform

> A MERN-stack crowdsourced FAQ platform for internship support, featuring a 2-tier FAQ system, AI-driven content gap analysis, and an emergency diagnostic tool.

---

## 🎯 Overview

The **Samagama Crowdsourced FAQ Platform** enables internship candidates to browse curated official FAQs and community-asked questions, submit unique support tickets, and track resolution status — all in one place. Admins manage content quality through a dedicated portal with moderation queues and content gap analytics.

**Live URL:** `samagama.in/internship/faq`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend (Public)** | React 18 + TypeScript, Vite, TailwindCSS, TanStack Router v7, TanStack Query v5, Axios |
| **Frontend (Admin)** | React 18 + TypeScript, Vite, TanStack Router v1 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB 8.x |
| **Authentication** | JWT (admin), session IDs (public upvoting) |

---

## ✨ Features

### Public App (`samagama.in/internship/faq`)

- [x] **3-Stage Navigation:** Browse → Submit → Track
- [x] **2-Tier FAQ System:** Official FAQs (curated) + Community Questions (user-submitted)
- [x] **Auto-Promotion Pipeline:** Community questions with ≥15 upvotes automatically elevate to Official status
- [x] **Innovation A — 3-Step Emergency Diagnostic Quiz:** Interactive wizard for urgent internship issues (focus area → phase → urgency → priority recommendation)
- [x] **Innovation B — Debounced Duplicate Submission Blocker:** Real-time similarity search before ticket submission, suggesting existing answers
- [x] **Debounced Search:** 300ms debounce on search queries with MongoDB text index
- [x] **Category Filtering:** Filter by Application Setup, Test & Coding Assessment, Stipend & Offer Letters, Internship Tasks
- [x] **Upvoting + Star Ratings:** Authenticated via localStorage session ID
- [x] **Ticket Tracking:** Nanoid-based tracking IDs (`TKT-2026-XXXXXXXX`)

### Admin Portal (`samagama.in/internship/faq/admin`)

- [x] **JWT Authentication** with rate-limited login (10 attempts / 15 min per IP)
- [x] **Ticket Management:** Filter by status (All/Pending/Under Review/Resolved/Closed), update status + admin notes with history tracking
- [x] **Question Moderation:** Approve → `public_community`, Reject → `rejected`; optional tags on approval
- [x] **Innovation C — Content Gap Metrics Matrix:** Zero-result search term aggregation + poorly-rated question identification across 7/30/90-day windows
- [x] **Notification Badges:** Real-time pending counts polled every 30 seconds

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB 8.x (local or Atlas)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/vicharanashala/cs23
cd cs23
```

### 2. Configure Environment Variables

```bash
# In apps/server/
cp .env.example .env
# Edit .env and set MONGODB_URI (e.g. mongodb://localhost:27017/faq-platform)
```

**Required variables in `apps/server/.env`:**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/faq-platform` |
| `JWT_SECRET` | Secret for admin JWT signing | (set your own) |
| `CLIENT_URL` | CORS origin (public frontend URL) | `http://localhost:5173` |
| `ADMIN_URL` | Admin portal URL | `http://localhost:5174` |

### 3. Install Dependencies

```bash
npm install
```

### 4. Seed the Database

```bash
cd apps/server
npm run seed
cd ..
```

This seeds:
- **8 Official FAQs** (covering stipend, onboarding, coding test, VSC setup, etc.)
- **6 Community Questions** in various states
- **1 Admin account:** `admin` / `admin123`

### 5. Start Development Servers

```bash
# Start server (port 3001) + public web (port 5173) concurrently
npm run dev

# Or start all 3 apps: server + web + admin portal
npm run dev:all
```

| App | URL |
|-----|-----|
| Public Frontend | http://localhost:5173 |
| Admin Portal | http://localhost:5174 |
| API Server | http://localhost:3001 |
| Health Check | http://localhost:3001/api/health |

### Admin Portal Login

- **URL:** http://localhost:5174
- **Username:** `admin`
- **Password:** `admin123`

---

## 📐 Architecture Overview

Full architecture documentation is available in `docs/architecture/`:

| Document | Contents |
|----------|----------|
| `01-project-architecture.md` | System overview, security model, deployment, tech choices |
| `02-folder-structure.md` | Full monorepo directory tree |
| `03-database-schema.md` | 9 MongoDB collections with field definitions and indexes |
| `04-api-endpoints.md` | All 20+ API endpoints with request/response shapes |

---

## 📸 Screenshots

Screenshots coming soon.

---

## 📁 Project Structure

```
cs23/
├── apps/
│   ├── server/          # Express API server (port 3001)
│   │   └── src/
│   │       ├── config/      # env.js, db.js
│   │       ├── middleware/  # auth.js, errorHandler.js, logger.js, validate.js
│   │       ├── models/      # Question, Ticket, Rating, SearchLog, Admin
│   │       ├── routes/      # faq.routes.js, ticket.routes.js, admin.routes.js
│   │       ├── scripts/     # seed.js
│   │       └── utils/       # ApiError.js
│   ├── web/             # Public React app (port 5173)
│   │   └── src/
│   │       ├── components/  # ui/ (Button, Input, Badge, Card, Spinner, Accordion)
│   │       ├── hooks/       # useDebounce.ts
│   │       ├── layouts/     # AppShell.tsx
│   │       ├── lib/         # api.ts (Axios)
│   │       ├── pages/       # MainDashboard, BrowseSearch, SubmitTicket, TicketTracking
│   │       └── router/      # TanStack Router
│   └── admin/            # Admin React app (port 5174)
│       └── src/
│           ├── components/  # AdminShell.tsx
│           ├── hooks/       # useAdminAuth.ts
│           ├── lib/         # api.ts
│           ├── pages/       # AdminLogin, AdminDashboard, TicketQueue, QuestionQueue, ContentGaps
│           └── router/      # TanStack Router
├── docs/
│   ├── architecture/    # 01–04 architecture documents
│   └── sprints/         # Sprint reports (sprint-07 through sprint-18)
└── package.json         # Root scripts: dev, dev:all, build, seed
```

---

## 🔒 Security Notes

- Admin passwords hashed with **bcryptjs** (12 salt rounds)
- JWT tokens for admin auth (8h expiry)
- Rate limiting on login route: **10 attempts / 15 min per IP**
- CORS restricted to configured `CLIENT_URL` and `ADMIN_URL`
- Admin routes protected by `verifyAdmin` middleware on all 8 endpoints
- No secrets in source code — all from environment variables