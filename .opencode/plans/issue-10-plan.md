# Plan: Issue #10 - Dashboard & Production Tracking UI

## Overview

Membuat dashboard untuk tracking status produksi order dengan view Kanban (Antri → Dirangkai → Selesai). Fitur ini menjadi dasar untuk integrasi realtime di Issue #16.

## Current State

- **Orders API** (`apps/api/src/routes/orders.ts`):
  - `GET /api/orders?status=` - list orders with status filter
  - `PATCH /api/orders/:id` - update order (including status)
  - Status values: `Draft`, `Antri`, `Dirangkai`, `Selesai`, `Diambil`, `Dikirim`, `Batal`
- **Frontend** (`apps/web/src/`):
  - Svelte 5 with runes syntax (`$state`, `$derived`, `$effect`)
  - Layout with nav links to `/dashboard` (ready, not implemented)
  - `app.svelte.ts` store for online status
  - No realtime mechanism yet (will use polling initially)

## Files to Create/Modify

### 1. Production Store (`apps/web/src/lib/stores/production.svelte.ts`)

```typescript
// Reactive store for orders state management
interface ProductionState {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

// Functions:
// - fetchOrders(status?: string[]) - fetch orders from API
// - updateOrderStatus(id, newStatus) - update single order status
// - pollOrders(intervalMs) - start polling
// - stopPolling() - stop polling
```

### 2. API Client (`apps/web/src/lib/api/client.ts`)

```typescript
// Extend existing API patterns for order operations
// - getOrders(status?: string[]): Promise<Order[]>
// - patchOrder(id, data): Promise<Order>
```

### 3. Dashboard Page (`apps/web/src/routes/dashboard/+page.svelte`)

**UI Components:**
- View toggle: Kanban / List
- Kanban columns: Antri | Dirangkai | Selesai
- Order cards showing: customer name, item count, time
- Status update buttons on cards
- Loading skeleton during fetch
- Error state with retry button
- Empty state per column

**Interactions:**
- Click card → expand/show details
- Click status button → PATCH status via API
- Auto-refresh every 30 seconds (polling)
- Pull-to-refresh gesture on mobile

### 4. Dashboard Layout (`apps/web/src/routes/dashboard/+layout.svelte`)

```typescript
// Server-side data loading for initial orders
// Load orders with status in [Antri, Dirangkai, Selesai]
```

### 5. Order Card Component (`apps/web/src/lib/components/OrderCard.svelte`)

```svelte
// Props: order, onStatusChange
// Shows: customer, item count, time, action buttons
// Actions: Next status button, expand for details
```

### 6. Tests (`apps/web/src/routes/dashboard/dashboard.test.ts`)

```typescript
// Test cases:
// - Dashboard loads and displays orders
// - Kanban view shows correct columns
// - Status update works
// - Loading state displays correctly
// - Error state handles gracefully
```

## Acceptance Criteria Checklist

- [ ] Orders dengan status `Antri`, `Dirangkai`, `Selesai` tampil di dashboard
- [ ] View Kanban dengan 3 kolom berfungsi
- [ ] Status order bisa diupdate via button click
- [ ] UI update setelah status berubah
- [ ] Loading state tampil saat fetch
- [ ] Error state dengan retry button
- [ ] Polling refresh setiap 30 detik
- [ ] Responsive design (mobile friendly)

## Technical Notes

### Polling Strategy (Before SSE #16)

```typescript
// Start polling on mount
const pollInterval = setInterval(() => {
  fetchOrders();
}, 30000);

// Cleanup on unmount
onDestroy(() => clearInterval(pollInterval));
```

### Status Transitions for Buttons

| Current Status | Button Label | Next Status |
|----------------|--------------|-------------|
| Antri | "Mulai Rangkai" | Dirangkai |
| Dirangkai | "Selesai" | Selesai |
| Selesai | "Serah Terima" | Diambil/Dikirim |

### API Integration

```bash
# Fetch active production orders
GET /api/orders?status=Antri&status=Dirangkai&status=Selesai
Authorization: Bearer $TOKEN

# Update status
PATCH /api/orders/:id
Authorization: Bearer $TOKEN
Content-Type: application/json

{ "status": "Dirangkai" }
```

## Execution Order

1. Create `production.svelte.ts` store
2. Create/update API client for orders
3. Create `OrderCard.svelte` component
4. Create dashboard layout with server loading
5. Create dashboard page with Kanban view
6. Add loading/error states
7. Implement polling mechanism
8. Add tests
9. Run typecheck and lint

## Estimated Complexity

**Medium** - Standard CRUD UI with state management. Main complexity adalah:
- Svelte 5 runes patterns
- Responsive Kanban layout
- Polling lifecycle management
