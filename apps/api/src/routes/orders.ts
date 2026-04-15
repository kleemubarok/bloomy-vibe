import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import * as schema from '../db/schema';
import { getDb, type Bindings } from '../db/client';
import { verifyAuth } from '../middleware/guard';
import { calculateHpp, validateStock } from '../lib/calc';

const orders = new Hono<{ Bindings: Bindings }>();

orders.get('/', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');

  if (status) {
    const results = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.status, status as 'Antri' | 'Dirangkai' | 'Selesai' | 'Diambil' | 'Dikirim' | 'Batal' | 'Draft'))
      .orderBy(desc(schema.orders.createdAt))
      .limit(limit);
    return c.json(results);
  }

  const results = await db
    .select()
    .from(schema.orders)
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit);

  return c.json(results);
});

orders.get('/:id', verifyAuth, async (c) => {
  const id = c.req.param('id') as string;
  const db = getDb(c.env.DB);

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);

  if (!order) {
    throw new HTTPException(404, { message: 'Order not found' });
  }

  const items = await db
    .select({
      id: schema.orderItems.id,
      productId: schema.orderItems.productId,
      productName: schema.products.name,
      quantity: schema.orderItems.quantity,
      unitPriceAtOrder: schema.orderItems.unitPriceAtOrder,
      notes: schema.orderItems.notes,
    })
    .from(schema.orderItems)
    .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
    .where(eq(schema.orderItems.orderId, id));

  return c.json({ ...order, items });
});

orders.post('/', verifyAuth, async (c) => {
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  if (!body.customerName) {
    throw new HTTPException(400, { message: 'Customer name is required' });
  }

  const [newOrder] = await db.insert(schema.orders).values({
    customerName: body.customerName,
    customerWhatsapp: body.customerWhatsapp,
    status: body.status || 'Draft',
    orderType: body.orderType || 'POS',
    deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
    messageCard: body.messageCard,
    senderName: body.senderName,
  }).returning();

  if (body.items && Array.isArray(body.items)) {
    const itemValues = body.items.map((item: { productId: number; quantity: number; unitPriceAtOrder: number; notes?: string }) => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPriceAtOrder: item.unitPriceAtOrder,
      notes: item.notes,
    }));

    await db.insert(schema.orderItems).values(itemValues);
  }

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, newOrder.id));

  const totalAmount = items.reduce(
    (sum: number, item: { unitPriceAtOrder: number; quantity: number }) => sum + item.unitPriceAtOrder * item.quantity,
    0
  );

  if (totalAmount > 0) {
    await db
      .update(schema.orders)
      .set({ totalAmount })
      .where(eq(schema.orders.id, newOrder.id));
  }

  return c.json({ ...newOrder, totalAmount, items }, 201);
});

orders.patch('/:id', verifyAuth, async (c) => {
  const id = c.req.param('id') as string;
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  const [existing] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);

  if (!existing) {
    throw new HTTPException(404, { message: 'Order not found' });
  }

  if (body.items) {
    await db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, id));

    const itemValues = body.items.map((item: { productId: number; quantity: number; unitPriceAtOrder: number; notes?: string }) => ({
      orderId: id,
      productId: item.productId,
      quantity: item.quantity,
      unitPriceAtOrder: item.unitPriceAtOrder,
      notes: item.notes,
    }));

    await db.insert(schema.orderItems).values(itemValues);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status) updateData.status = body.status;
  if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;
  if (body.customerName) updateData.customerName = body.customerName;
  if (body.customerWhatsapp !== undefined) updateData.customerWhatsapp = body.customerWhatsapp;
  if (body.deliveryDate !== undefined) updateData.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : undefined;
  if (body.messageCard !== undefined) updateData.messageCard = body.messageCard;
  if (body.senderName !== undefined) updateData.senderName = body.senderName;

  if (body.items) {
    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, id));
    const totalAmount = items.reduce(
      (sum: number, item: { unitPriceAtOrder: number; quantity: number }) => sum + item.unitPriceAtOrder * item.quantity,
      0
    );
    updateData.totalAmount = totalAmount;
  }

  const [updated] = await db
    .update(schema.orders)
    .set(updateData)
    .where(eq(schema.orders.id, id))
    .returning();

  return c.json(updated);
});

