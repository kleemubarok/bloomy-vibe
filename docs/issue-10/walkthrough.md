# Walkthrough: Dashboard & Production Tracking UI (Issue #10)

## Implementation Summary

Issue #10 implements the production dashboard for tracking order statuses in real-time with Kanban view.

## Changes Made

### 1. Production Store (`apps/web/src/lib/stores/production.svelte.ts`)

Svelte 5 runes-based reactive store for order state management:

```typescript
export const productionStore = createProductionStore();

// Features:
// - orders: reactive array of Order objects
// - isLoading: loading state indicator
// - error: error message state
// - lastFetched: timestamp of last successful fetch
// - fetchActiveOrders(): fetch orders with status Antri, Dirangkai, Selesai
// - updateOrderStatus(id, newStatus): optimistic update with rollback
// - startPolling(intervalMs): start auto-refresh (default 30s)
// - stopPolling(): stop auto-refresh
// - getOrdersByStatus(status): filter orders by status
```

### 2. API Client (`apps/web/src/lib/api/client.ts`)

Frontend API client for order operations:

```typescript
// Functions:
getOrders(status?: string[]): Promise<Order[]>
getOrder(id: string): Promise<Order & { items: OrderItem[] }>
patchOrder(id, data): Promise<Order>

// Helpers:
getNextStatus(current): { label, status } | null
getStatusColor(status): tailwind classes
```

### 3. OrderCard Component (`apps/web/src/lib/components/OrderCard.svelte`)

Displays order info with expandable details and status action button:

```svelte
<OrderCard order={order} onStatusChange={handleStatusChange} />

// Features:
// - Shows customer name, total amount, status badge
// - Expandable to show order items
// - Message card display for self-orders
// - Status transition button (Mulai Rangkai, Selesai, Serah Terima)
```

### 4. Dashboard Layout (`apps/web/src/routes/dashboard/+layout.svelte`)

Wraps dashboard with header and polling management:

- Dashboard title and last updated timestamp
- Error banner with retry button
- Polling starts on mount, stops on unmount

### 5. Dashboard Page (`apps/web/src/routes/dashboard/+page.svelte`)

Main Kanban board with view toggle:

**Kanban View:**
```
┌─────────────┬─────────────┬─────────────┐
│   Antri     │  Dirangkai  │   Selesai   │
│   (2)       │    (1)      │    (2)      │
├─────────────┼─────────────┼─────────────┤
│ [OrderCard] │ [OrderCard] │ [OrderCard] │
│ [OrderCard] │             │ [OrderCard] │
└─────────────┴─────────────┴─────────────┘
```

**List View:**
Table format with sortable columns.

### 6. Test Coverage (`apps/web/src/routes/dashboard/dashboard.test.ts`)

```bash
$ bun test src/routes/dashboard/dashboard.test.ts

 10 pass | 0 fail
```

## Local Development

### Running API
```bash
cd apps/api
bun run dev  # Bun dev server (SQLite)
# or
bun run dev:prod  # Wrangler with D1
```

### Running Web
```bash
cd apps/web
bun run dev
```

### Seed Dummy Data
```bash
cd apps/api
bun run db:seed
```

## API Integration

### Fetch Orders
```bash
GET /api/orders?status=Antri&status=Dirangkai&status=Selesai
Authorization: Bearer $TOKEN
```

### Update Status
```bash
PATCH /api/orders/:id
Authorization: Bearer $TOKEN
Content-Type: application/json

{ "status": "Dirangkai" }
```

## Status Transitions

| Current Status | Button Label | Next Status |
|----------------|--------------|-------------|
| Antri | Mulai Rangkai | Dirangkai |
| Dirangkai | Selesai | Selesai |
| Selesai | Serah Terima | Diambil |

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/lib/api/client.ts` | New - API client |
| `apps/web/src/lib/api/types.ts` | New - Type definitions |
| `apps/web/src/lib/stores/production.svelte.ts` | New - Production store |
| `apps/web/src/lib/components/OrderCard.svelte` | New - Order card component |
| `apps/web/src/routes/dashboard/+layout.svelte` | New - Layout wrapper |
| `apps/web/src/routes/dashboard/+page.svelte` | New - Main dashboard page |
| `apps/web/src/routes/dashboard/dashboard.test.ts` | New - Unit tests |
| `apps/api/src/db/client.ts` | Modified - Database detection |
| `apps/api/src/db/local.ts` | Modified - Local DB path handling |
| `apps/api/src/db/seed.ts` | Modified - Added dummy orders |
| `apps/api/src/dev.ts` | New - Bun dev server entry point |
| `apps/api/src/lib/calc.ts` | Modified - Removed local DB import |
| `apps/api/src/routes/self-order.ts` | Modified - Removed local DB import |

## Next Steps

Ready for **Issue #16: SSE Integration** which will:
- Replace polling with Server-Sent Events
- Real-time dashboard updates without polling
- Graceful fallback to polling when SSE blocked
