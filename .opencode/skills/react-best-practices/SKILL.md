---
name: react-best-practices
description: React performance optimization guidelines. Use when writing, reviewing, or refactoring React code to ensure optimal performance patterns.
---

# React Best Practices

Performance optimization guide for React applications.

## When to Apply

- Writing new React components
- Implementing data fetching
- Reviewing code for performance issues
- Refactoring existing React code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact |
|----------|----------|--------|
| 1 | Eliminating Waterfalls | CRITICAL |
| 2 | Bundle Size Optimization | CRITICAL |
| 3 | Client-Side Data Fetching | MEDIUM-HIGH |
| 4 | Re-render Optimization | MEDIUM |
| 5 | Rendering Performance | MEDIUM |
| 6 | JavaScript Performance | LOW-MEDIUM |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

- Check cheap sync conditions before awaiting
- Use Promise.all() for independent operations
- Start promises early, await late

### 2. Bundle Size Optimization (CRITICAL)

- Import directly, avoid barrel files
- Use lazy() for heavy components
- Defer analytics/logging after hydration
- Load modules only when feature is activated

### 3. Client-Side Data Fetching (MEDIUM-HIGH)

- Deduplicate global event listeners
- Use passive listeners for scroll
- Version and minimize localStorage data

### 4. Re-render Optimization (MEDIUM)

- Don't subscribe to state only used in callbacks
- Extract expensive work into memoized components
- Use primitive dependencies in effects
- Derive state during render, not effects
- Use functional setState for stable callbacks
- Pass function to useState for expensive values
- Don't define components inside components
- Use startTransition for non-urgent updates

### 5. Rendering Performance (MEDIUM)

- Use content-visibility for long lists
- Extract static JSX outside components
- Use ternary, not && for conditionals

### 6. JavaScript Performance (LOW-MEDIUM)

- Build Map for repeated lookups
- Cache object properties in loops
- Combine multiple filter/map into one loop
- Check array length before expensive comparison
- Return early from functions
- Use Set/Map for O(1) lookups
- Defer non-critical work to browser idle time
