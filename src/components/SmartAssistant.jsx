import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCodeAccess } from '../context/CodeAccessContext'
import { useKOT } from '../context/KOTContext'
import { useInventory } from '../context/InventoryContext'
import { useCustomers } from '../context/CustomerContext'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import {
  Lightbulb, X, ChevronUp, ChevronDown, AlertTriangle, TrendingUp,
  TrendingDown, Clock, Package, DollarSign, Users, ShoppingCart,
  Send, Bot, User, Trash2, ArrowRight, Zap, Brain,
  Coffee, BarChart3, Star, MessageCircle, Sparkles, Eye, EyeOff, Headphones, Phone, Mail, Timer, AlertCircle
} from 'lucide-react'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY

const SYSTEM_PROMPT = `You are DaawatDesk AI Assistant — a smart restaurant management helper. You receive real-time restaurant data as JSON with these sections:
- "today": orders, revenue (₹), avgOrder, discount, gst, topItems (with qty and revenue), paymentMethods, peakHour, itemCount
- "yesterday": revenue, orders, COGS, netProfit for comparison
- "last7Days": daily breakdown of orders, revenue, discount, COGS, and net profit for each of the last 7 days
- "inventory": totalItems, lowStock items, purchase/usage/wastage costs and quantities, expiredItems, expiringToday, expiringSoon
- "kitchen": pendingOrders, preparing, ready counts
- "customers": total count, todayBirthdays
- "finance": COGS, netProfit, discountPercent

Answer questions about sales, inventory, orders, revenue, COGS, profit, expiry, trends, and menu performance. Be concise, helpful, and give actionable advice. Use ₹ for Indian Rupees. When comparing days, use the last7Days data for accurate trend analysis. When asked about expiry, refer to expiredItems, expiringToday, and expiringSoon in inventory data. When giving suggestions, be specific with numbers from the data. Keep responses under 3 sentences unless asked for detail.`

const QUICK_QUESTIONS = [
  { label: "Today's revenue?", query: "What is today's total revenue and how many orders?" },
  { label: "Top selling item?", query: "What is my best selling item today?" },
  { label: "Low stock items?", query: "Which inventory items are running low?" },
  { label: "Payment split?", query: "What is the payment method breakdown today?" },
  { label: "Peak hours?", query: "What are my peak ordering hours today?" },
  { label: "Menu suggestions?", query: "Give me suggestions to improve my menu performance" },
]

