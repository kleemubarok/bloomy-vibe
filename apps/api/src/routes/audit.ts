import { Hono } from 'hono';
import { eq, desc, gte, lte, and, sum } from 'drizzle-orm';
import type { Bindings } from '../db/client';
import { getDb } from '../db/client';
import { verifyAuth } from '../middleware/guard';
import * as schema from '../db/schema';

const audit = new Hono<{ Bindings: Bindings }>();

audit.get('/inventory', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '100');

  const logs = await db
    .select({
      id: schema.inventoryLog.id,
      inventoryId: schema.inventoryLog.inventoryId,
      inventoryName: schema.inventory.name,
      changeQty: schema.inventoryLog.changeQty,
      reason: schema.inventoryLog.reason,
      orderId: schema.inventoryLog.orderId,
      createdAt: schema.inventoryLog.createdAt,
    })
    .from(schema.inventoryLog)
    .innerJoin(schema.inventory, eq(schema.inventoryLog.inventoryId, schema.inventory.id))
    .orderBy(desc(schema.inventoryLog.createdAt))
    .limit(limit);

  return c.json(logs);
});

audit.get('/orders', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '100');

  const orders = await db
    .select({
      id: schema.orders.id,
      customerName: schema.orders.customerName,
      totalAmount: schema.orders.totalAmount,
      totalHppSnapshot: schema.orders.totalHppSnapshot,
      paymentStatus: schema.orders.paymentStatus,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .where(eq(schema.orders.paymentStatus, 'Paid'))
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit);

  const ordersWithProfit = orders.map((o) => ({
    ...o,
    profit: o.paymentStatus === 'Paid' && o.totalHppSnapshot ? o.totalAmount - o.totalHppSnapshot : null,
  }));

  return c.json(ordersWithProfit);
});

audit.get('/summary', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);

  const allOrders = await db
    .select({
      totalAmount: schema.orders.totalAmount,
      totalHppSnapshot: schema.orders.totalHppSnapshot,
      paymentStatus: schema.orders.paymentStatus,
    })
    .from(schema.orders);

  const paidOrders = allOrders.filter((o) => o.paymentStatus === 'Paid');

  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalHpp = paidOrders.reduce((sum, o) => sum + (Number(o.totalHppSnapshot) || 0), 0);
  const totalProfit = totalRevenue - totalHpp;

  return c.json({
    totalOrders: paidOrders.length,
    totalRevenue,
    totalHpp,
    totalProfit,
  });
});

export default audit;