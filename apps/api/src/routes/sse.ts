import { Hono } from 'hono';
import type { Bindings } from '../db/client';
import { getDb } from '../db/client';

const sse = new Hono<{ Bindings: Bindings }>();

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();

sse.get('/status', async (c) => {
  const db = getDb(c.env.DB);

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`));

      const encoder2 = new TextEncoder();
      controller.enqueue(encoder2.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`));
    },
    cancel(controller) {
      clients.delete(controller);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

export function broadcastStatusUpdate(orderId: string, status: string) {
  const encoder = new TextEncoder();
  const data = JSON.stringify({ type: 'status_update', orderId, status, timestamp: Date.now() });
  
  for (const controller of clients) {
    try {
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
    } catch {
      clients.delete(controller);
    }
  }
}

export default sse;