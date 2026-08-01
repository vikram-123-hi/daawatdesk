# New Order Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "New Order" modal to Billing.jsx that captures customer details + party size, auto-suggests a table, then starts the order.

**Architecture:** Single file change in `Billing.jsx`. Add new state variables, a modal component, auto-suggest logic, and a "New Order" button. Existing billing flow (KOT, payment, bill print) unchanged.

**Tech Stack:** React 18, Tailwind CSS, Lucide React icons, existing CustomerContext (findCustomerByPhone)

## Global Constraints

- React 18 + Vite 5 + Tailwind CSS 3
- Firebase Firestore for customer data
- Existing `useCustomers` context with `findCustomerByPhone`
- `vibrate()` utility from `src/utils/haptics.js`
- `inputMode` attribute on all number/phone inputs
- `scrollbar-hide` CSS class for scrollable areas
- Mobile responsive (bottom-sheet style modals on mobile)
- No comments in code

---

## File Structure

**Modify:**
- `src/components/Billing.jsx` — All changes in this single file

**Read-only references:**
- `src/context/CustomerContext.jsx` — `findCustomerByPhone(phone)` returns customer object or null
- `src/context/KOTContext.jsx` — `activeKots` for checking occupied tables

---

### Task 1: Add New State Variables

**Files:**
- Modify: `src/components/Billing.jsx:225-275` (state declarations)

**What to add:** After existing state declarations (around line 274), add:

```javascript
const [showNewOrderModal, setShowNewOrderModal] = useState(true)
const [newOrderType, setNewOrderType] = useState('dine-in')
const [newOrderPax, setNewOrderPax] = useState(2)
const [newOrderPhone, setNewOrderPhone] = useState('')
const [newOrderName, setNewOrderName] = useState('')
const [newOrderTable, setNewOrderTable] = useState(null)
const [newOrderCustomer, setNewOrderCustomer] = useState(null)
```

**Why `showNewOrderModal: true`:** Modal opens on page load by default. When user closes it or starts an order, it sets to false. This replaces the current empty state.

- [ ] **Step 1:** Add the 7 new state variables after line 274 in Billing.jsx
- [ ] **Step 2:** Run `npx vite build` — verify no errors

---

### Task 2: Add Auto-Suggest Table Function

**Files:**
- Modify: `src/components/Billing.jsx` (add function after state declarations, before `useEffect` blocks)

**What to add:** After state declarations, add this helper function:

```javascript
function suggestTable(pax, tableList, occupiedIds) {
  const available = tableList.filter(t => !occupiedIds.includes(t.id) && t.seats >= pax)
  available.sort((a, b) => a.seats - b.seats)
  return available.length > 0 ? available[0] : null
}
```

Also add a helper to get occupied table IDs from active KOTs:

```javascript
function getOccupiedTableIds() {
  const ids = new Set()
  allPendingKots.forEach(k => {
    const match = k.table?.match(/Table\s*(\d+)/)
    if (match) ids.add(Number(match[1]))
  })
  return [...ids]
}
```

Note: `allPendingKots` is already defined in the component (line ~340). It filters out QR orders.

- [ ] **Step 1:** Add `suggestTable` function after state declarations
- [ ] **Step 2:** Add `getOccupiedTableIds` function after `suggestTable`
- [ ] **Step 3:** Run `npx vite build` — verify no errors

---

### Task 3: Add "New Order" Button to Header

**Files:**
- Modify: `src/components/Billing.jsx` (header section, around line 1398)

**Current code (line ~1398):**
```jsx
<span className="hidden sm:inline">{selectedTable ? `Table ${selectedTable}` : 'Parcel'}</span>
```

**Replace the header area** to include a "New Order" button. Find the header section (the top bar with the DaawatDesk logo and back button). Add a "New Order" button in the header, visible when no order is active or always available.

Add this button after the existing header controls (near the profile/settings area):

```jsx
<button
  onClick={() => setShowNewOrderModal(true)}
  className="flex items-center gap-2 bg-gradient-to-r from-primary to-orange text-white px-4 py-2 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] transition-all"
>
  <Plus className="w-4 h-4" />
  New Order
</button>
```

Place this in the header bar, between the existing controls. The exact position: after the profile pic button, before the closing `</div>` of the header flex row.

- [ ] **Step 1:** Add "New Order" button in the billing page header
- [ ] **Step 2:** Run `npx vite build` — verify no errors

---

### Task 4: Build the New Order Modal Component

**Files:**
- Modify: `src/components/Billing.jsx` (add modal JSX before closing `</div>` of the main return, around line 3400+)

