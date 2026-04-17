# Bloomy Vibe API Documentation

## Overview

- **Base URL**: `http://localhost:3000/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`

---

## Authentication

### POST /auth/login

Login dengan email dan PIN.

**Request:**
```json
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@bloomy.id",
  "pin": "1234"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Bang Kleem",
    "role": "owner"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc-123-def-456"
}
```

**Response (401):**
```json
{
  "message": "Invalid email or PIN"
}
```

---

### POST /auth/refresh

Refresh access token.

**Request:**
```json
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "abc-123-def-456"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /auth/logout

Logout dan revoke refresh token.

**Request:**
```json
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "abc-123-def-456"
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## Products

### GET /products

Ambil semua produk aktif.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Single Red Rose",
    "slug": "single-red-rose",
    "category": "flower",
    "basePrice": 25000,
    "imageUrl": "/images/products/single-red-rose.png",
    "isActive": true,
    "recipes": [
      {
        "inventoryId": 1,
        "inventoryName": "Mawar Merah",
        "quantityRequired": 1,
        "unit": "tangkai"
      }
    ]
  }
]
```

---

### POST /products

Buat produk baru. **Hanya owner/superadmin.**

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
POST /api/products
Content-Type: application/json

{
  "name": "Mixed Bouquet",
  "slug": "mixed-bouquet",
  "category": "flower",
  "basePrice": 150000,
  "imageUrl": "/images/products/mixed-bouquet.png",
  "recipes": [
    { "inventoryId": 1, "quantityRequired": 5 },
    { "inventoryId": 2, "quantityRequired": 3 }
  ]
}
```

**Response (201):**
```json
{
  "id": 4,
  "name": "Mixed Bouquet",
  "slug": "mixed-bouquet",
  "category": "flower",
  "basePrice": 150000,
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

---

### PATCH /products/:id

Update produk. **Hanya owner/superadmin.**

**Request:**
```json
PATCH /api/products/1
Content-Type: application/json

