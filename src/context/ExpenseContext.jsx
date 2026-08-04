import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'

const ExpenseContext = createContext()

export function useExpenses() {
  return useContext(ExpenseContext)
}

export const EXPENSE_CATEGORIES = [
  { id: 'rent', name: 'Rent & Lease', icon: '🏠', color: 'blue' },
  { id: 'salary', name: 'Staff Salary & Wages', icon: '👤', color: 'green' },
  { id: 'utilities', name: 'Utilities (Gas/Electric/Water)', icon: '💡', color: 'yellow' },
  { id: 'ingredients', name: 'Raw Food & Ingredients', icon: '🥘', color: 'orange' },
  { id: 'maintenance', name: 'Maintenance & Repairs', icon: '🔧', color: 'purple' },
  { id: 'packaging', name: 'Packaging & Disposables', icon: '📦', color: 'pink' },
  { id: 'marketing', name: 'Marketing & Ads', icon: '📢', color: 'red' },
  { id: 'transport', name: 'Transport & Delivery', icon: '🚚', color: 'indigo' },
  { id: 'license', name: 'License & Software', icon: '📄', color: 'amber' },
  { id: 'insurance', name: 'Insurance & Safety', icon: '🛡️', color: 'teal' },
  { id: 'tax', name: 'Tax & Compliance', icon: '💰', color: 'emerald' },
  { id: 'other', name: 'Other Operational', icon: '📋', color: 'gray' },
]

export const DEFAULT_TEMPLATES = [
  { id: 'tpl-1', name: 'Commercial Gas Cylinder', category: 'utilities', amount: 1650, note: 'LPG Refill', paymentMode: 'cash' },
  { id: 'tpl-2', name: 'Daily Dairy & Milk', category: 'ingredients', amount: 450, note: 'Milk & Paneer supply', paymentMode: 'cash' },
  { id: 'tpl-3', name: 'Fresh Vegetables Cash', category: 'ingredients', amount: 1200, note: 'Morning Mandi', paymentMode: 'cash' },
  { id: 'tpl-4', name: 'Takeaway Boxes & Bags', category: 'packaging', amount: 850, note: 'Packaging supplies', paymentMode: 'upi' },
  { id: 'tpl-5', name: 'Store Cleaning Supplies', category: 'maintenance', amount: 350, note: 'Detergents & Mops', paymentMode: 'cash' },
]

export function ExpenseProvider({ children }) {
  const { currentUser } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [quickTemplates, setQuickTemplates] = useState(() => {
    const saved = localStorage.getItem('daawatdesk_quick_templates')
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES
  })
  const [monthlyBudget, setMonthlyBudgetState] = useState(() => {
    const saved = localStorage.getItem('daawatdesk_expense_budget')
    return saved ? Number(saved) : 50000
  })

  useEffect(() => {
    if (!currentUser) { setExpenses([]); setLoading(false); return }
    const q = query(collection(db, 'users', currentUser.uid, 'expenses'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [currentUser])

  function setMonthlyBudget(val) {
    const b = Number(val) || 0
    setMonthlyBudgetState(b)
    localStorage.setItem('daawatdesk_expense_budget', String(b))
    if (currentUser) {
      updateDoc(doc(db, 'users', currentUser.uid), { expenseBudget: b }).catch(() => {})
    }
  }

  async function addExpense(data) {
    if (!currentUser) return
    return addDoc(collection(db, 'users', currentUser.uid, 'expenses'), {
      ...data,
      vendor: data.vendor ? data.vendor.trim() : '',
      isRecurring: Boolean(data.isRecurring),
      createdAt: new Date().toISOString(),
    })
  }

  async function updateExpense(id, data) {
    if (!currentUser) return
    return updateDoc(doc(db, 'users', currentUser.uid, 'expenses', id), data)
  }

  async function deleteExpense(id) {
    if (!currentUser) return
    return deleteDoc(doc(db, 'users', currentUser.uid, 'expenses', id))
  }

  const totalThisMonth = expenses.reduce((sum, e) => {
    const d = new Date(e.date)
    const now = new Date()
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      return sum + (Number(e.amount) || 0)
    }
    return sum
  }, 0)

  const totalToday = expenses.reduce((sum, e) => {
    const d = new Date(e.date)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return sum + (Number(e.amount) || 0)
    }
    return sum
  }, 0)

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.id).reduce((s, e) => s + (Number(e.amount) || 0), 0),
    count: expenses.filter((e) => e.category === cat.id).length,
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total)

  function updateQuickTemplate(id, newAmount) {
    setQuickTemplates((prev) => {
      const next = prev.map((t) => (t.id === id || t.name === id) ? { ...t, amount: Number(newAmount) || 0 } : t)
      localStorage.setItem('daawatdesk_quick_templates', JSON.stringify(next))
      return next
    })
  }

  const budgetUsedPercent = monthlyBudget > 0 ? Math.min(100, Math.round((totalThisMonth / monthlyBudget) * 100)) : 0

  const value = {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    totalThisMonth,
    totalToday,
    categoryTotals,
    EXPENSE_CATEGORIES,
    QUICK_TEMPLATES: DEFAULT_TEMPLATES,
    quickTemplates,
    updateQuickTemplate,
    monthlyBudget,
    setMonthlyBudget,
    budgetUsedPercent,
  }

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
}
