import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import * as schema from '../db/schema';
import { getDb, Bindings } from '../db/client';
import { verifyAuth, requireRole } from '../middleware/guard';

const products = new Hono<{ Bindings: Bindings }>();

// List products with their recipes (All roles can view)
products.get('/', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  
  // Fetch products and join with recipes and inventory
  // Since Drizzle relational queries aren't explicitly configured in schema.ts, we use joins
  const results = await db
    .select({
      id: schema.products.id,
      name: schema.products.name,
      slug: schema.products.slug,
      category: schema.products.category,
      basePrice: schema.products.basePrice,
      imageUrl: schema.products.imageUrl,
      isActive: schema.products.isActive,
      recipe: {
        inventoryId: schema.inventory.id,
        inventoryName: schema.inventory.name,
        quantityRequired: schema.productRecipes.quantityRequired,
        unit: schema.inventory.unit,
      }
    })
    .from(schema.products)
    .leftJoin(schema.productRecipes, eq(schema.products.id, schema.productRecipes.productId))
    .leftJoin(schema.inventory, eq(schema.productRecipes.inventoryId, schema.inventory.id))
    .where(eq(schema.products.isDeleted, false));

  // Group by product
  const grouped = results.reduce((acc: any[], curr) => {
    let product = acc.find(p => p.id === curr.id);
    if (!product) {
      product = {
        id: curr.id,
        name: curr.name,
        slug: curr.slug,
        category: curr.category,
        basePrice: curr.basePrice,
        imageUrl: curr.imageUrl,
        isActive: curr.isActive,
        recipes: []
      };
      acc.push(product);
    }
    if (curr.recipe.inventoryId) {
      product.recipes.push(curr.recipe);
    }
    return acc;
  }, []);

  return c.json(grouped);
});

// Create product and recipes mapping (Owner/Superadmin only)
products.post('/', verifyAuth, requireRole(['owner', 'superadmin']), async (c) => {
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  const { name, slug, category, basePrice, imageUrl, isActive, recipes } = body;

  if (!name || !slug || !category || basePrice === undefined) {
    throw new HTTPException(400, { message: 'Missing required fields' });
  }

  // Use a simple sequential approach for MVP; D1 batching could be used for better atomicity
  try {
    const [newProduct] = await db.insert(schema.products).values({
      name,
      slug,
      category,
      basePrice,
      imageUrl,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    if (recipes && Array.isArray(recipes) && recipes.length > 0) {
      const recipeValues = recipes.map((r: any) => ({
        productId: newProduct.id,
        inventoryId: r.inventoryId,
        quantityRequired: r.quantityRequired,
      }));

      await db.insert(schema.productRecipes).values(recipeValues);
    }

    return c.json(newProduct, 201);
  } catch (error: any) {
    console.error('Failed to create product:', error);
    throw new HTTPException(500, { message: 'Failed to create product: ' + error.message });
  }
});

// Update product and recipes mapping (Owner/Superadmin only)
products.patch('/:id', verifyAuth, requireRole(['owner', 'superadmin']), async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  const { recipes, ...productData } = body;

  const [existing] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);

  if (!existing || existing.isDeleted) {
    throw new HTTPException(404, { message: 'Product not found' });
  }

  try {
    // Update product details
    if (Object.keys(productData).length > 0) {
      await db.update(schema.products)
        .set({ ...productData, updatedAt: new Date() })
        .where(eq(schema.products.id, id));
    }

    // Replace recipes if provided
    if (recipes && Array.isArray(recipes)) {
      // Delete existing recipes
      await db.delete(schema.productRecipes)
        .where(eq(schema.productRecipes.productId, id));

      // Insert new recipes
      if (recipes.length > 0) {
        const recipeValues = recipes.map((r: any) => ({
          productId: id,
          inventoryId: r.inventoryId,
          quantityRequired: r.quantityRequired,
        }));
        await db.insert(schema.productRecipes).values(recipeValues);
      }
    }

    return c.json({ message: 'Product updated successfully' });
  } catch (error: any) {
    console.error('Failed to update product:', error);
    throw new HTTPException(500, { message: 'Failed to update product: ' + error.message });
  }
});

// Soft delete product (Owner/Superadmin only)
products.delete('/:id', verifyAuth, requireRole(['owner', 'superadmin']), async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = getDb(c.env.DB);

  const [existing] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);

  if (!existing || existing.isDeleted) {
    throw new HTTPException(404, { message: 'Product not found' });
  }

  await db.update(schema.products)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.products.id, id));

  return c.json({ message: 'Product archived successfully' });
});

export default products;
