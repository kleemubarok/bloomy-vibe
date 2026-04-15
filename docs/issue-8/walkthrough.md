# Walkthrough: Secure Self-Order Link Handler (Issue #8)

## Implementation Summary

Issue #8 implements a secure self-order link system for Bloomy POS, enabling staff to generate confirmation links for customers to complete their flower order details.

## Changes Made

### 1. Database Schema (`apps/api/src/db/schema.ts`)

Added new table for self-order links:

```typescript
export const selfOrderLinks = sqliteTable('self_order_links', {
  id: text('id').primaryKey().$defaultFn(() => uuidv7()),
  uuid: text('uuid').notNull().unique(),
  productId: integer('product_id').notNull().references(() => products.id),
  customerName: text('customer_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  isUsed: integer('is_used', { mode: 'boolean' }).notNull().default(false),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  uuidIdx: index('self_order_links_uuid_idx').on(table.uuid),
}));
```

### 2. Self-Order Routes (`apps/api/src/routes/self-order.ts`)

#### Generate Link (Staff)
```bash
POST /api/self-order/generate
Authorization: Bearer <owner/staff_token>
Body: { productId, customerName, quantity }

Response (201):
{
  "uuid": "abc123...",
  "url": "http://localhost:5173/order/abc123...",
  "expiresAt": "2024-01-02T12:00:00.000Z",
  "product": { "id": 1, "name": "Single Red Rose", "basePrice": 50000 },
  "customerName": "John Doe",
  "quantity": 2
}
```

#### Validate Link (Public)
```bash
GET /api/self-order/:uuid/validate

Response (200 - valid):
{ "valid": true, "product": {...}, "customerName": "...", "quantity": 2 }

Response (403 - expired):
{ "valid": false, "reason": "expired" }

Response (403 - used):
{ "valid": false, "reason": "used" }
```

#### Submit Order (Public - Auto-Hold)
```bash
POST /api/self-order/:uuid
Content-Type: application/json
Body: { messageCard, senderName, deliveryDate, customerWhatsapp }

Response (201):
{
  "message": "Order submitted successfully",
  "orderId": "...",
  "product": { "id": 1, "name": "Single Red Rose", "quantity": 2, "totalAmount": 100000 }
}
```

#### Cancel Order (Staff)
```bash
POST /api/self-order/:id/cancel
Authorization: Bearer <owner/staff_token>

Response (200):
{ "message": "Order cancelled and stock returned" }
```

### 3. Auto-Hold Implementation

When customer submits form:
1. Creates order with status `Antri`
2. Deducts inventory stock
3. Logs inventory changes with reason `Order Sale`
4. Marks link as `isUsed = true`

### 4. Stock Return on Cancel

When order is cancelled:
1. Updates order status to `Batal`
2. Returns reserved stock to inventory
3. Logs inventory changes with reason `Self-Order Cancelled`

## Test Results

```bash
$ cd apps/api && bun test src/routes/self-order.test.ts

bun test v1.3.12

src/routes/self-order.test.ts:
  ✅ Self-Order API > Generate Link > should generate a self-order link
  ✅ Self-Order API > Generate Link > should reject generate without auth
  ✅ Self-Order API > Generate Link > should reject generate with invalid product
  ✅ Self-Order API > Validate Link > should validate a valid link
  ✅ Self-Order API > Validate Link > should reject invalid uuid
  ✅ Self-Order API > Validate Link > should reject used link
  ✅ Self-Order API > Submit Order > should create order and mark link as used
  ✅ Self-Order API > Submit Order > should reject submit without link
  ✅ Self-Order API > Submit Order > should reject duplicate submit
  ✅ Self-Order API > Cancel Order > should cancel order and return stock

  10 pass
  0 fail
  23 expect() calls
```

## All Tests Pass

```bash
$ cd apps/api && bun test
23 pass - 55 expect() calls
```

## Files Changed

| File | Change |
|------|--------|
| `apps/api/src/db/schema.ts` | Added `self_order_links` table |
| `apps/api/src/routes/self-order.ts` | New - Generate/validate/submit/cancel endpoints |
| `apps/api/src/routes/self-order.test.ts` | New - Test coverage |
| `apps/api/src/index.ts` | Added self-order route registration |

## Next Steps

Ready for **Issue #9: Sync Queue Endpoint** which will:
- Accept batch operations from IndexedDB
- Apply last-write-wins or safe merge
- Return synced_ids & failed_ops
