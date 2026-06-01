# Dependencies

> FAQ Platform · Documentation · 2026-05-30

All packages installed via `npm`. Monorepo managed with npm workspaces.

---

## Root

| Package | Version | Purpose |
|---|---|---|
| `concurrently` | ^8.2.2 | Run multiple workspace scripts simultaneously |
| `nodemon` | ^3.1.4 | Auto-restart server on file changes (dev only) |

---

## `apps/server`

| Package | Version | Purpose |
|---|---|---|
| `express` | ^4.21.0 | Web framework |
| `mongoose` | ^8.24.0 | MongoDB ODM — schema建模 & queries |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing |
| `helmet` | ^8.2.0 | HTTP security headers |
| `morgan` | ^1.10.1 | HTTP request logging |
| `dotenv` | ^16.4.5 | Load `.env` variables at runtime |
| `jsonwebtoken` | ^9.0.2 | JWT signing & verification |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `nanoid` | ^3.3.7 | Unique ID generation (ticket tracking IDs) |
| `zod` | ^3.25.76 | Runtime schema validation for env & request bodies |
| `express-async-errors` | ^3.1.1 | Patch Express to auto-catch async errors (no need for try/catch in controllers) |
| `express-rate-limit` | ^7.4.1 | Rate limiting middleware |

---

## `apps/web` & `apps/admin`

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.3.1 | UI library |
| `react-dom` | ^18.3.1 | DOM renderer for React |
| `@tanstack/react-router` | ^1.170.10 | File-based routing |
| `@tanstack/react-query` | ^5.100.14 | Server state management, caching, mutations |
| `tailwindcss` | ^3.4.19 | Utility-first CSS |
| `postcss` | ^8.5.15 | CSS transform tool (used by Tailwind) |
| `autoprefixer` | ^10.5.0 | Vendor prefix injection for PostCSS |
| `axios` | ^1.16.1 | HTTP client for API calls |
| `react-hook-form` | latest | Form state management |
| `zod` | latest | Schema validation (shared with server) |
| `@hookform/resolvers` | ^3.10.0 | Adapter: react-hook-form ← Zod |

---

## `packages/shared`

| Package | Version | Purpose |
|---|---|---|
| `zod` | latest | Shared validation schemas used by both web and server |

> Currently a placeholder. Planned for shared Zod schemas, category enums, and constants used across all workspaces.

---

## Dev Dependencies (Root)

| Package | Purpose |
|---|---|
| `eslint` | Linting (not yet configured) |
| `prettier` | Code formatting (config exists at `.prettierrc`) |
| `concurrently` | Run multiple scripts in parallel |
| `nodemon` | Watch mode for server |

---

## Notes

- Both frontend apps share the same Tailwind config pattern and PostCSS setup
- `express-async-errors` must be required as the **first line** of `apps/server/src/index.js` before all other imports
- Only server-side packages should be in `apps/server/dependencies` — never import server packages into the frontend
- `Vite` only exposes environment variables prefixed with `VITE_` to the browser bundle