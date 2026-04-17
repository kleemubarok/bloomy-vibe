# Walkthrough - Issue #12: Customer Self-Order Form

## Implementation Summary

Issue #12 Customer Self-Order Form telah selesai diimplementasikan.

## Files Created

| File | Description |
|------|-------------|
| `apps/web/src/routes/self-order/+page.svelte` | Generate link page untuk staff |
| `apps/web/src/routes/order/[uuid]/+page.ts` | Load function untuk validasi link |
| `apps/web/src/routes/order/[uuid]/+page.svelte` | Public form untuk customer |
| `apps/web/src/lib/api/client.ts` | Added self-order API functions |
| `apps/web/src/routes/+layout.svelte` | Added Self-Order menu |
| `docs/issue-12/*.md` | Documentation |

## Features

### Generate Link Page (/self-order)

- Staff dapat melihat daftar produk
- Pilih produk, quantity, dan nama customer
- Generate UUID link
- Copy to clipboard
- Link ke halaman Inventory untuk create product

### Public Order Form (/order/:uuid)

- Validasi link (valid/expired/used)
- Tampilkan info produk
- Input fields:
  - Message card (ucapan)
  - Sender name (nama pengirim)
  - Delivery date (jadwal kirim)
  - WhatsApp number
- Submit → Konfirmasi

### Navigation

- Menu "Self-Order" ditambahkan di sidebar
- Route `/order/*` adalah public (tidak perlu login)

## User Flow

### Staff Flow

```
1. Login → Dashboard
2. Klik "Self-Order" di menu
3. Pilih produk dari dropdown
4. Input quantity dan nama customer
5. Klik "Generate Link"
6. Copy link → kirim ke customer via WA
```

### Customer Flow

```
1. Buka link yang dikirim staff
2. Lihat detail pesanan
3. Opsional: isi ucapan, nama pengirim, jadwal, WA
4. Klik "Kirim Pesanan"
5. Lihat konfirmasi
```

## API Integration

| Endpoint | Method | Auth | Usage |
|----------|--------|------|-------|
| `GET /api/products` | GET | Staff+ | List products |
| `POST /api/self-order/generate` | POST | Staff+ | Generate link |
| `GET /api/self-order/:uuid/validate` | GET | Public | Validate link |
| `POST /api/self-order/:uuid` | POST | Public | Submit form |

## Test Credentials

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "owner@bloomy.id", "pin": "1234"}'
```

## Verification

```bash
# Web build
cd apps/web && bun run build  # ✅ Success

# API tests  
cd apps/api && bun test       # ⚠️ 24 pass (pre-existing failures)
```

## Next Steps

Issue #12 complete. Ready for:
- **#13**: Thermal Print Layout
