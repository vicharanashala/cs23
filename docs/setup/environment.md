# Environment Variables

> FAQ Platform · Documentation · 2026-05-30

All environment variables are validated at server startup via `apps/server/src/config/env.js` using Zod. The process exits with a clear error listing any missing variables.

---

## Server — `apps/server/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | ✅ | — | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | ✅ | — | Secret for signing JWT access tokens |
| `PORT` | ✅ | `3001` | Port the Express server listens on |
| `CLIENT_URL` | ✅ | — | Frontend app URL (for CORS) — e.g. `http://localhost:5173` |
| `ADMIN_URL` | ✅ | — | Admin portal URL (for CORS) — e.g. `http://localhost:5174` |
| `NODE_ENV` | ✅ | `development` | `development` \| `production` \| `test` |

### Example

```env
MONGODB_URI=mongodb://localhost:27017/faq-platform
JWT_SECRET=replace-with-a-strong-random-secret
PORT=3001
CLIENT_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174
NODE_ENV=development
```

### Validation Rules

- `MONGODB_URI`, `JWT_SECRET`, `PORT`, `CLIENT_URL`, `ADMIN_URL` — must be non-empty strings
- `NODE_ENV` — must be one of: `development`, `production`, `test`
- If validation fails, the server prints a list of missing variables and exits with code `1`

---

## Public Web App — `apps/web/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | ✅ | `http://localhost:3001` | Base URL for the Express API |

### Example

```env
VITE_API_URL=http://localhost:3001
```

> **Note:** Vite only exposes variables prefixed with `VITE_` to the browser bundle.

---

## Admin Portal — `apps/admin/.env`

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | ✅ | `http://localhost:3001` | Base URL for the Express API |

### Example

```env
VITE_API_URL=http://localhost:3001
```

---

## Database State Codes (for `/api/health` `dbState` field)

| Code | Meaning |
|---|---|
| `0` | Disconnected |
| `1` | Connected |
| `2` | Connecting |
| `3` | Disconnecting |

---

*All server-side code imports config from `src/config/env.js` — never directly from `process.env`.*