# acquisitions (Docker + Neon)
This repo is dockerized to support two DB modes:
- Development: Neon Local (proxy) in Docker Compose, creating ephemeral Neon branches automatically.
- Production: Neon Cloud (direct), no Neon Local proxy.

## Prerequisites
- Docker Desktop
- A Neon project (for Neon Local to proxy to)

## Environment variables
This app reads environment variables via `dotenv/config`.

### Development (`.env.development`)
- `DATABASE_URL`: points at the Neon Local service on the compose network.
- `NEON_API_KEY`, `NEON_PROJECT_ID`: required by Neon Local.
- `PARENT_BRANCH_ID` (optional): if set, Neon Local creates an ephemeral branch from this parent.

Example:
- `DATABASE_URL=postgresql://neon:npg@neon-local:5432/neondb?sslmode=require`

### Production (`.env.production`)
- `DATABASE_URL`: your real Neon Cloud connection string (e.g. `...neon.tech...`).

## Development (local) — app + Neon Local
1. Create/edit `.env.development` and set:
   - `NEON_API_KEY`
   - `NEON_PROJECT_ID`
   - optionally `PARENT_BRANCH_ID`
   
   Note: `.env.development` / `.env.production` are ignored by git via `.gitignore`.
2. Start the stack (either compose file works):
   - PowerShell:
     - `docker compose --env-file .env.development up --build`
     - or `docker compose -f docker-compose.dev.yml --env-file .env.development up --build`
3. The API should be reachable at:
   - `http://localhost:3000/health`

### Database migrations (dev)
Run migrations against Neon Local (which routes to the ephemeral branch):
- `docker compose -f docker-compose.dev.yml --env-file .env.development run --rm app npm run db:migrate`

## Production — app only (Neon Cloud)
1. Create `.env.production` with your Neon Cloud connection string:
   - `DATABASE_URL=postgres://...neon.tech...`
2. Start the production container:
   - `docker compose -f docker-compose.prod.yml --env-file .env.production up --build`

### Database migrations (prod)
Run Drizzle migrations against Neon Cloud:
- `docker compose -f docker-compose.prod.yml --env-file .env.production run --rm app npm run db:migrate`

## How DATABASE_URL switches between dev and prod
- Dev uses `--env-file .env.development` where `DATABASE_URL` points at `neon-local:5432`.
- Prod uses `--env-file .env.production` where `DATABASE_URL` points at your Neon Cloud host (`*.neon.tech`).

## Notes
- Neon Local is a *proxy*, not a local Postgres instance. It routes your local connection to Neon Cloud and can create/delete branches automatically.
- If you are using additional Neon Local features (like a persistent branch per Git branch), follow Neon’s Neon Local documentation and mount the suggested volumes.
