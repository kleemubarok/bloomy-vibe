import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import * as schema from '../db/schema';
import { getDb, type Bindings } from '../db/client';
import { verifyAuth } from '../middleware/guard';

const payments = new Hono<{ Bindings: Bindings }>();

payments.post('/', verifyAuth, async (c) => {
  const body = await c.req.json();
  const db = getDb(c.env.DB);

  const { orderId, method, amount, reference } = body;

  if (!orderId || !method || !amount) {
    throw new HTTPException(400, { message: 'orderId, method, and amount are required' });
  }

  if (!['Cash', 'QRIS', 'Transfer'].includes(method)) {
    throw new HTTPException(400, { message: 'Invalid payment method' });
  }

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId))
    .limit(1);

  if (!order) {
    throw new HTTPException(404, { message: 'Order not found' });
  }

  const [newPayment] = await db.insert(schema.payments).values({
    orderId,
    method,
    amount,
    reference: reference || null,
  }).returning();

  let paymentStatus: 'Pending' | 'Paid' | 'Partial' = 'Partial';
  if (amount >= order.totalAmount) {
    paymentStatus = 'Paid';
  }

  await db
    .update(schema.orders)
    .set({ 
      paymentStatus,
      updatedAt: new Date()
    })
    .where(eq(schema.orders.id, orderId));

  return c.json({ 
    payment: newPayment,
    paymentStatus,
    message: paymentStatus === 'Paid' ? 'Payment completed' : 'Partial payment recorded'
  }, 201);
});

payments.get('/order/:orderId', verifyAuth, async (c) => {
  const orderId = c.req.param('orderId');
  const db = getDb(c.env.DB);

  const orderPayments = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, orderId));

  return c.json(orderPayments);
});

export default payments;
