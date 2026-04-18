import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import auth from './routes/auth';
import audit from './routes/audit';
import inventory from './routes/inventory';
import products from './routes/products';
import orders from './routes/orders';
import payments from './routes/payments';
import selfOrder from './routes/self-order';
import sync from './routes/sync';
import { verifyAuth, requireRole } from './middleware/guard';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

app.onError((err, c) => {
  console.error('Hono Error:', err.message);
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  return c.json({ message: 'Internal Server Error' }, 500);
});

// Swagger UI
app.get('/docs', swaggerUI({ url: '/api/swagger' }));

// Swagger JSON Spec
app.get('/api/swagger', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Bloomy Vibe API',
      version: '1.0.0',
      description: 'API for Bloomy Craft & Service POS'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local Development' }
    ],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with email and PIN',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'owner@bloomy.id' },
                    pin: { type: 'string', example: '1234' }
                  },
                  required: ['email', 'pin']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  example: {
                    user: { id: 1, name: 'Bang Kleem', role: 'owner' },
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    refreshToken: 'abc-123-def-456'
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials',
              content: { 'application/json': { example: { message: 'Invalid email or PIN' } } }
            }
          }
        }
      },
      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'Get all active products',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of products',
              content: {
                'application/json': {
                  example: [{
                    id: 1,
                    name: 'Single Red Rose',
                    slug: 'single-red-rose',
                    category: 'flower',
                    basePrice: 25000,
                    isActive: true,
                    recipes: [{ inventoryId: 1, inventoryName: 'Mawar Merah', quantityRequired: 1, unit: 'tangkai' }]
                  }]
                }
              }
            }
          }
        },
        post: {
          tags: ['Products'],
          summary: 'Create new product (Owner+)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    category: { type: 'string' },
                    basePrice: { type: 'number' },
                    recipes: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'Product created' },
            '400': { description: 'Missing required fields' },
            '403': { description: 'Forbidden: Insufficient permissions' }
          }
        }
      },
      '/api/orders': {
        get: {
          tags: ['Orders'],
          summary: 'Get all orders',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status (can use multiple)' }
          ],
          responses: {
            '200': {
              description: 'List of orders',
              content: {
                'application/json': {
                  example: [{
                    id: 'abc-123',
                    customerName: 'Sarah Wijaya',
                    totalAmount: 350000,
                    status: 'Antri',
                    paymentStatus: 'Pending',
                    orderType: 'POS'
                  }]
                }
              }
            }
          }
        },
        post: {
          tags: ['Orders'],
          summary: 'Create new order (Draft)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    customerName: { type: 'string' },
                    customerWhatsapp: { type: 'string' },
                    orderType: { type: 'string', enum: ['POS', 'Self-Order'] },
                    deliveryDate: { type: 'string', format: 'date-time' },
                    items: { type: 'array', items: { type: 'object' } }
                  },
                  required: ['customerName', 'items']
                }
              }
            }
          },
          responses: {
            '201': { description: 'Order created' },
            '400': { description: 'Customer name is required' }
          }
        }
      },
      '/api/orders/{id}/hold': {
        post: {
          tags: ['Orders'],
          summary: 'Soft-hold order (Draft → Antri)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Order moved to queue', content: { 'application/json': { example: { message: 'Order moved to queue and inventory reserved' } } } },
            '400': { description: 'Can only hold orders in Draft status' },
            '422': { description: 'Insufficient stock' }
          }
        }
      },
      '/api/orders/{id}/checkout': {
        post: {
          tags: ['Orders'],
          summary: 'Checkout order (Antri → Dirangkai)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Checkout successful' },
            '400': { description: 'Can only checkout orders in Antri status' }
          }
        }
      },
      '/api/payments': {
        post: {
          tags: ['Payments'],
          summary: 'Record payment for order',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orderId: { type: 'string' },
                    method: { type: 'string', enum: ['Cash', 'QRIS', 'Transfer'] },
                    amount: { type: 'number' }
                  },
                  required: ['orderId', 'method', 'amount']
                }
              }
            }
          },
          responses: {
            '201': { description: 'Payment recorded' },
            '400': { description: 'Invalid payment method' }
          }
        }
      },
      '/api/self-order/links': {
        get: {
          tags: ['Self-Order'],
          summary: 'Get all self-order links (Staff+)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of links',
              content: {
                'application/json': {
                  example: [{
                    id: 'uuid-link',
                    uuid: 'customer-link-uuid',
                    productName: 'Red Passion Bouquet',
                    customerName: 'Sarah',
                    quantity: 1,
                    expiresAt: '2024-01-15T22:00:00.000Z',
                    isUsed: false
                  }]
                }
              }
            }
          }
        }
      },
      '/api/self-order/generate': {
        post: {
          tags: ['Self-Order'],
          summary: 'Generate self-order link (Staff+)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    productId: { type: 'number' },
                    quantity: { type: 'number' },
                    customerName: { type: 'string' }
                  },
                  required: ['productId', 'customerName']
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Link generated',
              content: {
                'application/json': {
                  example: {
                    id: 'uuid-link',
                    uuid: 'customer-link-uuid',
                    url: 'http://localhost:5173/order/customer-link-uuid',
                    expiresAt: '2024-01-15T22:00:00.000Z',
                    product: { id: 2, name: 'Red Passion Bouquet', basePrice: 350000 },
                    customerName: 'Sarah',
                    quantity: 1,
                    isUsed: false
                  }
                }
              }
            }
          }
        }
      },
      '/api/self-order/{uuid}/validate': {
        get: {
          tags: ['Self-Order'],
          summary: 'Validate self-order link (Public)',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Link valid', content: { 'application/json': { example: { valid: true, product: { id: 2, name: 'Red Passion Bouquet', basePrice: 350000 }, customerName: 'Sarah', quantity: 1, expiresAt: '2024-01-15T22:00:00.000Z' } } } },
            '403': { description: 'Link expired or used' },
            '404': { description: 'Link not found' }
          }
        }
      },
      '/api/self-order/{uuid}': {
        post: {
          tags: ['Self-Order'],
          summary: 'Submit self-order (Public)',
          parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    messageCard: { type: 'string' },
                    senderName: { type: 'string' },
                    deliveryDate: { type: 'string', format: 'date-time' },
                    customerWhatsapp: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '201': { description: 'Order submitted' },
            '403': { description: 'Link expired or used' },
            '404': { description: 'Link not found' }
          }
        }
      },
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            '200': { description: 'API is healthy', content: { 'application/json': { example: { status: 'ok', service: 'bloom-api' } } } }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  });
});

// Auth Routes
app.route('/api/auth', auth);

// Master Data Routes
app.route('/api/inventory', inventory);
app.route('/api/products', products);

// Order Routes
app.route('/api/orders', orders);

// Payment Routes
app.route('/api/payments', payments);

// Self-Order Routes
app.route('/api/self-order', selfOrder);

// Sync Routes
app.route('/api/sync', sync);

// Audit Routes
app.route('/api/audit', audit);

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
