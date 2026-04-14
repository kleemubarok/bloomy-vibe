# Implementation Plan: Drizzle Schema & Migrations (Issue #3)

Implement the core database schema for Bloomy POS. This design focuses on supporting offline-first synchronization, inventory tracking with recipes, and a secure self-order lifecycle.

## User Review Required

> [!IMPORTANT]
> **Currency Handling**: All monetary values (prices, total_amount, balance) will be stored as **Integers** (minor units/sen) to prevent floating-point calculation errors in financial reports.

> [!NOTE]
> **Auto-UUIDs**: Primary keys for transaction-heavy tables (`orders`, `sync_queue`) will use UUIDs (via `crypto.randomUUID()`) to avoid ID collisions during offline-first synchronization.

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.ts](file:///Users/xiomay/bloom/apps/api/src/db/schema.ts)
- Define the following tables:
    - `users`: Staff/Owner management.
    - `inventory`: Raw materials tracking (Stock levels, SKU).
    - `products`: Saleable items (Category, Base Price).
    - `product_recipes`: Many-to-Many mapping of products to inventory requirements.
    - `orders`: Core transaction record (UUID-based, status tracking, HPP snapshot).
    - `order_items`: Individual items within an order.
    - `payments`: Recording payment methods and references.
    - `inventory_log`: Audit trail for stock movements.
    - `sync_queue`: Buffer for offline operations waiting to sync.
- Implement **Strategic Indices** on:
    - `orders.uuid`
    - `inventory.sku`
    - `sync_queue.status`
    - Foreign keys for optimized joins.

### Migrations

#### [NEW] [Migration Files](file:///Users/xiomay/bloom/apps/api/drizzle/)
- Run `bunx drizzle-kit generate` to create the SQL migration scripts.
- Ensure the SQL is compatible with SQLite/D1.

## Open Questions

- **Soft Delete**: Should we implement soft deletes (e.g., `is_deleted` column) for `products` and `inventory` to maintain historical order accuracy? (I recommend this over hard deletion).
- **Timezone**: All timestamps will be stored as UTC integers. Is this acceptable for your local reporting needs?

## Verification Plan

### Automated Tests
- Run `bunx drizzle-kit check:sqlite` to verify schema integrity.
- Run `bunx drizzle-kit generate` and inspect the output SQL.
- **Dry Run Migration**: Push the schema to a local SQLite database to verify constraints.

### Manual Verification
- Review the generated SQL to ensure indices and foreign key constraints are correctly defined.
- Verify that ID generation (UUIDs) works as expected.