{
  "name": "Single Red Rose - Premium",
  "basePrice": 30000
}
```

**Response (200):**
```json
{
  "message": "Product updated successfully"
}
```

---

### DELETE /products/:id

Soft delete produk. **Hanya owner/superadmin.**

**Response (200):**
```json
{
  "message": "Product archived successfully"
}
```

---

## Orders

### GET /orders

Ambil semua order, filter berdasarkan status.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): Filter by status. Can use multiple params for multiple statuses.

**Examples:**
```
GET /api/orders
GET /api/orders?status=Antri
GET /api/orders?status=Antri&status=Dirangkai&status=Selesai
```

**Response (200):**
```json
[
  {
    "id": "abc-123-def-456",
    "customerName": "Sarah Wijaya",
    "customerWhatsapp": "081234567890",
    "totalAmount": 350000,
    "discountAmount": 0,
    "status": "Antri",
    "paymentStatus": "Pending",
    "orderType": "POS",
    "deliveryDate": "2024-01-16T14:00:00.000Z",
    "isSynced": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

### GET /orders/:id

Ambil detail order dengan items.

**Response (200):**
```json
{
  "id": "abc-123-def-456",
  "customerName": "Sarah Wijaya",
  "customerWhatsapp": "081234567890",
  "totalAmount": 350000,
  "status": "Antri",
  "paymentStatus": "Pending",
  "items": [
    {
      "id": 1,
      "productId": 2,
      "productName": "Red Passion Bouquet",
      "quantity": 1,
      "unitPriceAtOrder": 350000
    }
  ]
}
```

---

### POST /orders

Buat order baru (Draft).

**Request:**
```json
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerName": "Sarah Wijaya",
  "customerWhatsapp": "081234567890",
  "orderType": "POS",
  "deliveryDate": "2024-01-16T14:00:00.000Z",
  "items": [
    {
      "productId": 2,
      "quantity": 1,
      "unitPriceAtOrder": 350000
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "abc-123-def-456",
  "customerName": "Sarah Wijaya",
  "status": "Draft",
  "totalAmount": 350000,
  "items": [
    {
      "id": 1,
      "productId": 2,
      "quantity": 1,
      "unitPriceAtOrder": 350000
    }
  ]
}
```

---

### PATCH /orders/:id

Update order.

**Request:**
```json
PATCH /api/orders/abc-123-def-456
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "Antri",
  "paymentStatus": "Paid"
}
```

**Response (200):**
```json
{
  "id": "abc-123-def-456",
  "status": "Antri",
  "paymentStatus": "Paid",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

### POST /orders/:id/hold

Soft-hold order (Draft → Antri). Validasi stok.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Order moved to queue and inventory reserved"
}
```

**Response (422):**
```json
{
  "message": "Insufficient stock",
  "details": [
    { "productId": 1, "required": 10, "available": 5 }
  ]
}
```

---

### POST /orders/:id/checkout

Checkout order (Antri → Dirangkai). Hard-deduct inventory.

**Headers:**
```
Authorization: Bearer <token>
Idempotency-Key: unique-key-here
```

**Response (200):**
```json
{
  "message": "Checkout successful",
  "order": {
    "id": "abc-123-def-456",
    "status": "Dirangkai",
    "totalHppSnapshot": 180000
  },
  "hppSnapshot": {
    "totalHpp": 180000,
    "breakdown": [
      { "productId": 2, "hpp": 180000 }
    ]
  }
}
```

---

### DELETE /orders/:id

Batalkan order (Draft/Antri → Batal).

**Response (200):**
```json
{
  "message": "Order cancelled"
}
```

---

## Payments

### POST /payments

Rekam pembayaran untuk order.

**Request:**
```json
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "abc-123-def-456",
  "method": "Cash",
  "amount": 350000
}
```

**Response (201):**
```json
{
  "payment": {
    "id": 1,
    "orderId": "abc-123-def-456",
    "method": "Cash",
    "amount": 350000
  },
  "paymentStatus": "Paid",
  "message": "Payment completed"
}
```

**Payment Methods:** `Cash`, `QRIS`, `Transfer`

---

## Self-Order

### GET /self-order/links

Ambil semua self-order links. **Staff+ only.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "uuid-link-id",
    "uuid": "customer-link-uuid",
    "productId": 2,
    "productName": "Red Passion Bouquet",
    "productPrice": 350000,
    "customerName": "Sarah",
    "quantity": 1,
    "expiresAt": "2024-01-15T22:00:00.000Z",
    "isUsed": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### POST /self-order/generate

Generate self-order link. **Staff+ only.**

**Request:**
```json
POST /api/self-order/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 2,
  "quantity": 1,
  "customerName": "Sarah"
}
```

**Response (201):**
```json
{
  "id": "uuid-link-id",
  "uuid": "customer-link-uuid",
  "url": "http://localhost:5173/order/customer-link-uuid",
  "expiresAt": "2024-01-15T22:00:00.000Z",
  "product": {
    "id": 2,
    "name": "Red Passion Bouquet",
    "basePrice": 350000
  },
  "customerName": "Sarah",
  "quantity": 1,
  "isUsed": false
}
```

---

### DELETE /self-order/links/:id

Hapus self-order link. **Staff+ only.**

**Response (200):**
```json
{
  "message": "Link deleted successfully"
}
```

---

### GET /self-order/:uuid/validate

Validasi self-order link. **Public (no auth).**

**Response (200 - Valid):**
```json
{
  "valid": true,
  "product": {
    "id": 2,
    "name": "Red Passion Bouquet",
    "basePrice": 350000,
    "category": "flower"
  },
  "customerName": "Sarah",
  "quantity": 1,
  "expiresAt": "2024-01-15T22:00:00.000Z"
}
```

**Response (403 - Expired):**
```json
{
  "valid": false,
  "reason": "expired"
}
```

**Response (403 - Used):**
```json
{
  "valid": false,
  "reason": "used"
}
```

**Response (404):**
```json
{
  "message": "Link not found"
}
```

---

### POST /self-order/:uuid

Submit self-order. **Public (no auth).**

**Request:**
```json
POST /api/self-order/abc-123-def-456
Content-Type: application/json

{
  "messageCard": "Happy Birthday! Wish you all the best.",
  "senderName": "Papa",
  "deliveryDate": "2024-01-16T14:00:00.000Z",
  "customerWhatsapp": "081234567890"
}
```

**Response (201):**
```json
{
  "message": "Order submitted successfully",
  "orderId": "order-uuid",
  "product": {
    "id": 2,
    "name": "Red Passion Bouquet",
    "quantity": 1,
    "totalAmount": 350000
  }
}
```

---

## Inventory

### GET /inventory

Ambil semua inventory.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Mawar Merah",
    "sku": "INV-ROSE-RED",
    "unit": "tangkai",
    "stockLevel": 45,
    "reorderLevel": 10
  }
]
```

---

### POST /inventory

Tambah inventory baru. **Owner+ only.**

**Request:**
```json
POST /api/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Mawar Pink",
  "sku": "INV-ROSE-PNK",
  "unit": "tangkai",
  "stockLevel": 50,
  "reorderLevel": 10
}
```

---

### PATCH /inventory/:id

Update inventory. **Owner+ only.**

**Request:**
```json
PATCH /api/inventory/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "stockLevel": 55
}
```

---

## Sync

### POST /sync

Sync offline operations.

**Request:**
```json
POST /api/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "operations": [
    {
      "entityType": "orders",
      "entityId": "local-uuid",
      "operation": "INSERT",
      "payload": { "customerName": "Test" }
    }
  ]
}
```

**Response (200):**
```json
{
  "syncedIds": ["local-uuid"],
  "failedOps": []
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Customer name is required"
}
```

### 401 Unauthorized
```json
{
  "message": "Session expired"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Order not found"
}
```

### 422 Unprocessable Entity
```json
{
  "message": "Insufficient stock",
  "details": [
    { "productId": 1, "required": 10, "available": 5 }
  ]
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal Server Error"
}
```

---

## Status Values

### Order Status
- `Draft` - Order dibuat, belum dihold
- `Antri` - Menunggu diproses
- `Dirangkai` - Sedang dirangkai
- `Selesai` - Selesai dirangkai
- `Diambil` - Sudah diambil customer
- `Dikirim` - Sedang dikirim
- `Batal` - Dibatalkan

### Payment Status
- `Pending` - Belum bayar
- `Paid` - Lunas
- `Partial` - Bayar sebagian
- `Refunded` - Dikembalikan

### Payment Method
- `Cash` - Tunai
- `QRIS` - QRIS
- `Transfer` - Transfer bank

### User Roles
- `superadmin` - Akses penuh
- `owner` - Akses penuh (kecuali superadmin-only)
- `staff` - Akses terbatas

---

## Order Status Flow

```
Draft → Antri → Dirangkai → Selesai → Diambil
  ↓         ↓           ↓
Batal    Batal       Batal
```
