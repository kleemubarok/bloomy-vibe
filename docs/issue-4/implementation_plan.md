# Implementation Plan: Seed Data & Validasi Local (Issue #4)

Implement a robust database seeding system to populate the POS with realistic data (Users, Inventory, Products, and Recipes) and validate the schema relationships.

## User Review Required

> [!IMPORTANT]
> **Local Database Path**: The seed script will target the local SQLite file used by Wrangler dev. If the file doesn't exist yet, it will be initialized. 

> [!NOTE]
> **Data Strategy**: I'll be using realistic "Bloomy Craft" data (Mawar, Bouquet, Wrapping Paper) to ensure the validation step reflects real business scenarios.

## Proposed Changes

### Scripts & Utilities

#### [NEW] [local.ts](file:///Users/xiomay/bloom/apps/api/src/db/local.ts)
- Utility to initialize a Drizzle instance connected to the local SQLite file for use in Bun scripts (seeding, migration verification).

#### [NEW] [seed.ts](file:///Users/xiomay/bloom/apps/api/src/db/seed.ts)
- Seeding logic:
    - **Users**: 1 Owner (owner@bloomy.id), 1 Staff (staf@bloomy.id).
    - **Inventory**: Raw materials (Mawar Merah, Mawar Putih, Kertas Wrapping, Pita Satin).
    - **Products**: Single items (Single Rose) and Bundles (Passion Bouquet).
    - **Recipes**: Detailed material requirements for each product.
- Validation logic:
    - Runs a join query to verify that products are correctly linked to their inventory requirements.

#### [MODIFY] [package.json](file:///Users/xiomay/bloom/apps/api/package.json)
- Add `"db:seed": "bun src/db/seed.ts"` to scripts.

## Open Questions

- **Inventory Stock**: Berapa stok awal yang Abang inginkan untuk data dummy ini? (Default: 100 untuk tiap item).
- **PIN POS**: Apakah ada PIN khusus yang ingin Abang pakai untuk User dummy atau saya pakai default (1234 / 5678)?

## Verification Plan

### Automated Tests
- Run `bun run db:seed`.
- Verify the console output shows successful insertion and the validation join results.

### Manual Verification
- Check the local SQLite file using `drizzle-kit studio` or a SQLite viewer to ensure data is persistent.
