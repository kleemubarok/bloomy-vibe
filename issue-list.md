# 📋 Issue List: Bloomy Craft & Service POS (v2)

## 🛠 Tech Stack & Arsitektur
- **Runtime:** Bun
- **API / Worker:** Hono.js (deploy ke Cloudflare Workers)
- **ORM:** Drizzle
- **Database:** SQLite (local dev) → Cloudflare D1 (prod)
- **Frontend:** SvelteKit (PWA) + IndexedDB (offline buffer)
- **Realtime:** SSE (Hono) + Fallback Polling

## 📖 Panduan Penggunaan
1. Kerjakan issue secara **berurutan** sesuai `Dependencies`.
2. Fokus pada **flow fungsional MVP** sebelum optimasi UI/UX atau edge-case.
3. Semua path file mengikuti struktur standar SvelteKit + Hono + Drizzle.
4. Gunakan `drizzle-kit` untuk generate migration. Pastikan query kompatibel dengan D1 (Hindari fitur SQLite-only seperti `RETURNING` atau triggers).
5. Dokumentasi API sederhana (endpoint, method, payload contoh) cukup ditulis di deskripsi issue atau `README.md`.

---

## 📦 Phase 1: Setup & Infrastruktur Dasar
| ID | Judul | Scope | Key Files | Acceptance Criteria | Dependencies |
|:---|:---|:---|:---|:---|:---|
| `#1` | **Project Init & Config Stack** | Inisialisasi repo Bun, setup SvelteKit, Hono, Drizzle. Konfigurasi env & alias DB (SQLite dev ↔ D1 prod). | `package.json`, `svelte.config.js`, `drizzle.config.ts`, `wrangler.toml` | `bun dev` menjalankan SvelteKit + API proxy. `drizzle-kit generate` berjalan tanpa error. Env vars terpisah jelas (`DEV`/`PROD`). | ✅ |
| `#2` | **PWA Shell & Base Layout** | Setup `@vite-pwa/sveltekit`, routing dasar, global state mock (auth, theme, online/offline status). | `src/app.html`, `src/routes/+layout.svelte`, `src/lib/stores/app.ts` | App bisa di-install sebagai PWA. Layout responsive siap dipakai. Indikator offline muncul otomatis. | `#1` | ✅ |

---

## 📦 Phase 2: Database & Schema
| ID | Judul | Scope | Key Files | Acceptance Criteria | Dependencies |
|:---|:---|:---|:---|:---|:---|
| `#3` | **Drizzle Schema & Migrations** | Definisikan tabel: `users`, `inventory`, `products`, `product_recipes`, `orders`, `order_items`, `payments`, `inventory_log`, `sync_queue`. Tambah index strategis. | `src/db/schema/`, `drizzle/migrations/` | Semua tabel & relasi terdefinisi. `drizzle-kit push` berhasil di SQLite & D1. Schema konsisten dengan konteks v2. | `#1` | ✅ |
| `#4` | **Seed Data & Validasi Local** | Script seed untuk dummy user, 5 produk + resep bahan, stok awal. Validasi query relasi & constraint. | `scripts/seed.ts`, `drizzle/seed.ts` | DB lokal terisi data realistis. Query Drizzle bisa join `products` ↔ `recipes` ↔ `inventory` tanpa error. | `#3` | ✅ |

---

## 📦 Phase 3: API Layer (Hono Workers)
| ID | Judul | Scope | Key Files | Acceptance Criteria | Dependencies |
|:---|:---|:---|:---|:---|:---|
| `#5` | **Auth & Role Middleware** | Endpoint login (PIN/Password), generate session/JWT. Middleware verifikasi `owner` vs `staff`. | `src/api/routes/auth.ts`, `src/api/middleware/auth.ts` | Endpoint `/api/auth/login` validasi & return token. Middleware reject akses tanpa role sesuai. | `#3`, `#4` |
| `#6` | **Master Data CRUD (Inv & Products)** | CRUD inventory, produk, & recipe mapping. Validasi stok negatif & recipe qty. | `src/api/routes/inventory.ts`, `src/api/routes/products.ts` | Semua CRUD berfungsi. Recipe linking tersimpan dengan benar. Error handling rapi (4xx/5xx). | ✅ |
| `#7` | **Order Lifecycle & Checkout Logic** | Flow: Draft → Soft-Hold → Checkout (Hard-Deduct). Hitung `total_hpp_snapshot` & `price_locked_at`. Catat ke `inventory_log`. Handle idempotency key. | `src/api/routes/orders.ts`, `src/api/lib/calc.ts` | Checkout mengurangi stok permanen. Snapshot profit tersimpan di `orders`. `inventory_log` terisi dengan `RESERVE`/`DEDUCT`. Duplikat request ditolak via idempotency key. | `#6` |
| `#8` | **Secure Self-Order Link Handler** | Generate UUID link (`expires_at`, `is_used`). Validasi sebelum render form customer. Simpan ucapan & jadwal kirim. | `src/api/routes/self-order.ts` | Link expired/used ditolak 403. Form customer hanya bisa submit 1x. Data ucapan & sender tersimpan aman. | `#7` |
| `#9` | **Sync Queue Endpoint (`POST /api/sync`)** | Terima batch operasi dari IndexedDB. Terapkan `last-write-wins` atau merge aman. Return `synced_ids` & `failed_ops`. | `src/api/routes/sync.ts`, `src/api/lib/merge.ts` | Payload queue diproses tanpa duplikat. Status `sync_queue` terupdate. Error per-item tidak menghentikan batch lain. | `#7` |

