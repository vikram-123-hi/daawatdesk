import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useKOT } from '../context/KOTContext'
import { useInventory } from '../context/InventoryContext'
import { useCustomers } from '../context/CustomerContext'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import {
  ShoppingBag, Package, BarChart3, Users, ChefHat, LogOut,
  Key, ChevronRight, Clock, TrendingUp, Copy, Check, Cake, Phone,
  Receipt, Truck, CalendarDays, MessageSquare
} from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, userProfile, logout } = useAuth()
  const { readyCount, kots } = useKOT()
  const { lowStockItems, expiringItems, expiredItems } = useInventory()
  const { todayBirthdays } = useCustomers()
  const [codeCopied, setCodeCopied] = useState(false)
  const [txns, setTxns] = useState([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [typedName, setTypedName] = useState('')
  const [isTypingDone, setIsTypingDone] = useState(false)

  const targetName = currentUser?.displayName || 'there'

  useEffect(() => {
    if (!targetName) return
    setTypedName('')
    setIsTypingDone(false)
    let index = 0
    let delay = 80
    let timeout
    const typeNext = () => {
      if (index < targetName.length) {
        setTypedName(targetName.slice(0, index + 1))
        index++
        delay = /[\s]/.test(targetName[index - 1]) ? 200 : 80
        timeout = setTimeout(typeNext, delay)
      } else {
        setIsTypingDone(true)
      }
    }
    timeout = setTimeout(typeNext, 300)

    return () => clearTimeout(timeout)
  }, [targetName])

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse coordinates between -0.5 and 0.5
      const x = (e.clientX / window.innerWidth) - 0.5
      const y = (e.clientY / window.innerHeight) - 0.5
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'users', currentUser.uid, 'transactions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [currentUser])


  const activeOrders = (kots || []).filter((k) => k.status === 'pending' || k.status === 'preparing').length
  const readyOrders = (kots || []).filter((k) => k.status === 'ready').length

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const todayTxns = useMemo(() => {
    return txns.filter((t) => {
      if (!t.createdAt) return false
      const d = new Date(t.createdAt)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === todayStr
    })
  }, [txns, todayStr])

  const handleCopyCode = () => {
    navigator.clipboard.writeText(userProfile.restaurantCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 1500)
  }

  const stats = [
    { label: 'Active', value: activeOrders, sub: 'orders in progress', icon: Clock, iconBg: 'bg-primary/10', iconColor: 'text-primary', gradient: 'bg-white', border: 'border-primary/10' },
    { label: 'Ready', value: readyOrders, sub: 'items ready to serve', icon: ChefHat, iconBg: 'bg-green/10', iconColor: 'text-green', gradient: 'bg-white', border: 'border-green/10' },
    { label: 'Today', value: todayTxns.length, sub: 'completed orders', icon: TrendingUp, iconBg: 'bg-blue/10', iconColor: 'text-blue', gradient: 'bg-white', border: 'border-blue/10' },
    { label: 'Code', value: userProfile?.restaurantCode || '—', sub: 'kitchen code', icon: Users, iconBg: 'bg-purple/10', iconColor: 'text-purple', gradient: 'bg-white', border: 'border-purple/10', isCode: true },
  ]

  const modules = [
    {
      title: 'Billing / POS',
      desc: 'Create orders, generate KOTs, process payments',
      icon: ShoppingBag,
      color: 'from-primary to-orange',
      iconBg: 'bg-primary/10',
      textColor: 'text-primary',
      route: '/billing',
      stats: activeOrders > 0 ? `${activeOrders} active orders` : null,
      badge: activeOrders > 0 ? 'bg-red-500' : null,
    },
    {
      title: 'Inventory',
      desc: 'Track stock, manage ingredients, low-stock alerts',
      icon: Package,
      color: 'from-orange to-amber-500',
      iconBg: 'bg-orange/10',
      textColor: 'text-orange',
      route: '/inventory',
      stats: expiredItems.length > 0 ? `${expiredItems.length} expired!` : expiringItems.length > 0 ? `${expiringItems.length} expiring soon` : lowStockItems.length > 0 ? `${lowStockItems.length} low stock` : null,
      badge: expiredItems.length > 0 ? 'bg-red-500' : expiringItems.length > 0 ? 'bg-orange' : lowStockItems.length > 0 ? 'bg-amber-500' : null,
    },
    {
      title: 'Reports',
      desc: 'Sales analytics, revenue breakdown, staff performance',
      icon: BarChart3,
      color: 'from-blue to-cyan-500',
      iconBg: 'bg-blue/10',
      textColor: 'text-blue',
      route: '/reports',
      stats: todayTxns.length > 0 ? `${todayTxns.length} txns today` : null,
      badge: null,
    },
    {
      title: 'CRM / Customers',
      desc: 'Customer data, order history, birthday reminders',
      icon: Users,
      color: 'from-purple to-pink-500',
      iconBg: 'bg-purple/10',
      textColor: 'text-purple',
      route: '/crm',
      stats: null,
      badge: null,
    },
    {
      title: 'Expenses',
      desc: 'Track costs, category breakdown, profit analysis',
      icon: Receipt,
      color: 'from-rose to-red',
      iconBg: 'bg-rose/10',
      textColor: 'text-rose',
      route: '/expenses',
      stats: null,
      badge: null,
    },
    {
      title: 'Suppliers',
      desc: 'Vendor directory, contacts, payment terms',
      icon: Truck,
      color: 'from-teal to-emerald-500',
      iconBg: 'bg-teal/10',
      textColor: 'text-teal',
      route: '/suppliers',
      stats: null,
      badge: null,
    },
    {
      title: 'Reservations',
      desc: 'Table bookings, guest management, calendar',
      icon: CalendarDays,
      color: 'from-indigo to-violet-500',
      iconBg: 'bg-indigo/10',
      textColor: 'text-indigo',
      route: '/reservations',
      stats: null,
      badge: null,
    },
    {
      title: 'Feedback',
      desc: 'Customer reviews, ratings, responses',
      icon: MessageSquare,
      color: 'from-amber to-yellow-500',
      iconBg: 'bg-amber/10',
      textColor: 'text-amber',
      route: '/feedback',
      stats: null,
      badge: null,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-100">
      {/* Interactive Cursor Light Glow */}
      <div
        className="fixed w-[28rem] h-[28rem] rounded-full bg-gradient-to-r from-orange-400/30 via-amber-300/20 to-transparent blur-3xl pointer-events-none transition-transform duration-75 ease-out z-0"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate3d(calc(-50% + ${mousePos.x * 600}px), calc(-50% + ${mousePos.y * 600}px), 0)`,
        }}
      ></div>

      {/* Parallax Background Layer 1 - Dot Grid Mesh */}
      <div className="fixed inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none"></div>

      {/* Parallax Layer 2 - Vivid Floating Orange/Amber Blob (Top-Left) */}
      <div
        className="fixed -top-16 -left-16 w-[36rem] h-[36rem] bg-gradient-to-br from-amber-400/50 via-orange-500/40 to-rose-400/30 rounded-full blur-3xl pointer-events-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * -80}px, ${mousePos.y * -80}px, 0)`,
        }}
      ></div>

      {/* Parallax Layer 3 - Floating Purple/Indigo Blob (Top-Right) */}
      <div
        className="fixed top-12 -right-16 w-[38rem] h-[38rem] bg-gradient-to-tr from-purple-500/40 via-pink-400/35 to-indigo-500/35 rounded-full blur-3xl pointer-events-none transition-transform duration-100 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * 100}px, ${mousePos.y * 100}px, 0)`,
        }}
      ></div>

      {/* Parallax Layer 4 - Floating Emerald/Teal Blob (Bottom) */}
      <div
        className="fixed -bottom-20 left-1/3 w-[36rem] h-[36rem] bg-gradient-to-r from-emerald-400/40 via-teal-400/35 to-cyan-400/30 rounded-full blur-3xl pointer-events-none transition-transform duration-150 ease-out"
        style={{
          transform: `translate3d(${mousePos.x * -60}px, ${mousePos.y * 80}px, 0)`,
        }}
      ></div>

      {/* Gentle Frosted Glass Overlay */}
      <div className="fixed inset-0 bg-white/30 backdrop-blur-[6px] pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/logo-app.png" alt="DaawatDesk" className="w-10 h-10 rounded-xl object-contain" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold"><span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span></h1>
              <p className="text-[11px] text-gray-400 font-medium hidden sm:block">Restaurant Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userProfile?.restaurantCode && (
              <button onClick={handleCopyCode} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono font-bold tracking-wider transition-all duration-300 ${codeCopied ? 'bg-green/10 text-green scale-105' : 'bg-primary/5 hover:bg-primary/10 text-primary'}`} title="Click to copy kitchen code">
                <Key className="w-3.5 h-3.5" />
                {codeCopied ? 'Copied!' : userProfile.restaurantCode}
                {codeCopied ? <Check className="w-3 h-3 animate-scale-in" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-primary/20">
                {(currentUser?.displayName || currentUser?.email || '?')[0].toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-secondary leading-tight">{currentUser?.displayName || 'User'}</p>
                <p className="text-[10px] text-gray-400">{currentUser?.email}</p>
              </div>
            </div>
            <button onClick={async () => { await logout(); navigate('/login') }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 active:scale-90" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <ScrollReveal animation="reveal" className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-secondary flex items-center gap-2 flex-wrap">
            <span>Welcome back,</span>
            <span className="text-primary bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent font-extrabold tracking-wide min-w-[2ch]">
              {typedName}
              {!isTypingDone && <span className="inline-block w-0.5 h-6 bg-primary ml-0.5 rounded-sm animate-blink-cursor align-middle"></span>}
            </span>
            {isTypingDone && (
              <span className="animate-wave-hand inline-block text-2xl sm:text-3xl ml-1 select-none">
                👋
              </span>
            )}
          </h2>
          <p className="text-gray-500 mt-1">Here's what's happening at your restaurant today</p>
        </ScrollReveal>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <ScrollReveal
              key={s.label}
              animation="reveal"
              delay={i * 80 + 100}
              className={`bg-white/75 backdrop-blur-md rounded-2xl p-4 border border-white/80 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 ${s.iconBg} rounded-xl flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
              </div>
              {s.isCode ? (
                <p className="text-lg font-bold text-secondary font-mono tracking-wider">{s.value}</p>
              ) : (
                <p className="text-2xl font-extrabold text-secondary">{s.value}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
            </ScrollReveal>
          ))}
        </div>

        {/* Birthdays */}
        {todayBirthdays.length > 0 && (
          <ScrollReveal animation="reveal-scale" delay={400} className="mb-8">
            <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 rounded-2xl border border-pink-200/60 p-5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center gap-2 mb-3 relative">
                <div className="w-8 h-8 bg-pink-100 rounded-xl flex items-center justify-center"><Cake className="w-4 h-4 text-pink-500" /></div>
                <h3 className="text-sm font-bold text-pink-600 uppercase tracking-wider">Today's Birthdays</h3>
                <span className="ml-auto px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-bold rounded-full">{todayBirthdays.length}</span>
              </div>
              <div className="space-y-2 relative">
                {todayBirthdays.map((c, ci) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2.5 transition-all duration-300 hover:bg-white hover:shadow-sm"
                    style={{ animationDelay: `${ci * 100}ms` }}
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-purple to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                      {(c.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-secondary truncate">{c.name}</p>
                      <p className="text-[11px] text-gray-400">Turning {c.ageTurning}</p>
                    </div>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 bg-green/10 text-green px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-green/20 transition-all duration-200 active:scale-95 flex-shrink-0">
                        <Phone className="w-3.5 h-3.5" />Call
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Modules Grid */}
        <ScrollReveal animation="reveal-fade" delay={500}>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Modules</h3>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
          {modules.map((mod, i) => (
            <ScrollReveal key={mod.title} animation="reveal" delay={i * 80 + 500} className="h-full">
              <button
                onClick={() => navigate(mod.route)}
                className="bg-white/75 backdrop-blur-md rounded-2xl p-6 border border-white/80 hover:border-orange-400/40 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-300 text-left group relative overflow-hidden active:scale-[0.98] w-full h-full flex flex-col justify-between min-h-[180px]"
              >
              {/* Gradient accent on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`}></div>

              <div className="relative flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 ${mod.iconBg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <mod.icon className={`w-6 h-6 ${mod.textColor}`} />
                    </div>
                    <div className="flex items-center gap-1 text-gray-300 group-hover:text-primary transition-colors duration-200">
                      <span className="text-xs font-semibold">Open</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-secondary mb-1">{mod.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{mod.desc}</p>
                </div>
                
                {/* Fixed height stats container to ensure equal card heights */}
                <div className="mt-4 h-5 flex items-center gap-2">
                  {mod.stats ? (
                    <>
                      {mod.badge && <span className={`w-2 h-2 ${mod.badge} rounded-full animate-pulse`}></span>}
                      <span className={`text-xs font-semibold ${mod.textColor}`}>{mod.stats}</span>
                    </>
                  ) : (
                    <span className="text-xs text-transparent select-none">&nbsp;</span>
                  )}
                </div>
              </div>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </div>
      </div>
    </div>
  )
}
