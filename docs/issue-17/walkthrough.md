# Walkthrough: Audit Trail & Profit Viewer (Issue #17)

## Implementation Summary

Issue #17 implements audit trail and profit viewer with three main tabs: Summary, Orders, and Inventory. Includes thermal print functionality for receipts.

## Changes Made

### 1. API Endpoints (`apps/api/src/routes/audit.ts`)

Four new endpoints:

- `GET /api/audit/summary?period=today|yesterday|this_week|this_month|last_month|all` - Revenue, HPP, and profit summary
- `GET /api/audit/orders?page=1&limit=20&q=search` - Paginated orders list with search
- `GET /api/audit/order/:id` - Single order detail with items
- `GET /api/audit/inventory?page=1&limit=20` - Paginated inventory logs
- `GET /api/audit/inventory-log/:id` - Single inventory log with linked order

### 2. Audit Page (`apps/web/src/routes/audit/+page.svelte`)

Three-tab interface:

**Summary Tab:**
- Period dropdown: Today, Yesterday, This Week, This Month, Last Month, All
- Cards showing: Total Orders, Revenue, HPP, Profit

**Orders Tab:**
- Search input with Enter key and button
- Pagination (20 per page)
- Click to open order detail modal
- Order detail shows items and print receipt button
- Shows profit per order (totalAmount - totalHppSnapshot)

**Inventory Tab:**
- Pagination (20 per page)
- Click log with orderId to see linked order
- Non-order logs shown with reduced opacity

### 3. Receipt Component Updates

Updated to handle cases where `unitPriceAtOrder` might be missing:

```svelte
const price = Number(i.unitPriceAtOrder) || Number(i.unitPrice) || 0;
```

### 4. Bug Fixes

- **Timestamp insertion**: Fixed `createdAt` to use `Date.now()` instead of `new Date()` for Drizzle compatibility
- **Search filtering**: Fixed orders search - now uses `inArray` with filtered IDs instead of re-querying all orders
- **Search UI**: Search form now persists when no results found, with "Clear search" button
- **formatCurrency**: Handles NaN values safely

## Files Modified

| File | Change |
|------|--------|
| `apps/api/src/routes/audit.ts` | New audit endpoints |
| `apps/web/src/routes/audit/+page.svelte` | New audit page UI |
| `apps/api/src/routes/orders.ts` | Fixed createdAt insertion |
| `apps/web/src/lib/components/Receipt.svelte` | Added price fallback |
| `apps/web/src/lib/print/utils.ts` | Fixed formatCurrency NaN handling |

## Usage

1. Navigate to `/audit` in the web app
2. **Summary**: Select period from dropdown to view revenue/HPP/profit
3. **Orders**: 
   - Use search to find orders by customer name
   - Click an order to see details
   - Click "Cetak Struk" to print receipt
4. **Inventory**: 
   - View inventory changes with pagination
   - Click logs with order link to see related order

## Test Results

Manual testing:
1. Summary period filter works correctly
2. Orders search filters by customerName
3. Pagination works on both Orders and Inventory
4. Order detail modal shows items with prices
5. Print receipt generates valid 58mm thermal print
6. Inventory logs show linked orders when clicked

## Notes

- `createdAt` stored as Unix timestamp (milliseconds) in database
- Profit calculated as `totalAmount - totalHppSnapshot`
- Search is case-insensitive
- All endpoints require authentication