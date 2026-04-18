# Issue #15: Background Sync & Conflict Resolver

## Purpose

Implement automatic sync when connection is restored, manual sync option, and UI to display sync status.

## Dependencies

- #9 (Sync Queue Endpoint) - Complete
- #14 (IndexedDB Wrapper & Local Queue) - Complete

## Scope

### 1. Online Detection (`src/lib/offline/online.ts`)
- Use `navigator.onLine` for network status
- Listen to `online`/`offline` events
- Export `isOnline()` function
- Export store for UI binding

### 2. Sync Service (`src/lib/offline/sync.ts`)
- `triggerSync()` - Kirim queue ke `/api/sync`
- Handle response: markSynced() / markFailed()
- Retry logic dengan exponential backoff
- Max 3 attempts

### 3. Auto-Sync on Reconnect
- Listen to `online` event
- Trigger sync saat online restore
- Interval polling (30s) sebagai fallback

### 4. Manual Sync
- `triggerManualSync()` button di dashboard/header
- Show loading state
- Display last sync time

### 5. Sync Status UI
- Show pending count badge
- Display last sync timestamp
- Show sync error if any

## Key Files
- `apps/web/src/lib/offline/online.ts` - Online detection
- `apps/web/src/lib/offline/sync.ts` - Sync service
- `apps/web/src/lib/components/SyncStatus.svelte` - Status badge

## Implementation Steps
1. Create `online.ts` dengan network detection
2. Create `sync.ts` dengan sync logic
3. Create `SyncStatus.svelte` component
4. Integrate auto-sync di layout/app init
5. Add manual sync button di header
6. Add sync status indicator di UI