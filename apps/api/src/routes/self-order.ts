import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import * as schema from '../db/schema';
import { getDb, type Bindings } from '../db/client';
import { verifyAuth, requireRole } from '../middleware/guard';
import { validateStock } from '../lib/calc';
import { uuidv7 } from 'uuidv7';

function generateUuid(): string {
  return uuidv7();
}

const selfOrder = new Hono<{ Bindings: Bindings }>();

const LINK_EXPIRY_HOURS = 12;

selfOrder.get('/links', verifyAuth, requireRole(['owner', 'staff', 'superadmin']), async (c) => {
  const db = getDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '50');

  const links = await db
    .select({
      id: schema.selfOrderLinks.id,
      uuid: schema.selfOrderLinks.uuid,
      productId: schema.selfOrderLinks.productId,
      customerName: schema.selfOrderLinks.customerName,
      quantity: schema.selfOrderLinks.quantity,
      expiresAt: schema.selfOrderLinks.expiresAt,
      isUsed: schema.selfOrderLinks.isUsed,
      createdAt: schema.selfOrderLinks.createdAt,
      productName: schema.products.name,
      productPrice: schema.products.basePrice,
    })
    .from(schema.selfOrderLinks)
    .leftJoin(schema.products, eq(schema.selfOrderLinks.productId, schema.products.id))
    .orderBy(desc(schema.selfOrderLinks.createdAt))
    .limit(limit);

  return c.json(links);
});

selfOrder.delete('/links/:id', verifyAuth, requireRole(['owner', 'staff', 'superadmin']), async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env.DB);

  const linkId = parseInt(id);
  if (isNaN(linkId)) {
    throw new HTTPException(400, { message: 'Invalid link ID' });
  }

  const [link] = await db
    .select()
    .from(schema.selfOrderLinks)
    .where(eq(schema.selfOrderLinks.id, linkId))
    .limit(1);

  if (!link) {
    throw new HTTPException(404, { message: 'Link not found' });
  }

  await db
    .delete(schema.selfOrderLinks)
    .where(eq(schema.selfOrderLinks.id, linkId));

  return c.json({ message: 'Link deleted successfully' });
});

selfOrder.post('/generate', verifyAuth, requireRole(['owner', 'staff', 'superadmin']), async (c) => {
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  const { productId, customerName, quantity = 1 } = body;

  if (!productId || !customerName) {
    throw new HTTPException(400, { message: 'productId and customerName are required' });
  }

  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);

  if (!product || product.isDeleted || !product.isActive) {
    throw new HTTPException(400, { message: 'Product not found or inactive' });
  }

  const expiresAt = new Date(Date.now() + LINK_EXPIRY_HOURS * 60 * 60 * 1000);
  const linkUuid = generateUuid();

  const payload = c.get('jwtPayload') as { id?: number } | undefined;

  const [link] = await db.insert(schema.selfOrderLinks).values({
    uuid: linkUuid,
    productId,
    customerName,
    quantity,
    expiresAt,
    createdBy: payload?.id,
  }).returning();

  const baseUrl = process.env.APP_URL || 'http://localhost:5173';
  const fullUrl = `${baseUrl}/order/${linkUuid}`;

  return c.json({
    id: link.id,
    uuid: linkUuid,
    url: fullUrl,
    expiresAt: link.expiresAt,
    product: {
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
    },
    customerName,
    quantity,
    isUsed: false,
  }, 201);
});

selfOrder.get('/:uuid/validate', async (c) => {
  const uuid = c.req.param('uuid') as string;
  const db = getDb(c.env.DB);

  const [link] = await db
    .select()
    .from(schema.selfOrderLinks)
    .where(eq(schema.selfOrderLinks.uuid, uuid))
    .limit(1);

  if (!link) {
    throw new HTTPException(404, { message: 'Link not found' });
  }

  if (link.isUsed) {
    return c.json({ valid: false, reason: 'used' }, 403);
  }

  if (new Date(link.expiresAt) < new Date()) {
    return c.json({ valid: false, reason: 'expired' }, 403);
  }

  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, link.productId))
    .limit(1);

  return c.json({
    valid: true,
    product: product ? {
      id: product.id,
      name: product.name,
      basePrice: product.basePrice,
      category: product.category,
    } : null,
    customerName: link.customerName,
    quantity: link.quantity,
    expiresAt: link.expiresAt,
  });
});

