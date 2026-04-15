# Implementation Plan - Issue #7: Order Lifecycle & Checkout Logic

## Overview

Implementasi order lifecycle dengan flow **Draft → Antri → Checkout → Dirangkai**, termasuk kalkulasi HPP snapshot, inventory deduction, dan idempotency handling.

## User Review Required

> [!IMPORTANT]
> **Order Flow**: Order dimulai sebagai `Draft`, bisa diedit. Soft-hold (`/hold`) memindahkan ke `Antri` dan melakukan stock reservation. Checkout (`/checkout`) melakukan hard-deduct dan menghitung HPP snapshot.

> [!IMPORTANT]
> **Idempotency**: Header `Idempotency-Key` wajib untuk checkout. Request duplikat dengan key yang sama akan di-reject atau return 200 dengan status "Already processed".

> [!IMPORTANT]
> **Inventory Logging**: Setiap perubahan stok dicatat ke `inventory_log` dengan `reason: 'Order Sale'` dan `orderId` sebagai referensi.

## Proposed Changes

### [API Component](../../apps/api)

#### [NEW] [orders.ts](../../apps/api/src/routes/orders.ts)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (optional: `?status=Antri`) |
| POST | `/api/orders` | Create order (status: Draft) |
| GET | `/api/orders/:id` | Get order with items |
| PATCH | `/api/orders/:id` | Update order details |
| POST | `/api/orders/:id/hold` | Soft-hold → move to Antri, validate stock |
| POST | `/api/orders/:id/checkout` | Hard-deduct, HPP snapshot, idempotency check |
| DELETE | `/api/orders/:id` | Cancel order (Draft/Antri only) |

#### [NEW] [lib/calc.ts](../../apps/api/src/lib/calc.ts)

```typescript
// Kalkulasi HPP per item
calculateHpp(items: { productId, quantity }[]): CalcResult

// Validasi stok cukup
validateStock(items: { productId, quantity }[]): ValidationResult
```

#### [NEW] [orders.test.ts](../../apps/api/src/routes/orders.test.ts)

Test cases:
- Create draft order
- Soft-hold (move to Antri)
- Reject hold on non-draft
- Checkout with idempotency key
- Reject checkout without idempotency key
- Idempotency duplicate detection
- Inventory deduction & logging
- List & filter orders

#### [MODIFY] [schema.ts](../../apps/api/src/db/schema.ts)
- `orders.totalAmount` → add `.default(0)`

#### [MODIFY] [index.ts](../../apps/api/src/index.ts)
- Register: `app.route('/api/orders', orders)`

## Flow Diagram

```
┌─────────┐     /hold      ┌─────────┐   /checkout   ┌────────────┐
│  Draft  │ ──────────────▶│  Antri  │ ────────────▶│  Dirangkai │
└─────────┘   (reserve)    └─────────┘  (deduct)    └────────────┘
     │                                │
     │                                │
     ▼                                ▼
┌─────────┐                     ┌───────────┐
│  Batal  │                     │inventory_ │
│(delete) │                     │   log    │
└─────────┘                     └───────────┘
```

## Error Handling

| Status | Condition |
|--------|-----------|
| 400 | Missing required fields / invalid status transition |
| 404 | Order not found |
| 409 | Idempotency conflict |
| 422 | Insufficient stock |

## Verification Plan

### Automated Tests
```bash
cd apps/api
bun test src/routes/orders.test.ts
```

### Manual Verification
1. Create draft order dengan items
2. Hold order → cek status berubah ke Antri
3. Checkout → cek status Dirangkai, inventory terdeduct, log terisi
4. Test idempotency: checkout 2x dengan key sama → reject 2nd
5. Test cancel: Batal order Draft/Antri
