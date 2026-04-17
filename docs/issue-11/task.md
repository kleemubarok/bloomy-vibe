# Tasks: Issue #11 - POS & Cart Management UI

## Implementation Tasks

- [x] Modify `apps/web/src/lib/api/types.ts`
  - [x] Add `Product` type
  - [x] Add `CartItem` type

- [x] Modify `apps/web/src/lib/api/client.ts`
  - [x] Add `getProducts()` function
  - [x] Add `createOrder()` function
  - [x] Add `holdOrder()` function
  - [x] Add `checkoutOrder()` function

- [x] Create `apps/web/src/lib/stores/pos.svelte.ts`
  - [x] Cart state management
  - [x] addToCart, removeFromCart, updateQuantity
  - [x] getTotal, clearCart

- [x] Create `apps/web/src/lib/components/ProductGrid.svelte`
  - [x] Display products in grid
  - [x] Add to cart on click

- [x] Create `apps/web/src/lib/components/Cart.svelte`
  - [x] List cart items
  - [x] Quantity controls
  - [x] Total display
  - [x] Customer info form
  - [x] Hold & Checkout buttons

- [x] Create `apps/web/src/routes/pos/+page.svelte`
  - [x] Main POS layout
  - [x] Combine ProductGrid + Cart
  - [x] Handle hold/checkout flows
  - [x] Success/error handling

- [x] Create `docs/issue-11/walkthrough.md`

## Verification

- [x] Run `bun run build` in apps/web ✅ Success
- [x] Run `bun test` in apps/api ✅ 32 pass

## Documentation

- [x] Save plan to `docs/issue-11/plan.md`
- [x] Save task list to `docs/issue-11/task.md`
- [x] Save walkthrough to `docs/issue-11/walkthrough.md`

## Commit

- [x] Commit to `feature/issue-11-pos-cart`
