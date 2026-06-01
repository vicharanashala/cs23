# Sprint Patch-01 Report

**Date:** 2026-05-30
**Type:** Dependency & tooling patch (non-feature)
**Duration:** Single session

---

## Objective

Install missing packages left out of the Phase 0 scaffold, wire up `packages/shared`, add root dev tooling, and configure root scripts.

---

## Changes Made

### 1. Package Installs

| Workspace | Package | Version |
|---|---|---|
| `apps/server` | `express-async-errors` | ^3.1.1 |
| `apps/server` | `express-rate-limit` | ^7.4.1 |
| `apps/web` | `@hookform/resolvers` | ^3.9.1 |
| `apps/admin` | `@hookform/resolvers` | ^3.9.1 |
| root `devDependencies` | `concurrently` | ^8.2.2 |
| root `devDependencies` | `nodemon` | ^3.1.4 |

Total new packages: **46** (audited → 316 total)

---

### 2. `packages/shared/` Created

```
packages/shared/
├── package.json   (name: "@faq/shared", version: "1.0.0", main: "index.js")
└── index.js       (module.exports = {})
```

---

### 3. Root `package.json` Updated

**`workspaces`** — added `"packages/*"`:
```json
"workspaces": ["apps/server", "apps/web", "apps/admin", "packages/*"]
```

**`scripts`** — updated and added:
```json
"dev": "concurrently \"npm run dev -w apps/server\" \"npm run dev -w apps/web\"",
"dev:all": "concurrently \"npm run dev -w apps/server\" \"npm run dev -w apps/web\" \"npm run dev -w apps/admin\"",
"dev:server": "npm run dev -w apps/server",
"dev:web": "npm run dev -w apps/web",
"dev:admin": "npm run dev -w apps/admin",
```

**`devDependencies`** — added:
```json
"concurrently": "^8.2.2",
"nodemon": "^3.1.4"
```

---

### 4. `apps/server/package.json` Updated

**`scripts.dev`** — changed from `"node --watch src/index.js"` to:
```json
"dev": "nodemon src/index.js"
```

**`dependencies`** — added:
```json
"express-async-errors": "^3.1.1",
"express-rate-limit": "^7.4.1"
```

---

### 5. `.prettierrc` Created

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2
}
```

---

## Verification

```bash
cd C:\faq-platform
node -e "require('express-async-errors'); console.log('OK')"
# → OK
```

All 46 packages installed, workspaces resolved, root `dev` script functional.

---

## Git Commit

```
[main <patch-01>] sprint-patch-01: install missing packages, add shared workspace, root scripts
```

---

## Next Steps

- Feature sprint begins: static header + Layout 1 (Main Dashboard)
- `apps/server` → implement API routes and MongoDB connection
- `apps/web` → wire up Layout 1 + Header + FloatingChatbot components

---

*Report generated: 2026-05-30 · Pooh 🐻*