import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import auth from './routes/auth';
import { verifyAuth, requireRole } from './middleware/guard';
import { getDb } from './db/client';

const app = new Hono();

// Auth Routes
app.route('/api/auth', auth);

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
