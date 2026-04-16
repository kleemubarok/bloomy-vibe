# Walkthrough: Sync Queue Endpoint (Issue #9)

## Implementation Summary

Issue #9 implements a batch sync endpoint for Bloomy POS, enabling offline-capable clients (IndexedDB) to synchronize their local operations when back online.

## Changes Made

### 1. Merge Library (`apps/api/src/lib/merge.ts`)

Core sync logic with support for multiple entity types:

```typescript
export type SyncOperation = {
  id: string;
  entityType: 'orders' | 'order_items' | 'payments';
  entityId?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  timestamp: number;
};

export type SyncResult = {
  synced: { localId: string; serverId: string }[];
  failed: { localId: string; error: string }[];
};
```

### 2. Sync Route (`apps/api/src/routes/sync.ts`)

Single endpoint for batch processing:

```bash
POST /api/sync
Authorization: Bearer <token>
```

### 3. Route Registration

Added to `apps/api/src/index.ts`:
```typescript
import sync from './routes/sync';
app.route('/api/sync', sync);
```

## Test Results

```bash
$ cd apps/api && bun test src/routes/sync.test.ts

bun test v1.3.12

src/routes/sync.test.ts:
  ✅ Sync Queue API > POST /api/sync > should reject sync without auth
  ✅ Sync Queue API > POST /api/sync > should reject sync without operations array
  ✅ Sync Queue API > POST /api/sync > should return empty result for empty operations
  ✅ Sync Queue API > POST /api/sync > should insert new order via sync
  ✅ Sync Queue API > POST /api/sync > should update existing order via sync (last-write-wins)
  ✅ Sync Queue API > POST /api/sync > should handle partial sync (mixed success and failure)
  ✅ Sync Queue API > POST /api/sync > should insert order item via sync
  ✅ Sync Queue API > POST /api/sync > should insert payment via sync
  ✅ Sync Queue API > POST /api/sync > should batch multiple operations

  9 pass
  0 fail
  30 expect() calls
```

## All Tests Pass

```bash
$ cd apps/api && bun test
32 pass - 85 expect() calls
```

## Example Usage

### Insert Order
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [{
      "id": "local-1",
      "entityType": "orders",
      "entityId": "order-123",
      "operation": "INSERT",
      "payload": {
        "customerName": "John Doe",
        "status": "Antri",
        "orderType": "POS"
      },
      "timestamp": 1704067200000
    }]
  }'
```

### Batch Sync
```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"id": "op-1", "entityType": "orders", "operation": "INSERT", ...},
      {"id": "op-2", "entityType": "order_items", "operation": "INSERT", ...},
      {"id": "op-3", "entityType": "payments", "operation": "INSERT", ...}
    ]
  }'
```

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/lib/merge.ts` | New - Batch sync logic |
| `apps/api/src/routes/sync.ts` | New - Sync endpoint |
| `apps/api/src/routes/sync.test.ts` | New - Test coverage |
| `apps/api/src/index.ts` | Added sync route registration |

## Next Steps

Ready for **Issue #10: Dashboard & Production Tracking UI** which will:
- Build SvelteKit dashboard with Kanban view
- Display order status flow (Antri → Dirangkai → Selesai)
- Integrate with polling/SSE for realtime updates
