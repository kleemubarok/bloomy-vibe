# Walkthrough: Drizzle Schema & Migrations (Issue #3)

I have successfully designed and implemented the full database schema for Bloomy POS. This covers inventory, products, order lifecycle, and offline-first synchronization.

## Changes Made

### 1. Database Schema (`apps/api/src/db/schema.ts`)
Implemented 9 core tables with strategic indexing and relations:
- **`inventory`**: Tracks raw materials with stock levels and soft delete support.
- **`products`**: Saleable items with slug-based indexing and soft delete.
- **`product_recipes`**: Linking inventory materials to finished products.
- **`orders`**: Transaction shell using **UUIDv7** for time-ordered IDs. Includes snapshots for HPP (COGS) and price locking.
- **`order_items` & `payments`**: Detailed transaction data.
- **`inventory_log`**: Comprehensive audit trail for all stock movements.
- **`sync_queue`**: Offline-first buffer using **UUIDv7**.

### 2. ID & Currency Strategy
- **UUIDv7**: Used for `orders` and `sync_queue` to ensure time-ordered, collision-free IDs even during offline operations.
- **Integers for Currency**: All monetary values are stored in minor units (e.g., cents/sen) to prevent rounding errors.

### 3. Localization (+7 Jakarta Time)
- Created date helpers in both `apps/api` and `apps/web` to automatically convert UTC database timestamps to **Jakarta Time (+7)** for the UI.

### 4. Migrations
- Successfully generated migration `0001_fine_harry_osborn.sql`.
- Verified SQL compatibility with Cloudflare D1 (SQLite).

## Documents Saved

All project documentation for this issue has been saved to the repository:
- `docs/issue-3/implementation_plan.md`
- `docs/issue-3/task.md`
- `docs/issue-3/walkthrough.md`

> [!TIP]
> You can inspect the generated SQL in `apps/api/drizzle/0001_fine_harry_osborn.sql` to see the exact table structures and indices.
