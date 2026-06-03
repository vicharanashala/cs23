# CrowdFAQ — Samagama Internship FAQ Platform

> **Version 1.0** — A MERN-stack knowledge base for the Samagama Internship program at Vicharanashala Lab, IIT Ropar.

**Live:** `https://samagama.in` (FAQ section)

---

## 🤔 What Is This?

The **Samagama Internship FAQ Platform** helps prospective and current interns find answers instantly — without waiting for an email reply.

It combines:
- A **searchable, browsable FAQ knowledge base** with 142 real questions scraped from the program website
- A **Keyword + AI hybrid search** — type naturally, get precise answers
- A **community Q&A layer** — users can upvote, rate, and submit new questions
- An **AI chatbot** that answers internship questions 24/7
- A **ticket submission + tracking system** for questions that don't have answers yet
- A full **admin moderation portal** to keep content fresh and accurate

---

## ✨ Features

### For Interns & Applicants

| Feature | Description |
|---------|-------------|
| **🔍 Dual-Mode Search** | 🔤 **Keyword Search** — fast ranked results by relevance. 🤖 **AI Search** — reads the full knowledge base and gives a direct answer with source citations. |
| **💬 AI Chatbot** | Floating chat button on every page. Handles both casual chat (hi/hello) and RAG-powered FAQ answers from 142 Samagama FAQs. |
| **📋 Browse FAQs** | Two-panel layout: Official FAQs (curated by admins) + Community Questions (submitted by users). Filter by category. |
| **📝 Submit Questions** | Submit a support ticket if you can't find an answer. Duplicate detection suggests existing answers before you create a ticket. |
| **🔔 Track Tickets** | Get a tracking ID on submission. Check resolution status, admin notes, and timeline at any time. |
| **🔥 Trending** | The most-upvoted question surfaces on the dashboard. |

### For Admins

| Feature | Description |
|---------|-------------|
| **🔐 JWT-Secured Portal** | Separate admin app at port 5174. Rate-limited login (10 attempts / 15 min per IP). |
| **🎫 Ticket Queue** | Filter by status (All / Pending / Under Review / Resolved / Closed). Add internal notes. Track resolution history. |
| **✅ Question Moderation** | Approve community questions (promote to `public_community`) or reject. Tag on approval. |
| **📊 Content Gap Matrix** | See what people searched for but found no answer for — over 7/30/90 day windows. |
| **🔔 Notification Badges** | Red badges on nav items show pending tickets + questions count, updated every 30s. |

---

## 🧱 Architecture

```
apps/
├── server/           Express API  —  port 3001
│   └── src/
│       ├── config/       # Zod env validation, MongoDB connection
│       ├── middleware/   # JWT auth, error handler, logger, rate limiter
│       ├── models/       # Question, Ticket, Rating, SearchLog, Admin
│       ├── routes/       # FAQ CRUD, ticket, admin, chat, search
│       └── utils/        # ApiError, TF-IDF categorizer
│
├── web/              Public React app  —  port 5173
│   └── src/
│       ├── components/   # ChatBot (RAG), UI library (Button, Input, Badge...)
│       ├── pages/        # MainDashboard, BrowseSearch (dual search), SubmitTicket, TicketTracking
│       ├── layouts/      # AppShell (sticky header + floating chatbot)
│       ├── lib/          # Axios client
│       └── router/       # TanStack Router v7
│
└── admin/             Admin React app  —  port 5174
    └── src/
        ├── components/   # AdminShell (sidebar + notification polling)
        ├── pages/        # Login, Dashboard, TicketQueue, QuestionQueue, ContentGaps
        ├── hooks/        # useAdminAuth
        └── router/       # TanStack Router v1

samagama-rag-chatbot/    Python RAG pipeline  —  port 8000
    ├── rag_api.py           # FastAPI — /chat (RAG), /search/keyword, /faqs
    ├── embed.py             # ChromaDB ingestion from samagama_faq.json
    ├── scrape_faq.py        # Scrapes samagama.in/internship/faq
    └── data/
        ├── samagama_faq.json   # 142 scraped FAQs
        └── chroma_db/          # Persistent vector store (all-MiniLM-L6-v2)
```

