import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export type CalcResult = {
  totalHpp: number;
  itemDetails: {
    productId: number;
    productName: string;
    quantity: number;
    hppPerItem: number;
    lineHpp: number;
  }[];
};

export async function calculateHpp(
  db: DrizzleD1Database,
  items: { productId: number; quantity: number }[]
): Promise<CalcResult> {
  const result: CalcResult = {
    totalHpp: 0,
    itemDetails: [],
  };

  for (const item of items) {
    const product = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, item.productId))
      .limit(1);

    if (!product[0]) continue;

    const recipes = await db
      .select({
        inventoryId: schema.productRecipes.inventoryId,
        quantityRequired: schema.productRecipes.quantityRequired,
        inventoryName: schema.inventory.name,
        unit: schema.inventory.unit,
      })
      .from(schema.productRecipes)
      .innerJoin(
        schema.inventory,
        eq(schema.productRecipes.inventoryId, schema.inventory.id)
      )
      .where(eq(schema.productRecipes.productId, item.productId));

    let hppPerItem = 0;
    for (const recipe of recipes) {
      hppPerItem += recipe.quantityRequired * 1000;
    }

    const lineHpp = hppPerItem * item.quantity;
    result.totalHpp += lineHpp;
    result.itemDetails.push({
      productId: item.productId,
      productName: product[0].name,
      quantity: item.quantity,
      hppPerItem,
      lineHpp,
    });
  }

  return result;
}

export async function validateStock(
  db: DrizzleD1Database,
  items: { productId: number; quantity: number }[]
): Promise<{ valid: boolean; insufficient: { productId: number; productName: string; required: number; available: number }[] }> {
  const insufficient: { productId: number; productName: string; required: number; available: number }[] = [];

  for (const item of items) {
    const product = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, item.productId))
      .limit(1);

    if (!product[0]) continue;

    const recipes = await db
      .select({
        inventoryId: schema.productRecipes.inventoryId,
        quantityRequired: schema.productRecipes.quantityRequired,
        inventoryName: schema.inventory.name,
        stockLevel: schema.inventory.stockLevel,
      })
      .from(schema.productRecipes)
      .innerJoin(
        schema.inventory,
        eq(schema.productRecipes.inventoryId, schema.inventory.id)
      )
      .where(eq(schema.productRecipes.productId, item.productId));

    for (const recipe of recipes) {
      const required = recipe.quantityRequired * item.quantity;
      if (required > recipe.stockLevel) {
        insufficient.push({
          productId: item.productId,
          productName: product[0].name,
          required,
          available: recipe.stockLevel,
        });
      }
    }
  }

  return { valid: insufficient.length === 0, insufficient };
}
