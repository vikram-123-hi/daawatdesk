---
name: performance-optimizer
description: Rules for optimizing bundle size, implementing React lazy loading, optimizing images, and achieving high Lighthouse performance scores.
---

# Performance Optimizer Skill

This skill provides optimization techniques for web application speed, bundle size reduction, and smooth runtime execution.

## Performance Checklist

### 1. Code-Splitting & Route Lazy Loading
- Keep route-level components lazy-loaded in `src/App.jsx` using `React.lazy()` and `Suspense`:
  ```js
  const Billing = lazy(() => import('./components/Billing'))
  ```
- Split heavy third-party vendor libraries (e.g. `jspdf`, `xlsx`, `recharts`) so they are loaded only when requested by the user.

### 2. Asset & Image Optimization
- Use WebP format for static images to minimize network transfer size.
- Specify explicit `width` and `height` or aspect-ratio attributes on image tags to prevent Layout Shifts (CLS).

### 3. Firestore Query Pagination & Indexing
- Limit query sizes when fetching large collections (e.g. past bills, customer logs) using Firestore `limit()`, `startAfter()`, and compound indexes.
- Avoid pulling thousands of documents into client memory when a aggregated summary query suffices.

### 4. Rendering Efficiency
- Use `React.memo` for heavy list item components in POS billing or menu lists.
- Avoid creating inline function references or object literals in key prop bindings during render loops.
