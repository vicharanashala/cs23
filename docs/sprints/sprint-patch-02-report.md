# Sprint Patch-02 Report

**Date:** 2026-05-30
**Type:** Environment & MongoDB setup
**Duration:** Single session

---

## Objective

Install MongoDB, wire it into the server, and verify all environment infrastructure is correctly in place.

---

## Changes Made

### 1. MongoDB Installation

- Installed MongoDB Server 8.3 via Chocolatey (`choco install mongodb`)
- Data directory: `C:\ProgramData\MongoDB\data`
- Log directory: `C:\ProgramData\MongoDB\log`
- Binaries: `C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe`
- Started as foreground process on port `27017`

### 2. `apps/server/src/config/db.js` — Fixed

Changed MongoDB connection failure from **warn + continue** to **exit immediately**:

```diff
- console.error('❌ MongoDB connection failed:', err.message);
- console.warn('⚠️  Server starting without database connection');
- console.warn('   The /api/health endpoint will report dbState=0 until MongoDB is available');
+ console.error('❌ MongoDB connection failed:', err.message);
+ process.exit(1);
```

### 3. `apps/server/src/index.js` — Cleaned Up

Removed redundant second call to `require('./config/env')` (Zod validation already runs on the first import at the top of the file).

### 4. All Required Files — Verified Present

| File | Status |
|---|---|
| `apps/server/src/config/env.js` | ✅ Zod schema, typed exports, fail-fast on missing vars |
| `apps/server/src/config/db.js` | ✅ Connects on startup, exits on failure |
| `apps/server/src/middleware/errorHandler.js` | ✅ ApiError/Zod/JWT/500 handling |
| `apps/server/src/utils/ApiError.js` | ✅ `class ApiError extends Error` |
| `apps/server/.env.example` | ✅ All 6 server vars documented |
| `apps/web/.env.example` | ✅ `VITE_API_URL=http://localhost:3001` |
| `apps/admin/.env.example` | ✅ `VITE_API_URL=http://localhost:3001` |
| `docs/setup/environment.md` | ✅ Full variable docs + dbState codes |

---

## Verification

```bash
# MongoDB is running (PID varies)
Get-Process mongod

# Health endpoint — dbState: 1 = connected
Invoke-RestMethod http://localhost:3001/api/health

# Response:
# { "status": "ok", "timestamp": "2026-05-30T08:40:54.179Z", "dbState": 1 }
```

**Health check result: ✅ PASS**
```
status: ok
dbState: 1  (connected)
```

---

## Package Audit

All server dependencies already present from previous session:
`express`, `mongoose`, `helmet`, `morgan`, `cors`, `dotenv`, `zod`, `express-async-errors`, `jsonwebtoken`, `bcryptjs`, `nanoid`, `express-rate-limit`

---

## Git Commit

```
[main <patch-02>] sprint-patch-02: MongoDB install, env validation, db connection, health endpoint
```

---

## Next Steps

- Feature sprint: Static header + floating chatbot button (all layouts)
- Layout 1: Main Dashboard
- Layout 2: Browse & Search (State 1)
- Layout 3: Submit Ticket (State 2) + debounced duplicate detection
- Layout 4: Ticket Tracking (State 3)
- 3-Step Emergency Diagnostic Quiz

---

*Report generated: 2026-05-30 · Pooh 🐻*