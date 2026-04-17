# Issue #11: POS & Cart Management UI - Implementation Plan

## Overview

Membangun halaman Point of Sale (POS) untuk membuat order baru dengan fitur shopping cart, soft-hold order, dan checkout.

## Dependencies

- **Issue #5** - Auth middleware (required for API access)
- **Issue #7** - Order Lifecycle & Checkout Logic (backend API)

## Scope

### Core Features (MVP)

1. **Product Browser** - Grid/list produk dengan harga
2. **Shopping Cart** - Tambah, update qty, hapus item
3. **Customer Info** - Input nama (minimal) dan WA opsional
4. **Soft-Hold** - Pindah order ke status "Antri"
5. **Checkout** - Hard-deduct inventory, set status "Dirangkai"
6. **Error Handling** - 401 redirect, API error display

### Optional (Future)

- Quick number pad
- Product search/filter
- Print preview

## File Structure

```
apps/web/src/
├── routes/pos/
│   └── +page.svelte          # POS main page
├── lib/
│   ├── components/
│   │   ├── Cart.svelte       # Cart panel
│   │   └── ProductGrid.svelte # Product browser
│   ├── stores/
│   │   └── pos.svelte.ts     # Cart state management
│   └── api/
│       ├── client.ts         # Add new API functions
│       └── types.ts          # Add Product type
```

## Data Flow

```
1. User browse products
2. Click product → add to cart (default qty 1)
3. Adjust qty in cart
4. Enter customer info (name required)
5. [Hold] → Order status = "Antri"
6. [Checkout] → Inventory deducted, status = "Dirangkai"
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/products` | GET | List active products |
| `/api/orders` | POST | Create new order |
| `/api/orders/:id/hold` | POST | Soft-hold order |
| `/api/orders/:id/checkout` | POST | Checkout with inventory deduct |

## Acceptance Criteria

- [ ] Cart supports multiple items with quantity adjustment
- [ ] Total price updates in real-time
- [ ] Customer name required before hold
- [ ] Hold order → status "Antri"
- [ ] Checkout → inventory deducted, status "Dirangkai"
- [ ] 401 handling → redirect to login
- [ ] Idempotency key for checkout

## Verification

```bash
cd apps/web && bun run build
cd apps/api && bun test
```