---

## 📦 Phase 4: Frontend (SvelteKit PWA)
| ID | Judul | Scope | Key Files | Acceptance Criteria | Dependencies |
|:---|:---|:---|:---|:---|:---|
| `#10` | **Dashboard & Production Tracking UI** | View list/Kanban status (`Antri` → `Dirangkai` → `Selesai`). Tombol update status. Integrasi awal polling/SSE. | `src/routes/dashboard/+page.svelte`, `src/lib/stores/production.ts` | Status order bisa diubah & tersimpan. UI refleksi perubahan realtime. Loading & error state tertangani. | `#7` |
| `#11` | **POS & Cart Management UI** | Tambah item ke cart, pilih pelanggan, apply soft-hold, preview total. Flow checkout & payment recording. | `src/routes/pos/+page.svelte`, `src/components/Cart.svelte` | Cart multi-item berjalan. Soft-hold tertrigger. Checkout memanggil API & handle response sukses/gagal. | `#7` |
| `#12` | **Customer Self-Order Form** | Halaman publik `/order/:uuid`. Input ucapan, nama pengirim, jadwal. Validasi format & submit ke API. | `src/routes/order/[uuid]/+page.svelte` | Form hanya render jika link valid. Data tersimpan & konfirmasi muncul. Link otomatis ditandai `used`. | `#8` |
| `#13` | **Thermal Print Layout (CSS MVP)** | `@media print` untuk struk 58/80mm & slip produksi. Font monospace, margin 0, hide UI elemen non-cetak. | `src/lib/print/styles.css`, `src/components/PrintPreview.svelte` | Print preview akurat di browser. Output rapi saat cetak thermal. Fallback button tersedia. | `#11` |

---

## 📦 Phase 5: Offline-First & Sync Engine
| ID | Judul | Scope | Key Files | Acceptance Criteria | Dependencies |
|:---|:---|:---|:---|:---|:---|
| `#14` | **IndexedDB Wrapper & Local Queue** | Setup `idb`/`localforage`. Buat tabel lokal mirror `orders`, `order_items`, `sync_queue`. Fungsi push/pop operasi. | `src/lib/offline/db.ts`, `src/lib/offline/queue.ts` | Transaksi tersimpan lokal saat offline. Queue terstruktur (`operation`, `payload`, `status`). | `#2` |
| `#15` | **Background Sync & Conflict Resolver** | Detect online status → trigger sync. Kirim queue ke `/api/sync`. Handle retry & mark `synced`/`failed`. | `src/lib/offline/sync.ts`, `src/lib/workers/sync.worker.ts` | App otomatis sync saat reconnect. Queue berkurang sesuai response API. UI menampilkan status sync. | `#9`, `#14` |

---

## 📦 Phase 6: Realtime, Audit & Polish
| ID | Judul | Scope | Key Files | Acceptance Criteria | Dependencies |
|:---|:---|:---|:---|:---|:---|
| `#16` | **SSE Integration (Hono → Frontend)** | Endpoint `/api/sse/status`. Frontend `EventSource` wrapper. Auto reconnect & fallback polling 10s. | `src/api/routes/sse.ts`, `src/lib/realtime/client.ts` | Dashboard update tanpa reload. Koneksi stabil & graceful fallback saat SSE blocked. | `#10` |
| `#17` | **Audit Trail & Profit Viewer** | Halaman riwayat `inventory_log` & ringkasan profit per order (`total_paid` - `total_hpp_snapshot`). | `src/routes/audit/+page.svelte` | Data log tersusun kronologis. Profit terhitung akurat sesuai snapshot. Export/print dasar tersedia. | `#7`, `#11` |

---

## ✅ Final Checklist (Pre-Deploy)
- [ ] `wrangler.toml` dikonfigurasi untuk D1 binding & Pages routing.
- [ ] Environment variables (`DATABASE_URL`, `JWT_SECRET`, `APP_URL`) aman & terpisah.
- [ ] Semua endpoint dilindungi rate-limit & CORS sesuai kebutuhan.
- [ ] Offline flow diuji: Matikan jaringan → Buat order → Nyalakan jaringan → Verifikasi sync.
- [ ] Print test di printer thermal 58mm & 80mm.

> 💡 **Catatan untuk Developer/Model:**  
> Jangan mengimplementasikan `sync_queue` atau `SSE` sebelum `order checkout` & `DB schema` stabil. Gunakan mock data jika API backend belum siap. Fokus pada **idempotency** & **data snapshot** di setiap transaksi kritis.