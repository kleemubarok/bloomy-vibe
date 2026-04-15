import { Context, Next } from 'hono';
import { jwt } from 'hono/jwt';
import { HTTPException } from 'hono/http-exception';

const JWT_SECRET = 'bloomy-vibe-secret-change-me-in-prod';

export const verifyAuth = (c: Context, next: Next) => {
  return jwt({
    secret: JWT_SECRET,
    alg: 'HS256'
  })(c, next);
};

export type Role = 'superadmin' | 'owner' | 'staff';

export const requireRole = (roles: Role[]) => {
  return async (c: Context, next: Next) => {
    const payload = c.get('jwtPayload');
    
    if (!payload) {
      throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const userRole = payload.role as Role;

    // Superadmin bypasses everything
    if (userRole === 'superadmin') {
      return next();
    }

    if (!roles.includes(userRole)) {
      throw new HTTPException(403, { message: 'Forbidden: Insufficient permissions' });
    }

    await next();
  };
};
