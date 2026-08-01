import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'

const ExpenseContext = createContext()

export function useExpenses() {
  return useContext(ExpenseContext)
}

const EXPENSE_CATEGORIES = [
  { id: 'rent', name: 'Rent', icon: '🏠', color: 'blue' },
  { id: 'salary', name: 'Staff Salary', icon: '👤', color: 'green' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: 'yellow' },
  { id: 'ingredients', name: 'Ingredients', icon: '🥘', color: 'orange' },
  { id: 'maintenance', name: 'Maintenance', icon: '🔧', color: 'purple' },
  { id: 'packaging', name: 'Packaging', icon: '📦', color: 'pink' },
  { id: 'marketing', name: 'Marketing', icon: '📢', color: 'red' },
  { id: 'transport', name: 'Transport', icon: '🚚', color: 'indigo' },
  { id: 'license', name: 'License & Permits', icon: '📄', color: 'amber' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: 'teal' },
  { id: 'tax', name: 'Tax & GST', icon: '💰', color: 'emerald' },
  { id: 'other', name: 'Other', icon: '📋', color: 'gray' },
]

export function ExpenseProvider({ children }) {
  const { currentUser } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) { setExpenses([]); setLoading(false); return }
    const q = query(collection(db, 'users', currentUser.uid, 'expenses'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [currentUser])

  async function addExpense(data) {
    if (!currentUser) return
    return addDoc(collection(db, 'users', currentUser.uid, 'expenses'), {
      ...data,
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
  }

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
}