---

## 🔌 API Reference

### FAQ Endpoints (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/faqs` | List FAQs with type, category, search, pagination |
| `GET` | `/api/faqs/trending` | Most upvoted official FAQ |
| `GET` | `/api/faqs/search/similar` | Duplicate detection (Innovation B) |
| `GET` | `/api/faqs/:id` | Single FAQ |
| `POST` | `/api/faqs/:id/upvote` | Upvote with session ID deduplication |
| `POST` | `/api/faqs/:id/rate` | Star rating (1–5, upsert) |

### Ticket Endpoints (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tickets` | Submit a support ticket |
| `GET` | `/api/tickets/:trackingId` | Track ticket by ID |

### Chat & Search (RAG)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | RAG chat — embeds query → ChromaDB → Gemini → answer |
| `GET` | `/api/search?q=...&mode=keyword\|ai` | Proxy: keyword → RAG keyword endpoint; ai → RAG chat endpoint |

### Admin Endpoints (protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | JWT login (rate-limited) |
| `GET` | `/api/admin/tickets` | Paginated ticket list with status filter |
| `PATCH` | `/api/admin/tickets/:id` | Update status + admin note |
| `GET` | `/api/admin/questions/pending` | Pending community questions |
| `POST` | `/api/admin/questions/:id/approve` | Approve → public_community |
| `POST` | `/api/admin/questions/:id/reject` | Reject → rejected |
| `GET` | `/api/admin/gaps` | Content gap metrics (7/30/90 day) |
| `GET` | `/api/admin/notifications/count` | Badge counts |

---

## 🚀 Setup

### Prerequisites

- Node.js 18+
- Python 3.10+ (for RAG pipeline)
- MongoDB 8.x
- Git

### 1. Clone & Install

```bash
git clone https://github.com/vicharanashala/cs23
cd cs23
npm install
```

### 2. Environment

```bash
cd apps/server
cp .env.example .env
# Edit .env — set MONGODB_URI and JWT_SECRET
```

**Required variables:**

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `3001` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/faq-platform` | |
| `JWT_SECRET` | — | **Set your own** |
| `CLIENT_URL` | `http://localhost:5173` | |
| `ADMIN_URL` | `http://localhost:5174` | |
| `RAG_API_URL` | `http://localhost:8000` | RAG chatbot backend |

### 3. Start MongoDB

```bash
mongod --dbpath "C:\Program Files\MongoDB\Server\8.3\data"
```

### 4. Seed Data

```bash
cd apps/server && npm run seed
```

Seeds 8 Official FAQs + 6 Community Questions + 1 admin account (`admin` / `admin123`).

### 5. Start All Services

```bash
# Terminal 1 — API server
cd apps/server && node src/index.js

# Terminal 2 — Public frontend
cd apps/web && npm run dev

# Terminal 3 — Admin portal
cd apps/admin && npm run dev

# Terminal 4 — RAG chatbot (Python)
cd samagama-rag-chatbot
.venv\Scripts\python.exe -m uvicorn rag_api:app --port 8000 --reload
```

### Service URLs

| Service | URL |
|---------|-----|
| Public Frontend | http://localhost:5173 |
| Admin Portal | http://localhost:5174 |
| API Server | http://localhost:3001 |
| RAG Chat API | http://localhost:8000 |

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Public Frontend** | React 18 + TypeScript, Vite, TailwindCSS, TanStack Router v7, TanStack Query v5 |
| **Admin Frontend** | React 18 + TypeScript, Vite, TanStack Router v1 |
| **Backend API** | Node.js + Express.js |
| **RAG Pipeline** | Python + FastAPI + ChromaDB + SentenceTransformers + Google Gemini |
| **Database** | MongoDB 8.x |
| **Auth** | JWT (admin), localStorage session IDs (public) |

---

## 📄 License

MIT — Vicharanashala Lab, IIT Ropar.