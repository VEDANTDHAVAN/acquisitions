# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project type
Node.js (ESM) Express API with Drizzle ORM targeting Postgres (Neon serverless driver).

## Common commands (PowerShell)
Install deps (repo uses `package-lock.json`):
- `npm ci`

Run API (auto-restart via Node’s `--watch`):
- `npm run dev`

Lint / format:
- `npm run lint`
- `npm run lint:fix`
- `npm run format:check`
- `npm run format`

Run a single lint/format on one file (useful while iterating):
- `npx eslint src/app.js`
- `npx prettier --check src/app.js`

Database / migrations (Drizzle Kit):
- `npm run db:generate` (generates SQL migrations into `drizzle/` from schemas in `src/models/`)
- `npm run db:migrate` (applies migrations to `DATABASE_URL`)
- `npm run db:studio` (Drizzle Studio)

Tests
- No test runner/scripts are currently configured (no `test` script and no `tests/` directory).

## Environment variables
Loaded via `dotenv/config` in `src/index.js`.

Expected variables (see `.env.example` and code usage):
- `PORT` (defaults to `3000`)
- `NODE_ENV` (affects logging + cookie `secure` flag)
- `LOG_LEVEL` (Winston level)
- `DATABASE_URL` (required for Drizzle/Neon)
- `JWT_SECRET` (used in `src/utils/jwt.js`; a fallback exists but should be overridden)

## High-level architecture
Entry points
- `src/index.js`: loads env (`dotenv/config`) and starts the server.
- `src/server.js`: starts the HTTP listener (`app.listen`) on `PORT`.
- `src/app.js`: builds the Express app, middleware stack, and mounts routes.

Request flow (typical)
- Route file in `src/routes/` defines the URL and chooses a controller.
  - Example: `src/routes/auth.routes.js` mounts under `/api/auth` (from `src/app.js`).
- Controller in `src/controllers/` handles HTTP concerns:
  - input validation via Zod schemas in `src/validations/`
  - formatting validation errors via `src/utils/format.js`
  - calls into `src/services/` for DB/business logic
  - sets auth cookie / issues JWT using `src/utils/jwt.js` + `src/utils/cookies.js`
- Service in `src/services/` performs DB work using Drizzle.

Database layer
- `src/config/database.js`: initializes Neon HTTP client + Drizzle instance and exports `db`.
- `src/models/*.model.js`: Drizzle schema definitions.
- `drizzle.config.js`: points Drizzle Kit at `src/models/*.js` and outputs migrations to `drizzle/`.
  - Generated migration SQL lives in `drizzle/*.sql` with snapshots/journal in `drizzle/meta/`.

Logging
- `src/config/logger.js`: Winston logger.
  - Writes to `logs/error.log` and `logs/combined.log`.
  - In non-production, also logs to console.
- HTTP logging is via `morgan` in `src/app.js`, wired into the Winston logger.

Module resolution / aliases
- `package.json` defines Node ESM import aliases via `imports` (e.g. `#config/*`, `#routes/*`).
  - Prefer these aliases when adding new modules to keep imports consistent.
