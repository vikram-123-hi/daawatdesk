import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { useCodeAccess } from './CodeAccessContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where, getDocs, increment } from 'firebase/firestore'

const CustomerContext = createContext()

export function useCustomers() {
  return useContext(CustomerContext)
}

export function CustomerProvider({ children }) {
  const { currentUser } = useAuth()
  const { codeUser } = useCodeAccess()
  const activeUid = currentUser?.uid || codeUser?.uid
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeUid) { setCustomers([]); setLoading(false); return }
    const unsub = onSnapshot(
      query(collection(db, 'users', activeUid, 'customers'), orderBy('createdAt', 'desc')),
      (snap) => {
        setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return () => unsub()
  }, [activeUid])

  async function addCustomer(data) {
    if (!activeUid) return null
    const docRef = await addDoc(collection(db, 'users', activeUid, 'customers'), {
      name: (data.name || '').trim(),
      phone: (data.phone || '').trim(),
      dob: data.dob || null,
      email: (data.email || '').trim(),
      tags: data.tags || [],
      notes: (data.notes || '').trim(),
      totalOrders: 0,
      totalSpent: 0,
      lastVisit: null,
      firstVisit: null,
      createdAt: new Date().toISOString(),
    })
    return docRef
  }

  async function updateCustomer(id, updates) {
    if (!activeUid) return
    await updateDoc(doc(db, 'users', activeUid, 'customers', id), updates)
  }

  async function deleteCustomer(id) {
    if (!activeUid) return
    await deleteDoc(doc(db, 'users', activeUid, 'customers', id))
  }

  async function findCustomerByPhone(phone) {
    if (!activeUid || !phone) return null
    const cleaned = phone.replace(/\D/g, '').slice(-10)
    if (cleaned.length < 10) return null
    const q = query(collection(db, 'users', activeUid, 'customers'), where('phone', '==', cleaned))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const result = snap.docs[0]
    return { id: result.id, ...result.data() }
  }

  async function incrementCustomerStats(customerId, orderTotal) {
    if (!activeUid || !customerId) return
    await updateDoc(doc(db, 'users', activeUid, 'customers', customerId), {
      totalOrders: increment(1),
      totalSpent: increment(Number(orderTotal) || 0),
      lastVisit: new Date().toISOString(),
    })
  }

  async function createQuickCustomer(phone, name) {
    if (!activeUid || !phone) return null
    const cleaned = phone.replace(/\D/g, '').slice(-10)
    const existing = await findCustomerByPhone(cleaned)
    if (existing) return existing
    return await addCustomer({
      name: name || 'Customer',
      phone: cleaned,
      tags: ['New'],
    })
  }

  function toLocalDateStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const todayBirthdays = useMemo(() => {
    const today = toLocalDateStr(new Date())
    return customers.filter((c) => {
      if (!c.dob) return false
      return c.dob.slice(5) === today.slice(5)
    }).map((c) => {
      const birthYear = Number(c.dob.split('-')[0])
      const thisYear = new Date().getFullYear()
      return { ...c, ageTurning: thisYear - birthYear }
    })
  }, [customers])

  const value = {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    findCustomerByPhone,
    incrementCustomerStats,
    createQuickCustomer,
    todayBirthdays,
    canWrite: !!currentUser,
  }

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
}
