# Plan: Issue #13 - Thermal Print Layout (CSS MVP)

## Overview

Implement print layout for receipts (58mm/80mm thermal) and production slips using `@media print` CSS. Focus on browser print with preview functionality.

## Current State

- **POS Page** (`src/routes/pos/+page.svelte`): Complete with checkout flow, payment recording
- **Order Type**: Contains customerName, items[], totalAmount, paymentStatus, messageCard, senderName
- **No print infrastructure**: No print CSS, no print components
- **POS Success Modal**: Shows after successful payment - ideal trigger point for print

## Files to Create

### 1. Print Styles (`src/lib/print/styles.css`)

```css
/* Thermal receipt styles (58mm) */
/* Production slip styles (80mm) */

/* Paper widths:
   - 58mm receipt: ~203px @ 96dpi
   - 80mm receipt: ~283px @ 96dpi */

/* Key features:
   - @media print rules
   - Hide nav, buttons, non-essential elements
   - Monospace font (Courier/monospace)
   - Zero margins for thermal printers
   - Page break handling */
```

### 2. Receipt Component (`src/lib/components/Receipt.svelte`)

```svelte
<script lang="ts">
  import type { Order } from '$lib/api/types';
  interface Props {
    order: Order;
    paymentMethod?: string;
    amountPaid?: number;
    change?: number;
  }
</script>

<!-- Receipt layout optimized for 58mm thermal -->
<!-- Company header, order info, items, totals, footer -->
```

### 3. Production Slip Component (`src/lib/components/ProductionSlip.svelte`)

```svelte
<!-- Production slip for workshop (80mm width) -->
<!-- Focus on items, quantities, customer name, delivery time -->
<!-- No pricing info needed -->
```

### 4. Print Preview Modal (`src/lib/components/PrintPreview.svelte`)

```svelte
<!-- Modal with:
     - Print type selector (Receipt / Slip)
     - Preview iframe/content
     - Print button (triggers window.print())
     - Close button -->
```

### 5. Print Utilities (`src/lib/print/utils.ts`)

```typescript
// formatCurrency(value: number): string
// formatDate(date: Date): string
// triggerPrint(): void
```

## Implementation Details

### Print Flow

1. **Trigger Point**: After successful checkout in POS, show print option in success modal
2. **Preview**: User can preview receipt/slip before printing
3. **Print**: Browser's `window.print()` with CSS `@media print` handling

### Receipt Layout (58mm Thermal)

```
┌──────────────────┐
│ BLOOMY CRAFT     │
│ & SERVICE        │
│------------------│
│ #ORD-12345       │
│ 17 Apr 2026      │
│ 14:30            │
│------------------│
│ Customer: Sarah  │
│ WhatsApp: 0812.. │
│------------------│
│ 2x Single Rose   │
│      Rp 50.000   │
│ 1x Bouquet       │
│      Rp 350.000  │
│------------------│
│ TOTAL   Rp400.000│
│ CASH    Rp500.000│
│ CHANGE  Rp100.000│
│------------------│
│ Bayar: Cash      │
│ [Paid]           │
│------------------│
│ Terima kasih!    │
│ bloomy.id        │
└──────────────────┘
```

### Production Slip Layout (80mm)

```
┌──────────────────────┐
│ 📋 SLIP PRODUKSI     │
│ #ORD-12345           │
│ 17 Apr 2026 15:00    │
│──────────────────────│
│ Pelanggan: Sarah W.  │
│──────────────────────│
│ ITEM         QTY     │
│ 2x Single Rose  2   │
│ 1x Bouquet      1   │
│──────────────────────│
│ Pesan: Happy B-day! │
│ Dari: Mom            │
│──────────────────────│
│ ☐ Baru  ☐ Rangkai  │
│ ☐ Selesai ☐ Serah  │
└──────────────────────┘
```

## Acceptance Criteria

- [ ] Receipt prints correctly at 58mm width
- [ ] Production slip prints correctly at 80mm width
- [ ] Print preview modal works
- [ ] Non-print elements (nav, buttons) hidden during print
- [ ] Print button triggers browser print dialog
- [ ] Fallback print button available on POS success modal
- [ ] Monospace font renders correctly
- [ ] QR code optional (can add later)

## Technical Notes

### Browser Print Flow

```javascript
// PrintPreview.svelte
function handlePrint() {
  window.print();
}

// Triggered by print button
```

### CSS Media Query

```css
@media print {
  /* Hide everything except .print-only */
  body * {
    visibility: hidden;
  }
  .print-only, .print-only * {
    visibility: visible;
  }
  .print-only {
    position: absolute;
    left: 0;
    top: 0;
    width: 58mm; /* or 80mm */
  }
}
```

## Execution Order

1. Create `src/lib/print/` directory structure
2. Create `src/lib/print/styles.css` with print media queries
3. Create `Receipt.svelte` component
4. Create `ProductionSlip.svelte` component
5. Create `PrintPreview.svelte` modal
6. Create `src/lib/print/utils.ts` helpers
7. Integrate print button in POS success modal
8. Add print button to dashboard OrderCard
9. Test print in browser
10. Add OpenAPI documentation

## Estimated Complexity

**Low-Medium** - CSS print styling with Svelte component integration. Main challenges:
- Proper @media print CSS scoping
- Svelte context for print content
- Browser print dialog handling
