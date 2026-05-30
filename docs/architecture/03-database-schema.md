# MongoDB Schema Design

> FAQ Platform · Architecture v1.0 · 2026-05-30

---

## 1. Database: `faq_platform`

All collections live in the `faq_platform` database on MongoDB Atlas (or self-hosted).

---

## 2. Schema Definitions

### 2.1 `users` Collection

Tracks both **admin users** and **community members** (identified by email for voting/commenting).

```typescript
// apps/server/src/models/User.ts

const UserSchema = new Schema({
  // Community users may not have a password — identified by email only
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },

  // Hashed password — required for admins, optional for community users
  passwordHash: {
    type: String,
    default: null, // null for email-only community accounts
  },

  // 'community' | 'admin'
  role: {
    type: String,
    enum: ['community', 'admin'],
    default: 'community',
  },

  displayName: {
    type: String,
    trim: true,
    default: null,
  },

  // Admin-only: notifications enabled
  notificationsEnabled: {
    type: Boolean,
    default: false,
  },

  // Soft delete
  deletedAt: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true, // createdAt, updatedAt
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
```

---

### 2.2 `questions` Collection

Core Q&A content. Supports both official FAQs and community-asked questions.

```typescript
// apps/server/src/models/Question.ts

const QuestionSchema = new Schema({

  // The question title (displayed as accordion header)
  title: {
    type: String,
    required: true,
    trim: true,
    minLength: 10,
    maxLength: 300,
  },

  // Full answer — supports Markdown + HTML (sanitized on render, not on store)
  body: {
    type: String,
    required: true,
  },

  // ---------- CATEGORIZATION ----------
  // Primary category (matches category chips on State 1)
  category: {
    type: String,
    required: true,
    enum: [
      'application-profile',     // Application & Profile Setup
      'test-assessment',         // Test & Coding Assessment
      'stipend-offer',           // Stipend & Offer Letters
      'internship-tasks',        // Internship Tasks (for emergency quiz)
      'selection-process',       // AI Interview / Test Link / Assessment
      'onboarding-documents',    // Offer Letter / Welcome Letter
      'general',                 // Catch-all
    ],
  },

  // ---------- PROMOTION PIPELINE ----------
  // 'pending' | 'public_community' | 'official_faq' | 'rejected' | 'removed'
  status: {
    type: String,
    enum: ['pending', 'public_community', 'official_faq', 'rejected', 'removed'],
    default: 'pending',
    index: true,
  },

  // Auto-true when status transitions to 'official_faq'
  isOfficialFAQ: {
    type: Boolean,
    default: false,
    index: true,
  },

  // ---------- ENGAGEMENT METRICS ----------
  upvoteCount: {
    type: Number,
    default: 0,
    index: true,
  },

  commentCount: {
    type: Number,
    default: 0,
  },

  viewCount: {
    type: Number,
    default: 0,
  },

  // Count of ratings ≤ 2 (for content gap detection — Innovation C)
  unhelpfulCount: {
    type: Number,
    default: 0,
  },

  // Average helpfulness rating (1–5 stars), updated on each rating
  avgRating: {
    type: Number,
    default: null,
    min: 1,
    max: 5,
  },

  ratingCount: {
    type: Number,
    default: 0,
  },

  // ---------- TRACKING ----------
  // Community submitter (userId reference, nullable for anon early submissions)
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  submitterEmail: {
    type: String,
    default: null,
  },

  // Admin who approved (if ever approved)
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  approvedAt: {
    type: Date,
    default: null,
  },

  // ---------- MEDIA ----------
  // Array of media attachments (GIF, image, video URLs from Cloudinary/S3)
  media: [{
    type: {
      type: String,
      enum: ['image', 'gif', 'video'],
    },
    url: { type: String },          // CDN URL
    thumbnailUrl: { type: String }, // For video: poster frame
    caption: { type: String },
  }],

  // ---------- TAGS ----------
  // AI-suggested + admin-assigned tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // ---------- CONTENT GAPS (Innovation C) ----------
  // Incremented whenever a search returns this question as a zero-result
  // (used to track if this answer needs improvement)
  zeroSearchHitCount: {
    type: Number,
    default: 0,
  },

  // Soft delete
  deletedAt: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true,
});

// COMPOUND INDEXES
// For browse + filter queries (State 1)
QuestionSchema.index({ status: 1, category: 1, createdAt: -1 });
QuestionSchema.index({ status: 1, isOfficialFAQ: 1, upvoteCount: -1 });

// For trending / daily top (sorted by upvotes in last 24h)
// Note: updatedAt index covers recent activity sorting
QuestionSchema.index({ status: 1, updatedAt: -1 });

// Text index for search (title + body)
QuestionSchema.index({ title: 'text', body: 'text' });

// For duplicate detection (Innovation B) — fuzzy match on title
QuestionSchema.index({ title: 1, status: 1 });
```

