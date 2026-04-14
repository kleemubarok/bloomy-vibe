# Implementation Plan: PWA Shell & Base Layout (Issue #2)

Implement a modern, "girly" (blush-rose theme) PWA shell for the Bloomy POS application. This includes PWA setup, Tailwind CSS configuration, and a responsive base layout with offline detection.

## User Review Required

> [!IMPORTANT]
> The design will use a **Blush-Rose** (Pink/Rose/Cream) color palette to achieve the "girly and modern" aesthetic.
> Base font will be **Outfit** (or Inter) for a premium clean look.

> [!NOTE]
> Icons for the PWA (192x192, 512x512) will be generated to match the brand.

## Proposed Changes

### Configuration & Tooling

#### [MODIFY] [package.json](file:///Users/xiomay/bloom/apps/web/package.json)
- Add `@vite-pwa/sveltekit`, `tailwindcss`, `postcss`, `autoprefixer`.

#### [NEW] [tailwind.config.ts](file:///Users/xiomay/bloom/apps/web/tailwind.config.ts)
- Configure custom blush-rose theme colors and modern typography.

#### [NEW] [postcss.config.js](file:///Users/xiomay/bloom/apps/web/postcss.config.js)
- Standard PostCSS setup for Tailwind.

#### [MODIFY] [vite.config.ts](file:///Users/xiomay/bloom/apps/web/apps/web/vite.config.ts)
- Integrate `SvelteKitPWA`.

### Global State & Logic

#### [NEW] [app.ts](file:///Users/xiomay/bloom/apps/web/src/lib/stores/app.ts)
- Create a Svelte 5 store (using `$state`) for:
    - `isOnline`: Tracks connectivity using `navigator.onLine`.
    - `user`: Mock user data for prototyping.
    - `theme`: Support for light/dark (defaulting to a soft light theme).

### UI & Layout

#### [NEW] [app.css](file:///Users/xiomay/bloom/apps/web/src/app.css)
- Tailwind directives and global styles (gradients, custom utility classes for "glassmorphism" effects).

#### [MODIFY] [app.html](file:///Users/xiomay/bloom/apps/web/src/app.html)
- Import Google Fonts (Outfit).
- Add PWA meta tags.

#### [MODIFY] [+layout.svelte](file:///Users/xiomay/bloom/apps/web/src/routes/+layout.svelte)
- Implement the main structural layout:
    - Navigation (Responsive: Bottom for mobile, Side/Top for tablet+).
    - Offline Alert Banner (Fixed at top or bottom).
    - Main content area with smooth transitions.
    - Glassmorphism effects for a premium feel.

## Verification Plan

### Automated Tests
- Run `bun run check` to ensure no TypeScript/Svelte errors.
- Run `vite dev` and verify PWA registration in Chrome DevTools.

### Manual Verification
- **Mobile responsiveness**: Test with Chrome simulator (iPhone/Android).
- **Offline Mode**: Toggle "Offline" in DevTools Network tab and verify the indicator shows up.
- **PWA Install**: Verify the "Install" prompt or button appears in the browser.
- **Aesthetics**: Ensure the colors match the "girly and modern" requirement (Blush Rose palette).
