import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import auth from './routes/auth';
import inventory from './routes/inventory';
import products from './routes/products';
import orders from './routes/orders';
import { verifyAuth, requireRole } from './middleware/guard';
import { getDb } from './db/client';

import { HTTPException } from 'hono/http-exception';

const app = new Hono();

app.onError((err, c) => {
  console.error('Hono Error:', err.message);
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  return c.json({ message: 'Internal Server Error' }, 500);
});

// Auth Routes
app.route('/api/auth', auth);

// Master Data Routes
app.route('/api/inventory', inventory);
app.route('/api/products', products);

// Order Routes
app.route('/api/orders', orders);

// Public Health Check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'bloom-api' });
});

// Protected Test Routes
app.get('/api/test/staff', verifyAuth, requireRole(['staff']), (c) => {
  return c.json({ message: 'Staff access granted' });
});

app.get('/api/test/owner', verifyAuth, requireRole(['owner']), (c) => {
  return c.json({ message: 'Owner access granted' });
});

app.get('/api/test/superadmin', verifyAuth, requireRole(['superadmin']), (c) => {
  return c.json({ message: 'Super Admin access granted' });
});

export default app;
