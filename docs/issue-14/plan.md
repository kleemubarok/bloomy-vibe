# Issue #14: IndexedDB Wrapper & Local Queue

## Purpose

Setup offline-first infrastructure with IndexedDB to store transactions locally when network is unavailable, and manage a queue for syncing when online.

## Dependencies

- #2 (PWA Shell & Base Layout) - Complete

## Scope

1. **IndexedDB Setup** (`src/lib/offline/db.ts`)
   - Setup `idb` library for IndexedDB
   - Create object stores: `orders`, `order_items`, `sync_queue`
   - Mirror schema dari Drizzle untuk kompatibilitas

2. **Local Queue Functions** (`src/lib/offline/queue.ts`)
   - `enqueue(operation, payload)` - Tambah operasi ke queue
   - `dequeue()` - Ambil & hapus operasi tertua
   - `getQueue()` - Lihat semua queued operations
   - `clearQueue()` - Clear all pending operations
   - `markSynced(ids)` - Mark operations as synced
   - `markFailed(ids, error)` - Mark operations as failed

3. **Order Mirror Functions** (`src/lib/offline/db.ts`)
   - `saveOrderLocal(order)` - Simpan order ke IndexedDB
   - `getOrderLocal(id)` - Ambil order dari IndexedDB
   - `getAllOrdersLocal()` - Ambil semua order lokal
   - `deleteOrderLocal(id)` - Hapus order dari IndexedDB

## Key Files to Create

- `apps/web/src/lib/offline/db.ts` - IndexedDB setup & order CRUD
- `apps/web/src/lib/offline/queue.ts` - Queue management

## Acceptance Criteria

1. Transaksi tersimpan lokal saat offline
2. Queue terstruktur dengan `operation`, `payload`, `status`
3. Fungsi enqueue/dequeue berfungsi benar
4. Compatible dengan schema dari #3

## Implementation Steps

1. Install `idb` package
2. Create `src/lib/offline/db.ts` dengan object stores
3. Create `src/lib/offline/queue.ts` dengan fungsi queue
4. Export functions untuk digunakan di frontend