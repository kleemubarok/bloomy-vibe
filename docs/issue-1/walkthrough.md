# Walkthrough - Issue #1: Project Init & Config Stack

I have successfully initialized the project with a monorepo structure using Bun Workspaces. The setup includes separate services for the Frontend (SvelteKit) and API (Hono), with Drizzle ORM configured for database management.

## Changes Made

### Monorepo Structure
- Created a root [package.json](file:///Users/xiomay/bloom/package.json) with Bun workspaces enabled for `apps/*`.
- Added global scripts to run developments servers concurrently.

### API Service (`apps/api`)
- Initialized a Bun project in [apps/api/package.json](file:///Users/xiomay/bloom/apps/api/package.json).
- Setup **Hono** with a basic health check endpoint in [index.ts](file:///Users/xiomay/bloom/apps/api/src/index.ts).
- Configured **Drizzle ORM** with [drizzle.config.ts](file:///Users/xiomay/bloom/apps/api/drizzle.config.ts) and an initial [schema](file:///Users/xiomay/bloom/apps/api/src/db/schema.ts).
- Added [wrangler.toml](file:///Users/xiomay/bloom/apps/api/wrangler.toml) for Cloudflare Workers deployment and D1 binding.

### Web Service (`apps/web`)
- Initialized a **SvelteKit** project using the `cloudflare-pages` adapter.
- Configured [vite.config.ts](file:///Users/xiomay/bloom/apps/web/vite.config.ts) to proxy `/api` requests to the Hono server (port 3000).

## Verification Results

### Drizzle Configuration
I verified that Drizzle is correctly configured by running the migration generator:
```bash
$ bun run db:generate
Reading config file 'drizzle.config.ts'
1 tables: users
[✓] Your SQL migration file ➜ drizzle/0000_harsh_odin.sql 🚀
```

### Script Readiness
- `bun dev` in the root will now start both the SvelteKit frontend and the Hono API.
- The API is configured to run on port 3000, and the Frontend on the default port with a proxy.

## Next Steps
Issue #1 is complete. You can now proceed to **Issue #2: PWA Shell & Base Layout**.
To start development, simply run:
```bash
bun dev
```
