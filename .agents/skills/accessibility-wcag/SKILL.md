---
name: accessibility-wcag
description: Guidelines for ensuring WCAG 2.1 AA accessibility compliance including semantic HTML, keyboard navigation, screen reader support, and color contrast.
---

# Accessibility (WCAG 2.1 AA) Skill

This skill enforces accessibility best practices so the application is fully usable for all users, including those relying on assistive technologies.

## Accessibility Requirements

### 1. Semantic HTML Elements
- Use native HTML elements over styled `<div>` elements for interactive items:
  - Use `<button>` for clickable triggers, not `<div onClick={...}>`.
  - Use `<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>`, `<article>`, and `<section>` for page structuring.

### 2. Keyboard Navigation & Focus Management
- Ensure all interactive elements (buttons, links, form fields, tab switches) are reachable via `Tab` key navigation.
- Provide visible focus rings (`focus:outline-none focus:ring-2 focus:ring-amber-500`).
- Ensure modals handle `Escape` key closes and trap focus inside the dialog while open.

### 3. Screen Reader Support & ARIA Attributes
- Provide meaningful `aria-label` or `aria-labelledby` attributes for icon-only buttons (e.g., Lucide icon buttons).
- Use `aria-expanded` on accordion or dropdown toggles.
- Use `role="alert"` or `aria-live="polite"` for dynamic notification banners or order status changes.

### 4. Color Contrast & Visual Indicators
- Maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text against background colors.
- Do not rely solely on color to convey information (e.g., combine color with icons or textual labels for KOT status badges).
