# Folder Structure

> FAQ Platform · Architecture v1.0 · 2026-05-30

---

## Complete Directory Tree

```
faq-platform/
│
├── docs/                          # Project documentation (this repo)
│   ├── project-prd.md             # Source PRD from PDF
│   ├── architecture/              # This directory
│   │   ├── 01-project-architecture.md
│   │   ├── 02-folder-structure.md   ← you are here
│   │   ├── 03-database-schema.md
│   │   └── 04-api-endpoints.md
│   └── layouts/                   # Wireframe descriptions (future)
│
├── apps/
│   │
│   ├── web/                       # Public-facing React app
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   │
│   │   │   ├── main.tsx           # App entry point
│   │   │   ├── App.tsx            # Root component + TanStack Router setup
│   │   │   ├── index.css          # Tailwind base + custom properties
│   │   │   │
│   │   │   ├── components/        # Shared / reusable components
│   │   │   │   ├── Header.tsx              # Static header (always visible)
│   │   │   │   ├── Header.css
│   │   │   │   ├── FloatingChatbot.tsx     # Sticky chatbot gateway button
│   │   │   │   ├── FloatingChatbot.css
│   │   │   │   ├── SearchBar.tsx           # Auto-suggest search input
│   │   │   │   ├── SearchBar.css
│   │   │   │   ├── CategoryChips.tsx       # Horizontal filter buttons
│   │   │   │   ├── AccordionItem.tsx       # Single FAQ accordion row
│   │   │   │   ├── AccordionItem.css
│   │   │   │   ├── MediaAnswer.tsx         # GIF/screenshot/video renderer
│   │   │   │   ├── DuplicateAlert.tsx      # "Is this your issue?" panel
│   │   │   │   ├── TicketReceipt.tsx       # Tracking ID display + copy
│   │   │   │   ├── TicketReceipt.css
│   │   │   │   ├── TrendingWidget.tsx      # Daily trending question card
│   │   │   │   ├── TrendingWidget.css
│   │   │   │   ├── EmergencyQuiz.tsx       # 3-Step diagnostic wizard
│   │   │   │   ├── EmergencyQuiz.css
│   │   │   │   ├── ActionScript.tsx        # Emergency quiz output block
│   │   │   │   ├── SplitViewToggle.tsx     # Official FAQ vs Community toggle
│   │   │   │   ├── StarRating.tsx          # 1-5 star rating input/display
│   │   │   │   ├── CommentThread.tsx       # Community comment section
│   │   │   │   └── Spinner.tsx             # Loading state
│   │   │   │
│   │   │   ├── pages/              # Route-level page components
│   │   │   │   ├── Home.tsx                # Layout 1 — Main Dashboard
│   │   │   │   ├── Home.css
│   │   │   │   ├── BrowseFaqs.tsx          # Layout 2 — State 1
│   │   │   │   ├── BrowseFaqs.css
│   │   │   │   ├── SubmitTicket.tsx        # Layout 3 — State 2
│   │   │   │   ├── SubmitTicket.css
│   │   │   │   ├── TrackTicket.tsx         # Layout 4 — State 3
│   │   │   │   └── TrackTicket.css
│   │   │   │
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   │   ├── useDebounce.ts           # Debounce hook (300ms)
│   │   │   │   ├── useSearchSimilar.ts      # Duplicate detection hook
│   │   │   │   ├── useTicketSearch.ts       # Ticket status lookup hook
│   │   │   │   └── useEmergencyQuiz.ts      # Quiz state machine hook
│   │   │   │
│   │   │   ├── api/                # API client functions
│   │   │   │   ├── client.ts               # Axios instance + interceptors
│   │   │   │   ├── faqApi.ts               # FAQ read/search endpoints
│   │   │   │   ├── ticketApi.ts            # Ticket creation + status
│   │   │   │   ├── searchApi.ts            # Auto-suggest + similar check
│   │   │   │   ├── diagnosticApi.ts        # Emergency quiz scoring
│   │   │   │   └── communityApi.ts         # upvotes, comments, ratings
│   │   │   │
│   │   │   ├── utils/              # Pure utility functions
│   │   │   │   ├── cn.ts                   # classname merger (clsx + twMerge)
│   │   │   │   ├── formatTrackingId.ts     # Format ticket tracking display
│   │   │   │   └── generateActionScript.ts # Map quiz answers → action object
│   │   │   │
│   │   │   └── types/              # Shared TypeScript types
│   │   │       ├── question.types.ts
│   │   │       ├── ticket.types.ts
│   │   │       ├── user.types.ts
│   │   │       └── diagnostic.types.ts
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── postcss.config.js
│   │
│   │
│   ├── admin/                      # Isolated Admin Portal (separate build)
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── AdminHeader.tsx
│   │   │   │   ├── NotificationBell.tsx
│   │   │   │   ├── QuestionCard.tsx         # Admin review card
│   │   │   │   ├── QuestionCard.css
│   │   │   │   ├── TagSuggestion.tsx        # AI tag suggestions
│   │   │   │   ├── ContentGapPanel.tsx      # Innovation C dashboard
│   │   │   │   ├── ContentGapPanel.css
│   │   │   │   ├── BookmarkButton.tsx
│   │   │   │   ├── StatsRow.tsx             # (non-numeric, just indicators)
│   │   │   │   └── StatusBadge.tsx          # pending / public / official
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx                # Admin auth
│   │   │   │   ├── Dashboard.tsx            # Overview + pending queue
│   │   │   │   ├── ReviewQueue.tsx          # Pending question approvals
│   │   │   │   ├── OfficialFaqs.tsx         # Manage official FAQ list
│   │   │   │   ├── Tickets.tsx              # Support ticket management
│   │   │   │   ├── ContentGaps.tsx          # Innovation C checklist
│   │   │   │   └── Settings.tsx             # Promotion thresholds, tags
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   └── useAdminAuth.ts
│   │   │   │
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   ├── adminApi.ts
│   │   │   │   └── authApi.ts
│   │   │   │
│   │   │   └── types/
│   │   │       └── admin.types.ts
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── postcss.config.js
│   │
│   │
│   └── server/                     # Express.js API server
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts            # Server entry — Express app bootstrap
│       │   ├── app.ts              # Express app (middleware + routes)
│       │   │
│       │   ├── config/
│       │   │   ├── index.ts                # env vars + validation (Zod)
│       │   │   ├── database.ts             # MongoDB connection
│       │   │   └── rateLimit.ts            # Rate limiter config
│       │   │
│       │   ├── routes/              # Route aggregators
│       │   │   ├── index.ts                # Route map
│       │   │   ├── faq.routes.ts
│       │   │   ├── ticket.routes.ts
│       │   │   ├── search.routes.ts
│       │   │   ├── diagnostic.routes.ts
│       │   │   ├── community.routes.ts
│       │   │   └── admin.routes.ts
│       │   │
│       │   ├── controllers/         # Request handlers
│       │   │   ├── faq.controller.ts
│       │   │   ├── ticket.controller.ts
│       │   │   ├── search.controller.ts
│       │   │   ├── diagnostic.controller.ts
│       │   │   ├── community.controller.ts
│       │   │   └── admin.controller.ts
│       │   │
│       │   ├── models/              # Mongoose schemas
│       │   │   ├── User.ts
│       │   │   ├── Question.ts
│       │   │   ├── Ticket.ts
│       │   │   ├── Comment.ts
│       │   │   ├── Vote.ts
│       │   │   ├── Rating.ts
│       │   │   ├── SearchLog.ts
│       │   │   ├── Tag.ts
│       │   │   └── Notification.ts
│       │   │
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts       # JWT verification
│       │   │   ├── admin.middleware.ts      # role=admin gate
│       │   │   ├── validate.middleware.ts   # Zod schema validation
│       │   │   ├── rateLimiter.ts
│       │   │   └── errorHandler.ts          # Global error catcher
│       │   │
│       │   ├── services/            # Business logic layer
│       │   │   ├── faq.service.ts
│       │   │   ├── ticket.service.ts
│       │   │   ├── search.service.ts        # Duplicate check + zero-result log
│       │   │   ├── promotion.service.ts     # Auto-promotion pipeline
│       │   │   ├── diagnostic.service.ts    # Emergency quiz scoring
│       │   │   ├── notification.service.ts
│       │   │   └── contentGap.service.ts    # Innovation C aggregation
│       │   │
│       │   └── utils/
│       │       ├── AppError.ts              # Custom error class
│       │       ├── asyncHandler.ts          # Promise wrapper for controllers
│       │       └── idGenerator.ts           # nanoid tracking code generator
│       │
│       └── tests/                   # Integration + unit tests
│           ├── faq.test.ts
│           ├── ticket.test.ts
│           ├── search.test.ts
│           └── promotion.test.ts
│
├── package.json              # Root workspace (if using Turborepo/npm workspaces)
├── README.md
└── .env.example
```

---

## Key Architectural Notes

### Monorepo Strategy
Using **npm workspaces** (or optionally Turborepo) at root:
- `apps/web` — public React app (Vite)
- `apps/admin` — isolated admin React app (Vite)
- `apps/server` — Express API (TypeScript, running on port 3001)

### Shared Packages (Future Refactor)
When the project scales, extract:
- `packages/types` — shared TypeScript interfaces
- `packages/ui` — shared design system components
- `packages/validation` — shared Zod schemas

### Build Outputs
```
apps/web/dist/        → deployed to /internship/faq on samagama.in
apps/admin/dist/      → deployed to /admin on samagama.in
apps/server/          → runs as Node.js process, port 3001 (not served as static files)
```

### Environment Variables (`.env.example`)
```env
# Server
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/faq_platform
JWT_SECRET=<admin-jwt-secret>
JWT_EXPIRES_IN=7d

# Web
VITE_API_BASE_URL=http://localhost:3001/api

# Admin
VITE_ADMIN_API_BASE_URL=http://localhost:3001/api/admin
ADMIN_JWT_SECRET=<same-as-server>
```

---

*Previous: `01-project-architecture.md` · Next: `03-database-schema.md`*