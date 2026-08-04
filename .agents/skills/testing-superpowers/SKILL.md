---
name: testing-superpowers
description: Methodology for unit testing, integration testing, edge case handling, and regression prevention across billing, licensing, and inventory.
---

# Testing Superpowers Skill

This skill outlines testing standards, edge case matrix generation, and quality assurance strategies.

## Core Testing Domains

### 1. Business Logic & Calculation Edge Cases
- **Billing Calculations:**
  - Zero-item cart total calculation.
  - Percentage & fixed discount application.
  - Multi-tax / GST breakdown rounding accuracy (rounding to 2 decimal places).
  - Split payment math verification (e.g., Cash + UPI total matching invoice sum).

- **License Validity Rules (`utils/license.js`):**
  - Past expiration date -> Invalid (`false`).
  - Future expiration date -> Valid (`true`).
  - Null or undefined date -> Safe fallback handling.

### 2. Edge Case Matrix

| Feature | Tested Edge Case | Expected Behavior |
| :--- | :--- | :--- |
| **Billing POS** | Stock quantity reaches 0 | Show warning badge / prevent over-billing |
| **KOT System** | Kitchen staff offline | Queue local state or notify user |
| **Customer Menu**| Item price missing or NaN | Default to 0, log warning, prevent checkout crash |
| **Pin Code Auth** | Invalid PIN entered 3x | Display error message, maintain security lock |

### 3. Regression Testing Guidelines
- Whenever modifying core contexts (`KOTContext`, `InventoryContext`, `AuthContext`), verify all dependent views (`Billing.jsx`, `Kitchen.jsx`, `Reports.jsx`) to prevent breaking consumer signatures.
