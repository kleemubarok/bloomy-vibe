# Implementation Plan - Issue #9: Sync Queue Endpoint

## Overview

Implementasi endpoint untuk menerima batch operasi dari IndexedDB (offline buffer) dan melakukan sync ke server dengan conflict resolution strategy.

## User Review Notes (Finalized)

> [!IMPORTANT]
> **Batch Processing**: Setiap operasi diproses secara independen. Error pada satu operasi TIDAK menghentikan batch lain (partial success allowed).

> [!IMPORTANT]
> **Conflict Resolution**: Menggunakan Last-Write-Wins (LWW) berdasarkan timestamp. Operasinya atomic per-item.

> [!IMPORTANT]
> **Retry Logic**: Jika operasi gagal, client harus retry manual dengan mengirim ulang operasi yang gagal saja.

## Proposed Changes

### [API Component](../../apps/api)

#### [NEW] [sync.ts](../../apps/api/src/routes/sync.ts)
- `POST /api/sync` - Process batch operations

#### [NEW] [lib/merge.ts](../../apps/api/src/lib/merge.ts)
- `processBatchSync()` - Main batch processor
- `processSyncOperation()` - Per-entity type handler
- `lastWriteWins()` - Timestamp comparison for LWW

#### [NEW] [sync.test.ts](../../apps/api/src/routes/sync.test.ts)
- Test cases untuk INSERT, UPDATE, batch, partial sync

## Request Format

```json
POST /api/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "operations": [
    {
      "id": "local-uuid-1",
      "entityType": "orders",
      "entityId": "server-uuid-1",
      "operation": "UPDATE",
      "payload": { "status": "Selesai" },
      "timestamp": 1704067200000
    },
    {
      "id": "local-uuid-2",
      "entityType": "order_items",
      "operation": "INSERT",
      "payload": { "orderId": "...", "productId": 1, "quantity": 2 }
    }
  ]
}
```

## Response Format

```json
{
  "synced": [
    { "localId": "local-uuid-1", "serverId": "server-uuid-1" },
    { "localId": "local-uuid-2", "serverId": "15" }
  ],
  "failed": [
    { "localId": "local-uuid-3", "error": "Order not found" }
  ]
}
```

## Supported Entities & Operations

| Entity | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|
| orders | ✅ | ✅ | ✅ (soft delete) |
| order_items | ✅ | ✅ | ✅ |
| payments | ✅ | ✅ | - |

## Error Handling

| Scenario | Result |
|----------|--------|
| Entity not found (UPDATE) | `failed` |
| Duplicate INSERT | `failed` |
| Invalid payload | `failed` |
| Missing entityId (UPDATE/DELETE) | `failed` |

## Verification Plan

### Automated Tests
```bash
cd apps/api && bun test src/routes/sync.test.ts
```

### Manual Verification
1. POST empty array → { synced: [], failed: [] }
2. INSERT new order → synced
3. UPDATE existing → synced
4. UPDATE non-existent → failed
5. Batch mixed ops → partial success
6. Multiple entity types → all processed
