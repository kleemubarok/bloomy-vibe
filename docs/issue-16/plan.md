# Issue #16: SSE Integration (Hono → Frontend)

## Purpose

Real-time dashboard updates using Server-Sent Events without page reload.

## Dependencies

- #10 (Dashboard & Production Tracking UI) - Complete

## Scope

### 1. SSE Endpoint (`src/api/routes/sse.ts`)
- Endpoint `/api/sse/status` 
- Stream order status changes
- Broadcast ke semua connected clients

### 2. Frontend Client (`src/lib/realtime/client.ts`)
- EventSource wrapper
- Auto reconnect on disconnect
- Fallback ke polling 10s bila SSE blocked

### 3. Dashboard Integration
- Connect ke SSE di dashboard mount
- Update order list on event
- Handle disconnect/reconnect gracefully

## Key Files

- `apps/api/src/routes/sse.ts` - SSE endpoint
- `apps/web/src/lib/realtime/client.ts` - Client wrapper

## Acceptance Criteria

- Dashboard update tanpa reload
- Koneksi stabil & graceful fallback saat SSE blocked

## Implementation Steps

1. Create `sse.ts` API endpoint
2. Create `client.ts` EventSource wrapper
3. Integrate di dashboard
4. Add fallback polling