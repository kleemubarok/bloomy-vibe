# Walkthrough - Issue #11: POS & Cart Management UI

## Implementation Summary

Issue #11 POS (Point of Sale) & Cart Management UI telah selesai diimplementasikan dengan payment flow.

## Files Created/Modified

### New Files
| File | Description |
|------|-------------|
| `apps/api/src/routes/payments.ts` | Payment recording API |
| `apps/web/src/routes/pos/+page.svelte` | Main POS page |
| `apps/web/src/lib/components/Cart.svelte` | Cart panel with payment modal |
| `apps/web/src/lib/components/ProductGrid.svelte` | Product browser component |
| `apps/web/src/lib/stores/pos.svelte.ts` | Cart state management |
| `docs/issue-11/plan.md` | Implementation plan |
| `docs/issue-11/task.md` | Task checklist |
| `docs/issue-11/walkthrough.md` | This file |

### Modified Files
| File | Changes |
|------|---------|
| `apps/api/src/index.ts` | Added payments route |
| `apps/web/src/lib/api/types.ts` | Added `Product` and `CartItem` types |
| `apps/web/src/lib/api/client.ts` | Added `getProducts()`, `createOrder()`, `holdOrder()`, `checkoutOrder()`, `recordPayment()` |

## Features Implemented

### 1. Product Browser
- Grid layout menampilkan semua produk aktif
- Click untuk tambah ke cart
- Tampilkan nama, kategori, dan harga

### 2. Shopping Cart
- Add/remove/update quantity item
- Total price realtime update
- Customer info form (nama required, WA optional)

### 3. Payment Flow
- **Metode bayar**: Cash, QRIS, Transfer
- **Input jumlah bayar** (untuk Cash)
- **Kalkulasi kembalian** otomatis
- **Payment modal** dengan tombol "Bayar Sekarang"

### 4. Order Flow
- **Hold**: Create order → move to "Antri"
- **Bayar**: 
  1. Create order
  2. Hold (move to "Antri")
  3. Record payment
  4. If Paid → Checkout (inventory deducted, status "Dirangkai")
  5. If Partial → stays "Antri"

## User Flow

```
1. Browse products di grid
2. Click product → added to cart
3. Adjust quantity di cart panel
4. Enter customer name (required)
5. [Hold] → Order status "Antri"
   
ATAU

5. [Bayar] → Payment modal opens
6. Select method (Cash/QRIS/Transfer)
7. If Cash: enter amount paid
8. [Bayar Sekarang]
9. Payment recorded → Checkout if full payment
10. Success modal with change (if cash)
```

## API Integration

| Endpoint | Method | Usage |
|----------|--------|-------|
| `GET /api/products` | GET | Load products untuk grid |
| `POST /api/orders` | POST | Create new order dengan items |
| `POST /api/orders/:id/hold` | POST | Soft-hold order |
| `POST /api/orders/:id/checkout` | POST | Checkout dengan idempotency key |
| `POST /api/payments` | POST | Record payment |

## Payment Flow Details

### Cash Payment
```
1. User enters amount paid
2. System calculates change
3. Payment recorded with amount = amountPaid
4. If amountPaid >= total → status "Paid" → auto checkout
5. If amountPaid < total → status "Partial" → stays "Antri"
```

### QRIS/Transfer Payment
```
1. User selects method
2. Payment recorded with amount = total
3. Status set to "Paid" → auto checkout
```

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

Issue #11 complete with payment flow. Ready for:
- **#12**: Customer Self-Order Form
- **#13**: Thermal Print Layout
