# Inventory Page — Light + Glass Redesign

## Context

Current Inventory.jsx is functional but visually plain: flat `bg-gray-100` background, solid white header, white summary cards, white item cards, no ambient motion. The app's other pages (Billing, CustomerMenu) already got an iOS-26 style glass treatment (`.glass-pill`, `.glass-dropdown`, `.shine-layer`). The Inventory page should match that aesthetic while keeping data density and readability.

## Goal

Make the Inventory page visually appealing: warm light background with ambient floating blobs, frosted-glass cards, redesigned item cards with category-color accents, and rich motion (scroll stagger, hover shine + lift, pulsing low/out-stock glow, micro-interactions).

## Design

### 1. Background
- Replace `bg-gray-100` with a warm gradient: `bg-gradient-to-br from-gray-50 via-white to-orange-50/40`
- 2–3 fixed, blurred, slow-drifting blobs (orange / blue / green, low opacity) behind content, `pointer-events-none`
- Loading screen uses the same gradient + brand spinner

### 2. Glass system
- New reusable `.glass-card` class in `src/index.css` (frosted `rgba(255,255,255,0.6)` bg, `backdrop-blur-xl`, white border, inner specular highlight, soft shadow) — matches Billing's glass aesthetic
- Sticky header becomes frosted glass with bottom hairline

### 3. Summary cards (5)
- Convert to `.glass-card`; keep colored icon tiles (primary/red/orange/green)
- Hover: lift + `.shine-layer` sweep
- Scroll-reveal staggered entrance

### 4. Item cards (accent redesign)
- Category-color **left accent bar** derived from `catColorMap` color → gradient strip on the card's left edge
- Bigger stock number (`text-2xl`), colored by status (green/orange/red)
- Keep: category chip, SKU, stock progress bar (slightly thicker), cost, supplier, expiry row, Out/Low/Expiry corner badges
- Hover: `.shine-layer` sweep + lift + category-color glow shadow
- Low / Out cards: soft pulsing glow (orange / red keyframes)

### 5. Tabs, Search, Filters
- Tabs container → glass, active tab uses primary gradient (`.glass-pill-active` style)
- Search input → glass field with icon
- Category dropdown → glass dropdown (`.glass-dropdown`)

### 6. Modals
- Stay white (form readability), minor polish only

### 7. Animations
- Scroll stagger: per-card inline delay via `ScrollReveal` `delay` prop
- Hover shine + lift: `.shine-layer` spans on cards/buttons
- Ambient: floating blobs + low/out-stock glow pulse keyframes
- Micro-interactions: header buttons scale, tab transitions, focus rings

## Files
- `src/index.css` — add `.glass-card`, blob + pulse-glow keyframes
- `src/components/Inventory.jsx` — apply redesign

## Verification
- `npm run build` passes
- User reviews on localhost