**What to add:** Insert this modal before the closing of the main return statement. It should be placed alongside other modals (showTableModal, showPayment, etc.).

The modal structure:

```jsx
{showNewOrderModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-3xl max-h-[90vh] overflow-hidden animate-slide-up flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-secondary">New Order</h2>
          <button onClick={() => { setShowNewOrderModal(false); resetNewOrder() }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {/* Order Type Toggle */}
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setNewOrderType('dine-in')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${newOrderType === 'dine-in' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500'}`}
          >
            <Utensils className="w-4 h-4 inline mr-1.5" />
            Dine-in
          </button>
          <button
            onClick={() => { setNewOrderType('parcel'); setNewOrderTable(null) }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${newOrderType === 'parcel' ? 'bg-white text-secondary shadow-sm' : 'text-gray-500'}`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-1.5" />
            Parcel
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-5 space-y-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Customer Phone */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Customer Phone (optional)</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              inputMode="tel"
              pattern="[0-9]*"
              placeholder="10-digit phone number"
              value={newOrderPhone}
              onChange={async (e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setNewOrderPhone(val)
                if (val.length < 10) { setNewOrderCustomer(null); setNewOrderName(''); return }
                try {
                  const c = await findCustomerByPhone(val)
                  if (c) { setNewOrderCustomer(c); setNewOrderName(c.name || '') }
                  else { setNewOrderCustomer(null); setNewOrderName('') }
                } catch { setNewOrderCustomer(null) }
              }}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
            />
          </div>
          {newOrderCustomer && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green font-medium">
              <Check className="w-4 h-4" />
              {newOrderCustomer.name}
              {newOrderCustomer.dob && checkBday(newOrderCustomer.dob) && (
                <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">Birthday!</span>
              )}
            </div>
          )}
        </div>

        {/* Customer Name (only if phone entered and customer not found) */}
        {newOrderPhone.length === 10 && !newOrderCustomer && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Customer Name</label>
            <input
              type="text"
              placeholder="Enter name"
              value={newOrderName}
              onChange={(e) => setNewOrderName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm"
            />
          </div>
        )}

        {/* Pax Count (Dine-in only) */}
        {newOrderType === 'dine-in' && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">How many guests?</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNewOrderPax(Math.max(1, newOrderPax - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={newOrderPax}
                onChange={(e) => setNewOrderPax(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className="w-16 text-center text-xl font-bold text-secondary py-2 rounded-xl border border-gray-200 bg-gray-50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
              <button
                onClick={() => setNewOrderPax(Math.min(20, newOrderPax + 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Table Selection (Dine-in only) */}
        {newOrderType === 'dine-in' && (
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {suggestTable(newOrderPax, tables, getOccupiedTableIds()) ? 'Suggested Table' : 'Select Table'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {tables.map((table) => {
                const occupied = getOccupiedTableIds().includes(table.id)
                const suggested = suggestTable(newOrderPax, tables, getOccupiedTableIds())?.id === table.id
                const selected = newOrderTable === table.id
                return (
                  <button
                    key={table.id}
                    onClick={() => { if (!occupied) setNewOrderTable(table.id) }}
                    disabled={occupied}
                    className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                      selected ? 'border-primary bg-primary/5 shadow-sm' :
                      suggested ? 'border-green/50 bg-green/5' :
                      occupied ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' :
                      'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                    }`}
                  >
                    {suggested && !selected && (
                      <span className="absolute -top-2 -right-2 bg-green text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">★</span>
                    )}
                    {selected && (
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">✓</span>
                    )}
                    <p className={`font-bold text-sm ${selected ? 'text-primary' : suggested ? 'text-green' : occupied ? 'text-gray-400' : 'text-secondary'}`}>
                      {table.id}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{table.seats}s</p>
                    {occupied && <p className="text-[9px] text-red-400 mt-0.5">Busy</p>}
                  </button>
                )
              })}
            </div>
            {newOrderTable && (
              <div className="mt-2 text-sm text-primary font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Table {newOrderTable} selected ({tables.find(t => t.id === newOrderTable)?.seats} seats)
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={startNewOrder}
          disabled={newOrderType === 'dine-in' && !newOrderTable}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-primary to-orange text-white hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Start Order →
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 1:** Add the full modal JSX before the closing of the main return statement (after existing modals like showPayment, etc.)
- [ ] **Step 2:** Run `npx vite build` — verify no errors

---

### Task 5: Add startNewOrder and resetNewOrder Functions

**Files:**
- Modify: `src/components/Billing.jsx` (add functions before the return statement)

**What to add:**

```javascript
function resetNewOrder() {
  setNewOrderType('dine-in')
  setNewOrderPax(2)
  setNewOrderPhone('')
  setNewOrderName('')
  setNewOrderTable(null)
  setNewOrderCustomer(null)
}

function startNewOrder() {
  if (newOrderType === 'dine-in' && !newOrderTable) return

  if (newOrderType === 'parcel') {
    setSelectedTable(null)
  } else {
    setSelectedTable(newOrderTable)
  }

  if (newOrderCustomer) {
    setActiveCustomer(newOrderCustomer)
    setCustomerPhone(newOrderPhone)
    if (checkBday(newOrderCustomer.dob)) {
      setDiscount({ type: 'percent', value: 10 })
    }
  } else if (newOrderPhone.length === 10) {
    setCustomerPhone(newOrderPhone)
  }

  setShowNewOrderModal(false)
  resetNewOrder()
  vibrate(15)
}
```

- [ ] **Step 1:** Add `resetNewOrder` function before the return statement
- [ ] **Step 2:** Add `startNewOrder` function after `resetNewOrder`
- [ ] **Step 3:** Run `npx vite build` — verify no errors

---

### Task 6: Update Empty State to Show New Order Prompt

**Files:**
- Modify: `src/components/Billing.jsx:1866-1871` (empty order state)

**Current code (line ~1866):**
```jsx
{orderItems.length === 0 ? (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
    <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
    <p className="font-medium">No items in order</p>
    <p className="text-sm">Click menu items to add</p>
  </div>
)}
```

**Replace with:**
```jsx
{orderItems.length === 0 ? (
  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
    <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
    <p className="font-medium">No items in order</p>
    <p className="text-sm mb-4">Click "New Order" to start</p>
    <button
      onClick={() => setShowNewOrderModal(true)}
      className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
    >
      <Plus className="w-4 h-4" />
      New Order
    </button>
  </div>
)}
```

- [ ] **Step 1:** Replace the empty state JSX in the Current Order section
- [ ] **Step 2:** Run `npx vite build` — verify no errors

---

### Task 7: Handle "Parcel" Button in Existing Table Modal

**Files:**
- Modify: `src/components/Billing.jsx` (existing table modal, around line 2101)

The existing "Parcel / Takeaway" button in the table modal should also open the New Order modal in parcel mode instead. Find the Parcel button in the existing `showTableModal` and update its click handler:

```jsx
onClick={() => {
  setNewOrderType('parcel')
  setShowNewOrderModal(true)
  setShowTableModal(false)
}}
```

This ensures consistency — both paths (New Order button and Parcel shortcut) use the same modal.

- [ ] **Step 1:** Update the Parcel/Takeaway button click handler in the existing table modal
- [ ] **Step 2:** Run `npx vite build` — verify no errors

---

### Task 8: Auto-Apply Birthday Discount in startNewOrder

**Files:**
- Modify: `src/components/Billing.jsx` — already handled in Task 5's `startNewOrder` function

This task is a verification step — confirm the birthday discount logic in `startNewOrder` works:
- `checkBday(newOrderCustomer.dob)` is called
- If true, `setDiscount({ type: 'percent', value: 10 })` is called

Also verify the `checkBday` function exists and works with the customer's `dob` field (format: `YYYY-MM-DD`).

- [ ] **Step 1:** Search for `checkBday` in Billing.jsx to confirm it exists
- [ ] **Step 2:** Verify the function compares `dob.slice(5)` with today's date
- [ ] **Step 3:** Run `npx vite build` — verify no errors

---

### Task 9: Final Build + Visual Verification

**Files:**
- No changes — verification only

- [ ] **Step 1:** Run `npx vite build` — verify clean build with 0 errors
- [ ] **Step 2:** Start dev server `npx vite` and open `http://localhost:5173/billing`
- [ ] **Step 3:** Verify: Modal opens on page load
- [ ] **Step 4:** Verify: Dine-in/Parcel toggle works
- [ ] **Step 5:** Verify: Phone input auto-searches customer
- [ ] **Step 6:** Verify: Pax count changes update suggested table
- [ ] **Step 7:** Verify: Table selection highlights correctly
- [ ] **Step 8:** Verify: "Start Order" assigns table and closes modal
- [ ] **Step 9:** Verify: Empty state shows "New Order" button
- [ ] **Step 10:** Verify: Existing billing flow (KOT, payment, bill) still works
- [ ] **Step 11:** Verify: Mobile responsive (bottom-sheet modal)
