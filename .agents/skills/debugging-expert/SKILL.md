---
name: debugging-expert
description: Diagnostic procedures for identifying root causes of bugs, resolving console errors, preventing runtime crashes, and fixing memory leaks in React and Firebase applications.
---

# Debugging Expert Skill

This skill provides diagnostic standards and systematic troubleshooting routines for React, Firestore, and Vite applications.

## Debugging Workflow

### 1. Log First, Never Guess
- Inspect exact console error traces, line numbers, and network payloads before mutating code logic.
- Log incoming Firebase snapshot objects or state updates during critical lifecycles to inspect exact schema shapes.

### 2. Common Bug Patterns & Root Causes

#### A. Firebase Snapshot & Async Memory Leaks
- **Symptom:** "Can't perform a React state update on an unmounted component" or memory growth.
- **Fix:** Always return unsubscribe functions in `useEffect`:
  ```js
  useEffect(() => {
    let cancelled = false;
    const unsub = onSnapshot(docRef, (doc) => {
      if (!cancelled && doc.exists()) {
        setData(doc.data());
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [docRef]);
  ```

#### B. Null Dereferencing & Optional Chaining
- **Symptom:** `TypeError: Cannot read properties of undefined (reading 'price')`.
- **Fix:** Always guard object access with optional chaining (`item?.price ?? 0`) or default fallbacks.

#### C. React Key Warnings
- **Symptom:** `Warning: Each child in a list should have a unique "key" prop.`
- **Fix:** Ensure all map iterations render elements with unique IDs (e.g., `item.id || index`).

### 3. Defensive Programming Rules
- Never swallow errors silently in try/catch blocks (`catch (e) { console.error("Operation failed:", e); }`).
- Handle offline or network failure states gracefully when querying Firestore.
