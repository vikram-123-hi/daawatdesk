import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../firebase'
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore'
import { vibrate } from '../utils/haptics'

const fallbackCategories = [
  { id: 'starters', name: 'Starters', icon: 'Utensils', subCategories: [
    { id: 'start-indian', name: 'Indian' }, { id: 'start-chinese', name: 'Chinese' },
  ]},
  { id: 'main', name: 'Main Course', icon: 'Grid3X3', subCategories: [
    { id: 'main-north', name: 'North Indian' }, { id: 'main-south', name: 'South Indian' },
    { id: 'main-chinese', name: 'Chinese' },
  ]},
  { id: 'biryani', name: 'Rice & Biryani', icon: 'Package', subCategories: [
    { id: 'bir-veg', name: 'Veg' }, { id: 'bir-nonveg', name: 'Non-Veg' },
  ]},
  { id: 'breads', name: 'Breads & Naan', icon: 'Pizza', subCategories: [] },
  { id: 'beverages', name: 'Beverages', icon: 'Coffee', subCategories: [] },
  { id: 'desserts', name: 'Desserts', icon: 'IceCream', subCategories: [] },
]

const fallbackItems = [
  { id: 1, name: 'Paneer Tikka', category: 'starters', subCategory: 'start-indian', price: 220, veg: true },
  { id: 2, name: 'Chicken 65', category: 'starters', subCategory: 'start-indian', price: 280, veg: false },
  { id: 3, name: 'Veg Spring Roll', category: 'starters', subCategory: 'start-chinese', price: 160, veg: true },
  { id: 4, name: 'Chicken Momos', category: 'starters', subCategory: 'start-chinese', price: 180, veg: false },
  { id: 5, name: 'Butter Chicken', category: 'main', subCategory: 'main-north', price: 320, veg: false },
  { id: 6, name: 'Paneer Butter Masala', category: 'main', subCategory: 'main-north', price: 260, veg: true },
  { id: 7, name: 'Dal Makhani', category: 'main', subCategory: 'main-north', price: 200, veg: true },
  { id: 8, name: 'Chicken Curry', category: 'main', subCategory: 'main-north', price: 300, veg: false },
  { id: 9, name: 'Sambar Rice', category: 'main', subCategory: 'main-south', price: 160, veg: true },
  { id: 10, name: 'Chilli Chicken', category: 'main', subCategory: 'main-chinese', price: 280, veg: false },
  { id: 11, name: 'Veg Biryani', category: 'biryani', subCategory: 'bir-veg', price: 220, veg: true },
  { id: 12, name: 'Chicken Biryani', category: 'biryani', subCategory: 'bir-nonveg', price: 300, veg: false },
  { id: 13, name: 'Mutton Biryani', category: 'biryani', subCategory: 'bir-nonveg', price: 380, veg: false },
  { id: 14, name: 'Butter Naan', category: 'breads', subCategory: '', price: 40, veg: true },
  { id: 15, name: 'Garlic Naan', category: 'breads', subCategory: '', price: 50, veg: true },
  { id: 16, name: 'Cold Coffee', category: 'beverages', subCategory: '', price: 80, veg: true },
  { id: 17, name: 'Masala Chai', category: 'beverages', subCategory: '', price: 30, veg: true },
  { id: 18, name: 'Coca-Cola', category: 'beverages', subCategory: '', price: 40, veg: true },
  { id: 19, name: 'Gulab Jamun', category: 'desserts', subCategory: '', price: 60, veg: true },
  { id: 20, name: 'Rasmalai', category: 'desserts', subCategory: '', price: 80, veg: true },
]

