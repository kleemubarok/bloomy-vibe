import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import type { Bindings } from '../db/client';
import { getDb } from '../db/client';
import { verifyAuth } from '../middleware/guard';
import * as schema from '../db/schema';

const audit = new Hono<{ Bindings: Bindings }>();

audit.get('/inventory', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '100');
  const fromDate = c.req.query('from');
  const toDate = c.req.query('to');

  let query = db
    .select()
    .from(schema.inventoryLog)
    .leftJoin(schema.inventory, eq(schema.inventoryLog.inventoryId, schema.inventory.id))
    .orderBy(desc(schema.inventoryLog.createdAt))
    .limit(limit);

  const logs = await query;

  const mapped = logs.map((l: any) => ({
    id: l.inventory_log.id,
    inventoryId: l.inventory_log.inventoryId,
    name: l.inventory?.name || 'Unknown',
    unit: l.inventory?.unit || '',
    stockLevel: l.inventory?.stockLevel || 0,
    changeQty: l.inventory_log.changeQty,
    reason: l.inventory_log.reason,
    orderId: l.inventory_log.orderId,
    createdAt: l.inventory_log.createdAt,
  }));

  return c.json(mapped);
});

audit.get('/orders', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '100');

  try {
    const orders = await db
      .select({
        id: schema.orders.id,
        customerName: schema.orders.customerName,
        customerWhatsapp: schema.orders.customerWhatsapp,
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

    const ordersWithItems = await Promise.all(orders.map(async (o: any) => {
      const items = await db
        .select({
          productName: schema.orderItems.productName,
          quantity: schema.orderItems.quantity,
          unitPrice: schema.orderItems.unitPrice,
          totalPrice: schema.orderItems.totalPrice,
        })
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, o.id));

      return {
        id: o.id,
        customerName: o.customerName,
        customerWhatsapp: o.customerWhatsapp,
        totalAmount: o.totalAmount,
        totalHppSnapshot: o.totalHppSnapshot,
        paymentStatus: o.paymentStatus,
        status: o.status,
        createdAt: o.createdAt,
        items: items.map((i: any) => ({
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
        profit: o.paymentStatus === 'Paid' && o.totalHppSnapshot ? Number(o.totalAmount) - Number(o.totalHppSnapshot) : null,
      };
    }));

    return c.json(ordersWithItems);
  } catch (e) {
    console.error('Audit orders error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

audit.get('/summary', verifyAuth, async (c) => {
  const db = getDb(c.env.DB);
  const fromDate = c.req.query('from');
  const toDate = c.req.query('to');

  try {
    let query = db
      .select({
        totalAmount: schema.orders.totalAmount,
        totalHppSnapshot: schema.orders.totalHppSnapshot,
        paymentStatus: schema.orders.paymentStatus,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(eq(schema.orders.paymentStatus, 'Paid'));

    const allOrders = await query;

    let filteredOrders = allOrders;
    if (fromDate || toDate) {
      filteredOrders = allOrders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        if (fromDate && orderDate < new Date(fromDate)) return false;
        if (toDate && orderDate > new Date(toDate)) return false;
        return true;
      });
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalHpp = filteredOrders.reduce((sum, o) => sum + (Number(o.totalHppSnapshot) || 0), 0);
    const totalProfit = totalRevenue - totalHpp;

    return c.json({
      totalOrders: filteredOrders.length,
      totalRevenue,
      totalHpp,
      totalProfit,
      fromDate,
      toDate,
    });
  } catch (e) {
    console.error('Audit summary error:', e);
    return c.json({ error: String(e) }, 500);
  }
});

export default audit;