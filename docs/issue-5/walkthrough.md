# Walkthrough - Issue #5: Auth & Role Middleware

Implementation of JWT-based authentication and role-based access control (RBAC) for the Bloomy Craft & Service API.

## Changes Made

### API Layer

#### [Auth Route](../../apps/api/src/routes/auth.ts)
- `POST /api/auth/login`: Validates user email and PIN, returns JWT access token and refresh token.
- `POST /api/auth/refresh`: Generates a new access token using a valid refresh token.
- `POST /api/auth/logout`: Revokes the refresh token.

#### [Guard Middleware](../../apps/api/src/middleware/guard.ts)
- `verifyAuth`: Middleware to verify the JWT token in the `Authorization` header.
- `requireRole(roles)`: Middleware to restrict access based on user role (`superadmin`, `owner`, `staff`).

### Integration
- Routes are registered in `apps/api/src/index.ts`.
- Test endpoints added at `/api/test/staff`, `/api/test/owner`, and `/api/test/superadmin`.

## Verification Results

### Login Flow
```bash
# Login as staff
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "staf@bloomy.id", "pin": "1234"}'
```
- Returns 200 OK with `accessToken`.

### Permission Enforcement
- `staff` access to `/api/test/staff`: Success (200).
- `staff` access to `/api/test/owner`: Forbidden (403).
- `superadmin` access to all: Success (200).
