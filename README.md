# CrowdFAQ

> **Version 1.0** — A general-purpose, crowd-sourced FAQ knowledge base built on the MERN stack.

CrowdFAQ lets any community — companies, campuses, teams — host a searchable FAQ knowledge base where users can browse official answers, ask community questions, get instant AI-powered answers, and submit support tickets when nothing exists yet.

The **initial seed data** comes from the [Samagama Internship Program](https://samagama.in) at Vicharanashala Lab, IIT Ropar. The platform itself is fully generic — swap the data, it's your FAQ platform.

**Live:** `your-domain.com/faq`

---

## ✨ Features

### For End Users

| Feature | Description |
|---------|-------------|
| **🔍 Dual-Mode Search** | 🔤 **Keyword Search** — fast ranked results by text relevance. 🤖 **AI Search** — reads the full knowledge base and gives a direct answer with source citations. |
| **💬 AI Chatbot** | Floating chat button on every page. Handles casual chat (hi/hello) and RAG-powered FAQ answers from your knowledge base. |
| **📋 Browse FAQs** | Two-panel layout: **Official FAQs** (curated, admin-managed) + **Community Questions** (user-submitted, upvoted). Filter by category. |
| **📝 Submit Questions** | Support ticket system for questions with no answer yet. Duplicate detection suggests existing matches before you file a ticket. |
| **🔔 Track Tickets** | Get a tracking ID on submission. Check status, admin notes, and resolution timeline at any time. |
| **🔥 Trending** | Most-upvoted question shown on the dashboard — surfaced by the community. |
| **👍 Upvote & ⭐ Rate** | Community signals that push useful questions toward official status. Questions with 15+ upvotes auto-promote to Official FAQ. |

### For Admins

| Feature | Description |
|---------|-------------|
| **🔐 JWT-Secured Portal** | Separate admin app. Rate-limited login (10 attempts / 15 min per IP). |
| **🎫 Ticket Queue** | Filter by status. Add internal notes. Full resolution history per ticket. |
| **✅ Question Moderation** | Approve community questions (push to public) or reject. Tag on approval. |
| **📊 Content Gap Matrix** | See what people searched for but found no answer for — over 7/30/90 day windows. Identifies knowledge gaps to fill. |
| **🔔 Notification Badges** | Live red badges on nav items show pending tickets and questions count (polled every 30s). |

---

## 🧱 Architecture

```
apps/
├── server/           Node.js + Express API  —  port 3001
│   └── src/
│       ├── config/       Zod env validation, MongoDB connection
│       ├── middleware/   JWT auth, error handler, Morgan logger, rate limiter
│       ├── models/       Question, Ticket, Rating, SearchLog, Admin
│       ├── routes/       FAQ CRUD, ticket, admin, chat, search
│       └── utils/        ApiError, TF-IDF auto-categorizer
│
├── web/              React 18 + TypeScript + Vite + TailwindCSS  —  port 5173
│   └── src/
│       ├── components/   ChatBot (RAG + casual), UI library
│       ├── pages/        MainDashboard, BrowseSearch, SubmitTicket, TicketTracking
│       ├── layouts/      AppShell (sticky header + floating chatbot)
│       ├── lib/          Axios client
│       └── router/       TanStack Router v7 + TanStack Query v5
│
└── admin/             React 18 + TypeScript + Vite  —  port 5174
    └── src/
        ├── components/   AdminShell (sidebar + polling)
        ├── pages/        Login, Dashboard, TicketQueue, QuestionQueue, ContentGaps
        ├── hooks/        useAdminAuth
        └── router/       TanStack Router v1

samagama-rag-chatbot/    Python + FastAPI RAG pipeline  —  port 8000
    ├── rag_api.py           FastAPI — RAG chat, keyword search, list all FAQs
    ├── embed.py             ChromaDB ingestion script
    ├── scrape_faq.py        FAQ scraper (adapts to any <details>/<summary> page)
    └── data/
        ├── samagama_faq.json   142 scraped FAQs (initial seed data)
        └── chroma_db/          Persistent vector store — all-MiniLM-L6-v2 embeddings
```

---

## 🔌 API Reference

### FAQ Endpoints (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/faqs` | List FAQs — filter by `type`, `category`, `search`, `page` |
| `GET` | `/api/faqs/trending` | Most upvoted official FAQ |
| `GET` | `/api/faqs/search/similar` | Duplicate detection for ticket submission |
| `GET` | `/api/faqs/:id` | Single FAQ by ID |
| `POST` | `/api/faqs/:id/upvote` | Upvote (session-deduplicated, triggers auto-promotion at 15) |
| `POST` | `/api/faqs/:id/rate` | Star rating 1–5 (upsert, records count) |

### Ticket Endpoints (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tickets` | Submit a support ticket |
| `GET` | `/api/tickets/:trackingId` | Track ticket by ID (format: `TKT-YYYY-XXXXXXXX`) |

### Chat & Search (RAG)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | RAG chat — embeds query → ChromaDB → LLM → answer + context |
| `GET` | `/api/search?q=...&mode=keyword\|ai` | Proxies to RAG pipeline: `keyword` → text match, `ai` → RAG chat |

### Admin Endpoints (protected — JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Login — returns JWT (expires 8h, rate-limited 10/15min) |
| `GET` | `/api/admin/tickets` | Paginated ticket list, filter by `status` |
| `PATCH` | `/api/admin/tickets/:id` | Update `status` + `adminNote`, tracks history |
| `GET` | `/api/admin/questions/pending` | Pending community questions (new/rejected) |
| `POST` | `/api/admin/questions/:id/approve` | Approve → `public_community` + tags |
| `POST` | `/api/admin/questions/:id/reject` | Reject → `rejected` |
| `GET` | `/api/admin/gaps` | Content gap matrix — zero-result searches + low-rated content |
| `GET` | `/api/admin/notifications/count` | `{ pendingTickets, pendingQuestions }` for badge counts |

---

## 🚀 Setup

### Prerequisites

- Node.js 18+
- Python 3.10+ (for the RAG pipeline)
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
# Set MONGODB_URI and JWT_SECRET
```

**Required variables:**

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `3001` | API server port |
| `MONGODB_URI` | `mongodb://localhost:27017/faq-platform` | |
| `JWT_SECRET` | — | **Set your own random string** |
| `CLIENT_URL` | `http://localhost:5173` | Public frontend |
| `ADMIN_URL` | `http://localhost:5174` | Admin portal |
| `RAG_API_URL` | `http://localhost:8000` | RAG chatbot backend |

### 3. Start MongoDB

```bash
mongod --dbpath "C:\Program Files\MongoDB\Server\8.3\data"
# or on macOS/Linux:
mongod --dbpath /data/db
```

### 4. Seed Initial Data

```bash
cd apps/server && npm run seed
```

Seeds the database with sample questions and one admin account:
- **User login:** `admin` / `admin123`
- *(Swap seed data with your own FAQ JSON to rebrand)*

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
| **RAG Pipeline** | Python + FastAPI + ChromaDB + SentenceTransformers (all-MiniLM-L6-v2) + Google Gemini |
| **Database** | MongoDB 8.x |
| **Auth** | JWT (admin), localStorage session IDs (public features) |

---

## 📄 License

MIT — Vicharanashala Lab, IIT Ropar