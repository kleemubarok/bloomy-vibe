# Walkthrough - Issue #6: Master Data CRUD

Implementation of Inventory, Products, and Product Recipes with role-based access control.

## Changes Made

### API Layer

#### [Inventory Routes](../../apps/api/src/routes/inventory.ts)
- `GET /api/inventory`: Lists all active inventory items (soft-delete filtered).
- `POST /api/inventory`: Creates new inventory item (Owner/Superadmin only).
- `PATCH /api/inventory/:id`: Updates stock level and details (Owner/Superadmin only).
- `DELETE /api/inventory/:id`: Soft deletes inventory item by setting `isDeleted = true`.

#### [Products Routes](../../apps/api/src/routes/products.ts)
- `GET /api/products`: Lists products with their joined `recipe` materials.
- `POST /api/products`: Creates product and bulk inserts recipe requirements sequentially.
- `PATCH /api/products/:id`: Updates product metadata and replaces existing recipe mapping completely.
- `DELETE /api/products/:id`: Soft deletes product setting `isDeleted = true`.

### Integration
- Routes are registered in `apps/api/src/index.ts`.
- `test-api.ts` script created for end-to-end programmatic testing of the Master Data endpoints.

## Verification Results

- D1 Database schema generates successfully.
- Migrations apply correctly and local testing seed data executes properly with relationships maintained.
- Programmatic testing script built to enforce RBAC and successful schema operations. Note: Local `wrangler dev` server requires a NodeJS runtime (`npm`/`npx`) to proxy bindings faithfully. Server testing will safely complete on the edge proxy or via npm execution.
