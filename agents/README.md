# DaawatDesk Agent System & Workflow

Directory containing permanent system prompts for all 7 specialized agents.

## Agent System Roster

1. [`project-manager.md`](./project-manager.md) — Task breakdown, execution ordering & tracking.
2. [`feature-developer.md`](./feature-developer.md) — Senior Full Stack implementation.
3. [`code-reviewer.md`](./code-reviewer.md) — Staff Engineer security, code quality & design pattern review.
4. [`uiux-designer.md`](./uiux-designer.md) — Visual polish, spacing, micro-interactions & accessibility.
5. [`firebase-architect.md`](./firebase-architect.md) — Firestore, Auth, Security Rules & cloud functions optimization.
6. [`performance-engineer.md`](./performance-engineer.md) — Bundle size, lazy loading, rendering performance & Lighthouse optimization.
7. [`qa-tester.md`](./qa-tester.md) — End-to-end verification, build testing, edge case checks & production readiness.

## Execution Workflow Pipeline

```
User
 │
 ▼
Project Manager
 │
 ▼
Feature Developer
 │
 ▼
Code Reviewer
 │
 ▼
Performance Engineer
 │
 ▼
Firebase Architect
 │
 ▼
UI/UX Designer
 │
 ▼
QA Engineer
 │
 ├── ❌ QA Fail ──► Feature Developer (Fixes & Resubmits to QA)
 └── ✅ QA Pass ──► Production Ready
```