---

### 2.3 `tickets` Collection

Support ticket submissions with unique tracking IDs.

```typescript
// apps/server/src/models/Ticket.ts

const TicketSchema = new Schema({

  // Short, user-friendly tracking code (nanoid, 10 chars)
  // Example: "FAQ-X7K9M2LP"
  trackingCode: {
    type: String,
    required: true,
    unique: true,
  },

  // 'open' | 'in_review' | 'resolved' | 'closed'
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'closed'],
    default: 'open',
    index: true,
  },

  // ---------- SUBMISSION DETAILS ----------
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },

  category: {
    type: String,
    required: true,
    enum: [
      'application-profile',
      'test-assessment',
      'stipend-offer',
      'internship-tasks',
      'selection-process',
      'onboarding-documents',
      'general',
    ],
  },

  title: {
    type: String,
    required: true,
    trim: true,
    minLength: 10,
    maxLength: 300,
  },

  description: {
    type: String,
    required: true,
    minLength: 20,
  },

  // Linked question (if duplicate was caught but user confirmed different)
  linkedQuestionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    default: null,
  },

  // Was this preceded by a duplicate detection alert?
  duplicateAlertShown: {
    type: Boolean,
    default: false,
  },

  // ---------- STAFF TRACKING ----------
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = unassigned
  },

  // Status change notes (timeline)
  statusHistory: [{
    status: String,
    note: { type: String, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  }],

  // Admin's resolution note (shown to user on status check)
  resolutionNote: {
    type: String,
    default: null,
  },

  deletedAt: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true,
});

// Indexes
TicketSchema.index({ trackingCode: 1 });
TicketSchema.index({ email: 1, createdAt: -1 });
TicketSchema.index({ status: 1, createdAt: -1 });
```

---

### 2.4 `comments` Collection

Threaded comments on community questions.

```typescript
// apps/server/src/models/Comment.ts

const CommentSchema = new Schema({

  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true,
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = anonymous (email only)
  },

  authorEmail: {
    type: String,
    required: true,
  },

  authorDisplayName: {
    type: String,
    default: 'Anonymous',
  },

  body: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 2000,
  },

  // For threading (optional — 1 level deep)
  parentCommentId: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },

  // 'visible' | 'hidden' | 'deleted'
  status: {
    type: String,
    enum: ['visible', 'hidden', 'deleted'],
    default: 'visible',
  },

  deletedAt: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true,
});

CommentSchema.index({ questionId: 1, createdAt: 1 });
CommentSchema.index({ parentCommentId: 1 });
```

---

### 2.5 `votes` Collection

One vote per user per question (prevents vote inflation).

```typescript
// apps/server/src/models/Vote.ts

const VoteSchema = new Schema({

  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true,
  },

  // User or email (community can vote by email if not logged in)
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  voterEmail: {
    type: String, // required if userId is null
  },

  // Always 1 (upvote only, no downvotes per PRD)
  value: {
    type: Number,
    enum: [1],
    default: 1,
  },

}, {
  timestamps: true,
});

// Unique compound index — one vote per question per user/email
VoteSchema.index({ questionId: 1, voterEmail: 1 }, { unique: true });
VoteSchema.index({ questionId: 1, userId: 1 }, { unique: true, sparse: true });
```

---

### 2.6 `ratings` Collection

Answer helpfulness ratings (1–5 stars). One rating per user per question.

