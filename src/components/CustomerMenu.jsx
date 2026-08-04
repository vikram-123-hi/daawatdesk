import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../firebase'
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore'
import { vibrate } from '../utils/haptics'
import ItemDetailModal from './ItemDetailModal'

const fallbackCategories = [
  {
    id: 'starters', name: 'Starters', icon: 'Utensils', subCategories: [
      { id: 'start-indian', name: 'Indian' }, { id: 'start-chinese', name: 'Chinese' },
    ]
  },
  {
    id: 'main', name: 'Main Course', icon: 'Grid3X3', subCategories: [
      { id: 'main-north', name: 'North Indian' }, { id: 'main-south', name: 'South Indian' },
      { id: 'main-chinese', name: 'Chinese' },
    ]
  },
  {
    id: 'biryani', name: 'Rice & Biryani', icon: 'Package', subCategories: [
      { id: 'bir-veg', name: 'Veg' }, { id: 'bir-nonveg', name: 'Non-Veg' },
    ]
  },
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

  const sessionKey = useMemo(() => `dd_cust_session_${uid || 'demo'}_${table || '1'}`, [uid, table])
  const cartKey = useMemo(() => `dd_cust_cart_${uid || 'demo'}_${table || '1'}`, [uid, table])
  const ordersKey = useMemo(() => `dd_cust_orders_${uid || 'demo'}_${table || '1'}`, [uid, table])

  // Restore saved session from localStorage
  const savedSession = useMemo(() => {
    try {
      const s = localStorage.getItem(sessionKey)
      return s ? JSON.parse(s) : null
    } catch (e) { return null }
  }, [sessionKey])

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

  // Restore saved cart from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const c = localStorage.getItem(cartKey)
      return c ? JSON.parse(c) : []
    } catch (e) { return [] }
  })
  const [showCart, setShowCart] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [orderSent, setOrderSent] = useState(false)

  // Restore placed orders from localStorage
  const [placedOrders, setPlacedOrders] = useState(() => {
    try {
      const o = localStorage.getItem(ordersKey)
      return o ? JSON.parse(o) : []
    } catch (e) { return [] }
  })
  const [showPlacedOrders, setShowPlacedOrders] = useState(false)
  const categoryRefs = useRef({})

  const [customerName, setCustomerName] = useState(savedSession?.name || '')
  const [customerPhone, setCustomerPhone] = useState(savedSession?.phone || '')
  const [customerDob, setCustomerDob] = useState(savedSession?.dob || '')
  const [customerSaved, setCustomerSaved] = useState(Boolean(savedSession?.customerSaved))
  const [customerId, setCustomerId] = useState(savedSession?.id || null)
  const [customerSaving, setCustomerSaving] = useState(false)
  const [phoneStep, setPhoneStep] = useState(savedSession?.customerSaved ? 'welcome' : 'phone')
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneSearching, setPhoneSearching] = useState(false)
  const [existingCustomer, setExistingCustomer] = useState(null)

  const [showPayment, setShowPayment] = useState(false)
  const [payingOrder, setPayingOrder] = useState(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [custRating, setCustRating] = useState(5)
  const [custComment, setCustComment] = useState('')
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const [selectedDetailItem, setSelectedDetailItem] = useState(null)

  // Persist session to localStorage
  useEffect(() => {
    if (customerSaved) {
      try {
        localStorage.setItem(
          sessionKey,
          JSON.stringify({
            name: customerName,
            phone: customerPhone,
            dob: customerDob,
            id: customerId,
            customerSaved: true,
          })
        )
      } catch (e) {}
    }
  }, [customerSaved, customerName, customerPhone, customerDob, customerId, sessionKey])

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart))
    } catch (e) {}
  }, [cart, cartKey])

  // Persist placed orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ordersKey, JSON.stringify(placedOrders))
    } catch (e) {}
  }, [placedOrders, ordersKey])

  // Real-time Firestore sync for placed orders
  useEffect(() => {
    if (!uid || !table) return
    const q = query(
      collection(db, 'users', uid, 'kots'),
      where('table', '==', `Table ${table}`),
      where('source', '==', 'qr-order')
    )
    const unsub = onSnapshot(q, (snap) => {
      const liveOrders = snap.docs.map((d) => {
        const data = d.data()
        return {
          firestoreId: d.id,
          id: d.id,
          items: data.items || [],
          subtotal: data.subtotal || 0,
          gst: data.gst || 0,
          total: data.total || 0,
          status: data.status || 'pending',
          paid: Boolean(data.paid || data.paymentStatus === 'paid'),
          payment: data.payment || '',
          time: data.createdAt ? new Date(data.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          rawTime: data.createdAt || '',
        }
      })

      liveOrders.sort((a, b) => (new Date(b.rawTime) - new Date(a.rawTime)))
      setPlacedOrders(liveOrders)
    })

    return () => unsub()
  }, [uid, table])

  function clearCustomerSession() {
    try {
      localStorage.removeItem(sessionKey)
      localStorage.removeItem(cartKey)
      localStorage.removeItem(ordersKey)
    } catch (e) {}
    setCustomerSaved(false)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerDob('')
    setCustomerId(null)
    setCart([])
    setPlacedOrders([])
    setPhoneStep('phone')
    setPhoneInput('')
  }

  async function submitCustomerFeedback() {
    const targetUid = uid || searchParams.get('uid')
    if (!targetUid) {
      alert('Restaurant reference missing from URL. Cannot submit feedback.')
      return
    }
    setFeedbackSending(true)
    try {
      await addDoc(collection(db, 'users', targetUid, 'feedback'), {
        overall: custRating,
        foodRating: custRating,
        serviceRating: custRating,
        ambienceRating: custRating,
        valueRating: custRating,
        customerName: customerName || 'Dine-in Customer',
        customerPhone: customerPhone || '',
        table: table || '',
        comment: custComment,
        responded: false,
        response: '',
        createdAt: new Date().toISOString(),
      })
      setFeedbackSubmitted(true)
      setTimeout(() => {
        setShowFeedbackModal(false)
        setFeedbackSubmitted(false)
        setCustComment('')
      }, 1800)
    } catch (e) {
      console.error('Error submitting feedback:', e)
      alert('Error submitting review: ' + (e.message || e))
    }
    setFeedbackSending(false)
  }

  useEffect(() => {
    let cancelled = false

    async function loadMenuData() {
      if (!uid) {
        if (!cancelled) {
          setRestaurant('DaawatDesk Special')
          setRestLogo('')
          setMenuItems(fallbackItems)
          setMenuCategories(fallbackCategories)
          setActiveCategory(fallbackCategories[0]?.id || '')
          setLoading(false)
        }
        return
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', uid))
        if (userSnap.exists()) {
          const userData = userSnap.data()
          if (!cancelled) {
            setRestaurant(userData.restaurant || userData.name || 'DaawatDesk Restaurant')
            setRestAddress(userData.address || '')
            setRestPhone(userData.phone || '')
            setRestInstagram(userData.instagram || '')
            setRestFacebook(userData.facebook || '')
            setRestLogo(userData.profilePic || userData.logo || userData.logoUrl || userData.avatar || '')

            const menuData = userData.menuConfig
            if (menuData?.items?.length) {
              setMenuItems(menuData.items)
              setMenuCategories(menuData.categories?.length ? menuData.categories : fallbackCategories)
              setActiveCategory(menuData.categories?.[0]?.id || fallbackCategories[0]?.id || '')
            } else {
              setMenuItems(fallbackItems)
              setMenuCategories(fallbackCategories)
              setActiveCategory(fallbackCategories[0]?.id || '')
            }
          }
        } else {
          if (!cancelled) {
            setRestaurant('DaawatDesk Restaurant')
            setMenuItems(fallbackItems)
            setMenuCategories(fallbackCategories)
            setActiveCategory(fallbackCategories[0]?.id || '')
          }
        }
      } catch (err) {
        console.error('CustomerMenu load error:', err)
        if (!cancelled) {
          setRestaurant('DaawatDesk Restaurant')
          setMenuItems(fallbackItems)
          setMenuCategories(fallbackCategories)
          setActiveCategory(fallbackCategories[0]?.id || '')
        }
      }
      if (!cancelled) setLoading(false)
    }

    loadMenuData()
    return () => { cancelled = true }
  }, [uid])

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
  const cgstAmount = Number((cartTotal * 0.025).toFixed(2))
  const sgstAmount = Number((cartTotal * 0.025).toFixed(2))
  const gstAmount = Number((cgstAmount + sgstAmount).toFixed(2))
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
        } catch { }
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
        const data = d.data()
        const s = data.status
        const isPaid = Boolean(data.paid || data.paymentStatus === 'paid' || s === 'completed')
        return (s === 'pending' || s === 'preparing') && !isPaid
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
      if (!uid) {
        // Fallback for local demo preview mode without Firestore sync
        const orderEntry = {
          firestoreId: firestoreId || `demo-${Date.now()}`,
          items: mergedItems,
          subtotal: mergedSubtotal,
          gst: mergedGst,
          total: mergedTotal,
          time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        }
        setPlacedOrders((prev) => {
          const updated = [...prev]
          const idx = updated.findIndex((o) => (o.firestoreId || o.id) === (firestoreId || orderEntry.firestoreId))
          if (idx >= 0) updated[idx] = orderEntry
          else updated.unshift(orderEntry)
          return updated
        })
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
        await updateDoc(doc(db, 'users', uid, 'kots', order.firestoreId), {
          paid: true,
          payment: method.toUpperCase(),
          paymentStatus: 'paid',
          status: 'completed',
          paidAt: new Date().toISOString(),
        })
      }
      setPayingOrder(null)
      setShowPayment(false)
      setPaymentSuccess(true)
      setPlacedOrders((prev) => prev.map((o) => ((o.firestoreId === order.firestoreId || o.id === order.id) ? { ...o, paid: true, payment: method.toUpperCase() } : o)))
      setTimeout(() => {
        setPaymentSuccess(false)
        setShowFeedbackModal(true)
      }, 1200)
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
            {restLogo ? (
              <img src={restLogo} alt={restaurant} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 border border-gray-100 shadow-sm" />
            ) : null}
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
    <div className="min-h-screen relative bg-slate-50 font-sans text-slate-800">
      {/* Restored Background Texture */}
      <div className="fixed inset-0 bg-[url('/bg-billing.png')] bg-cover bg-center bg-fixed pointer-events-none opacity-20"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-amber-500/5 via-slate-50/90 to-slate-100/95 pointer-events-none"></div>

      <div className="relative z-10 pb-28">
        {/* Industry Standard Sticky Hero Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
          <div className="max-w-md mx-auto px-4 py-3">
            {/* Top Bar: Restaurant & Actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {restLogo ? (
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden border-2 border-white p-0.5">
                    <img src={restLogo} alt={restaurant} className="w-full h-full rounded-xl object-cover" />
                  </div>
                ) : null}
                <div>
                  <h1 className="text-xl font-black font-textured-brand leading-tight flex items-center gap-1.5">
                    {restaurant}
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Restaurant"></span>
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 bg-primary-light text-primary font-bold text-[11px] rounded-md border border-primary/20">
                      Table #{table}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">
                      {customerName ? `Hi, ${customerName.split(' ')[0]}` : 'Dine-in'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={callWaiter}
                  disabled={waiterSending}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm flex items-center gap-1.5 ${waiterSent
                    ? 'bg-emerald-600 text-white'
                    : 'bg-primary-light hover:bg-primary-light/80 text-primary border border-primary/20'
                    } disabled:opacity-50`}
                  title="Call Waiter"
                >
                  <span className="text-base">🔔</span>
                  <span className="hidden sm:inline">{waiterSent ? 'Notified' : 'Waiter'}</span>
                </button>

                <button
                  onClick={() => setShowPlacedOrders(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-primary text-white shadow-md shadow-primary/30 border border-white/20"
                >
                  <span className="text-sm">📋</span>
                  <span>Orders</span>
                  <span className="bg-white text-primary text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                    {placedOrders.length + (cartCount > 0 ? 1 : 0)}
                  </span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search dishes or cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-100/90 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white border border-slate-200 transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Filter & Category Navigation Bar */}
        {!searchQuery && menuCategories.length > 0 && (
          <div className="sticky top-[110px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
            <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between gap-3">
              {/* Veg / Non-Veg Quick Filter Chips */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl flex-shrink-0 border border-slate-200/60">
                <button
                  onClick={() => setVegFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${vegFilter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setVegFilter(vegFilter === 'veg' ? 'all' : 'veg')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${vegFilter === 'veg' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm border border-current flex items-center justify-center flex-shrink-0">
                    <span className="w-1 h-1 bg-current rounded-full"></span>
                  </span>
                  Veg
                </button>
              </div>

              {/* Horizontal Category Scroll */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                {menuCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setSearchQuery('') }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${activeCategory === cat.id
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu Items List */}
        <div className="max-w-md mx-auto px-4 py-4">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
              <span className="text-4xl block mb-2">🍽️</span>
              <p className="text-sm font-bold text-slate-700">No dishes match your filter</p>
              <p className="text-xs text-slate-400 mt-1">Try switching off filters or searching for another term</p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([catName, items]) => (
              <div key={catName} className="mb-6">
                {!searchQuery && (
                  <div className="py-2.5 mb-3 flex items-center justify-between border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-primary rounded-full shadow-2xs"></span>
                      <h3 className="text-l sm:text-sm font-extrabold font-header-pro text-slate-800 uppercase tracking-widest">
                        {catName}
                      </h3>
                    </div>
                    <span className="text-[12px] font-extrabold font-header-pro bg-primary-light text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                      {items.length} dishes
                    </span>
                  </div>
                )}
                <div className="space-y-3">
                  {items.map((item) => {
                    const qty = getCartQty(item)
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 group"
                      >
                        {/* Item Info: Title & Price separated */}
                        <div
                          onClick={() => setSelectedDetailItem(item)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            {/* Standard Veg / Non-Veg Red Triangle Symbol */}
                            {item.veg ? (
                              <span className="w-4 h-4 rounded-[3px] border-[1.5px] border-emerald-600 flex items-center justify-center flex-shrink-0 bg-white" title="Pure Veg">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              </span>
                            ) : (
                              <span className="w-4 h-4 rounded-[3px] border-[1.5px] border-rose-600 flex items-center justify-center flex-shrink-0 bg-white" title="Non-Veg">
                                <svg className="w-2.5 h-2.5 fill-rose-600" viewBox="0 0 12 12">
                                  <polygon points="6,1 11,10 1,10" />
                                </svg>
                              </span>
                            )}

                            {/* Dish Title - Bold Dark Slate */}
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                              {item.name}
                            </h4>
                          </div>

                          {/* Price & Tag - Soft Gray Price */}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-slate-600">
                              ₹{item.price}
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 hover:bg-amber-100">
                              <span>ℹ️</span> Details & Ingredients
                            </span>
                          </div>
                        </div>

                        {/* Add / Stepper Button - Solid High Contrast Theme Color */}
                        <div className="flex-shrink-0">
                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl shadow-md shadow-primary/25 active:scale-95 transition-all flex items-center gap-1 border border-primary-dark"
                            >
                              <span>+ ADD</span>
                            </button>
                          ) : (
                            <div className="flex items-center bg-primary text-white rounded-xl shadow-md shadow-primary/25 overflow-hidden border border-primary-dark h-9">
                              <button
                                onClick={() => removeFromCart(item)}
                                className="w-8 h-full flex items-center justify-center font-black text-sm hover:bg-primary-dark text-white transition-colors"
                              >
                                −
                              </button>
                              <span className="text-xs font-black px-2 text-center min-w-[22px] text-white">
                                {qty}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-8 h-full flex items-center justify-center font-black text-sm hover:bg-primary-dark text-white transition-colors"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Industry-Standard Floating Bottom Cart Bar (Primary Theme) */}
        {cartCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto animate-bounce-short">
            <button
              onClick={() => setShowCart(true)}
              className="w-full py-3.5 px-5 bg-slate-900 text-white font-bold rounded-2xl shadow-2xl shadow-slate-900/40 border border-slate-700/50 flex items-center justify-between hover:bg-slate-800 active:scale-[0.99] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-primary text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
                <div className="text-left">
                  <p className="text-xs text-slate-400 font-medium">Your Order</p>
                  <p className="text-sm font-extrabold text-white">₹{grandTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                <span>View Cart & Order</span>
                <span className="text-sm">→</span>
              </div>
            </button>
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
                <div className="flex justify-between text-sm text-gray-600"><span>CGST (2.5%)</span><span>₹{cgstAmount.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>SGST (2.5%)</span><span>₹{sgstAmount.toFixed(2)}</span></div>
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
                        <div className="flex justify-between text-gray-500"><span>CGST (2.5%)</span><span>₹{(order.gst / 2)?.toFixed(2)}</span></div>
                        <div className="flex justify-between text-gray-500"><span>SGST (2.5%)</span><span>₹{(order.gst / 2)?.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-gray-800 text-base"><span>Total</span><span>₹{order.total?.toFixed(2)}</span></div>
                      </div>
                      {order.paid ? (
                        <div className="flex gap-2 mt-3">
                          <div className="flex-1 py-2 bg-emerald-50 text-emerald-700 font-extrabold rounded-xl border border-emerald-200 text-xs flex items-center justify-center gap-1.5 shadow-2xs">
                            <span>✅</span> Paid ({order.payment || 'UPI'})
                          </div>
                          <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold rounded-xl border border-amber-300 text-xs flex items-center justify-center gap-1 transition-all active:scale-95"
                          >
                            <span>⭐</span> Rate
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setPayingOrder(order); setShowPayment(true) }}
                          className="w-full mt-3 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          Pay Now
                        </button>
                      )}
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

        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/60 z-[90] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-3xl sm:rounded-2xl w-full max-w-sm p-6 space-y-4 animate-fade-up shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Rate Your Dining Experience</h3>
                  <p className="text-xs text-gray-400">Table #{table} · {restaurant}</p>
                </div>
                <button onClick={() => setShowFeedbackModal(false)} className="p-1 hover:bg-gray-100 rounded-xl text-gray-400">✕</button>
              </div>

              {feedbackSubmitted ? (
                <div className="text-center py-6 space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto">🎉</div>
                  <h4 className="font-extrabold text-gray-900">Thank You For Your Feedback!</h4>
                  <p className="text-xs text-gray-500">Your review helps us serve you even better next time.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block mb-2">How was your food & service?</label>
                    <div className="flex gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCustRating(s)}
                          className="p-1 hover:scale-125 transition-transform active:scale-95"
                        >
                          <span className={`text-3xl ${custRating >= s ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale'}`}>⭐</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block mb-1">Feedback Comment (Optional)</label>
                    <textarea
                      value={custComment}
                      onChange={(e) => setCustComment(e.target.value)}
                      placeholder="Tell us what you loved or how we can improve..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                    />
                  </div>

                  <button
                    onClick={submitCustomerFeedback}
                    disabled={feedbackSending}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 text-xs flex items-center justify-center gap-2"
                  >
                    {feedbackSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '⭐ Submit Review'}
                  </button>
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

        <ItemDetailModal
          item={selectedDetailItem}
          onClose={() => setSelectedDetailItem(null)}
          onAddToCart={(item) => addToCart(item)}
        />
      </div>
    </div>
  )
}
