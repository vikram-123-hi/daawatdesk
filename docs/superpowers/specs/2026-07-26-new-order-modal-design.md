# New Order Modal — Customer Details + Auto Table Allocation

## Context

Current Billing.jsx flow: user opens billing page → sees menu → adds items → enters customer phone inline → selects table via modal. Customer details and table selection are scattered, no party size concept exists.

Industry standard (Petpooja, URY, Table Needs): table selection + customer info FIRST, then items. Pax count (party size) is a standard field used for table allocation and guest analytics.

## Goal

Add a "New Order" modal that opens when user clicks "New Order" button. Modal captures customer details + party size, auto-suggests a table, then loads the menu for that order.

## Design

### New Order Button

- Location: Top of the billing page, prominent position (replaces or sits next to existing controls)
- Style: Primary gradient button with `+` icon, labeled "New Order"
- Clicking opens the New Order modal

### New Order Modal

Fields (top to bottom):

1. **Order Type** — Toggle: `Dine-in` | `Parcel` (default: Dine-in)
   - Dine-in shows table selection
   - Parcel hides table selection, skips to items

2. **Customer Phone** (optional)
   - Same auto-search logic as current inline phone input
   - If existing customer found: shows name + birthday badge
   - If new customer: shows name field below

3. **Customer Name** (shown if phone entered and customer not found)
   - Required for new customers

4. **Pax Count** (party size) — only for Dine-in
   - Number input, default 2, range 1-20
   - Label: "How many guests?"

5. **Table Suggestion** — only for Dine-in
   - Based on pax count, auto-suggests best available table
   - Logic: find free tables where `seats >= pax` (sorted by closest seats), highlight as "Suggested"
   - User can override and pick any free table
   - If no free table fits: show warning "No table fits {pax} guests. Choose any available table."
   - Tables already occupied by other orders shown as "Occupied" (disabled)
   - Parcel/takeaway option always available (no table needed)

6. **Action Buttons**
   - "Start Order" (primary) — confirms selection, closes modal, loads menu
   - "Cancel" — closes modal, no order started

### State Changes

New state variables:
- `showNewOrderModal` (boolean) — controls modal visibility
- `newOrderType` ('dine-in' | 'parcel') — order type in modal
- `newOrderPax` (number) — party size, default 2
- `newOrderPhone` (string) — customer phone
- `newOrderName` (string) — customer name
- `newOrderTable` (number|null) — selected table id

Existing state reused:
- `selectedTable` — set from modal confirmation
- `customerPhone` — set from modal
- `activeCustomer` — set from modal
- `orderItems` — starts empty, populated after modal

### Flow

```
Billing Page Loads
  → Empty state (no order active)
  → User clicks "New Order"
  → Modal opens
  → User fills: phone (optional), pax (optional for parcel), selects table (or auto-suggested)
  → Clicks "Start Order"
  → Modal closes
  → selectedTable, customerPhone, activeCustomer set
  → Menu becomes active, user adds items
  → KOT/Bill flow continues as before
```

### Auto-Table Suggestion Algorithm

```
function suggestTable(pax, tables, occupiedIds):
  available = tables.filter(t => !occupiedIds.includes(t.id) && t.seats >= pax)
  available.sort((a, b) => a.seats - b.seats)  // closest fit first
  return available[0] || null
```

### Edge Cases

- **Parcel order:** No table selection, table = null (Parcel), pax not needed
- **No free tables:** Show all tables as occupied, user can still proceed with parcel
- **Existing customer with birthday:** Auto-apply 10% birthday discount (same as current)
- **Re-open existing table:** If user clicks a table that already has pending KOTs, load existing items (same as current behavior)

### UI Mockup (text)

```
┌─────────────────────────────────────┐
│  New Order                          │
│  ─────────────────────────────────  │
│                                     │
│  [Dine-in]  [Parcel]                │
│                                     │
│  Customer Phone (optional)          │
│  ┌─────────────────────────────┐    │
│  │ 📞 9876543210              │    │
│  └─────────────────────────────┘    │
│  ✓ Ravi Kumar — Happy Birthday! 🎂  │
│                                     │
│  How many guests?                   │
│  ┌───┐                              │
│  │ 4 │                              │
│  └───┘                              │
│                                     │
│  Suggested Table                    │
│  ┌──────────┐ ┌──────────┐         │
│  │ Table 4  │ │ Table 6  │ ...     │
│  │ 4 seats  │ │ 6 seats  │         │
│  │ ★ Suggested│ │          │         │
│  └──────────┘ └──────────┘         │
│                                     │
│  [Cancel]  [Start Order →]          │
└─────────────────────────────────────┘
```

## Files to Modify

- `src/components/Billing.jsx` — Add New Order modal, button, state, auto-suggest logic

## Verification

1. Click "New Order" → modal opens with Dine-in selected
2. Enter phone → customer auto-detected
3. Change pax to 4 → Table 4 (4-seater) suggested
4. Click "Start Order" → modal closes, table assigned, menu active
5. Add items → KOT shows correct table + customer
6. Parcel mode → no table shown, order works without table
7. All existing billing flow (discount, payment, KOT, bill print) still works