export default function CustomerMenu() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid')
  const table = searchParams.get('table')

  const [restaurant, setRestaurant] = useState('')
  const [restAddress, setRestAddress] = useState('')
  const [restPhone, setRestPhone] = useState('')
  const [restInstagram, setRestInstagram] = useState('')
  const [restFacebook, setRestFacebook] = useState('')
  const [restLogo, setRestLogo] = useState('')
  const [menuItems, setMenuItems] = useState([])
  const [menuCategories, setMenuCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [vegFilter, setVegFilter] = useState('all')
  const [cart, setCart] = useState([])
  const [showCart, setShowCart] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [orderSent, setOrderSent] = useState(false)
  const [placedOrders, setPlacedOrders] = useState([])
  const [showPlacedOrders, setShowPlacedOrders] = useState(false)
  const categoryRefs = useRef({})

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerDob, setCustomerDob] = useState('')
  const [customerSaved, setCustomerSaved] = useState(false)
  const [customerId, setCustomerId] = useState(null)
  const [customerSaving, setCustomerSaving] = useState(false)
  const [phoneStep, setPhoneStep] = useState('phone')
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneSearching, setPhoneSearching] = useState(false)
  const [existingCustomer, setExistingCustomer] = useState(null)

  const [showPayment, setShowPayment] = useState(false)
  const [payingOrder, setPayingOrder] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (!uid) { setError('Invalid link — missing restaurant ID.'); setLoading(false); return }
    if (!table) { setError('Invalid link — missing table number.'); setLoading(false); return }

    let cancelled = false
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid))
        if (!userSnap.exists()) { setError('Restaurant not found.'); setLoading(false); return }
        const userData = userSnap.data()
        if (!cancelled) {
          setRestaurant(userData.restaurant || userData.name || 'Restaurant')
          setRestAddress(userData.address || '')
          setRestPhone(userData.phone || '')
          setRestInstagram(userData.instagram || '')
          setRestFacebook(userData.facebook || '')
          setRestLogo(userData.profilePic || '')
        }
        const menuData = userData.menuConfig
        if (menuData?.items?.length) {
          if (!cancelled) {
            setMenuItems(menuData.items)
            setMenuCategories(menuData.categories || [])
            if (menuData.categories?.length) setActiveCategory(menuData.categories[0]?.id || '')
          }
        } else {
          if (!cancelled) {
            setMenuItems(fallbackItems)
            setMenuCategories(fallbackCategories)
            if (fallbackCategories.length) setActiveCategory(fallbackCategories[0]?.id || '')
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load menu. Check your connection.')
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [uid, table])

  const filteredItems = useMemo(() => {
    let items = menuItems
    if (activeCategory) items = items.filter((i) => i.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = menuItems.filter((i) => i.name.toLowerCase().includes(q))
    }
    if (vegFilter === 'veg') items = items.filter((i) => i.veg)
    return items
  }, [menuItems, activeCategory, searchQuery, vegFilter])

  const groupedItems = useMemo(() => {
    const groups = {}
    filteredItems.forEach((item) => {
      const cat = menuCategories.find((c) => c.id === item.category)
      const catName = cat?.name || item.category || 'Other'
      if (!groups[catName]) groups[catName] = []
      groups[catName].push(item)
    })
    return groups
  }, [filteredItems, menuCategories])

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const gstAmount = Number((cartTotal * 0.05).toFixed(2))
  const grandTotal = Number((cartTotal + gstAmount).toFixed(2))

  function addToCart(item) {
    vibrate(10)
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name && i.price === item.price)
      if (existing) return prev.map((i) => i === existing ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { name: item.name, price: item.price, veg: item.veg, qty: 1 }]
    })
  }

  function removeFromCart(item) {
    setCart((prev) => {
      const existing = prev.find((i) => i.name === item.name && i.price === item.price)
      if (!existing) return prev
      if (existing.qty <= 1) return prev.filter((i) => i !== existing)
      return prev.map((i) => i === existing ? { ...i, qty: i.qty - 1 } : i)
    })
  }

  function getCartQty(item) {
    const found = cart.find((i) => i.name === item.name && i.price === item.price)
    return found?.qty || 0
  }

  async function lookupPhone() {
    if (!phoneInput.trim() || phoneInput.length < 10) return
    setPhoneSearching(true)
    try {
      const phone = phoneInput.trim()
      const snap = await getDocs(collection(db, 'users', uid, 'customers'))
      const match = snap.docs.find((d) => {
        const p = d.data().phone
        return p === phone || p?.replace(/\D/g, '') === phone
      })
      if (match) {
        const data = match.data()
        setExistingCustomer(data)
        setCustomerName(data.name || '')
        setCustomerDob(data.dob || '')
        setCustomerId(match.id)
        setCustomerPhone(phone)
        try {
          await updateDoc(doc(db, 'users', uid, 'customers', match.id), {
            lastVisit: new Date().toISOString(),
            totalOrders: (data.totalOrders || 0) + 1,
          })
        } catch {}
        setPhoneStep('welcome')
        setTimeout(() => {
          setCustomerSaved(true)
        }, 1500)
      } else {
        setCustomerPhone(phone)
        setPhoneStep('details')
      }
    } catch (e) {
      console.error('Phone lookup failed:', e)
      setCustomerPhone(phoneInput.trim())
      setPhoneStep('details')
    }
    setPhoneSearching(false)
  }

  async function saveCustomer() {
    if (!customerName.trim()) return
    setCustomerSaving(true)
    try {
      const dobFormatted = customerDob.trim() || ''
      const docRef = await addDoc(collection(db, 'users', uid, 'customers'), {
        name: customerName.trim(),
        phone: customerPhone.trim(),
        dob: dobFormatted,
        tags: [],
        notes: '',
        totalOrders: 1,
        totalSpent: 0,
        lastVisit: new Date().toISOString(),
        firstVisit: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      setCustomerId(docRef.id)
      setCustomerSaved(true)
    } catch (e) {
      console.error('Save customer failed:', e)
      setCustomerSaved(true)
    }
    setCustomerSaving(false)
  }

  function handlePhoneSubmit(e) {
    e.preventDefault()
    lookupPhone()
  }

  function handleDetailsSubmit(e) {
    e.preventDefault()
    if (!customerName.trim()) return
    saveCustomer()
  }

  async function placeOrder() {
    if (!cart.length || !uid || !table) return
    setPlacing(true)
    try {
      const now = new Date()

      // check if pending KOT exists for this table → merge items
      const existingQuery = query(
        collection(db, 'users', uid, 'kots'),
        where('table', '==', `Table ${table}`),
        where('source', '==', 'qr-order')
      )
      const existingSnap = await getDocs(existingQuery)
      const pendingKot = existingSnap.docs.find((d) => {
        const s = d.data().status
        return s === 'pending' || s === 'preparing'
      })

      let firestoreId
      let mergedItems
      let mergedSubtotal
      let mergedGst
      let mergedTotal

      if (pendingKot) {
        const existingData = pendingKot.data()
        mergedItems = [...(existingData.items || [])]
        cart.forEach((newItem) => {
          const idx = mergedItems.findIndex((i) => i.name === newItem.name && i.price === newItem.price)
          if (idx >= 0) {
            mergedItems[idx] = { ...mergedItems[idx], qty: mergedItems[idx].qty + newItem.qty }
          } else {
            mergedItems.push({ name: newItem.name, price: newItem.price, veg: newItem.veg, qty: newItem.qty })
          }
        })
        mergedSubtotal = mergedItems.reduce((s, i) => s + i.price * i.qty, 0)
        mergedGst = Number((mergedSubtotal * 0.05).toFixed(2))
        mergedTotal = Number((mergedSubtotal + mergedGst).toFixed(2))
        await updateDoc(doc(db, 'users', uid, 'kots', pendingKot.id), {
          items: mergedItems,
          subtotal: mergedSubtotal,
          gst: mergedGst,
          total: mergedTotal,
          itemStatus: mergedItems.map(() => 'pending'),
          updatedAt: now.toISOString(),
        })
        firestoreId = pendingKot.id
      } else {
        mergedItems = cart.map((i) => ({ name: i.name, price: i.price, veg: i.veg, qty: i.qty }))
        mergedSubtotal = cartTotal
        mergedGst = gstAmount
        mergedTotal = grandTotal
        const kotData = {
          table: `Table ${table}`,
          items: mergedItems,
          subtotal: mergedSubtotal,
          gst: mergedGst,
          total: mergedTotal,
          source: 'qr-order',
          status: 'pending',
          createdAt: now.toISOString(),
          notes: '',
          itemStatus: mergedItems.map(() => 'pending'),
        }
        if (customerId) {
          kotData.customerId = customerId
          kotData.customerName = customerName.trim()
          kotData.customerPhone = customerPhone.trim()
        }
        const docRef = await addDoc(collection(db, 'users', uid, 'kots'), kotData)
        firestoreId = docRef.id
      }

      vibrate(20)
      const orderEntry = {
        firestoreId,
        items: mergedItems,
        subtotal: mergedSubtotal,
        gst: mergedGst,
        total: mergedTotal,
        time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }
      if (pendingKot) {
        setPlacedOrders((prev) => {
          const updated = [...prev]
          const idx = updated.findIndex((o) => o.firestoreId === firestoreId)
          if (idx >= 0) updated[idx] = orderEntry
          else updated.unshift(orderEntry)
          return updated
        })
      } else {
        setPlacedOrders((prev) => [orderEntry, ...prev])
      }
      setOrderSent(true)
      setShowCart(false)
      setCart([])
      setTimeout(() => setOrderSent(false), 3000)
    } catch (e) {
      console.error('Order failed:', e)
      alert('Failed to send order. Please try again.')
    }
    setPlacing(false)
  }

  async function processPayment(order, method) {
    setPaymentProcessing(true)
    try {
      await addDoc(collection(db, 'users', uid, 'transactions'), {
        table: `Table ${table}`,
        items: order.items,
        itemsDetail: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price, veg: i.veg })),
        subtotal: order.subtotal,
        gst: order.gst,
        total: order.total,
        payment: method.toUpperCase(),
        source: 'qr-order',
        customerId: customerId || null,
        customerName: customerName || null,
        createdAt: new Date().toISOString(),
      })
      if (order.firestoreId) {
        await deleteDoc(doc(db, 'users', uid, 'kots', order.firestoreId))
      }
      setPayingOrder(null)
      setShowPayment(false)
      setPaymentSuccess(true)
      setPlacedOrders((prev) => prev.filter((o) => o.firestoreId !== order.firestoreId))
      setTimeout(() => setPaymentSuccess(false), 3000)
    } catch (e) {
      console.error('Payment failed:', e)
      alert('Payment failed. Please try again.')
    }
    setPaymentProcessing(false)
  }

  const [waiterSent, setWaiterSent] = useState(false)
  const [waiterSending, setWaiterSending] = useState(false)

  async function callWaiter() {
    if (!uid || !table || waiterSending) return
    setWaiterSending(true)
    try {
      await addDoc(collection(db, 'users', uid, 'notifications'), {
        type: 'waiter',
        table: `Table ${table}`,
        message: `Table ${table} is requesting waiter help`,
        createdAt: new Date().toISOString(),
        read: false,
      })
      setWaiterSent(true)
      setTimeout(() => setWaiterSent(false), 3000)
    } catch (e) {
      console.error('Failed to call waiter:', e)
      alert('Failed to notify waiter. Please try again.')
    }
    setWaiterSending(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <span className="text-4xl block mb-3">❌</span>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!customerSaved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg">
          <div className="text-center mb-6">
            <span className="text-4xl block mb-3">🍽️</span>
            <h2 className="text-xl font-bold text-gray-800">{restaurant}</h2>
            <p className="text-sm text-gray-400 mt-1">Table {table} · Dine-in</p>
          </div>

          {phoneStep === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <input
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9]*"
                  autoFocus
                  value={phoneInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setPhoneInput(val)
                  }}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={phoneInput.length < 10 || phoneSearching}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {phoneSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : 'Continue →'}
              </button>
            </form>
          )}

          {phoneStep === 'welcome' && existingCustomer && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">👋</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Welcome back, {existingCustomer.name}!</h3>
              <p className="text-xs text-gray-400 mt-1">Loading your menu...</p>
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
            </div>
          )}

          {phoneStep === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 flex items-center justify-between">
                  <span>{customerPhone}</span>
                  <button type="button" onClick={() => { setPhoneStep('phone'); setPhoneInput(''); setCustomerPhone('') }} className="text-xs text-primary font-semibold">Change</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Your Name *</label>
                <input
                  type="text"
                  autoFocus
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={customerDob}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '').slice(0, 8)
                    if (val.length > 4) val = val.slice(0, 4) + '/' + val.slice(4)
                    if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2)
                    setCustomerDob(val)
                  }}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={!customerName.trim() || customerSaving}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {customerSaving ? 'Saving...' : 'View Menu →'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-[url('/bg-billing.png')] bg-cover bg-center bg-fixed pointer-events-none"></div>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-md pointer-events-none"></div>
      <div className="relative z-10 pb-20">
      <div className="bg-white/90 border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-lg font-bold text-gray-800">{restaurant}</h1>
              <p className="text-xs text-gray-400">Table {table} · Dine-in · {customerName}</p>
            </div>
            <button onClick={() => setShowPlacedOrders(true)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm ${placedOrders.length > 0 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
              Orders
              {placedOrders.length > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{placedOrders.length}</span>
              )}
            </button>
          </div>
          <div className="flex justify-center mb-3">
            <button onClick={callWaiter} disabled={waiterSending} className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm ${waiterSent ? 'bg-green text-white' : 'bg-blue text-white hover:bg-blue/90'} disabled:opacity-50 ${!waiterSent && !waiterSending ? 'animate-pulse' : ''}`} title="Call Waiter">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {waiterSent ? 'Notified ✓' : waiterSending ? 'Sending...' : 'Call Waiter'}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      {!searchQuery && menuCategories.length > 0 && (
        <div className="sticky top-[108px] z-30 bg-white/90 border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 flex gap-2 py-2 overflow-x-auto scrollbar-hide">
            {menuCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearchQuery('') }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="max-w-lg mx-auto px-4 pb-2">
            <div className="flex items-center gap-2 h-7">
              <button
                onClick={() => setVegFilter(vegFilter === 'veg' ? 'all' : 'veg')}
                className={`relative w-12 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${vegFilter === 'veg' ? 'bg-green' : 'bg-gray-300'}`}
              >
                <span
                  className="absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md transition-all duration-300"
                  style={{ left: vegFilter === 'veg' ? '23px' : '3px' }}
                ></span>
              </button>
              <span className="w-3 h-3 rounded-sm border-[1.5px] border-green flex items-center justify-center flex-shrink-0"><span className="w-1 h-1 bg-green rounded-full"></span></span>
              <span className="text-xs font-bold text-green">Veg Only</span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No items found</p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([catName, items]) => (
            <div key={catName} className="mb-6">
              {!searchQuery && (
                <h3 className="text-sm font-bold text-gray-800 mb-3 sticky top-[148px] bg-white/90 py-1 z-20">{catName}</h3>
              )}
              <div className="space-y-2">
                {items.map((item) => {
                  const qty = getCartQty(item)
                  return (
                    <div key={item.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`w-3 h-3 rounded-sm border-[1.5px] flex-shrink-0 ${item.veg ? 'border-green' : 'border-red-500'}`}>
                            <span className={`block w-1.5 h-1.5 mx-auto mt-[1px] ${item.veg ? 'bg-green rounded-full' : 'bg-red-500'}`} style={!item.veg ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {}}></span>
                          </span>
                          <span className="text-sm font-semibold text-gray-800 truncate">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">₹{item.price}</span>
                      </div>
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-4 py-1.5 bg-primary/10 text-primary font-bold text-sm rounded-lg hover:bg-primary/20 transition-colors"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-primary/10 rounded-lg">
                          <button onClick={() => removeFromCart(item)} className="w-8 h-8 flex items-center justify-center text-primary font-bold text-lg hover:bg-primary/20 rounded-l-lg transition-colors">−</button>
                          <span className="text-sm font-bold text-primary w-5 text-center">{qty}</span>
                          <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-primary font-bold text-lg hover:bg-primary/20 rounded-r-lg transition-colors">+</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 p-3">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-between px-5 hover:bg-primary/90 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-sm">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
              </span>
              <span className="flex items-center gap-2">
                <span>₹{grandTotal.toFixed(2)}</span>
                <span className="text-sm">→</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Your Order</h3>
              <button onClick={() => setShowCart(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {cart.map((item) => (
                <div key={`${item.name}-${item.price}`} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm border-[1.5px] flex-shrink-0 ${item.veg ? 'border-green' : 'border-red-500'}`}>
                      <span className={`block w-1.5 h-1.5 mx-auto mt-[1px] ${item.veg ? 'bg-green rounded-full' : 'bg-red-500'}`} style={!item.veg ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {}}></span>
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <span className="text-xs text-gray-400 ml-1">×{item.qty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">₹{item.price * item.qty}</span>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-md">
                      <button onClick={() => removeFromCart(item)} className="w-6 h-6 flex items-center justify-center text-gray-600 text-sm font-bold">−</button>
                      <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => addToCart(item)} className="w-6 h-6 flex items-center justify-center text-gray-600 text-sm font-bold">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 p-4 space-y-3">
              <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>₹{cartTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-gray-600"><span>GST (5%)</span><span>₹{gstAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-base font-bold text-gray-800"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
              <button
                onClick={() => { setShowCart(false); placeOrder() }}
                disabled={placing}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {placing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding to Cart...
                  </>
                ) : (
                  <>🛒 Add to Cart · ₹{grandTotal.toFixed(2)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlacedOrders && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-up">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">My Orders</h3>
              <button onClick={() => setShowPlacedOrders(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {placedOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No orders placed yet</p>
                </div>
              ) : (
                placedOrders.map((order) => (
                  <div key={order.firestoreId || order.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400">{order.time}</span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-sm border flex-shrink-0 ${item.veg ? 'border-green' : 'border-red-500'}`}>
                              <span className={`block w-1 h-1 mx-auto mt-[1px] ${item.veg ? 'bg-green rounded-full' : 'bg-red-500'}`} style={!item.veg ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {}}></span>
                            </span>
                            <span className="text-gray-800">{item.name}</span>
                            <span className="text-gray-400">×{item.qty}</span>
                          </div>
                          <span className="font-semibold text-gray-800">₹{item.price * item.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-50 pt-2 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{order.subtotal?.toFixed(2)}</span></div>
                      <div className="flex justify-between text-gray-500"><span>GST (5%)</span><span>₹{order.gst?.toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-gray-800 text-base"><span>Total</span><span>₹{order.total?.toFixed(2)}</span></div>
                    </div>
                    <button
                      onClick={() => { setPayingOrder(order); setShowPayment(true) }}
                      className="w-full mt-3 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      Pay Now
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showPayment && payingOrder && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm animate-fade-up p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Pay via UPI</h3>
              <button onClick={() => { setShowPayment(false); setPayingOrder(null) }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">✕</button>
            </div>
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-gray-800">₹{payingOrder.total?.toFixed(2)}</p>
              <p className="text-xs text-gray-400">{payingOrder.items?.length} item{payingOrder.items?.length > 1 ? 's' : ''}</p>
            </div>
            <div className="space-y-2">
              <button onClick={() => processPayment(payingOrder, 'upi')} disabled={paymentProcessing} className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-3 px-4 disabled:opacity-50 text-base">
                <span className="text-xl">📱</span> Pay with UPI
              </button>
              <p className="text-xs text-gray-400 text-center">GPay · PhonePe · Paytm · BHIM</p>
            </div>
            {paymentProcessing && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Processing payment...
              </div>
            )}
          </div>
        </div>
      )}

      {paymentSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-green text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-up">
          <span className="text-lg">✅</span>
          <span className="text-sm font-bold">Payment successful!</span>
        </div>
      )}

      {waiterSent && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] bg-blue text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-up">
          <span className="text-lg">🔔</span>
          <span className="text-sm font-bold">Waiter has been notified!</span>
        </div>
      )}

      {orderSent && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] bg-green text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-up">
          <span className="text-lg">✅</span>
          <span className="text-sm font-bold">Order sent to kitchen!</span>
        </div>
      )}
      </div>
    </div>
  )
}
