import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useCodeAccess } from './CodeAccessContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore'

const InventoryContext = createContext()

export function useInventory() {
  return useContext(InventoryContext)
}

const DEFAULT_CATEGORIES = [
  { id: 'veg', name: 'Vegetables & Fruits', color: 'green' },
  { id: 'meat', name: 'Meat & Seafood', color: 'red' },
  { id: 'dairy', name: 'Dairy & Eggs', color: 'yellow' },
  { id: 'spice', name: 'Spices & Masala', color: 'orange' },
  { id: 'grain', name: 'Grains & Flour', color: 'amber' },
  { id: 'oil', name: 'Oil & Ghee', color: 'yellow' },
  { id: 'bev', name: 'Beverages', color: 'blue' },
  { id: 'pack', name: 'Packaging', color: 'gray' },
  { id: 'clean', name: 'Cleaning', color: 'teal' },
  { id: 'other', name: 'Other', color: 'purple' },
]

const UNITS = ['kg', 'g', 'ltr', 'ml', 'pcs', 'dozen', 'bag', 'box', 'bottle', 'can']

const SHELF_LIFE_DAYS = {
  dairy: 3,
  meat: 2,
  veg: 5,
  spice: 90,
  grain: 180,
  oil: 365,
  bev: 180,
  pack: 365,
  clean: 365,
  other: 30,
}

export { DEFAULT_CATEGORIES, UNITS, SHELF_LIFE_DAYS }

