---
name: security-audit
description: Security guidelines for Firebase Firestore security rules, authentication protection, XSS prevention, and secret credential handling.
---

# Security Audit Skill

This skill enforces security checks across Firestore security rules, client-side input handling, authentication checks, and secret exposures.

## Security Practices

### 1. Firebase Firestore Security Rules
- Ensure `firestore.rules` enforces authorization checks for read/write operations:
  - Users must only be allowed to access data belonging to their own account or business tenant (`request.auth != null && request.auth.uid == userId`).
  - Publicly readable routes (e.g. `/menu` for customer menus) must have restricted write permissions.

### 2. Client-Side Input Sanitization & XSS
- Sanitize user-provided text inputs before rendering dynamic HTML or exporting reports.
- Avoid using `dangerouslySetInnerHTML` unless input is thoroughly sanitized with DOMPurify.

### 3. Secrets & API Keys Exposure
- Store sensitive environment variables in `.env` and never commit production API keys or admin credentials to version control.
- Ensure `.env` is listed in `.gitignore`.

### 4. Authentication & Protected Routes
- Wrap sensitive routes with `ProtectedRoute` or `CodeAccessRoute`.
- Validate user session state on the server or Firestore rules level, not just in client-side state.
