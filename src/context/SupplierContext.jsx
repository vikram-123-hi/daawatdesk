import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'

const SupplierContext = createContext()

export function useSuppliers() {
  return useContext(SupplierContext)
}

export function SupplierProvider({ children }) {
  const { currentUser } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) { setSuppliers([]); setLoading(false); return }
    const q = query(collection(db, 'users', currentUser.uid, 'suppliers'), orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [currentUser])

  async function addSupplier(data) {
    if (!currentUser) return
    return addDoc(collection(db, 'users', currentUser.uid, 'suppliers'), {
      ...data,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    })
  }

  async function updateSupplier(id, data) {
    if (!currentUser) return
    return updateDoc(doc(db, 'users', currentUser.uid, 'suppliers', id), data)
  }

  async function deleteSupplier(id) {
    if (!currentUser) return
    return deleteDoc(doc(db, 'users', currentUser.uid, 'suppliers', id))
  }

  const activeSuppliers = suppliers.filter((s) => !s.archived)
  const totalSpent = suppliers.reduce((sum, s) => sum + (Number(s.totalSpent) || 0), 0)
  const topSuppliers = [...activeSuppliers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 5)

  const value = {
    suppliers,
    activeSuppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    totalSpent,
    topSuppliers,
  }

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>
}
