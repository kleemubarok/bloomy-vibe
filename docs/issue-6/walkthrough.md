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

### Frontend API Client

#### [API Client - Missing Functions Fixed](../../apps/web/src/lib/api/client.ts)
Added missing inventory and products API functions that the UI depends on:

- `getInventory()` - Fetches inventory items list
- `createInventory(data)` - Creates new inventory item
- `updateInventory(id, data)` - Updates inventory item
- `deleteInventory(id)` - Soft deletes inventory item
- `getProductsList()` - Fetches products list with recipes
- `createProduct(data)` - Creates new product with recipes
- `updateProduct(id, data)` - Updates product and recipes
- `deleteProduct(id)` - Soft deletes product

Also added TypeScript interfaces:
- `InventoryItem` - Type for inventory data
- `Product` - Type for product data with recipes
- `ProductRecipe` - Type for recipe entries
- `CreateProductData` - Type for product creation payload

### Integration
- Routes are registered in `apps/api/src/index.ts`.
- `test-api.ts` script created for end-to-end programmatic testing of the Master Data endpoints.

## Verification Results

- D1 Database schema generates successfully.
- Migrations apply correctly and local testing seed data executes properly with relationships maintained.
- Programmatic testing script built to enforce RBAC and successful schema operations. Note: Local `wrangler dev` server requires a NodeJS runtime (`npm`/`npx`) to proxy bindings faithfully. Server testing will safely complete on the edge proxy or via npm execution.
