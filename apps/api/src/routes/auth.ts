import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { eq, and, gt } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import * as schema from '../db/schema';
import { getDb, Bindings } from '../db/client';
import { uuidv7 } from 'uuidv7';

const auth = new Hono<{ Bindings: Bindings }>();

const JWT_SECRET = 'bloomy-vibe-secret-change-me-in-prod';
const ACCESS_TOKEN_EXP = 3 * 60 * 60; // 3 hours in seconds
const REFRESH_TOKEN_EXP_DAYS = 7;

auth.post('/login', async (c) => {
  const { email, pin } = await c.req.json();
  const db = getDb(c.env.DB);

  if (!email || !pin) {
    throw new HTTPException(400, { message: 'Email and PIN are required' });
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user || user.pin !== pin) {
    throw new HTTPException(401, { message: 'Invalid email or PIN' });
  }

  // 1. Generate Access Token
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXP,
  };
  const accessToken = await sign(payload, JWT_SECRET);

  // 2. Generate Refresh Token
  const refreshTokenValue = uuidv7();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXP_DAYS);

  await db.insert(schema.refreshTokens).values({
    userId: user.id,
    token: refreshTokenValue,
    expiresAt,
  });

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken: refreshTokenValue,
  });
});

auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();
  const db = getDb(c.env.DB);

  if (!refreshToken) {
    throw new HTTPException(400, { message: 'Refresh token is required' });
  }

  const [storedToken] = await db
    .select()
    .from(schema.refreshTokens)
    .where(
      and(
        eq(schema.refreshTokens.token, refreshToken),
        gt(schema.refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!storedToken) {
    throw new HTTPException(401, { message: 'Invalid or expired refresh token' });
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, storedToken.userId))
    .limit(1);

  if (!user) {
    throw new HTTPException(401, { message: 'User not found' });
  }

  // Generate new Access Token
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXP,
  };
  const accessToken = await sign(payload, JWT_SECRET);

  return c.json({ accessToken });
});

auth.post('/logout', async (c) => {
  const { refreshToken } = await c.req.json();
  const db = getDb(c.env.DB);

  if (refreshToken) {
    await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, refreshToken));
  }

  return c.json({ message: 'Logged out successfully' });
});

export default auth;
