# Implementation Plan - Issue #5: Frontend Auth Integration

## Overview

Implementasi frontend authentication layer yang menghubungkan antara login form dan backend API yang sudah ada (Issue #5 backend).

## User Review Notes (from task description)

> [!IMPORTANT]
> **Token Storage**: Gunakan `sessionStorage` (bukan `localStorage`) sesuai task requirement.

> [!IMPORTANT]
> **Middleware**: Semua route terproteksi kecuali `/login` dan `/order/*` (public self-order).

> [!IMPORTANT]
> **401 Handling**: Auto-redirect ke `/login` saat token expired/invalid.

## Proposed Changes

### [Web Component](../../apps/web)

#### [MODIFY] [client.ts](../../apps/web/src/lib/api/client.ts)
- Change `localStorage` → `sessionStorage`
- Add `setAuthToken()`, `removeAuthToken()`, `isAuthenticated()`
- Add `login(pin)` function
- Add `logout()` function
- Add 401 handler → auto redirect

#### [NEW] [login/+page.svelte](../../apps/web/src/routes/login/+page.svelte)
- PIN input form
- Call `login()` wrapper
- Store token → redirect `/dashboard`
- Error handling display

#### [MODIFY] [+layout.svelte](../../apps/web/src/routes/+layout.svelte)
- Add auth check in `onMount`
- Redirect to `/login` if not authenticated
- Add Logout button in header

## Flow Diagram

```
User access /dashboard
        ↓
Check sessionStorage.getItem('auth_token')
        ↓
Not found → redirect /login
        ↓
Found → allow access
        ↓
POST /api/auth/login
        ↓
Success → setAuthToken() → redirect /dashboard
        ↓
Error → show error message
```

## API Client Methods

```typescript
// Login
login(pin: string): Promise<{ token, user }>

// Check auth status
isAuthenticated(): boolean

// Logout
logout(): void

// Auto-attached in all requests
fetchWithAuth(url, options)
```

## Protected Routes

| Route | Status |
|-------|--------|
| `/login` | Public (redirect if already logged in) |
| `/order/*` | Public (self-order) |
| `/*` | Protected (require auth) |

## Verification Plan

### Manual Verification
1. Access `/dashboard` without token → redirect `/login`
2. Login with valid PIN → token stored → `/dashboard` accessible
3. Logout → token removed → redirect `/login`
4. API request without auth → 401 → redirect `/login`

### Build Verification
```bash
cd apps/web && bun run build
```