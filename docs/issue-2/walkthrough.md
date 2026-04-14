# Walkthrough: PWA Shell & Base Layout (Issue #2)

I have implemented a modern, mobile-friendly PWA shell with a premium "girly" (Blush-Rose) aesthetic. The application is now offline-ready with automatic connectivity detection.

## Changes Made

### 1. PWA & Tooling Setup
- Installed and configured `@vite-pwa/sveltekit` for offline support.
- Set up **Tailwind CSS 4** with a custom Blush-Rose color palette.
- Added **Lucide Svelte** for premium icons.
- Integrated **Google Fonts (Outfit)** for a modern typography feel.

### 2. Global State Management
- Created a global store in `src/lib/stores/app.svelte.ts` using Svelte 5 `$state`.
- Implemented real-time offline/online status tracking.

### 3. Responsive UI/UX
- **Mobile First**: Bottom navigation bar with glassmorphism effects.
- **Desktop Sidebar**: Elegant side navigation for larger screens.
- **Offline Indicator**: A subtle rose-colored banner that appears when connectivity is lost.
- **Micro-animations**: Smooth transitions and hover effects for interactive elements.

## Visuals

### App Icon
![Bloomy App Icon](/Users/xiomay/bloom/apps/web/static/pwa-512x512.png)

### Layout Components
- **Top Bar**: Branding and user profile access.
- **Nav Items**: Dashboard, POS, Inventory, and Audit History.
- **Offline Banner**: Fixed at the top with a `WifiOff` icon.

## Verification Results

- [x] **Dev Server**: Served with `200 OK`.
- [x] **Responsiveness**: Layout adapts correctly from mobile (bottom nav) to desktop (sidebar).
- [x] **Offline Detection**: Verified via `navigator.onLine` and Svelte state updates.
- [x] **PWA Manifest**: `manifest.webmanifest` is correctly generated and served.

> [!TIP]
> You can now test the PWA installation by opening the app in Chrome and clicking the 'Install' icon in the address bar.