orders.post('/:id/hold', verifyAuth, async (c) => {
  const id = c.req.param('id') as string;
  const db = getDb(c.env.DB);

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);

  if (!order) {
    throw new HTTPException(404, { message: 'Order not found' });
  }

  if (order.status !== 'Draft') {
    throw new HTTPException(400, { message: 'Can only hold orders in Draft status' });
  }

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, id));

  if (items.length === 0) {
    throw new HTTPException(400, { message: 'Order has no items' });
  }

  const stockValidation = await validateStock(
    db as any,
    items.map((i: { productId: number; quantity: number }) => ({ productId: i.productId, quantity: i.quantity }))
  );

  if (!stockValidation.valid) {
    return c.json({ 
      message: 'Insufficient stock',
      details: stockValidation.insufficient
    }, 422);
  }

  await db
    .update(schema.orders)
    .set({ status: 'Antri', updatedAt: new Date() })
    .where(eq(schema.orders.id, id));

  return c.json({ message: 'Order moved to queue and inventory reserved' });
});

orders.post('/:id/checkout', verifyAuth, async (c) => {
  const id = c.req.param('id') as string;
  const idempotencyKey = c.req.header('Idempotency-Key');
  const db = getDb(c.env.DB);

  if (!idempotencyKey) {
    throw new HTTPException(400, { message: 'Idempotency-Key header is required' });
  }

  const existingSync = await db
    .select()
    .from(schema.syncQueue)
    .where(eq(schema.syncQueue.entityId, id))
    .limit(1);

  if (existingSync[0] && existingSync[0].status === 'Synced') {
    const [existingOrder] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    return c.json({ message: 'Already processed', order: existingOrder }, 200);
  }

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);

  if (!order) {
    throw new HTTPException(404, { message: 'Order not found' });
  }

  if (order.status !== 'Antri') {
    throw new HTTPException(400, { message: 'Can only checkout orders in Antri status' });
  }

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, id));

  const hppResult = await calculateHpp(
    db as any,
    items.map((i: { productId: number; quantity: number }) => ({ productId: i.productId, quantity: i.quantity }))
  );

  await db.transaction(async (tx: typeof db) => {
    for (const item of items) {
      const recipes = await tx
        .select({
          inventoryId: schema.productRecipes.inventoryId,
          quantityRequired: schema.productRecipes.quantityRequired,
          stockLevel: schema.inventory.stockLevel,
        })
        .from(schema.productRecipes)
        .innerJoin(schema.inventory, eq(schema.productRecipes.inventoryId, schema.inventory.id))
        .where(eq(schema.productRecipes.productId, item.productId));

      for (const recipe of recipes) {
        const deductQty = recipe.quantityRequired * item.quantity;

        await tx
          .update(schema.inventory)
          .set({ stockLevel: recipe.stockLevel - deductQty })
          .where(eq(schema.inventory.id, recipe.inventoryId));

        await tx.insert(schema.inventoryLog).values({
          inventoryId: recipe.inventoryId,
          changeQty: -deductQty,
          reason: 'Order Sale',
          orderId: id,
        });
      }
    }

    await tx
      .update(schema.orders)
      .set({
        totalHppSnapshot: hppResult.totalHpp,
        priceLockedAt: new Date(),
        status: 'Dirangkai',
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, id));
  });

  await db.insert(schema.syncQueue).values({
    entityType: 'orders',
    entityId: id,
    operation: 'CHECKOUT',
    payload: JSON.stringify({ idempotencyKey }),
    status: 'Synced',
  });

  const [updatedOrder] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);

  return c.json({
    message: 'Checkout successful',
    order: updatedOrder,
    hppSnapshot: hppResult,
  });
});

orders.delete('/:id', verifyAuth, async (c) => {
  const id = c.req.param('id') as string;
  const db = getDb(c.env.DB);

  const [existing] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);

  if (!existing) {
    throw new HTTPException(404, { message: 'Order not found' });
  }

  if (!['Draft', 'Antri'].includes(existing.status)) {
    throw new HTTPException(400, { message: 'Cannot cancel order in current status' });
  }

  await db
    .update(schema.orders)
    .set({ status: 'Batal', updatedAt: new Date() })
    .where(eq(schema.orders.id, id));

  return c.json({ message: 'Order cancelled' });
});

export default orders;