export function InventoryProvider({ children }) {
  const { currentUser } = useAuth()
  const { codeUser } = useCodeAccess()
  const activeUid = currentUser?.uid || codeUser?.uid
  const [items, setItems] = useState([])
  const [movements, setMovements] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeUid) { setItems([]); setMovements([]); setLoading(false); return }
    const unsubItems = onSnapshot(
      query(collection(db, 'users', activeUid, 'inventory'), orderBy('name', 'asc')),
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const seen = new Map()
        all.forEach((item) => {
          const key = item.name?.toLowerCase().trim()
          if (!seen.has(key)) seen.set(key, item)
          else {
            const existing = seen.get(key)
            if ((item.currentStock || 0) > (existing.currentStock || 0)) seen.set(key, item)
          }
        })
        setItems(Array.from(seen.values()))
        setLoading(false)
      },
      () => setLoading(false)
    )
    const unsubMovements = onSnapshot(
      query(collection(db, 'users', activeUid, 'stockMovements'), orderBy('createdAt', 'desc')),
      (snap) => setMovements(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
    return () => { unsubItems(); unsubMovements() }
  }, [activeUid])

  async function addItem(item) {
    if (!activeUid) return
    const docRef = await addDoc(collection(db, 'users', activeUid, 'inventory'), {
      name: item.name,
      sku: item.sku || '',
      category: item.category || 'other',
      unit: item.unit || 'pcs',
      costPrice: Number(item.costPrice) || 0,
      currentStock: Number(item.currentStock) || 0,
      minStock: Number(item.minStock) || 0,
      supplier: item.supplier || '',
      notes: item.notes || '',
      createdAt: new Date().toISOString(),
    })
    return docRef
  }

  async function updateItem(id, updates) {
    if (!activeUid) return
    await updateDoc(doc(db, 'users', activeUid, 'inventory', id), updates)
  }

  async function deleteItem(id) {
    if (!activeUid) return
    await deleteDoc(doc(db, 'users', activeUid, 'inventory', id))
  }

  async function adjustStock(itemId, type, quantity, reason, expiryDate) {
    if (!activeUid) return
    const item = items.find((i) => i.id === itemId)
    if (!item) return
    const qty = Number(quantity)
    let newStock = item.currentStock
    if (type === 'add' || type === 'purchase') newStock += qty
    else if (type === 'reduce' || type === 'wastage') newStock -= qty
    if (newStock < 0) newStock = 0
    const updates = { currentStock: newStock }
    if (expiryDate) updates.expiryDate = expiryDate
    await updateDoc(doc(db, 'users', activeUid, 'inventory', itemId), updates)
    await addDoc(collection(db, 'users', activeUid, 'stockMovements'), {
      itemId,
      itemName: item.name,
      category: item.category,
      cost: item.costPrice || 0,
      type,
      quantity: qty,
      previousStock: item.currentStock,
      newStock,
      reason: reason || '',
      unit: item.unit,
      expiryDate: expiryDate || item.expiryDate || '',
      createdAt: new Date().toISOString(),
    })
  }

  const lowStockItems = items.filter((i) => i.minStock > 0 && i.currentStock <= i.minStock)
  const totalValue = items.reduce((sum, i) => sum + (i.costPrice * i.currentStock), 0)
  const canWrite = !!currentUser

  const todayStr = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!activeUid || items.length === 0) return
    if (sessionStorage.getItem('expiryMigrated')) return
    const missingExpiry = items.filter((i) => !i.expiryDate)
    if (missingExpiry.length === 0) { sessionStorage.setItem('expiryMigrated', '1'); return }
    sessionStorage.setItem('expiryMigrated', '1')
    const today = new Date()
    const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
    missingExpiry.forEach((item) => {
      const cat = item.category
      let expiryDate
      if (cat === 'dairy' || cat === 'meat') {
        const range = [-2, -1, 0, 0, 1, 1, 2, 3]
        expiryDate = addDays(range[Math.floor(Math.random() * range.length)])
      } else if (cat === 'veg') {
        const range = [-1, 0, 1, 2, 3, 4, 5]
        expiryDate = addDays(range[Math.floor(Math.random() * range.length)])
      } else {
        const shelfLife = SHELF_LIFE_DAYS[cat] || 30
        expiryDate = addDays(Math.floor(shelfLife * 0.5 + Math.random() * shelfLife * 0.5))
      }
      updateDoc(doc(db, 'users', activeUid, 'inventory', item.id), { expiryDate })
    })
  }, [activeUid, items.length])

  const expiringItems = items.filter((i) => {
    if (!i.expiryDate) return false
    const exp = new Date(i.expiryDate)
    const today = new Date(todayStr)
    const diffMs = exp.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / 86400000)
    return diffDays <= 3
  }).map((i) => {
    const exp = new Date(i.expiryDate)
    const today = new Date(todayStr)
    const diffMs = exp.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / 86400000)
    return { ...i, daysLeft: diffDays }
  }).sort((a, b) => a.daysLeft - b.daysLeft)

  const expiredItems = expiringItems.filter((i) => i.daysLeft < 0)
  const expiringToday = expiringItems.filter((i) => i.daysLeft === 0)
  const expiringSoon = expiringItems.filter((i) => i.daysLeft > 0)

  async function seedDummyItems() {
    if (!currentUser) return
    const existing = await getDocs(query(collection(db, 'users', currentUser.uid, 'inventory')))
    if (existing.size > 0) return
    const today = new Date()
    const fmt = (d) => d.toISOString().slice(0, 10)
    const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d) }

    const DUMMY = [
      { name: 'Onion', sku: 'VEG-001', category: 'veg', unit: 'kg', costPrice: 30, currentStock: 50, minStock: 15, supplier: 'Local Mandi', expiryDate: addDays(4) },
      { name: 'Tomato', sku: 'VEG-002', category: 'veg', unit: 'kg', costPrice: 40, currentStock: 35, minStock: 15, supplier: 'Local Mandi', expiryDate: addDays(1) },
      { name: 'Potato', sku: 'VEG-003', category: 'veg', unit: 'kg', costPrice: 25, currentStock: 60, minStock: 20, supplier: 'Local Mandi', expiryDate: addDays(5) },
      { name: 'Green Chilli', sku: 'VEG-004', category: 'veg', unit: 'kg', costPrice: 80, currentStock: 8, minStock: 5, supplier: 'Spice Garden', expiryDate: addDays(-1) },
      { name: 'Lemon', sku: 'VEG-005', category: 'veg', unit: 'pcs', costPrice: 5, currentStock: 40, minStock: 20, supplier: 'Spice Garden', expiryDate: addDays(3) },
      { name: 'Paneer', sku: 'DAI-001', category: 'dairy', unit: 'kg', costPrice: 350, currentStock: 12, minStock: 5, supplier: 'Amul Dairy', expiryDate: addDays(2) },
      { name: 'Curd', sku: 'DAI-002', category: 'dairy', unit: 'ltr', costPrice: 60, currentStock: 10, minStock: 4, supplier: 'Amul Dairy', expiryDate: addDays(0) },
      { name: 'Milk', sku: 'DAI-003', category: 'dairy', unit: 'ltr', costPrice: 55, currentStock: 20, minStock: 10, supplier: 'Amul Dairy', expiryDate: addDays(-2) },
      { name: 'Butter', sku: 'DAI-004', category: 'dairy', unit: 'pcs', costPrice: 50, currentStock: 8, minStock: 4, supplier: 'Amul Dairy', expiryDate: addDays(1) },
      { name: 'Eggs', sku: 'DAI-005', category: 'dairy', unit: 'dozen', costPrice: 72, currentStock: 6, minStock: 3, supplier: 'Poultry Farm', expiryDate: addDays(3) },
      { name: 'Chicken Boneless', sku: 'MST-001', category: 'meat', unit: 'kg', costPrice: 280, currentStock: 10, minStock: 5, supplier: 'Fresh Meat Shop', expiryDate: addDays(1) },
      { name: 'Mutton', sku: 'MST-002', category: 'meat', unit: 'kg', costPrice: 650, currentStock: 4, minStock: 3, supplier: 'Fresh Meat Shop', expiryDate: addDays(-1) },
      { name: 'Basmati Rice', sku: 'GRN-001', category: 'grain', unit: 'kg', costPrice: 80, currentStock: 25, minStock: 10, supplier: 'Wholesale Bazaar', expiryDate: addDays(180) },
      { name: 'Wheat Flour (Atta)', sku: 'GRN-002', category: 'grain', unit: 'kg', costPrice: 45, currentStock: 30, minStock: 10, supplier: 'Wholesale Bazaar', expiryDate: addDays(120) },
      { name: 'Maida', sku: 'GRN-003', category: 'grain', unit: 'kg', costPrice: 38, currentStock: 15, minStock: 8, supplier: 'Wholesale Bazaar', expiryDate: addDays(150) },
      { name: 'Sooji (Semolina)', sku: 'GRN-004', category: 'grain', unit: 'kg', costPrice: 50, currentStock: 8, minStock: 5, supplier: 'Wholesale Bazaar', expiryDate: addDays(100) },
      { name: 'Chana Dal', sku: 'GRN-005', category: 'grain', unit: 'kg', costPrice: 90, currentStock: 12, minStock: 6, supplier: 'Wholesale Bazaar', expiryDate: addDays(200) },
      { name: 'Red Chilli Powder', sku: 'SPC-001', category: 'spice', unit: 'kg', costPrice: 200, currentStock: 5, minStock: 2, supplier: 'Everest Spices', expiryDate: addDays(90) },
      { name: 'Turmeric Powder', sku: 'SPC-002', category: 'spice', unit: 'kg', costPrice: 180, currentStock: 3, minStock: 2, supplier: 'Everest Spices', expiryDate: addDays(75) },
      { name: 'Garam Masala', sku: 'SPC-003', category: 'spice', unit: 'kg', costPrice: 400, currentStock: 2, minStock: 1, supplier: 'Everest Spices', expiryDate: addDays(60) },
      { name: 'Coriander Powder', sku: 'SPC-004', category: 'spice', unit: 'kg', costPrice: 150, currentStock: 4, minStock: 2, supplier: 'Everest Spices', expiryDate: addDays(80) },
      { name: 'Cumin Seeds', sku: 'SPC-005', category: 'spice', unit: 'kg', costPrice: 300, currentStock: 3, minStock: 1, supplier: 'Everest Spices', expiryDate: addDays(95) },
      { name: 'Sunflower Oil', sku: 'OIL-001', category: 'oil', unit: 'ltr', costPrice: 150, currentStock: 15, minStock: 5, supplier: 'Fortune Foods', expiryDate: addDays(365) },
      { name: 'Mustard Oil', sku: 'OIL-002', category: 'oil', unit: 'ltr', costPrice: 180, currentStock: 8, minStock: 3, supplier: 'Fortune Foods', expiryDate: addDays(300) },
      { name: 'Ghee', sku: 'OIL-003', category: 'oil', unit: 'ltr', costPrice: 500, currentStock: 6, minStock: 2, supplier: 'Amul Dairy', expiryDate: addDays(180) },
      { name: 'Tea Powder', sku: 'BEV-001', category: 'bev', unit: 'kg', costPrice: 250, currentStock: 4, minStock: 2, supplier: 'Brooke Bond', expiryDate: addDays(120) },
      { name: 'Coffee Powder', sku: 'BEV-002', category: 'bev', unit: 'kg', costPrice: 450, currentStock: 2, minStock: 1, supplier: 'Nescafe', expiryDate: addDays(90) },
      { name: 'Soft Drinks (Coke)', sku: 'BEV-003', category: 'bev', unit: 'bottle', costPrice: 35, currentStock: 24, minStock: 10, supplier: 'Coca-Cola Distributor', expiryDate: addDays(180) },
      { name: 'Mineral Water', sku: 'BEV-004', category: 'bev', unit: 'bottle', costPrice: 18, currentStock: 48, minStock: 20, supplier: 'Bisleri', expiryDate: addDays(90) },
      { name: 'Packing Containers', sku: 'PKG-001', category: 'pack', unit: 'pcs', costPrice: 8, currentStock: 200, minStock: 50, supplier: 'PackWell Ltd', expiryDate: addDays(365) },
      { name: 'Tissue Rolls', sku: 'PKG-002', category: 'pack', unit: 'box', costPrice: 45, currentStock: 12, minStock: 5, supplier: 'PackWell Ltd', expiryDate: addDays(365) },
      { name: 'Hand Wash Liquid', sku: 'CLN-001', category: 'clean', unit: 'ltr', costPrice: 120, currentStock: 3, minStock: 2, supplier: 'Himalaya', expiryDate: addDays(365) },
      { name: 'Dish Soap', sku: 'CLN-002', category: 'clean', unit: 'ltr', costPrice: 90, currentStock: 5, minStock: 3, supplier: 'Vim', expiryDate: addDays(300) },
      { name: 'Garbage Bags', sku: 'OTR-001', category: 'other', unit: 'bag', costPrice: 60, currentStock: 4, minStock: 2, supplier: 'PackWell Ltd', expiryDate: addDays(30) },
    ]
    for (const item of DUMMY) {
      const ref = await addDoc(collection(db, 'users', currentUser.uid, 'inventory'), {
        ...item,
        notes: '',
        createdAt: new Date().toISOString(),
      })
      item._ref = ref
    }
    const DUMMY_MOVEMENTS = [
      { itemRef: DUMMY[0], type: 'purchase', qty: 20, prev: 30, new: 50, reason: 'Weekly stock from mandi' },
      { itemRef: DUMMY[1], type: 'purchase', qty: 15, prev: 20, new: 35, reason: 'Fresh delivery' },
      { itemRef: DUMMY[5], type: 'purchase', qty: 5, prev: 7, new: 12, reason: 'Amul restock' },
      { itemRef: DUMMY[10], type: 'usage', qty: 3, prev: 13, new: 10, reason: 'Butter chicken orders' },
      { itemRef: DUMMY[11], type: 'usage', qty: 2, prev: 6, new: 4, reason: 'Mutton curry prep' },
      { itemRef: DUMMY[12], type: 'purchase', qty: 10, prev: 15, new: 25, reason: 'Monthly rice order' },
      { itemRef: DUMMY[17], type: 'wastage', qty: 1, prev: 6, new: 5, reason: 'Spilled during prep' },
      { itemRef: DUMMY[22], type: 'purchase', qty: 5, prev: 10, new: 15, reason: 'Fortune oil can' },
      { itemRef: DUMMY[25], type: 'purchase', qty: 24, prev: 0, new: 24, reason: 'Cold drink crates' },
      { itemRef: DUMMY[26], type: 'purchase', qty: 48, prev: 0, new: 48, reason: 'Bisleri carton' },
      { itemRef: DUMMY[27], type: 'usage', qty: 50, prev: 250, new: 200, reason: 'Weekend packing' },
      { itemRef: DUMMY[14], type: 'usage', qty: 5, prev: 20, new: 15, reason: 'Naan preparation' },
      { itemRef: DUMMY[20], type: 'purchase', qty: 2, prev: 1, new: 3, reason: 'Spice restock' },
      { itemRef: DUMMY[29], type: 'wastage', qty: 2, prev: 7, new: 5, reason: 'Expired soap' },
      { itemRef: DUMMY[4], type: 'purchase', qty: 20, prev: 20, new: 40, reason: 'Fresh lemons order' },
    ]
    for (const m of DUMMY_MOVEMENTS) {
      await addDoc(collection(db, 'users', currentUser.uid, 'stockMovements'), {
        itemId: m.itemRef.id,
        itemName: m.itemRef.name,
        category: m.itemRef.category,
        cost: m.itemRef.costPrice || 0,
        type: m.type,
        quantity: m.qty,
        previousStock: m.prev,
        newStock: m.new,
        reason: m.reason,
        unit: m.itemRef.unit,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString(),
      })
    }
  }

  const value = { items, movements, categories, loading, addItem, updateItem, deleteItem, adjustStock, lowStockItems, totalValue, seedDummyItems, canWrite, expiringItems, expiredItems, expiringToday, expiringSoon }
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}
