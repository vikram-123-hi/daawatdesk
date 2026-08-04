---
name: code-reviewer
description: Code quality rules, clean code principles, refactoring guidance, duplicate code elimination, and architecture reviews.
---

# Code Reviewer Skill

This skill enforces code cleanliness, architectural integrity, and maintainability standards across the codebase.

## Principles & Checklist

### 1. Clean Code & DRY Principle
- **No Duplicate Logic:** Avoid repeating helper routines (such as date formatting, currency formatting, or phone number parsing). Move them to `src/utils/`.
- **Meaningful Naming:** Variables, functions, and state variables must describe intent clearly (`isLicenseValid`, `activeOrderList`, `calculateGrandTotal`).
- **Dead Code Removal:** Regularly scan for and remove unused imports, abandoned components, and commented-out legacy code blocks.

### 2. Architecture & File Decomposition
- Files exceeding 500 lines (e.g. large UI components) should be evaluated for modular decomposition:
  - Extract sub-dialogs/modals into standalone component files.
  - Extract table row renderers or complex filters.
- Maintain clear layer separation: Presentation (`src/components`), State & Domain Logic (`src/context`), Services (`src/firebase.js`), Utilities (`src/utils`).

### 3. Commenting & Documentation
- Preserve existing docstrings and comments unless modifying the underlying contract.
- Clearly mark temporary development flags or mocks with `/* TEMPORARY FEATURE */` comments.
