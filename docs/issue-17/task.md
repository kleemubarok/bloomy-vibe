# Issue #17: Audit Trail & Profit Viewer

## Purpose

Halaman riwayat inventory_log + ringkasan profit per order dengan print thermal 58mm.

## Dependencies

- #13 (Thermal Print Layout) - Complete
- #10 (Dashboard & Production Tracking UI) - Complete

## Scope

### 1. Summary Tab
- Dropdown: Today / Yesterday / This Week / This Month / Last Month / All
- Tampilkan: Total Orders, Revenue, HPP, Profit

### 2. Orders Tab
- Pagination (20/page)
- Search by customer name
- Click untuk detail order
- Detail: items list, total, profit
- Print struk button (thermal 58mm)

### 3. Inventory Tab
- Pagination (20/page)
- Click untuk lihat linked order

## Key Files

- `apps/api/src/routes/audit.ts` - API endpoints
- `apps/web/src/routes/audit/+page.svelte` - Audit page UI
- `apps/web/src/lib/components/Receipt.svelte` - Receipt component

## Acceptance Criteria

1. Summary tab shows correct totals per period
2. Orders can be searched by customer name
3. Order detail shows items with prices and profit
4. Receipt prints correctly at 58mm width
5. Inventory logs show linked orders

## Implementation Steps

1. Create `/api/audit/summary` endpoint with period filter
2. Create `/api/audit/orders` endpoint with pagination + search
3. Create `/api/audit/order/:id` endpoint for order detail
4. Create `/api/audit/inventory` endpoint with pagination
5. Create `/api/audit/inventory-log/:id` endpoint for linked order
6. Build audit page UI with three tabs
7. Integrate receipt printing in order detail
8. Fix createdAt timestamp handling in database
9. Fix search filtering bug