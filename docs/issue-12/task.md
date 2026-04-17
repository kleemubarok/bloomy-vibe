# Tasks: Issue #12 - Customer Self-Order Form

## Implementation Tasks

- [x] Modify `apps/web/src/lib/api/client.ts`
  - [x] Add `generateSelfOrderLink()` function
  - [x] Add `validateSelfOrderLink()` function
  - [x] Add `submitSelfOrder()` function

- [x] Create `apps/web/src/routes/self-order/+page.svelte`
  - [x] Product selector
  - [x] Quantity input
  - [x] Customer name input
  - [x] Generate link button
  - [x] Copy to clipboard

- [x] Create `apps/web/src/routes/order/[uuid]/+page.ts`
  - [x] Validate link on load

- [x] Create `apps/web/src/routes/order/[uuid]/+page.svelte`
  - [x] Show product info
  - [x] Form: messageCard, senderName, deliveryDate, WhatsApp
  - [x] Submit handling
  - [x] Success confirmation
  - [x] Error states (expired/used/invalid)

- [x] Modify `apps/web/src/routes/+layout.svelte`
  - [x] Add Self-Order menu to sidebar
  - [x] Mark /order/* as public route

- [x] Create `docs/issue-12/walkthrough.md`

## Verification

- [x] Run `bun run build` in apps/web ✅ Success
- [ ] Run `bun test` in apps/api ⚠️ (pre-existing failures)

## Documentation

- [x] Save plan to `docs/issue-12/plan.md`
- [x] Save task list to `docs/issue-12/task.md`
- [x] Save walkthrough to `docs/issue-12/walkthrough.md`
