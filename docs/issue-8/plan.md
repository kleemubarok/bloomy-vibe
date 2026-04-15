# Implementation Plan - Issue #8: Secure Self-Order Link Handler

## Overview

Implementasi self-order link system yang memungkinkan staff membuatkan link untuk customer melakukan konfirmasi pesanan dengan mengisi message card, alamat pengiriman, dll.

## User Review Notes (Finalized)

> [!IMPORTANT]
> **Auto-hold**: Setelah customer submit form, order langsung di-hold ke status `Antri` dan stok di-reserve. Jika order di-cancel, stok otomatis dikembalikan.

> [!IMPORTANT]
> **Link Expiry**: Default 12 jam setelah link di-generate.

> [!IMPORTANT]
> **Pre-selected Product**: Link hanya untuk 1 produk yang sudah ditentukan oleh staff saat generate.

## Proposed Changes

### [API Component](../../apps/api)

#### [NEW] [self-order.ts](../../apps/api/src/routes/self-order.ts)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/self-order/generate` | Owner/Staff | Generate UUID link (12h expiry) |
| GET | `/api/self-order/:uuid/validate` | Public | Check link valid/expired/used |
| POST | `/api/self-order/:uuid` | Public | Submit form → auto-hold order |
| POST | `/api/self-order/:id/cancel` | Auth | Cancel order & release stock |

#### [MODIFY] [schema.ts](../../apps/api/src/db/schema.ts)
- New table: `self_order_links` (uuid, productId, customerName, quantity, isUsed, expiresAt)

#### [MODIFY] [index.ts](../../apps/api/src/index.ts)
- Register: `app.route('/api/self-order', selfOrder)`

## Flow Diagram

```
Staff                         API                       Customer
  │                           │                           │
  │ POST /generate            │                           │
  │ {productId, qty}         │                           │
  │──────────────────────────>│                           │
  │                           │                           │
  │ {uuid, url, expiresAt}    │                           │
  │<──────────────────────────│                           │
  │                           │                           │
  │ (Share link via WA)       │                           │
  │                           │                           │
  │                           │ GET /validate             │
  │                           │<──────────────────────────│
  │                           │                           │
  │                           │ {valid: true, product}   │
  │                           │──────────────────────────>│
  │                           │                           │
  │                           │ POST /submit              │
  │                           │ {messageCard, sender...}  │
  │                           │<──────────────────────────│
  │                           │                           │
  │                           │ → Create Order (Antri)   │
  │                           │ → Reserve Stock          │
  │                           │ → Mark link used         │
  │                           │                           │
  │                           │ {orderId, confirmation}  │
  │                           │──────────────────────────>│
```

## Validation Rules

| Check | Result |
|-------|--------|
| Link not found | 404 |
| Link expired | 403 { reason: 'expired' } |
| Link already used | 403 { reason: 'used' } |
| Insufficient stock | 422 { details: [...] } |

## Cancel Flow

When `/cancel` is called:
1. Find latest order with matching customerName and orderType='Self-Order'
2. Update status to 'Batal'
3. Return reserved stock to inventory
4. Log in `inventory_log` with reason: 'Self-Order Cancelled'

## Verification Plan

### Automated Tests
```bash
cd apps/api && bun test src/routes/self-order.test.ts
```

### Manual Verification
1. Generate link with productId
2. Validate new link → 200 valid
3. Submit form → 201 order created, status Antri
4. Validate used link → 403 reason: used
5. Try submit again → 403 already used
6. Cancel order → stock returned, inventory_log updated
