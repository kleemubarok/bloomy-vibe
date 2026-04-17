# Walkthrough - Issue #11: POS & Cart Management UI

## Implementation Summary

Issue #11 POS (Point of Sale) & Cart Management UI telah selesai diimplementasikan.

## Files Created/Modified

### New Files
| File | Description |
|------|-------------|
| `apps/web/src/routes/pos/+page.svelte` | Main POS page |
| `apps/web/src/lib/components/Cart.svelte` | Cart panel component |
| `apps/web/src/lib/components/ProductGrid.svelte` | Product browser component |
| `apps/web/src/lib/stores/pos.svelte.ts` | Cart state management |
| `docs/issue-11/plan.md` | Implementation plan |
| `docs/issue-11/task.md` | Task checklist |
| `docs/issue-11/walkthrough.md` | This file |

### Modified Files
| File | Changes |
|------|---------|
| `apps/web/src/lib/api/types.ts` | Added `Product` and `CartItem` types |
| `apps/web/src/lib/api/client.ts` | Added `getProducts()`, `createOrder()`, `holdOrder()`, `checkoutOrder()` |

## Features Implemented

### 1. Product Browser
- Grid layout menampilkan semua produk aktif
- Click untuk tambah ke cart
- Tampilkan nama, kategori, dan harga

### 2. Shopping Cart
- Add/remove/update quantity item
- Total price realtime update
- Customer info form (nama required, WA optional)

### 3. Order Flow
- **Hold**: Create order → move to "Antri"
- **Checkout**: Create order → hold → checkout (deduct inventory → status "Dirangkai")

### 4. Error Handling
- 401 redirect to login
- API error display di cart
- Success modal after operations

## User Flow

```
1. Browse products di grid
2. Click product → added to cart
3. Adjust quantity di cart panel
4. Enter customer name (required)
5. [Hold] → Order status "Antri"
   ATAU
   [Checkout] → Inventory deducted, status "Dirangkai"
```

## API Integration

| Endpoint | Usage |
|----------|-------|
| `GET /api/products` | Load products untuk grid |
| `POST /api/orders` | Create new order dengan items |
| `POST /api/orders/:id/hold` | Soft-hold order |
| `POST /api/orders/:id/checkout` | Checkout dengan idempotency key |

## Test Credentials

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@bloomy.id", "pin": "1234"}'
```

## Verification

```bash
# Web build
cd apps/web && bun run build  # ✅ Success

# API tests  
cd apps/api && bun test       # ✅ 32 pass
```

## Next Steps

Issue #11 complete. Ready for:
- **#12**: Customer Self-Order Form
- **#13**: Thermal Print Layout
