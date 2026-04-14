# Walkthrough: Seed Data & Validasi Local (Issue #4)

I have implemented a database seeding system for Bloomy POS, enabling us to populate the local development environment with realistic business data and verify the database relationships.

## Changes Made

### 1. Local Database Setup
- Initialized the local SQLite database using `wrangler d1 execute` to ensure the schema is applied correctly.
- Created `apps/api/src/db/local.ts`, a utility that dynamically finds the active Wrangler SQLite file and connects to it using **`bun:sqlite`**. This allows high-speed database operations from local scripts.

### 2. Seeding Script (`apps/api/src/db/seed.ts`)
Implemented a comprehensive seeding script that populates:
- **Users**: Admin ('Bang Kleem') and Staff, both accessible with PIN `1234`.
- **Inventory**: Raw materials (Mawar Merah, Mawar Putih, etc.) with **random stock levels (10-50)** per your request.
- **Products**: Single items and bundles (e.g., "Red Passion Bouquet").
- **Recipes**: Accurate mapping of products to their raw material requirements.

### 3. Validation
The script ends with a **Validation Join Query** that confirms:
- Products are linked to their ingredients.
- Stock levels are accessible via joins.
- Constraints and foreign keys are working as expected.

## Verification Results

### Seed Output
```bash
$ bun run db:seed
🌱 Seeding database...
✅ Database cleared.
👤 Inserted 2 users.
📦 Inserted 4 inventory items.
🌹 Inserted 2 products.
📜 Inserted product recipes.

🔍 Validating relations (Products -> Recipes -> Inventory):
┌───┬───────────────────┬─────────────┬─────┬─────────┬───────────┐
│   │ product           │ material    │ qty │ unit    │ currStock │
├───┼───────────────────┼─────────────┼─────┼─────────┼───────────┤
│ 0 │ Single Red Rose   │ Mawar Merah │ 1   │ tangkai │ 15        │
│ ...                                                             │
└───┴───────────────────┴─────────────┴─────┴─────────┴───────────┘
✨ Seeding completed successfully!
```

## Documents Saved

Documentation for this issue has been saved to:
- `docs/issue-4/implementation_plan.md`
- `docs/issue-4/task.md`
- `docs/issue-4/walkthrough.md`

> [!TIP]
> You can re-run the seeds anytime using `bun run db:seed` in the `apps/api` folder. It will safely clear the previous data before re-seeding.
