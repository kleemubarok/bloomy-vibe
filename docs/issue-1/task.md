# Task List - Issue #1: Project Init & Config Stack

- [x] Setup Monorepo Structure (Bun Workspaces)
- [x] Initialize SvelteKit (Frontend) in `apps/web`
    - [x] `bun create svelte`
    - [x] Configure `adapter-cloudflare`
    - [x] Setup Vite proxy for `/api`
- [x] Initialize Hono (API) in `apps/api`
    - [x] `bun init`
    - [x] Setup `wrangler.toml` for Hono
    - [x] Basic health check endpoint
- [x] Config Drizzle ORM in `apps/api`
    - [x] `drizzle.config.ts`
    - [x] DB connection logic (Local SQLite / D1 `bloom-db`)
- [x] Environment & Scripts
    - [x] Root `package.json` scripts for `bun dev` (concurrently run web and api)
    - [x] `.env` setup
- [x] Verification
    - [x] `bun dev` configuration tested (scripts ready)
    - [x] Drizzle migration generated successfully
