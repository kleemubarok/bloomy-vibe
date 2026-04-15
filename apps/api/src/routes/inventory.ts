import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import * as schema from '../db/schema';
import { getDb, Bindings } from '../db/client';
import { verifyAuth, requireRole } from '../middleware/guard';

const inventory = new Hono<{ Bindings: Bindings }>();

// List inventory items (All roles can view)
inventory.get('/', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  
  const items = await db
    .select()
    .from(schema.inventory)
    .where(eq(schema.inventory.isDeleted, false));
    
  return c.json(items);
});

// Get single item detail
inventory.get('/:id', verifyAuth, async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = getDb(c.env.DB);
  
  const [item] = await db
    .select()
    .from(schema.inventory)
    .where(
      and(
        eq(schema.inventory.id, id),
        eq(schema.inventory.isDeleted, false)
      )
    )
    .limit(1);
    
  if (!item) {
    throw new HTTPException(404, { message: 'Inventory item not found' });
  }
  
  return c.json(item);
});

// Create inventory item (Owner/Superadmin only)
inventory.post('/', verifyAuth, requireRole(['owner', 'superadmin']), async (c) => {
  const body = await c.req.json();
  const db = getDb(c.env.DB);
  
  // Basic validation
  if (!body.name || !body.unit) {
    throw new HTTPException(400, { message: 'Name and unit are required' });
  }
  
  if (body.stockLevel < 0 || body.reorderLevel < 0) {
    throw new HTTPException(400, { message: 'Stock and reorder levels cannot be negative' });
  }

  const [newItem] = await db.insert(schema.inventory).values({
    name: body.name,
    sku: body.sku,
    unit: body.unit,
    stockLevel: body.stockLevel || 0,
    reorderLevel: body.reorderLevel || 5,
  }).returning();

  return c.json(newItem, 210);
});

// Update inventory item (Owner/Superadmin only)
inventory.patch('/:id', verifyAuth, requireRole(['owner', 'superadmin']), async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  // Check existence
  const [existing] = await db
    .select()
    .from(schema.inventory)
    .where(eq(schema.inventory.id, id))
    .limit(1);

  if (!existing || existing.isDeleted) {
    throw new HTTPException(404, { message: 'Inventory item not found' });
  }

  // Validation
  if (body.stockLevel !== undefined && body.stockLevel < 0) {
    throw new HTTPException(400, { message: 'Stock level cannot be negative' });
  }

  const [updatedItem] = await db
    .update(schema.inventory)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(schema.inventory.id, id))
    .returning();

  return c.json(updatedItem);
});

// Soft delete inventory item (Owner/Superadmin only)
inventory.delete('/:id', verifyAuth, requireRole(['owner', 'superadmin']), async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = getDb(c.env.DB);

  const [existing] = await db
    .select()
    .from(schema.inventory)
    .where(eq(schema.inventory.id, id))
    .limit(1);

  if (!existing || existing.isDeleted) {
    throw new HTTPException(404, { message: 'Inventory item not found' });
  }

  await db
    .update(schema.inventory)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.inventory.id, id));

  return c.json({ message: 'Inventory item archived successfully' });
});

export default inventory;