selfOrder.post('/:uuid', async (c) => {
  const uuid = c.req.param('uuid') as string;
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  const [link] = await db
    .select()
    .from(schema.selfOrderLinks)
    .where(eq(schema.selfOrderLinks.uuid, uuid))
    .limit(1);

  if (!link) {
    throw new HTTPException(404, { message: 'Link not found' });
  }

  if (link.isUsed) {
    throw new HTTPException(403, { message: 'Link has already been used' });
  }

  if (new Date(link.expiresAt) < new Date()) {
    throw new HTTPException(403, { message: 'Link has expired' });
  }

  const { messageCard, senderName, deliveryDate, customerWhatsapp } = body;

  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, link.productId))
    .limit(1);

  if (!product) {
    throw new HTTPException(400, { message: 'Product no longer available' });
  }

  const stockValidation = await validateStock(
    db as any,
    [{ productId: link.productId, quantity: link.quantity }]
  );

  if (!stockValidation.valid) {
    return c.json({
      message: 'Insufficient stock',
      details: stockValidation.insufficient
    }, 422);
  }

  await db.transaction(async (tx: any) => {
    const [newOrder] = await tx.insert(schema.orders).values({
      customerName: link.customerName,
      customerWhatsapp: customerWhatsapp || null,
      status: 'Antri',
      orderType: 'Self-Order',
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      messageCard: messageCard || null,
      senderName: senderName || null,
      totalAmount: product.basePrice * link.quantity,
    }).returning();

    if (!newOrder) {
      throw new HTTPException(500, { message: 'Failed to create order' });
    }

    await tx.insert(schema.orderItems).values({
      orderId: newOrder.id,
      productId: link.productId,
      quantity: link.quantity,
      unitPriceAtOrder: product.basePrice,
    });

    const recipes = await tx
      .select({
        inventoryId: schema.productRecipes.inventoryId,
        quantityRequired: schema.productRecipes.quantityRequired,
        stockLevel: schema.inventory.stockLevel,
      })
      .from(schema.productRecipes)
      .innerJoin(schema.inventory, eq(schema.productRecipes.inventoryId, schema.inventory.id))
      .where(eq(schema.productRecipes.productId, link.productId));

    for (const recipe of recipes) {
      const deductQty = recipe.quantityRequired * link.quantity;

      await tx
        .update(schema.inventory)
        .set({ stockLevel: recipe.stockLevel - deductQty })
        .where(eq(schema.inventory.id, recipe.inventoryId));

      await tx.insert(schema.inventoryLog).values({
        inventoryId: recipe.inventoryId,
        changeQty: -deductQty,
        reason: 'Order Sale',
        orderId: newOrder.id,
      });
    }

    await tx
      .update(schema.selfOrderLinks)
      .set({ isUsed: true })
      .where(eq(schema.selfOrderLinks.uuid, uuid));
  });

  const createdOrder = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerName, link.customerName))
    .orderBy(schema.orders.createdAt);

  const latestOrder = createdOrder
    .filter((o: any) => o.orderType === 'Self-Order')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return c.json({
    message: 'Order submitted successfully',
    orderId: latestOrder?.id,
    product: {
      id: product.id,
      name: product.name,
      quantity: link.quantity,
      totalAmount: product.basePrice * link.quantity,
    },
  }, 201);
});

selfOrder.post('/:id/cancel', verifyAuth, async (c) => {
  const id = c.req.param('id');
  const db = getDb(c.env.DB);

  const linkId = parseInt(id);
  if (isNaN(linkId)) {
    throw new HTTPException(400, { message: 'Invalid link ID' });
  }

  const [link] = await db
    .select()
    .from(schema.selfOrderLinks)
    .where(eq(schema.selfOrderLinks.id, linkId))
    .limit(1);

  if (!link) {
    throw new HTTPException(404, { message: 'Link not found' });
  }

  const orders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerName, link.customerName))
    .orderBy(schema.orders.createdAt);

  const latestOrder = orders
    .filter((o: any) => o.orderType === 'Self-Order')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (latestOrder && latestOrder.status === 'Antri') {
    await db.transaction(async (tx: any) => {
      await tx
        .update(schema.orders)
        .set({ status: 'Batal' })
        .where(eq(schema.orders.id, latestOrder.id));

      const items = await tx
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, latestOrder.id));

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
          const returnQty = recipe.quantityRequired * item.quantity;

          await tx
            .update(schema.inventory)
            .set({ stockLevel: recipe.stockLevel + returnQty })
            .where(eq(schema.inventory.id, recipe.inventoryId));

          await tx.insert(schema.inventoryLog).values({
            inventoryId: recipe.inventoryId,
            changeQty: returnQty,
            reason: 'Self-Order Cancelled',
            orderId: latestOrder.id,
          });
        }
      }
    });

    return c.json({ message: 'Order cancelled and stock returned' });
  }

  throw new HTTPException(400, { message: 'No active order to cancel' });
});

export default selfOrder;
