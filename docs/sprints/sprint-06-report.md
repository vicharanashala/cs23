# Sprint Patch-06 Report

**Date:** 2026-05-30
**Type:** Data seeding
**Duration:** Single session

---

## Objective

Create a database seed script that populates the FAQ platform with realistic test data: an admin user, official FAQs, and community questions with varying upvote counts to test auto-promotion logic.

---

## Changes Made

### `apps/server/src/scripts/seed.js` — Created

Full seed script with these steps:

1. **Connect** to MongoDB via `MONGODB_URI` from `config/env.js`
2. **Clear** Question, Ticket, Rating, SearchLog, Admin collections
3. **Create admin:** `username=admin`, `password=admin123`, hashed with bcrypt (salt rounds: 12)
4. **Seed 8 official FAQs** across all 4 categories:
   - `isOfficialFAQ: true`, `status: "official_faq"`
   - Realistic internship-related titles and descriptions
5. **Seed 6 community questions** (`status: "public_community"`):
   - 2 with upvotes: 16 (auto-promotion threshold test)
   - 2 with upvotes: 8
   - 2 with upvotes: 3
   - All with `upvotedBy` arrays populated with unique fake sessionIds
6. **Log each step**, then **disconnect**

### `apps/server/package.json` — Updated

```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "seed": "node src/scripts/seed.js"
}
```

---

## Seed Run Results

```
🌱 SEED SCRIPT — FAQ Platform

Connecting to MongoDB: mongodb://127.0.0.1:27017/faq-platform
✅ Connected

1. Clearing collections...
   Question, Ticket, Rating, SearchLog, Admin → cleared

2. Creating admin user...
   Created: username=admin, _id=6a1aa9d939a350f2f7589df0

3. Seeding 8 official FAQs...
   [Test & Coding Assessment] How do I reset my test password if I forgot it?...
   [Stipend & Offer Letters] When will I receive my offer letter after completi...
   [Test & Coding Assessment] What should I do if my test link has expired?...
   [Application Setup] How do I upload my documents for the onboarding pr...
   [Internship Tasks] How do I join the GitHub organization for my inter...
   [Stipend & Offer Letters] When will I receive my first stipend payment?...
   [Internship Tasks] How can I track the status of my internship certif...
   [Internship Tasks] What is the deadline for submitting my internship ...
   → 8 official FAQs inserted

4. Seeding 6 community questions...
   upvotes=16 | Test portal shows "Session Already Active" even af...
   upvotes=16 | Resume upload fails with "File type not supported"...
   upvotes=8 | GitHub Classroom invite link gives 404 error...
   upvotes=8 | Did not receive welcome email after completing doc...
   upvotes=3 | Can I change my internship start date after accept...
   upvotes=3 | Stipend amount on offer letter does not match what...
   → 6 community questions inserted

5. Final document counts:
   Question: 14
   Ticket: 0
   Rating: 0
   SearchLog: 0
   Admin: 1

✅ Seed complete
Disconnected. Done.
```

### Final Collection Counts

| Collection | Count |
|---|---|
| Question | 14 (8 official FAQ + 6 community) |
| Ticket | 0 |
| Rating | 0 |
| SearchLog | 0 |
| Admin | 1 |

---

## Admin Credentials

```
username: admin
password: admin123
```

---

## Next Steps

- Start server: `npm run dev --prefix apps/server`
- Run seed: `npm run seed --prefix apps/server`
- Next sprint: Layout 1 (Main Dashboard) + Static Header + Floating Chatbot

---

*Report generated: 2026-05-30 · Pooh 🐻*