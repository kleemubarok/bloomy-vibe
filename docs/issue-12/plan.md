# Issue #12: Customer Self-Order Form - Implementation Plan

## Overview

Membuat halaman untuk generate self-order link dan form publik untuk customer.

## Flow Utama

```
Inventory → Create Product → Self-Order → Generate Link → Kirim ke Customer
```

## File Structure

```
apps/web/src/routes/self-order/
├── +page.svelte        # Generate link page
apps/web/src/routes/order/[uuid]/
├── +page.svelte        # Public form untuk customer
├── +page.ts           # Validate link
```

## API Integration

| Endpoint | Method | Auth | Usage |
|----------|--------|------|-------|
| `GET /api/products` | GET | Staff+ | List in-stock products |
| `POST /api/self-order/generate` | POST | Staff+ | Generate link |
| `GET /api/self-order/:uuid/validate` | GET | Public | Validate link |
| `POST /api/self-order/:uuid` | POST | Public | Submit form |

## Acceptance Criteria

**Generate Link Page:**
- [ ] Staff can view products
- [ ] Link to `/inventory` for creating new products
- [ ] Generate link with product + quantity + customer
- [ ] Copy link to clipboard

**Public Form (/order/:uuid):**
- [ ] Validate link (valid/expired/used)
- [ ] Show product info
- [ ] Input: message, sender, date, WhatsApp
- [ ] Submit → confirmation

**Navigation:**
- [ ] Add "Self-Order" menu in sidebar
