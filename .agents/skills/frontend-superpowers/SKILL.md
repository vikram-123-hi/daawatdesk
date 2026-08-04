---
name: frontend-superpowers
description: Best practices for React 18 component structure, custom hooks, state management, and Tailwind CSS code organization.
---

# Frontend Superpowers Skill

This skill governs React application structure, state hygiene, component modularity, and Tailwind CSS execution.

## React & Component Architecture

### 1. Component Boundaries & Single Responsibility
- Break monolithic files down into small, single-purpose components.
- Keep UI rendering logic separate from heavy calculation or Firestore side-effects.
- Prefer controlled inputs and explicit state flow over mutable refs where appropriate.

### 2. Custom Hooks & Logic Extraction
- Extract repetitive logic into custom hooks (`useAuth`, `useScrollReveal`, `useLocalStorage`).
- Decouple Firebase listeners (`onSnapshot`) inside context providers or dedicated custom hooks with complete cleanup functions.

### 3. State Management & Hygiene
- Use Context API for global session and business domain states (`AuthContext`, `KOTContext`, `InventoryContext`).
- Avoid storing derived state. Compute derived data on the fly or memoize with `useMemo`.
- Never mutate state directly in React context or local state; always use functional updates (`setItems(prev => [...prev, newItem])`).

### 4. Tailwind CSS Optimization
- Group utility classes logically: Layout (`flex grid hidden`), Spacing (`m-2 p-4`), Sizing (`w-full h-12`), Typography (`text-base font-bold text-gray-800`), Background & Visuals (`bg-white rounded-lg shadow-md hover:bg-gray-50`).
- Extract recurring button or badge styles into clean helper classes or reusable UI primitives.
