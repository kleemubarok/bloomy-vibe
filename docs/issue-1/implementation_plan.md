# Implementation Plan - Issue #1: Project Init & Config Stack

This plan covers the initial setup of the Bloomy Craft & Service POS (v2) project using Bun, SvelteKit, Hono, and Drizzle in a monorepo structure.

## Architecture

> [!IMPORTANT]
> **Monorepo Structure**:
> - `apps/api`: Hono implementation + Drizzle + D1.
> - `apps/web`: SvelteKit frontend (adapter-cloudflare).
>
> **Development Workflow**:
> - `bun dev` will run both services concurrently.
> - `apps/web` (Vite) will proxy `/api` requests to `localhost:3000` (Hono).

## Proposed Changes

### Project Initialization
- Initialize a monorepo in the root directory using Bun Workspaces.
- Setup TypeScript, ESLint, and Prettier at the root level.

### Dependencies (Root)
- `concurrently` (to run services together).

### API Service (apps/api)
- **Hono**: Basic API setup with `apps/api/wrangler.toml`.
- **Drizzle**: Schema in `apps/api/src/db/schema.ts`, migration in `drizzle/`.
- **D1**: Bind to `bloom-db`.

### Web Service (apps/web)
- **SvelteKit**: Initialized with `adapter-cloudflare`.
- **Vite Proxy**: Configured in `apps/web/vite.config.ts`.

## Verification Plan

### Automated Tests
- `bun dev` starts both apps.
- `curl localhost:5173/api/health` returns status from Hono through the proxy.
- `bunx drizzle-kit generate` works in `apps/api`.

### Manual Verification
- Access SvelteKit at `localhost:5173`.
- Verify D1 local binding with `wrangler d1`.