```typescript
// apps/server/src/models/Rating.ts

const RatingSchema = new Schema({

  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true,
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  raterEmail: {
    type: String,
  },

  // 1–5
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },

  // 'helpful' (≥3) | 'unhelpful' (≤2) — computed, stored for easy aggregation
  helpfulness: {
    type: String,
    enum: ['helpful', 'unhelpful'],
  },

}, {
  timestamps: true,
});

RatingSchema.index({ questionId: 1, raterEmail: 1 }, { unique: true });
RatingSchema.index({ questionId: 1, userId: 1 }, { unique: true, sparse: true });
RatingSchema.index({ helpfulness: 1 }); // For content gap queries
```

---

### 2.7 `search_logs` Collection

Every search query logged for Innovation C (content gap detection).

```typescript
// apps/server/src/models/SearchLog.ts

const SearchLogSchema = new Schema({

  query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },

  // Number of results returned
  resultCount: {
    type: Number,
    required: true,
    default: 0,
  },

  // True if resultCount === 0 (high priority for content gap)
  zeroResults: {
    type: Boolean,
    default: false,
    index: true,
  },

  // If zeroResults: what category was selected (helps identify gap)
  activeCategory: {
    type: String,
    default: null,
  },

  // If zeroResults: which view was active (official | community | all)
  activeView: {
    type: String,
    enum: ['all', 'official', 'community'],
    default: 'all',
  },

  // User info (optional)
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  sessionId: {
    type: String,
    default: null,
  },

}, {
  timestamps: true,
});

// Index for content gap aggregation
SearchLogSchema.index({ zeroResults: 1, createdAt: -1 });
SearchLogSchema.index({ query: 1, createdAt: -1 });
```

---

### 2.8 `tags` Collection

AI-suggested + admin-created tags for question categorization.

```typescript
// apps/server/src/models/Tag.ts

const TagSchema = new Schema({

  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  // 'system' (AI-suggested) | 'admin'
  source: {
    type: String,
    enum: ['system', 'admin'],
    default: 'admin',
  },

  // Admin who created this tag
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  usageCount: {
    type: Number,
    default: 0,
  },

  // Soft delete
  deletedAt: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true,
});

TagSchema.index({ name: 1 });
TagSchema.index({ source: 1 });
```

---

### 2.9 `notifications` Collection

Admin + user notifications (new question in queue, ticket update, etc.).

```typescript
// apps/server/src/models/Notification.ts

const NotificationSchema = new Schema({

  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // 'question_pending' | 'question_approved' | 'question_rejected'
  // | 'ticket_update' | 'promotion_threshold' | 'content_gap_alert'
  type: {
    type: String,
    required: true,
    enum: [
      'question_pending',
      'question_approved',
      'question_rejected',
      'ticket_update',
      'promotion_threshold',
      'content_gap_alert',
    ],
  },

  title: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  // Related resource (question or ticket)
  relatedResourceId: {
    type: Schema.Types.ObjectId,
    default: null,
  },

  relatedResourceType: {
    type: String,
    enum: ['question', 'ticket', null],
    default: null,
  },

  // 'unread' | 'read' | 'archived'
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread',
    index: true,
  },

  readAt: {
    type: Date,
    default: null,
  },

}, {
  timestamps: true,
});

NotificationSchema.index({ recipientId: 1, status: 1 });
NotificationSchema.index({ createdAt: -1 });
```

---

## 3. Auto-Promotion Trigger

The `promotion.service.ts` listens for vote events and checks:

```typescript
// Promotion threshold — configurable via admin settings
const UPVOTE_THRESHOLD = 15; // default

// After each upvote:
// 1. Increment question.upvoteCount
// 2. If upvoteCount >= UPVOTE_THRESHOLD AND status === 'public_community':
//    → set question.isOfficialFAQ = true
//    → set question.status = 'official_faq'
//    → create Notification { type: 'promotion_threshold', ... }
```

---

## 4. Content Gap Aggregation Query (Innovation C)

```javascript
// Content Gap Matrix query — run in contentGap.service.ts
db.search_logs.aggregate([
  { $match: { zeroResults: true, createdAt: { $gte: last24h } } },
  { $group: { _id: '$query', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 20 },
])

// Also: high unhelpful ratio questions
db.questions.find({
  status: 'official_faq',
  ratingCount: { $gte: 5 },
  $expr: { $gt: [{ $divide: ['$unhelpfulCount', '$ratingCount'] }, 0.4] }
}).sort({ unhelpfulCount: -1 }).limit(20)
```

---

*Previous: `02-folder-structure.md` · Next: `04-api-endpoints.md`*