# Implementation Plan - Issue #6: Master Data CRUD

Implement CRUD operations for Inventory, Products, and Product Recipes with proper validation and role-based access control.

## User Review Required

> [!IMPORTANT]
> **Deletion Policy**: Both Inventory and Products will use **Soft Delete** (`isDeleted = true`). Deleted items will be hidden from default lists but remain in the database for historical reference (Issue #7 requirement).
> 
> [!IMPORTANT]
> **Recipe Management**: For the initial version, updating a product's recipe will **replace** all existing recipe mappings for that product. This ensures data consistency without complex diffing logic.
> 
> [!IMPORTANT]
> **Stock Management**: Mutations (including stock level updates) will be restricted to **Owner** and **superadmin** roles for now. This keeps the MVP simple and avoids the complexity of an approval system.

## Proposed Changes

### [API Component](../../apps/api)

#### [NEW] [inventory.ts](../../apps/api/src/routes/inventory.ts)
- `GET /`: List active inventory items.
- `POST /`: Create inventory item.
- `PATCH /:id`: Update details or `stockLevel`.
- `DELETE /:id`: Archive item (`isDeleted = true`).
- **Validation**: Ensure `stockLevel` and `reorderLevel` are not negative.

#### [NEW] [products.ts](../../apps/api/src/routes/products.ts)
- `GET /`: List active products including their recipes (joined with inventory).
- `POST /`: Create product and its associated `product_recipes` in a single transaction.
- `PATCH /:id`: Update product details and replace recipes mapping in a transaction.
- `DELETE /:id`: Archive product.
- **Validation**: Ensure `basePrice` is positive and `quantityRequired` in recipes is > 0.

#### [MODIFY] [index.ts](../../apps/api/src/index.ts)
- Register the new routes: `app.route('/api/inventory', inventory)` and `app.route('/api/products', products)`.

#### [NEW] [issue-5-docs](../../docs/issue-5/walkthrough.md)
- Restore/create basic documentation for Issue #5 since it was merged without docs.

## Open Questions

1. We will keep stock updates restricted to the **Owner** role for now. An approval system can be considered in a later phase if needed.
2. SKU validation will remain basic (uniqueness check) as there are no specific format requirements yet.

## Verification Plan

### Automated Tests
- I will create a `scripts/test-master-data.sh` to verify all CRUD operations via `curl`.

### Manual Verification
1. Create an inventory item (e.g., "Red Rose").
2. Create a product (e.g., "Red Bouquet") using the inventory item in its recipe.
3. Update inventory stock and verify product recipe view reflects it.
4. Try to delete an inventory item that is still part of a recipe (should we prevent this or just warn?).
5. Verify `staff` token cannot perform `POST/PATCH/DELETE`.