const CATEGORY_CONFIG = {
  inventory: { icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Inventory' },
  sales: { icon: TrendingUp, color: 'text-green', bg: 'bg-green/10', label: 'Sales' },
  menu: { icon: Coffee, color: 'text-purple', bg: 'bg-purple/10', label: 'Menu' },
  finance: { icon: DollarSign, color: 'text-blue', bg: 'bg-blue/10', label: 'Finance' },
  operations: { icon: Clock, color: 'text-red-500', bg: 'bg-red-50', label: 'Operations' },
  customer: { icon: Users, color: 'text-pink-500', bg: 'bg-pink-50', label: 'Customers' },
}

const SEVERITY_CONFIG = {
  critical: { border: 'border-l-red-500', dot: 'bg-red-500', text: 'text-red-600' },
  warning: { border: 'border-l-amber-500', dot: 'bg-amber-500', text: 'text-amber-600' },
  info: { border: 'border-l-blue', dot: 'bg-blue', text: 'text-blue' },
}

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function SmartAssistant() {
  const navigate = useNavigate()
  const { currentUser, userProfile } = useAuth()
  const { codeUser } = useCodeAccess()
  const { kots } = useKOT()
  const { items: inventoryItems, movements: inventoryMovements, lowStockItems, expiringItems, expiredItems, expiringToday, expiringSoon } = useInventory()
  const { todayBirthdays, customers } = useCustomers()
  const activeUid = currentUser?.uid || codeUser?.uid

  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('alerts')
  const [dismissedAlerts, setDismissedAlerts] = useState([])
  const [txns, setTxns] = useState([])

  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your DaawatDesk AI assistant. Ask me anything about your restaurant — sales, inventory, orders, or menu performance." }
  ])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [requestCount, setRequestCount] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const requestTimestampsRef = useRef([])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const canSendRequest = useCallback(() => {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    requestTimestampsRef.current = requestTimestampsRef.current.filter((t) => t > oneMinuteAgo)
    if (requestTimestampsRef.current.length >= 25) {
      const oldestInWindow = requestTimestampsRef.current[0]
      const secondsLeft = Math.ceil((oldestInWindow + 60000 - now) / 1000)
      setCountdown(secondsLeft)
      setRequestCount(requestTimestampsRef.current.length)
      return false
    }
    return true
  }, [])

  const recordRequest = useCallback(() => {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    requestTimestampsRef.current = requestTimestampsRef.current.filter((t) => t > oneMinuteAgo)
    requestTimestampsRef.current.push(now)
    setRequestCount(requestTimestampsRef.current.length)
  }, [])

  useEffect(() => {
    if (!activeUid) return
    const q = query(collection(db, 'users', activeUid, 'transactions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [activeUid])

  const todayStr = useMemo(() => toLocalDateStr(new Date()), [])

  const todayTxns = useMemo(() => {
    return txns.filter((t) => {
      if (!t.createdAt) return false
      return toLocalDateStr(new Date(t.createdAt)) === todayStr
    })
  }, [txns, todayStr])

  const yesterdayStr = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return toLocalDateStr(d)
  }, [])

  const yesterdayTxns = useMemo(() => {
    return txns.filter((t) => {
      if (!t.createdAt) return false
      return toLocalDateStr(new Date(t.createdAt)) === yesterdayStr
    })
  }, [txns, yesterdayStr])

  const todayStats = useMemo(() => {
    let revenue = 0, discount = 0, gst = 0, itemCount = 0
    const itemCounts = {}
    const itemRevenue = {}
    const paymentCounts = {}
    const hourlyOrders = {}
    const tableOrders = {}

    todayTxns.forEach((t) => {
      revenue += t.total || 0
      discount += t.discount || 0
      gst += t.gst || 0
      const pm = (t.payment || 'OTHER').toUpperCase()
      paymentCounts[pm] = (paymentCounts[pm] || 0) + 1
      const d = new Date(t.createdAt)
      hourlyOrders[d.getHours()] = (hourlyOrders[d.getHours()] || 0) + 1
      const tbl = t.table || 'Parcel'
      tableOrders[tbl] = (tableOrders[tbl] || 0) + 1
      ;(t.items || []).forEach((item) => {
        const qty = item.qty || 0
        itemCount += qty
        itemCounts[item.name] = (itemCounts[item.name] || 0) + qty
        itemRevenue[item.name] = (itemRevenue[item.name] || 0) + (item.price || 0) * qty
      })
    })

    const avgOrder = todayTxns.length > 0 ? Number((revenue / todayTxns.length).toFixed(2)) : 0

    return {
      revenue, discount, gst, itemCount, orders: todayTxns.length,
      itemCounts, itemRevenue, paymentCounts, hourlyOrders, tableOrders,
      avgOrder,
    }
  }, [todayTxns])

  const yesterdayStats = useMemo(() => {
    let revenue = 0, discount = 0, gst = 0
    yesterdayTxns.forEach((t) => {
      revenue += t.total || 0
      discount += t.discount || 0
      gst += t.gst || 0
    })
    const orders = yesterdayTxns.length
    const avgOrder = orders > 0 ? Number((revenue / orders).toFixed(2)) : 0
    return { revenue, discount, gst, orders, avgOrder }
  }, [yesterdayTxns])

  const inventoryCostMap = useMemo(() => {
    const map = {}
    inventoryItems.forEach((item) => {
      map[item.name.toLowerCase()] = item.costPrice || 0
    })
    return map
  }, [inventoryItems])

  const yesterdayInventoryStats = useMemo(() => {
    let usageCost = 0, wastageCost = 0
    inventoryMovements.forEach((m) => {
      if (!m.createdAt) return
      if (toLocalDateStr(new Date(m.createdAt)) !== yesterdayStr) return
      const cost = m.cost || inventoryCostMap[m.itemName?.toLowerCase()] || 0
      const qty = m.quantity || 0
      if (m.type === 'usage' || m.type === 'reduce') { usageCost += cost * qty }
      else if (m.type === 'wastage') { wastageCost += cost * qty }
    })
    return { usageCost, wastageCost, cogs: usageCost + wastageCost }
  }, [inventoryMovements, inventoryCostMap, yesterdayStr])

  const inventoryStats = useMemo(() => {
    let purchaseCost = 0, usageCost = 0, wastageCost = 0
    let purchaseQty = 0, usageQty = 0, wastageQty = 0
    const todayMovements = inventoryMovements.filter((m) => {
      if (!m.createdAt) return false
      return toLocalDateStr(new Date(m.createdAt)) === todayStr
    })

    todayMovements.forEach((m) => {
      const cost = m.cost || inventoryCostMap[m.itemName?.toLowerCase()] || 0
      const qty = m.quantity || 0
      if (m.type === 'purchase' || m.type === 'add') { purchaseCost += cost * qty; purchaseQty += qty }
      else if (m.type === 'usage' || m.type === 'reduce') { usageCost += cost * qty; usageQty += qty }
      else if (m.type === 'wastage') { wastageCost += cost * qty; wastageQty += qty }
    })

    const cogs = usageCost + wastageCost
    return { purchaseCost, usageCost, wastageCost, purchaseQty, usageQty, wastageQty, cogs }
  }, [inventoryMovements, inventoryCostMap, todayStr])

  const weeklyStats = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = toLocalDateStr(d)
      const dayTxns = txns.filter((t) => t.createdAt && toLocalDateStr(new Date(t.createdAt)) === dateStr)
      let revenue = 0, discount = 0, gst = 0
      dayTxns.forEach((t) => {
        revenue += t.total || 0
        discount += t.discount || 0
        gst += t.gst || 0
      })
      let usageCost = 0, wastageCost = 0
      inventoryMovements.forEach((m) => {
        if (!m.createdAt || toLocalDateStr(new Date(m.createdAt)) !== dateStr) return
        const cost = m.cost || inventoryCostMap[m.itemName?.toLowerCase()] || 0
        const qty = m.quantity || 0
        if (m.type === 'usage' || m.type === 'reduce') { usageCost += cost * qty }
        else if (m.type === 'wastage') { wastageCost += cost * qty }
      })
      const cogs = usageCost + wastageCost
      const netProfit = (revenue - gst) - cogs
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' })
      days.push({
        date: dateStr,
        day: dayName,
        orders: dayTxns.length,
        revenue,
        discount,
        gst,
        cogs,
        netProfit,
      })
    }
    return days
  }, [txns, inventoryMovements, inventoryCostMap])

  const alerts = useMemo(() => {
    const result = []

    // ── INVENTORY ──
    if (lowStockItems.length > 0) {
      const critical = lowStockItems.filter((i) => i.currentStock === 0)
      const warning = lowStockItems.filter((i) => i.currentStock > 0)
      if (critical.length > 0) {
        result.push({
          id: 'inv-out-stock',
          category: 'inventory',
          severity: 'critical',
          title: `${critical.length} item${critical.length > 1 ? 's' : ''} OUT OF STOCK`,
          text: critical.map((i) => i.name).join(', ') + ' — order immediately to avoid lost sales.',
          action: () => navigate('/inventory'),
          actionLabel: 'Restock Now',
        })
      }
      if (warning.length > 0) {
        const names = warning.slice(0, 3).map((i) => `${i.name} (${Number(i.currentStock).toFixed(2)} ${i.unit})`).join(', ')
        result.push({
          id: 'inv-low-stock',
          category: 'inventory',
          severity: 'warning',
          title: `${warning.length} item${warning.length > 1 ? 's' : ''} running low`,
          text: names + (warning.length > 3 ? ` +${warning.length - 3} more` : ''),
          action: () => navigate('/inventory'),
          actionLabel: 'View Inventory',
        })
      }
    }

    if (inventoryStats.wastageCost > 0) {
      const wastagePct = inventoryStats.usageCost > 0
        ? ((inventoryStats.wastageCost / (inventoryStats.usageCost + inventoryStats.wastageCost)) * 100).toFixed(1)
        : 0
      if (Number(wastagePct) > 10) {
        result.push({
          id: 'inv-high-wastage',
          category: 'inventory',
          severity: 'warning',
          title: `Wastage at ${wastagePct}% of total usage`,
          text: `₹${inventoryStats.wastageCost.toLocaleString('en-IN')} wasted. Review prep quantities and storage.`,
          action: () => navigate('/inventory'),
          actionLabel: 'Review Wastage',
        })
      }
    }

    if (expiredItems.length > 0) {
      const names = expiredItems.slice(0, 3).map((i) => i.name).join(', ')
      result.push({
        id: 'inv-expired',
        category: 'inventory',
        severity: 'critical',
        title: `${expiredItems.length} item${expiredItems.length > 1 ? 's' : ''} EXPIRED!`,
        text: names + (expiredItems.length > 3 ? ` +${expiredItems.length - 3} more` : '') + ' — remove from stock immediately to avoid serving expired items.',
        action: () => navigate('/inventory'),
        actionLabel: 'View Inventory',
      })
    }

    if (expiringToday.length > 0) {
      const names = expiringToday.map((i) => i.name).join(', ')
      result.push({
        id: 'inv-expiring-today',
        category: 'inventory',
        severity: 'critical',
        title: `${expiringToday.length} item${expiringToday.length > 1 ? 's' : ''} expiring TODAY`,
        text: names + ' — use or discount today before they expire.',
        action: () => navigate('/inventory'),
        actionLabel: 'View Inventory',
      })
    }

    if (expiringSoon.length > 0) {
      const names = expiringSoon.slice(0, 3).map((i) => `${i.name} (${i.daysLeft}d)`).join(', ')
      result.push({
        id: 'inv-expiring-soon',
        category: 'inventory',
        severity: 'warning',
        title: `${expiringSoon.length} item${expiringSoon.length > 1 ? 's' : ''} expiring in ≤3 days`,
        text: names + (expiringSoon.length > 3 ? ` +${expiringSoon.length - 3} more` : '') + ' — prioritize using these items.',
        action: () => navigate('/inventory'),
        actionLabel: 'View Inventory',
      })
    }

    // ── SALES ──
    if (todayStats.orders > 0 && yesterdayStats.orders > 0) {
      const revDiff = ((todayStats.revenue - yesterdayStats.revenue) / yesterdayStats.revenue * 100).toFixed(1)
      if (Number(revDiff) < -20) {
        result.push({
          id: 'sales-down',
          category: 'sales',
          severity: 'warning',
          title: `Revenue down ${Math.abs(Number(revDiff))}% vs yesterday`,
          text: `₹${todayStats.revenue.toLocaleString('en-IN')} today vs ₹${yesterdayStats.revenue.toLocaleString('en-IN')} yesterday. Investigate footfall or promotions.`,
          action: () => navigate('/reports'),
          actionLabel: 'View Reports',
        })
      } else if (Number(revDiff) > 20) {
        result.push({
          id: 'sales-up',
          category: 'sales',
          severity: 'info',
          title: `Revenue up ${Number(revDiff)}% vs yesterday!`,
          text: `₹${todayStats.revenue.toLocaleString('en-IN')} today — great performance. Keep it up!`,
          action: null,
          actionLabel: null,
        })
      }
    }

    const sortedItems = Object.entries(todayStats.itemCounts).sort((a, b) => b[1] - a[1])
    if (sortedItems.length > 0 && todayStats.orders >= 3) {
      const top = sortedItems[0]
      const least = sortedItems.length > 2 ? sortedItems[sortedItems.length - 1] : null
      result.push({
        id: 'sales-top-item',
        category: 'sales',
        severity: 'info',
        title: `Top seller: "${top[0]}" (${top[1]} orders)`,
        text: least && least[1] <= 1
          ? `"${least[0]}" only sold ${least[1]} time — consider a combo deal or discount.`
          : 'Strong performer — consider promoting it as a signature dish.',
        action: null,
        actionLabel: null,
      })
    }

    // ── MENU ──
    if (todayStats.orders >= 5) {
      const avgOrder = todayStats.avgOrder
      if (avgOrder < 200) {
        result.push({
          id: 'menu-low-aov',
          category: 'menu',
          severity: 'warning',
          title: `Low avg order: ₹${avgOrder.toFixed(0)}`,
          text: 'Try combo meals, meal deals, or minimum order incentives to boost ticket size.',
          action: null,
          actionLabel: null,
        })
      } else if (avgOrder > 500) {
        result.push({
          id: 'menu-high-aov',
          category: 'menu',
          severity: 'info',
          title: `Strong avg order: ₹${avgOrder.toFixed(0)}`,
          text: 'High-value orders — ensure premium items are always in stock.',
          action: null,
          actionLabel: null,
        })
      }
    }

    // ── FINANCE ──
    if (todayStats.discount > 0 && todayStats.revenue > 0) {
      const pct = todayStats.discount > 0 && todayStats.revenue > 0
        ? (todayStats.discount / (todayStats.revenue + todayStats.discount) * 100).toFixed(1)
        : 0
      if (Number(pct) > 10) {
        result.push({
          id: 'fin-high-discount',
          category: 'finance',
          severity: 'critical',
          title: `Discounts at ${pct}% of revenue!`,
          text: `₹${todayStats.discount.toLocaleString('en-IN')} given away. Review staff discount authority.`,
          action: () => navigate('/reports'),
          actionLabel: 'View Reports',
        })
      } else if (Number(pct) > 5) {
        result.push({
          id: 'fin-moderate-discount',
          category: 'finance',
          severity: 'warning',
          title: `Discounts at ${pct}% — moderate`,
          text: `₹${todayStats.discount.toLocaleString('en-IN')} given. Keep under 5% for healthy margins.`,
          action: null,
          actionLabel: null,
        })
      }
    }

    const sortedPayments = Object.entries(todayStats.paymentCounts).sort((a, b) => b[1] - a[1])
    if (sortedPayments.length >= 2 && todayStats.orders >= 3) {
      const dominant = sortedPayments[0]
      const pct = ((dominant[1] / todayStats.orders) * 100).toFixed(0)
      if (Number(pct) > 75) {
        result.push({
          id: 'fin-payment-mix',
          category: 'finance',
          severity: 'info',
          title: `${pct}% via ${dominant[0]}`,
          text: 'Consider promoting UPI/card to diversify payment channels.',
          action: null,
          actionLabel: null,
        })
      }
    }

    if (todayStats.gst > 0) {
      const dayOfMonth = new Date().getDate()
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
      const isMonthEnd = dayOfMonth >= 25 || dayOfMonth >= daysInMonth - 3
      result.push({
        id: 'fin-gst',
        category: 'finance',
        severity: isMonthEnd ? 'warning' : 'info',
        title: `GST collected: ₹${todayStats.gst.toLocaleString('en-IN')}`,
        text: isMonthEnd
          ? `SGST: ₹${(todayStats.gst / 2).toFixed(0)} + CGST: ₹${(todayStats.gst / 2).toFixed(0)}. Month end — file GST returns soon!`
          : `SGST: ₹${(todayStats.gst / 2).toFixed(0)} + CGST: ₹${(todayStats.gst / 2).toFixed(0)}.`,
        action: isMonthEnd ? () => navigate('/reports') : null,
        actionLabel: isMonthEnd ? 'View Reports' : null,
      })
    }

    // ── OPERATIONS ──
    const pendingKots = (kots || []).filter((k) => k.status === 'pending' || k.status === 'preparing')
    const readyKots = (kots || []).filter((k) => k.status === 'ready')

    if (pendingKots.length >= 5) {
      result.push({
        id: 'ops-backlog',
        category: 'operations',
        severity: 'critical',
        title: `${pendingKots.length} orders pending!`,
        text: 'Kitchen backlog building up. Prioritize old KOTs to avoid customer complaints.',
        action: () => navigate('/billing'),
        actionLabel: 'Open Billing',
      })
    } else if (pendingKots.length >= 3) {
      result.push({
        id: 'ops-moderate-queue',
        category: 'operations',
        severity: 'warning',
        title: `${pendingKots.length} orders in queue`,
        text: 'Kitchen is busy. Keep an eye on wait times.',
        action: null,
        actionLabel: null,
      })
    }

    if (readyKots.length >= 3) {
      result.push({
        id: 'ops-ready',
        category: 'operations',
        severity: 'warning',
        title: `${readyKots.length} orders ready to serve!`,
        text: 'Serve promptly to maintain food quality and customer satisfaction.',
        action: () => navigate('/billing'),
        actionLabel: 'View Orders',
      })
    }

    const peakHours = Object.entries(todayStats.hourlyOrders).sort((a, b) => b[1] - a[1])
    if (peakHours.length > 0 && todayStats.orders >= 5) {
      const peak = peakHours[0]
      const hr = Number(peak[0])
      const label = hr < 12 ? `${hr} AM` : hr === 12 ? '12 PM' : `${hr - 12} PM`
      const isLunch = hr >= 11 && hr <= 14
      const isDinner = hr >= 18 && hr <= 21
      let tip = isLunch ? 'Staff extra for lunch rush.' : isDinner ? 'Prepare extra for dinner crowd.' : 'Manage staffing around this time.'
      result.push({
        id: 'ops-peak',
        category: 'operations',
        severity: 'info',
        title: `Peak hour: ${label} (${peak[1]} orders)`,
        text: tip,
        action: null,
        actionLabel: null,
      })
    }

    // ── CUSTOMER ──
    if (todayStats.orders >= 10) {
      const avgOrder = todayStats.avgOrder
      if (avgOrder > 300) {
        result.push({
          id: 'cust-high-value',
          category: 'customer',
          severity: 'info',
          title: 'High-value customers today',
          text: `Avg order ₹${avgOrder.toFixed(0)} — consider a loyalty program to retain them.`,
          action: null,
          actionLabel: null,
        })
      }
    }

    if (todayBirthdays.length > 0) {
      const names = todayBirthdays.map((c) => c.name).join(', ')
      result.push({
        id: 'cust-birthday',
        category: 'customer',
        severity: 'info',
        title: `Birthday Alert — ${todayBirthdays.length} customer${todayBirthdays.length > 1 ? 's' : ''}`,
        text: `Today is ${names}'s birthday${todayBirthdays.length > 1 ? 's' : ''}! Consider calling them with a special offer.`,
        action: () => navigate('/crm'),
        actionLabel: 'View CRM',
      })
    }

    return result.filter((a) => !dismissedAlerts.includes(a.id))
  }, [todayStats, yesterdayStats, lowStockItems, inventoryStats, kots, dismissedAlerts, navigate, todayBirthdays, expiredItems, expiringToday, expiringSoon])

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length
  const unreadCount = criticalCount + warningCount

  const sendAIQuery = useCallback(async (userQuery) => {
    if (!userQuery.trim()) return
    if (!canSendRequest()) return

    const peakHourSorted = Object.entries(todayStats.hourlyOrders).sort((a, b) => b[1] - a[1])
    let peakHourStr = 'N/A'
    if (peakHourSorted.length > 0) {
      const [hr, count] = peakHourSorted[0]
      const h = Number(hr)
      peakHourStr = h < 12 ? `${h} AM (${count} orders)` : h === 12 ? `12 PM (${count} orders)` : `${h - 12} PM (${count} orders)`
    }

    const totalItemQty = todayStats.itemCount
    const revenueExclGst = todayStats.revenue - todayStats.gst
    const netProfit = revenueExclGst - inventoryStats.cogs
    const discountPercent = (todayStats.revenue + todayStats.discount) > 0
      ? Number((todayStats.discount / (todayStats.revenue + todayStats.discount) * 100).toFixed(1))
      : 0

    const contextData = {
      today: {
        date: todayStr,
        orders: todayStats.orders,
        totalItemsSold: totalItemQty,
        revenue: todayStats.revenue,
        revenueExclGst,
        avgOrder: todayStats.avgOrder,
        discount: todayStats.discount,
        gst: todayStats.gst,
        topItems: Object.entries(todayStats.itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, qty]) => `${name}(qty:${qty},₹${todayStats.itemRevenue[name] || 0})`).join(', '),
        paymentMethods: Object.entries(todayStats.paymentCounts).map(([m, c]) => `${m}:${c}`).join(', '),
        peakHour: peakHourStr,
        tableOrders: Object.entries(todayStats.tableOrders).map(([t, c]) => `${t}:${c}`).join(', '),
      },
      yesterday: {
        revenue: yesterdayStats.revenue,
        orders: yesterdayStats.orders,
        avgOrder: yesterdayStats.avgOrder,
        discount: yesterdayStats.discount,
        gst: yesterdayStats.gst,
        COGS: yesterdayInventoryStats.cogs,
        netProfit: (yesterdayStats.revenue - yesterdayStats.gst) - yesterdayInventoryStats.cogs,
      },
      inventory: {
        totalItems: inventoryItems.length,
        lowStock: lowStockItems.map((i) => `${i.name}(${Number(i.currentStock).toFixed(2)} ${i.unit})`).join(', ') || 'None',
        purchaseCost: inventoryStats.purchaseCost,
        purchaseQty: inventoryStats.purchaseQty,
        usageCost: inventoryStats.usageCost,
        usageQty: inventoryStats.usageQty,
        wastageCost: inventoryStats.wastageCost,
        wastageQty: inventoryStats.wastageQty,
        expiredItems: expiredItems.map((i) => `${i.name}(${i.category},₹${i.costPrice})`).join(', ') || 'None',
        expiringToday: expiringToday.map((i) => `${i.name}(${i.category},₹${i.costPrice})`).join(', ') || 'None',
        expiringSoon: expiringSoon.map((i) => `${i.name}(${i.daysLeft}d,${i.category},₹${i.costPrice})`).join(', ') || 'None',
      },
      kitchen: {
        pendingOrders: (kots || []).filter((k) => k.status === 'pending').length,
        preparing: (kots || []).filter((k) => k.status === 'preparing').length,
        ready: (kots || []).filter((k) => k.status === 'ready').length,
      },
      customers: {
        total: customers.length,
        todayBirthdays: todayBirthdays.map((c) => `${c.name}(age ${c.ageTurning})`).join(', ') || 'None',
      },
      finance: {
        COGS: inventoryStats.cogs,
        netProfit,
        discountPercent,
      },
      last7Days: weeklyStats.map((d) => `${d.day}(${d.date}): orders=${d.orders}, rev=₹${d.revenue.toFixed(0)}, disc=₹${d.discount.toFixed(0)}, cogs=₹${d.cogs.toFixed(0)}, profit=₹${d.netProfit.toFixed(0)}`).join('\n'),
    }

    const fullPrompt = `Restaurant Data Context:\n${JSON.stringify(contextData, null, 2)}\n\nUser Question: ${userQuery}`

    const userMsg = { role: 'user', text: userQuery }
    setAiMessages((prev) => [...prev, userMsg])
    setAiInput('')
    setAiLoading(true)
    recordRequest()

    try {
      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: fullPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setAiMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${data.error.message || 'API limit reached. Try again shortly.'}` }])
      } else {
        const reply = data.choices?.[0]?.message?.content || 'No response generated.'
        setAiMessages((prev) => [...prev, { role: 'assistant', text: reply }])
      }
    } catch (err) {
      setAiMessages((prev) => [...prev, { role: 'assistant', text: 'Network error. Please check your connection and try again.' }])
    } finally {
      setAiLoading(false)
    }
  }, [todayStr, todayStats, inventoryItems, lowStockItems, inventoryStats, kots, canSendRequest, recordRequest, yesterdayStats, yesterdayInventoryStats, customers, todayBirthdays, weeklyStats, expiredItems, expiringToday, expiringSoon])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  useEffect(() => {
    if (isOpen && activeTab === 'ai') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, activeTab])

  return (
    <>
      {/* ── Floating Widget ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
           className="fixed z-[100] w-14 h-14 bg-gradient-to-br from-amber-500 to-orange rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 ease-out flex items-center justify-center group sm:bottom-[80px] sm:left-[80px] bottom-[20px] left-[20px]"
        >
          <Brain className="w-6 h-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Panel ── */}
      {isOpen && (
        <div className="fixed z-[100] w-[380px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100vh-2.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 sm:bottom-[30px] sm:left-[30px] bottom-[16px] left-[16px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white">DaawatDesk Assistant</span>
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} alert{unreadCount > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white p-1 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'alerts' ? 'text-orange border-b-2 border-orange bg-orange/5' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Smart Alerts
              {unreadCount > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1 py-0 rounded-full">{unreadCount}</span>}
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'ai' ? 'text-orange border-b-2 border-orange bg-orange/5' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'help' ? 'text-orange border-b-2 border-orange bg-orange/5' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              Help
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'alerts' && (
              <div className="h-full overflow-y-auto p-3 space-y-2">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10">
                    <div className="w-12 h-12 bg-green/10 rounded-full flex items-center justify-center mb-3">
                      <Sparkles className="w-6 h-6 text-green" />
                    </div>
                    <p className="text-sm font-semibold text-secondary">All clear!</p>
                    <p className="text-xs text-gray-400 mt-1">No alerts right now. Your restaurant is running smoothly.</p>
                  </div>
                ) : (
                  <>
                    {alerts.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categories</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                      </div>
                    )}
                    {alerts.map((alert) => {
                      const cat = CATEGORY_CONFIG[alert.category]
                      const sev = SEVERITY_CONFIG[alert.severity]
                      return (
                        <div key={alert.id} className={`bg-white border border-gray-100 rounded-xl p-3 border-l-4 ${sev.border} hover:shadow-sm transition-shadow group`}>
                          <div className="flex items-start gap-2.5">
                            <div className={`w-7 h-7 ${cat.bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <cat.icon className={`w-3.5 h-3.5 ${cat.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${sev.dot} flex-shrink-0`}></span>
                                <p className="text-[11px] font-bold text-secondary truncate">{alert.title}</p>
                              </div>
                              <p className="text-[11px] text-gray-500 leading-relaxed">{alert.text}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                {alert.action && (
                                  <button onClick={alert.action} className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                                    {alert.actionLabel} <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                                <button onClick={() => setDismissedAlerts((p) => [...p, alert.id])} className="text-[10px] text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
            {activeTab === 'ai' && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-gray-100 text-secondary rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-bl-md">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {aiMessages.length <= 1 && (
                  <div className="px-3 pb-2 flex-shrink-0">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Quick Questions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendAIQuery(q.query)}
                          disabled={aiLoading}
                          className="text-[11px] font-medium px-2.5 py-1 bg-orange/5 hover:bg-orange/10 text-orange rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                  <div className="border-t border-gray-100 px-3 py-2.5 flex-shrink-0">
                    {countdown > 0 && (
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-amber-50 rounded-lg">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                        <span className="text-[11px] font-semibold text-amber-700">
                          Rate limit — wait {countdown}s ({requestCount}/25 used)
                        </span>
                      </div>
                    )}
                    {countdown <= 0 && requestCount > 0 && (
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-gray-50 rounded-lg">
                        <span className="text-[10px] text-gray-400">{requestCount}/25 requests used</span>
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green rounded-full transition-all" style={{ width: `${(requestCount / 25) * 100}%` }}></div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !aiLoading && countdown <= 0) sendAIQuery(aiInput) }}
                        placeholder={countdown > 0 ? `Wait ${countdown}s...` : "Ask about your restaurant..."}
                        disabled={aiLoading || countdown > 0}
                        className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange focus:border-orange disabled:opacity-50"
                      />
                      <button
                        onClick={() => sendAIQuery(aiInput)}
                        disabled={aiLoading || !aiInput.trim() || countdown > 0}
                        className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange rounded-xl flex items-center justify-center text-white hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
              </div>
            )}
            {activeTab === 'help' && (
              <div className="h-full overflow-y-auto p-4 space-y-3">
                <div className="text-center mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-orange/20 animate-bounce">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-bold text-secondary">We're here to help!</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Reach out anytime</p>
                </div>

                <a
                  href="tel:7008938983"
                  className="group flex items-center gap-3.5 bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:shadow-lg hover:border-blue/20 transition-all duration-300 hover:-translate-y-0.5 opacity-100"
                >
                  <div className="w-12 h-12 bg-blue rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue/20 group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-secondary">Call Us</p>
                    <p className="text-xs text-gray-400 mt-0.5">+91 7008 938 983</p>
                  </div>
                  <div className="text-gray-300 group-hover:text-blue transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </a>

                <a
                  href={`https://wa.me/917008938983?text=${encodeURIComponent(`Hi\nI am from ${userProfile?.restaurant || 'DaawatDesk'} trying to connect with you.\nPlease call back!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3.5 bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:shadow-lg hover:border-green/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 bg-[#25D366] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-green/20 group-hover:scale-110 transition-transform duration-300 relative">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-secondary">WhatsApp</p>
                    <p className="text-xs text-gray-400 mt-0.5">Chat with us instantly</p>
                  </div>
                  <div className="text-gray-300 group-hover:text-green transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </a>

                <a
                  href="mailto:swainvikramaditya99@gmail.com"
                  className="group flex items-center gap-3.5 bg-white border border-gray-100 rounded-2xl px-4 py-4 hover:shadow-lg hover:border-orange/20 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md shadow-orange/20 group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-secondary">Email Us</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">swainvikramaditya99@gmail.com</p>
                  </div>
                  <div className="text-gray-300 group-hover:text-orange transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </a>

                <div className="text-center pt-2">
                  <p className="text-[10px] text-gray-300 font-medium">Available 24/7 for your support</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
