---
name: ui-ux-pro-max
description: Guidelines for enhancing UI/UX across landing pages, POS dashboard, billing, and customer interfaces with modern design, responsive layouts, consistent spacing, and polished animations.
---

# UI/UX Pro Max Skill

This skill provides design standards and aesthetic principles for building and refining user interfaces in the DaawatDesk application.

## Core Design Principles

### 1. Modern Color Palette & Consistency
- **Primary Accent:** Warm Orange / Amber (`#F97316` / `bg-orange-500` / `bg-amber-600`) representing hospitality and dining.
- **Dark Mode / Neutral Tones:** Sleek slate/gray scales (`slate-900`, `gray-900` for dark cards, `gray-50` for light backgrounds).
- **Status Colors:**
  - Success/Paid: Emerald (`emerald-600`)
  - Pending/KOT Preparing: Amber (`amber-500`)
  - Danger/Cancel/Alert: Rose (`rose-600`)
  - Info/Primary Action: Indigo / Blue (`indigo-600`)

### 2. Spacing Rhythm & Typography
- **Font Stack:** Modern sans-serif (Inter, Outfit, or system-ui).
- **Hierarchy:** Clear distinction between Page Titles (`text-2xl font-bold`), Section Headers (`text-lg font-semibold`), Body (`text-sm text-gray-600`), and Badges (`text-xs font-medium`).
- **Paddings & Margins:** Maintain consistent scale (`p-4`, `p-6`, `gap-4`, `gap-6`). Avoid custom arbitrary pixel values (`p-[13px]`) unless strictly required.

### 3. Responsive Layout Guidelines
- **Mobile First Approach:** Ensure billing, kitchen, and customer menu components adjust gracefully down to `360px` screens.
- **Grid Layouts:** Use responsive grid classes:
  - Cards Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
  - POS Layout: Two-column layout on desktop (`lg:flex-row`), stack vertically on mobile.

### 4. Interactive Feedback & Micro-Animations
- **Hover & Active States:** Add subtle hover transforms (`hover:-translate-y-0.5 transition-all duration-200 active:scale-95`).
- **Loading States:** Use pulse skeletons (`animate-pulse bg-gray-200 rounded-md`) or smooth spinners (`animate-spin border-t-transparent`).
- **Touch & Haptics:** Support touch targets (minimum `44x44px`) for tablet/mobile POS users.

### 5. Landing Page & Feature Showcase
- Use glassmorphic card effects (`bg-white/80 backdrop-blur-md border border-gray-100 shadow-xl`).
- Gradient overlays for call-to-action sections (`bg-gradient-to-r from-orange-500 to-amber-600`).
