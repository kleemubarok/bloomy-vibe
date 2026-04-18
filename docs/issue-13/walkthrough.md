# Walkthrough: Thermal Print Layout (Issue #13)

## Implementation Summary

Issue #13 implements thermal print layout for receipts and production slips using `@media print` CSS. The implementation focuses on browser print functionality with preview modal.

## Changes Made

### 1. Print Styles (`src/lib/print/styles.css`)

CSS for thermal print at 58mm width:

```css
/* Paper width: 58mm */
/* @media print rules to hide non-print elements */
/* Monospace font for receipt alignment */
```

### 2. Print Utilities (`src/lib/print/utils.ts`)

```typescript
formatCurrency(value: number): string  // Format to IDR
formatDate(date: Date | string): string
formatTime(date: Date | string): string
formatDateTime(date: Date | string): string
triggerPrint(): void  // Trigger browser print
truncateText(text: string, maxLength: number): string
```

### 3. Receipt Component (`src/lib/components/Receipt.svelte`)

Customer receipt optimized for 58mm thermal printer:

```svelte
<Receipt
  order={order}
  paymentMethod="Cash"
  amountPaid={500000}
  change={100000}
/>
```

**Layout:**
```
┌──────────────────┐
│ BLOOMY CRAFT     │
│ & SERVICE        │
│------------------│
│ #ORD-12345678   │
│ 17 Apr 2026     │
│ 14:30           │
│------------------│
│ Sarah Wijaya     │
│------------------│
│ 2x Single Rose   │
│      Rp 50.000  │
│ 1x Bouquet      │
│      Rp 350.000 │
│------------------│
│ TOTAL   Rp400.000│
│ TUNAI  Rp500.000 │
│ KEMBALI Rp100.000│
│------------------│
│ Bayar: Cash      │
│ Status: Paid     │
│------------------│
│ "Happy Birthday" │
│ - Mom            │
│------------------│
│ Terima Kasih!   │
└──────────────────┘
```

### 4. Production Slip Component (`src/lib/components/ProductionSlip.svelte`)

Workshop production slip (no pricing):

```svelte
<ProductionSlip {order} />
```

**Layout:**
```
┌──────────────────┐
│ SLIP PRODUKSI    │
│ #ORD-12345678   │
│ 17 Apr 14:30    │
│------------------│
│ Sarah Wijaya     │
│------------------│
│ ITEM        QTY │
│ Single Rose   x2│
│ Bouquet      x1 │
│------------------│
│ Pesan: Happy... │
│ dr: Mom         │
│------------------│
│ ☐ Baru ☐ Rangkai│
│ ☐ Selesai ☐ Srh │
└──────────────────┘
```

### 5. Print Preview Modal (`src/lib/components/PrintPreview.svelte`)

Modal for preview and print:

```svelte
<PrintPreview
  {order}
  isOpen={showPrintPreview}
  onClose={() => (showPrintPreview = false)}
  paymentMethod="Cash"
  amountPaid={500000}
  change={100000}
/>
```

**Features:**
- Toggle between Receipt and Production Slip
- Print preview
- Print button triggers `window.print()`

### 6. POS Integration (`src/routes/pos/+page.svelte`)

Added print button to success modal after payment:

```svelte
<button onclick={() => (showPrintPreview = true)}>
  Cetak Struk
</button>
```

## Usage

### Print Flow

1. Complete payment in POS
2. Success modal shows with "Cetak Struk" button
3. Click to open print preview
4. Select "Struk" or "Slip Produksi"
5. Click "Cetak" to print

### Browser Print

The `@media print` CSS handles:
- Hiding non-print elements (nav, buttons)
- Setting 58mm paper width
- Removing shadows and colors
- Ensuring text is black

## Files Created

| File | Description |
|------|-------------|
| `src/lib/print/styles.css` | Print CSS with @media print |
| `src/lib/print/utils.ts` | Print helper functions |
| `src/lib/components/Receipt.svelte` | Receipt component |
| `src/lib/components/ProductionSlip.svelte` | Production slip component |
| `src/lib/components/PrintPreview.svelte` | Print preview modal |

## Files Modified

| File | Change |
|------|--------|
| `src/routes/pos/+page.svelte` | Added print button and PrintPreview integration |

## Test Results

Manual testing via browser:
1. Open POS page
2. Add items to cart
3. Complete payment
4. Click "Cetak Struk"
5. Preview should show in 58mm width
6. Click "Cetak" to open browser print dialog

## Next Steps

- **Add to Dashboard**: Add print button to OrderCard in dashboard
- **QR Code**: Add QR code to receipt for digital receipt retrieval
- **Direct Print**: Consider ESC/POS protocol for direct thermal printer (future)
