# Walkthrough: Order Lifecycle & Checkout Logic (Issue #7)

## Implementation Summary

Issue #7 successfully implements the order lifecycle management for Bloomy POS with proper flow control, inventory deduction, and idempotency handling.

## Changes Made

### 1. Calculation Library (`apps/api/src/lib/calc.ts`)

New library for HPP calculation and stock validation:

```typescript
// Calculate HPP based on product recipes
calculateHpp(items: { productId, quantity }[])

// Validate stock availability before operations
validateStock(items: { productId, quantity }[])
```

### 2. Order Routes (`apps/api/src/routes/orders.ts`)

Full CRUD endpoints with lifecycle management:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET | List orders (filter by `?status=`) |
| `/api/orders` | POST | Create draft order |
| `/api/orders/:id` | GET | Get order with items |
| `/api/orders/:id` | PATCH | Update order |
| `/api/orders/:id/hold` | POST | Soft-hold → Antri status |
| `/api/orders/:id/checkout` | POST | Checkout with idempotency |
| `/api/orders/:id` | DELETE | Cancel order |

### 3. Schema Fix

Changed `orders.totalAmount` to have default value:
```typescript
// Before
totalAmount: integer('total_amount').notNull()

// After
totalAmount: integer('total_amount').notNull().default(0)
```

### 4. Route Registration

Added to `apps/api/src/index.ts`:
```typescript
import orders from './routes/orders';
app.route('/api/orders', orders);
```

## Test Results

```bash
$ cd apps/api && bun test src/routes/orders.test.ts

bun test v1.3.12

src/routes/orders.test.ts:
  ✅ Connected to local database...
  ✅ Order Lifecycle API > Create Order > should create a draft order
  ✅ Order Lifecycle API > Create Order > should reject order without customer name
  ✅ Order Lifecycle API > Soft-Hold (Move to Queue) > should move draft order to Antri status
  ✅ Order Lifecycle API > Soft-Hold (Move to Queue) > should reject hold on non-draft order
  ✅ Order Lifecycle API > Checkout > should checkout order with idempotency key
  ✅ Order Lifecycle API > Checkout > should reject checkout without idempotency key
  ✅ Order Lifecycle API > Checkout > should detect duplicate checkout via idempotency
  ✅ Order Lifecycle API > Inventory Deduction > should deduct inventory on checkout and log it
  ✅ Order Lifecycle API > Order List & Get > should list orders
  ✅ Order Lifecycle API > Order List & Get > should filter orders by status

  10 pass
  0 fail
  25 expect() calls
```

## Order Lifecycle Flow

```
┌─────────┐
│  Draft  │ ← Initial status when order created
└────┬────┘
     │ POST /hold
     ▼
┌─────────┐
│  Antri  │ ← Reserved (soft-hold), waiting for checkout
└────┬────┘
     │ POST /checkout + Idempotency-Key
     ▼
┌────────────┐
│ Dirangkai  │ ← Stock deducted, HPP snapshot saved
└────────────┘
```

## Idempotency Implementation

Checkout requires `Idempotency-Key` header:
- First request → processes checkout, returns 200
- Duplicate request with same key → returns 200 with `message: "Already processed"`
- Request without key → returns 400

```bash
# Valid checkout
curl -X POST /api/orders/:id/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: unique-uuid-123"

# Duplicate detection
curl -X POST /api/orders/:id/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: unique-uuid-123"  # Same key

# Response: { "message": "Already processed", "order": {...} }
```

## Inventory Logging

On checkout, every inventory change is logged:

```typescript
await tx.insert(schema.inventoryLog).values({
  inventoryId: recipe.inventoryId,
  changeQty: -deductQty,
  reason: 'Order Sale',
  orderId: id,
});
```

This enables audit trail for Issue #17 (Audit Trail & Profit Viewer).

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/routes/orders.ts` | New - Order CRUD & lifecycle |
| `apps/api/src/lib/calc.ts` | New - HPP calculation |
| `apps/api/src/routes/orders.test.ts` | New - Test coverage |
| `apps/api/src/db/schema.ts` | Modified - totalAmount default |
| `apps/api/src/index.ts` | Modified - route registration |

## Next Steps

Ready for **Issue #8: Secure Self-Order Link Handler** which will:
- Generate UUID links with expiry
- Validate links before rendering customer form
- Store message cards and sender info
