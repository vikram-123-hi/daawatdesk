import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useAuth } from '../context/AuthContext'
import { useCodeAccess } from '../context/CodeAccessContext'
import { useInventory } from '../context/InventoryContext'
import { db } from '../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import {
  ArrowLeft, BarChart3, DollarSign, ShoppingCart,
  CreditCard, Clock, Calendar, ChevronDown, ChevronLeft, ChevronRight,
  ArrowDownRight, Filter, X, TrendingUp, TrendingDown, Receipt, Package, Download,
  ChefHat, Trash2, Utensils
} from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Sector
} from 'recharts'

const COLORS = ['#FF6B00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6']
const PAYMENT_COLORS = { CASH: '#10B981', UPI: '#3B82F6', CARD: '#8B5CF6', OTHER: '#6B7280' }
const ORDER_TYPE_COLORS = { 'Dine-in': '#FF6B00', 'Parcel': '#10B981' }
const RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom' },
]

function getDateRange(range, customFrom, customTo) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (range) {
    case 'today': return { start: today, end: new Date(today.getTime() + 86400000) }
    case 'yesterday': {
      const y = new Date(today.getTime() - 86400000)
      return { start: y, end: today }
    }
    case 'week': {
      const day = today.getDay()
      const monday = new Date(today.getTime() - (day === 0 ? 6 : day - 1) * 86400000)
      return { start: monday, end: new Date(today.getTime() + 86400000) }
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(today.getTime() + 86400000) }
    case 'custom': {
      const s = customFrom ? new Date(customFrom) : today
      const e = customTo ? new Date(new Date(customTo).getTime() + 86400000) : new Date(today.getTime() + 86400000)
      return { start: s, end: e }
    }
    default: return { start: today, end: new Date(today.getTime() + 86400000) }
  }
}

function getPreviousRange(start, end) {
  const duration = end.getTime() - start.getTime()
  return { start: new Date(start.getTime() - duration), end: new Date(start.getTime()) }
}

function fmt(n) {
  if (n == null || isNaN(n)) return 'Rs.0'
  return 'Rs.' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function fmtDec(n) {
  if (n == null || isNaN(n)) return 'Rs.0.00'
  return 'Rs.' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function CalendarDropdown({ date, onSelect, calMonth, setCalMonth, minDate, maxDate }) {
  const today = new Date()
  const year = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const selected = date ? new Date(date + 'T00:00:00') : null
  const [view, setView] = useState('day')
  const [yearPage, setYearPage] = useState(Math.floor(year / 12) * 12)
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthFull = calMonth.toLocaleDateString('en-IN', { month: 'long' })

  const minD = minDate ? new Date(minDate + 'T00:00:00') : null
  const maxD = maxDate ? new Date(maxDate + 'T00:00:00') : null
  const isBeforeMin = (y, m, d) => minD && new Date(y, m, d) < minD && !(new Date(y, m, d).toDateString() === minD.toDateString())
  const isAfterMax = (y, m, d) => maxD && new Date(y, m, d) > maxD && !(new Date(y, m, d).toDateString() === maxD.toDateString())
  const isPast = (y, m, d) => new Date(y, m, d) > today
  const isDisabled = (y, m, d) => isPast(y, m, d) || isBeforeMin(y, m, d) || isAfterMax(y, m, d)
  const isYearDisabled = (y) => (y > today.getFullYear()) || (minD && y < minD.getFullYear()) || (maxD && y > maxD.getFullYear())
  const isMonthDisabled = (y, m) => {
    if (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth())) return true
    if (minD && (y < minD.getFullYear() || (y === minD.getFullYear() && m < minD.getMonth()))) return true
    if (maxD && (y > maxD.getFullYear() || (y === maxD.getFullYear() && m > maxD.getMonth()))) return true
    return false
  }

  const canGoPrev = !minD || month > minD.getMonth() || year > minD.getFullYear()
  const canGoNext = !maxD || month < maxD.getMonth() || year < maxD.getFullYear()
  const prev = () => { if (canGoPrev) setCalMonth(new Date(year, month - 1, 1)) }
  const next = () => { if (canGoNext) setCalMonth(new Date(year, month + 1, 1)) }
  const pick = (d) => { if (!isDisabled(year, month, d)) onSelect(toLocalDateStr(new Date(year, month, d))) }

  if (view === 'year') {
    const startYear = yearPage
    const yearRange = Array.from({ length: 12 }, (_, i) => startYear + i)
    return (
      <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-[100] w-64 animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setYearPage(yearPage - 12)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
          <span className="text-sm font-bold text-secondary">{yearRange[0]} - {yearRange[yearRange.length - 1]}</span>
          <button onClick={() => setYearPage(yearPage + 12)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {yearRange.map((y) => {
            const isCurrent = y === today.getFullYear()
            const isSelected = y === year
            const disabled = isYearDisabled(y)
            return (
              <button key={y} onClick={() => { if (!disabled) { setCalMonth(new Date(y, month, 1)); setView('month') } }} disabled={disabled} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${isSelected ? 'bg-primary text-white shadow-md' : isCurrent ? 'bg-primary/10 text-primary font-bold' : disabled ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
                {y}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (view === 'month') {
    return (
      <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-[100] w-64 animate-fade-up">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setYearPage(yearPage - 12)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-gray-500" /></button>
          <button onClick={() => setView('year')} className="text-sm font-bold text-secondary hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5">{year}</button>
          <button onClick={() => setYearPage(yearPage + 12)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-gray-500" /></button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {months.map((m, i) => {
            const isCurrent = i === today.getMonth() && year === today.getFullYear()
            const isSelected = i === month
            const disabled = isMonthDisabled(year, i)
            return (
              <button key={m} onClick={() => { if (!disabled) { setCalMonth(new Date(year, i, 1)); setView('day') } }} disabled={disabled} className={`py-2.5 rounded-xl text-xs font-medium transition-all ${isSelected ? 'bg-primary text-white shadow-md' : isCurrent ? 'bg-primary/10 text-primary font-bold' : disabled ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
                {m}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="absolute top-full left-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-[100] w-64 animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} disabled={!canGoPrev} className={`p-1.5 rounded-lg transition-colors ${canGoPrev ? 'hover:bg-gray-100' : 'cursor-not-allowed text-gray-200'}`}><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-1">
          <button onClick={() => setView('month')} className="text-sm font-bold text-secondary hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5">{monthFull}</button>
          <button onClick={() => { setYearPage(Math.floor(year / 12) * 12); setView('year') }} className="text-sm font-bold text-secondary hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/5">{year}</button>
        </div>
        <button onClick={next} disabled={!canGoNext} className={`p-1.5 rounded-lg transition-colors ${canGoNext ? 'hover:bg-gray-100' : 'cursor-not-allowed text-gray-200'}`}><ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {days.map((d) => <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1
          const isToday = today.getDate() === d && today.getMonth() === month && today.getFullYear() === year
          const isSelected = selected && selected.getDate() === d && selected.getMonth() === month && selected.getFullYear() === year
          const disabled = isDisabled(year, month, d)
          return (
            <button key={d} onClick={() => pick(d)} disabled={disabled} className={`w-full aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center ${isSelected ? 'bg-primary text-white shadow-md' : isToday ? 'bg-primary/10 text-primary font-bold' : disabled ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}>
              {d}
            </button>
          )
        })}
      </div>
      <div className="border-t border-gray-100 mt-2 pt-2 flex justify-center">
        <button onClick={() => onSelect(toLocalDateStr(today))} className="text-xs font-semibold text-primary hover:bg-primary/5 px-3 py-1 rounded-lg transition-colors">Today</button>
      </div>
    </div>
  )
}

const ActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1A1A2E" style={{ fontSize: 13, fontWeight: 700 }}>{payload.name}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6B7280" style={{ fontSize: 11 }}>{`${(percent * 100).toFixed(0)}% | ${fmt(value)}`}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 10} fill={fill} />
    </g>
  )
}

function DiffBadge({ current, previous, suffix = '' }) {
  if (!previous || previous === 0) return <span className="text-[10px] text-gray-400 ml-1">vs prev period</span>
  const diff = ((current - previous) / previous) * 100
  const isUp = diff > 0
  const isNeutral = Math.abs(diff) < 0.5
  if (isNeutral) return <span className="text-[10px] text-gray-400 ml-1">Same as prev</span>
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ml-1 ${isUp ? 'text-green' : 'text-red-500'}`}>
      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isUp ? '+' : ''}{diff.toFixed(1)}%{suffix}
    </span>
  )
}

export default function Reports() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { codeUser } = useCodeAccess()
  const activeUid = currentUser?.uid || codeUser?.uid
  const { items: inventoryItems, movements: allMovements } = useInventory()
  const [allTxns, setAllTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showRangeDrop, setShowRangeDrop] = useState(false)
  const [activePayment, setActivePayment] = useState(null)
  const [activeOrderType, setActiveOrderType] = useState(null)
  const [calOpen, setCalOpen] = useState(null)
  const [calMonth, setCalMonth] = useState(() => new Date())

  const [allExpenses, setAllExpenses] = useState([])

  useEffect(() => {
    if (!activeUid) { setLoading(false); return }
    const unsubTxns = onSnapshot(
      query(collection(db, 'users', activeUid, 'transactions'), orderBy('createdAt', 'desc')),
      (snap) => { setAllTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false) },
      () => setLoading(false)
    )
    const unsubExp = onSnapshot(
      query(collection(db, 'users', activeUid, 'expenses'), orderBy('date', 'desc')),
      (snap) => { setAllExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() }))) },
      () => {}
    )
    return () => { unsubTxns(); unsubExp() }
  }, [activeUid])

  const { start, end } = useMemo(() => getDateRange(range, customFrom, customTo), [range, customFrom, customTo])
  const prevRange = useMemo(() => getPreviousRange(start, end), [start, end])

  const txns = useMemo(() => {
    return allTxns.filter((t) => {
      if (!t.createdAt) return false
      const d = new Date(t.createdAt)
      if (isNaN(d.getTime())) return false
      return d >= start && d < end
    })
  }, [allTxns, start, end])

  const prevTxns = useMemo(() => {
    return allTxns.filter((t) => {
      if (!t.createdAt) return false
      const d = new Date(t.createdAt)
      if (isNaN(d.getTime())) return false
      return d >= prevRange.start && d < prevRange.end
    })
  }, [allTxns, prevRange])

  const inventoryCostMap = useMemo(() => {
    const map = {}
    inventoryItems.forEach((item) => {
      map[item.name.toLowerCase()] = item.costPrice || 0
    })
    return map
  }, [inventoryItems])

  const stats = useMemo(() => {
    if (txns.length === 0) return { revenue: 0, orders: 0, avgOrder: 0, discount: 0, gst: 0, topPayment: 'N/A', sgst: 0, cgst: 0, totalItems: 0 }
    const revenue = txns.reduce((s, t) => s + (t.total || 0), 0)
    const discount = txns.reduce((s, t) => s + (t.discount || 0), 0)
    const gst = txns.reduce((s, t) => s + (t.gst || 0), 0)
    const totalItems = txns.reduce((s, t) => s + (t.items || []).reduce((a, i) => a + (i.qty || 0), 0), 0)
    const payCount = {}
    txns.forEach((t) => { const p = t.payment || 'OTHER'; payCount[p] = (payCount[p] || 0) + 1 })
    const topPayment = Object.entries(payCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    return { revenue, orders: txns.length, avgOrder: txns.length > 0 ? Number((revenue / txns.length).toFixed(2)) : 0, discount, gst, topPayment, sgst: gst / 2, cgst: gst / 2, totalItems }
  }, [txns])

  const prevStats = useMemo(() => {
    if (prevTxns.length === 0) return { revenue: 0, orders: 0, avgOrder: 0, discount: 0, gst: 0 }
    const revenue = prevTxns.reduce((s, t) => s + (t.total || 0), 0)
    const discount = prevTxns.reduce((s, t) => s + (t.discount || 0), 0)
    const gst = prevTxns.reduce((s, t) => s + (t.gst || 0), 0)
    return { revenue, orders: prevTxns.length, avgOrder: prevTxns.length > 0 ? Number((revenue / prevTxns.length).toFixed(2)) : 0, discount, gst }
  }, [prevTxns])

  const inventoryMovements = useMemo(() => {
    return allMovements.filter((m) => {
      if (!m.createdAt) return false
      const d = new Date(m.createdAt)
      if (isNaN(d.getTime())) return false
      return d >= start && d < end
    })
  }, [allMovements, start, end])

  const inventoryStats = useMemo(() => {
    let purchaseCost = 0, wastageCost = 0, usageCost = 0
    let purchaseQty = 0, wastageQty = 0, usageQty = 0
    const categoryMap = {}

    inventoryMovements.forEach((m) => {
      const cost = m.cost || inventoryCostMap[m.itemName?.toLowerCase()] || 0
      const total = cost * (m.quantity || 0)

      if (m.type === 'purchase' || m.type === 'add') {
        purchaseCost += total; purchaseQty += m.quantity || 0
      } else if (m.type === 'wastage') {
        wastageCost += total; wastageQty += m.quantity || 0
      } else if (m.type === 'usage' || m.type === 'reduce') {
        usageCost += total; usageQty += m.quantity || 0
      }

      const cat = m.category || 'other'
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, purchase: 0, wastage: 0, usage: 0 }
      if (m.type === 'purchase' || m.type === 'add') categoryMap[cat].purchase += total
      else if (m.type === 'wastage') categoryMap[cat].wastage += total
      else if (m.type === 'usage' || m.type === 'reduce') categoryMap[cat].usage += total
    })

    const totalExpenses = usageCost + wastageCost
    const netProfit = (stats.revenue - stats.gst) - totalExpenses

    return {
      purchaseCost, wastageCost, usageCost, totalExpenses, netProfit,
      purchaseQty, wastageQty, usageQty,
      categoryData: Object.values(categoryMap).filter((c) => c.purchase > 0 || c.wastage > 0 || c.usage > 0).sort((a, b) => (b.purchase + b.wastage + b.usage) - (a.purchase + a.wastage + a.usage))
    }
  }, [inventoryMovements, inventoryCostMap, stats.revenue, stats.gst])

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      if (!e.date) return false
      const d = new Date(e.date + 'T00:00:00')
      if (isNaN(d.getTime())) return false
      return d >= start && d < end
    })
  }, [allExpenses, start, end])

  const operationalExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  }, [filteredExpenses])

  const profitData = useMemo(() => {
    if (txns.length === 0 && operationalExpensesTotal === 0) {
      return { cogs: 0, grossProfit: 0, operationalExpenses: 0, netProfit: 0, cogsPercent: 0, grossMargin: 0, netRevenue: 0 }
    }
    const cogs = inventoryStats.usageCost + inventoryStats.wastageCost
    const netRevenue = stats.revenue - stats.gst
    const grossProfit = netRevenue - cogs
    const netProfit = grossProfit - operationalExpensesTotal
    const cogsPercent = netRevenue > 0 ? (cogs / netRevenue) * 100 : 0
    const grossMargin = netRevenue > 0 ? ((grossProfit / netRevenue) * 100) : 0
    return { cogs, grossProfit, operationalExpenses: operationalExpensesTotal, netProfit, cogsPercent, grossMargin, netRevenue }
  }, [inventoryStats, stats.revenue, stats.gst, operationalExpensesTotal, txns.length])

  const orderTypeData = useMemo(() => {
    const map = { 'Dine-in': { name: 'Dine-in', count: 0, revenue: 0 }, 'Parcel': { name: 'Parcel', count: 0, revenue: 0 } }
    txns.forEach((t) => {
      const type = /^table\s*\d+/i.test(t.table) ? 'Dine-in' : 'Parcel'
      map[type].count += 1
      map[type].revenue += t.total || 0
    })
    return Object.values(map)
  }, [txns])

  const discountData = useMemo(() => {
    if (txns.length === 0) return { totalDiscount: 0, avgDiscount: 0, discountOrders: 0, discountPercent: 0, maxDiscount: 0, discountRevenue: 0 }
    let totalDiscount = 0
    let discountOrders = 0
    let maxDiscount = 0
    let discountRevenue = 0
    txns.forEach((t) => {
      const d = t.discount || 0
      totalDiscount += d
      if (d > 0) { discountOrders++; discountRevenue += t.total || 0 }
      if (d > maxDiscount) maxDiscount = d
    })
    return {
      totalDiscount,
      avgDiscount: discountOrders > 0 ? totalDiscount / discountOrders : 0,
      discountOrders,
      discountPercent: stats.revenue > 0 ? (totalDiscount / (stats.revenue + totalDiscount)) * 100 : 0,
      maxDiscount,
      discountRevenue
    }
  }, [txns, stats.revenue])

  const costBreakdownData = useMemo(() => {
    const data = []
    if (inventoryStats.purchaseCost > 0) data.push({ name: 'Purchases', value: inventoryStats.purchaseCost })
    if (inventoryStats.usageCost > 0) data.push({ name: 'Usage', value: inventoryStats.usageCost })
    if (inventoryStats.wastageCost > 0) data.push({ name: 'Wastage', value: inventoryStats.wastageCost })
    return data
  }, [inventoryStats])

  const salesTrend = useMemo(() => {
    const dayMap = {}
    txns.forEach((t) => {
      if (!t.createdAt) return
      const d = new Date(t.createdAt)
      if (isNaN(d.getTime())) return
      const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      if (!dayMap[key]) dayMap[key] = { date: key, revenue: 0, orders: 0 }
      dayMap[key].revenue += t.total || 0
      dayMap[key].orders += 1
    })
    return Object.values(dayMap).reverse()
  }, [txns])

  const paymentData = useMemo(() => {
    const map = {}
    txns.forEach((t) => { const p = t.payment || 'OTHER'; map[p] = (map[p] || 0) + (t.total || 0) })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [txns])

  const paymentCountData = useMemo(() => {
    const map = {}
    txns.forEach((t) => { const p = t.payment || 'OTHER'; map[p] = (map[p] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [txns])

  const topItems = useMemo(() => {
    const map = {}
    txns.forEach((t) => {
      (t.items || []).forEach((item) => {
        if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 }
        map[item.name].qty += item.qty || 0
        map[item.name].revenue += (item.price || 0) * (item.qty || 0)
      })
    })
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8)
  }, [txns])

  const peakHours = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, orders: 0, revenue: 0 }))
    txns.forEach((t) => {
      if (!t.createdAt) return
      const d = new Date(t.createdAt)
      if (isNaN(d.getTime())) return
      const h = d.getHours()
      hours[h].orders += 1
      hours[h].revenue += t.total || 0
    })
    return hours.filter((h) => h.orders > 0)
  }, [txns])

  const tableData = useMemo(() => {
    const map = {}
    txns.forEach((t) => {
      const tbl = t.table || ''
      if (!tbl || !/^table\s*\d+/i.test(tbl)) return
      if (!map[tbl]) map[tbl] = { name: tbl, orders: 0, revenue: 0 }
      map[tbl].orders += 1
      map[tbl].revenue += t.total || 0
    })
    return Object.values(map).sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, '')) || 0
      const numB = parseInt(b.name.replace(/\D/g, '')) || 0
      return numA - numB
    })
  }, [txns])

  const peakHourLabel = useMemo(() => {
    if (peakHours.length === 0) return '--'
    return [...peakHours].sort((a, b) => b.orders - a.orders)[0]?.hour || '--'
  }, [peakHours])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const hasData = txns.length > 0
  const discPercent = stats.revenue > 0 ? ((stats.discount / stats.revenue) * 100).toFixed(1) : '0.0'
  const topPayValue = paymentData.find((p) => p.name === stats.topPayment)?.value
  const topPaymentCount = paymentCountData.find((p) => p.name === stats.topPayment)?.value

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function downloadCSV() {
    if (txns.length === 0 && inventoryMovements.length === 0) return
    const wb = XLSX.utils.book_new()

    const headerStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 }, fill: { fgColor: { rgb: 'FF6B00' } }, alignment: { horizontal: 'center' } }
    const currencyFmt = '#,##0.00'
    const sectionStyle = { font: { bold: true, color: { rgb: 'FF6B00' }, sz: 12 } }
    const metricStyle = { font: { bold: true, sz: 11 } }
    const valueStyle = { font: { sz: 11 }, numFmt: '#,##0.00' }

    function styleHeaderRow(ws, colCount) {
      for (let c = 0; c < colCount; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c })
        if (ws[addr]) ws[addr].s = { ...headerStyle }
      }
    }

    // ── Sheet 1: Sales Transactions ──
    const txnHeaders = ['Date', 'Time', 'Table', 'Order Type', 'Items', 'Item Count', 'Subtotal', 'Discount', 'SGST', 'CGST', 'GST', 'Total', 'Payment']
    const txnData = [txnHeaders]
    txns.forEach((t) => {
      const d = t.createdAt ? new Date(t.createdAt) : new Date()
      const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      txnData.push([
        date, time, t.table || '-', /^table\s*\d+/i.test(t.table) ? 'Dine-in' : 'Parcel',
        (t.items || []).map((i) => `${i.name} x${i.qty}`).join('; '),
        (t.items || []).reduce((a, i) => a + (i.qty || 0), 0),
        t.subtotal || 0, t.discount || 0,
        (t.gst || 0) / 2, (t.gst || 0) / 2, t.gst || 0,
        t.total || 0, t.payment || '-'
      ])
    })
    if (txnData.length === 1) txnData.push(['No transactions in this period'])
    const wsTxn = XLSX.utils.aoa_to_sheet(txnData)
    wsTxn['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }]
    styleHeaderRow(wsTxn, txnHeaders.length)
    for (let r = 1; r < txnData.length; r++) {
      for (let c = 6; c <= 11; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (wsTxn[addr]) wsTxn[addr].s = { numFmt: currencyFmt }
      }
    }
    XLSX.utils.book_append_sheet(wb, wsTxn, 'Sales Transactions')

    // ── Sheet 2: Sales Summary ──
    const summaryData = [
      ['DaawatDesk Sales Summary', ''],
      [`Period: ${toLocalDateStr(start)} to ${toLocalDateStr(new Date(end.getTime() - 86400000))}`, ''],
      ['', ''],
      ['Metric', 'Value'],
      ['Total Orders', stats.orders],
      ['Total Items Sold', stats.totalItems],
      ['Total Revenue', stats.revenue],
      ['Total Discount', stats.discount],
      ['Total GST', stats.gst],
      ['SGST', stats.sgst],
      ['CGST', stats.cgst],
      ['Net Revenue (Revenue - GST)', stats.revenue - stats.gst],
      ['Average Order Value', stats.avgOrder],
      ['Top Payment Method', stats.topPayment],
      ['', ''],
      ['── Profitability ──', ''],
      ['COGS (Usage + Wastage)', profitData.cogs],
      ['Gross Profit', profitData.grossProfit],
      ['Gross Margin', `${profitData.grossMargin.toFixed(1)}%`],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [{ wch: 32 }, { wch: 20 }]
    if (wsSummary['A1']) wsSummary['A1'].s = { font: { bold: true, sz: 14, color: { rgb: 'FF6B00' } } }
    if (wsSummary['A2']) wsSummary['A2'].s = { font: { italic: true, sz: 10, color: { rgb: '666666' } } }
    for (let c = 0; c < 2; c++) {
      const addr = XLSX.utils.encode_cell({ r: 3, c })
      if (wsSummary[addr]) wsSummary[addr].s = { ...headerStyle }
    }
    for (let c = 0; c < 2; c++) {
      const addr = XLSX.utils.encode_cell({ r: 15, c })
      if (wsSummary[addr]) wsSummary[addr].s = { ...sectionStyle }
    }
    for (let r = 4; r < 14; r++) {
      const addrA = XLSX.utils.encode_cell({ r, c: 0 })
      const addrB = XLSX.utils.encode_cell({ r, c: 1 })
      if (wsSummary[addrA]) wsSummary[addrA].s = { ...metricStyle }
      if (wsSummary[addrB] && typeof wsSummary[addrB].v === 'number') wsSummary[addrB].s = { ...valueStyle }
    }
    for (let r = 16; r < 19; r++) {
      const addrA = XLSX.utils.encode_cell({ r, c: 0 })
      const addrB = XLSX.utils.encode_cell({ r, c: 1 })
      if (wsSummary[addrA]) wsSummary[addrA].s = { ...metricStyle }
      if (wsSummary[addrB] && typeof wsSummary[addrB].v === 'number') wsSummary[addrB].s = { ...valueStyle }
    }
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Sales Summary')

    // ── Sheet 3: Inventory ──
    const invHeaders = ['Date', 'Time', 'Item', 'Category', 'Type', 'Quantity', 'Unit', 'Cost/Unit', 'Total Cost', 'Reason']
    const invData = [invHeaders]
    inventoryMovements.forEach((m) => {
      const d = m.createdAt ? new Date(m.createdAt) : new Date()
      const date = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      const cost = m.cost || inventoryCostMap[m.itemName?.toLowerCase()] || 0
      invData.push([
        date, time, m.itemName || '-', m.category || '-', m.type || '-',
        m.quantity || 0, m.unit || '-', cost, cost * (m.quantity || 0), m.reason || '-'
      ])
    })
    if (invData.length === 1) invData.push(['No stock movements in this period'])

    const invGap = invData.length
    invData.push(['', ''])
    invData.push(['── Inventory Summary ──', ''])
    invData.push(['Purchase Spend', inventoryStats.purchaseCost])
    invData.push(['Purchase Quantity', inventoryStats.purchaseQty])
    invData.push(['Usage Cost', inventoryStats.usageCost])
    invData.push(['Usage Quantity', inventoryStats.usageQty])
    invData.push(['Wastage Cost', inventoryStats.wastageCost])
    invData.push(['Wastage Quantity', inventoryStats.wastageQty])
    invData.push(['Net Profit', inventoryStats.netProfit])

    const wsInv = XLSX.utils.aoa_to_sheet(invData)
    wsInv['!cols'] = [{ wch: 14 }, { wch: 8 }, { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 25 }]
    styleHeaderRow(wsInv, invHeaders.length)
    for (let r = 1; r < invGap; r++) {
      for (let c = 7; c <= 8; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        if (wsInv[addr]) wsInv[addr].s = { numFmt: currencyFmt }
      }
    }
    const summaryStartRow = invGap + 1
    for (let c = 0; c < 2; c++) {
      const addr = XLSX.utils.encode_cell({ r: summaryStartRow, c })
      if (wsInv[addr]) wsInv[addr].s = { ...sectionStyle }
    }
    for (let r = summaryStartRow + 1; r < invData.length; r++) {
      const addrA = XLSX.utils.encode_cell({ r, c: 0 })
      const addrB = XLSX.utils.encode_cell({ r, c: 1 })
      if (wsInv[addrA]) wsInv[addrA].s = { ...metricStyle }
      if (wsInv[addrB] && typeof wsInv[addrB].v === 'number') wsInv[addrB].s = { ...valueStyle }
    }
    XLSX.utils.book_append_sheet(wb, wsInv, 'Inventory')

    // ── Download ──
    const fileName = `daawatdesk-report-${toLocalDateStr(start)}-to-${toLocalDateStr(new Date(end.getTime() - 86400000))}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-all duration-200 active:scale-90 group">
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
              <span className="text-sm font-medium hidden sm:inline group-hover:font-bold min-w-[5rem] text-center">Dashboard</span>
            </button>
            <div className="h-5 w-px bg-gray-200"></div>
              <img src="/logo-app.png" alt="DaawatDesk" className="w-7 h-7 rounded-lg flex-shrink-0 object-contain" />
            <h1 className="text-lg font-bold text-secondary hidden sm:inline"><span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span> <span className="text-gray-400 font-medium">Reports & Analytics</span></h1>
          </div>
          <div className="flex items-center gap-2">
            {(txns.length > 0 || inventoryMovements.length > 0) && (
              <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors bg-white">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
            <div className="relative">
              <button onClick={() => setShowRangeDrop(!showRangeDrop)} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors bg-white">
                <Calendar className="w-4 h-4 text-gray-400" />
                {RANGE_OPTIONS.find((r) => r.id === range)?.label}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showRangeDrop ? 'rotate-180' : ''}`} />
              </button>
            {showRangeDrop && (
              <>
                <div className="fixed inset-0 z-[80]" onClick={() => setShowRangeDrop(false)} />
                <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-[85] w-48 animate-fade-up">
                  {RANGE_OPTIONS.map((r) => (
                    <button key={r.id} onClick={() => { setRange(r.id); setShowRangeDrop(false) }} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${range === r.id ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <span className="flex-1 text-left">{r.label}</span>
                      {range === r.id && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {range === 'custom' && (
          <div className="mb-4 bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-gray-400">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">Date Range</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: 'Yesterday', days: 1 },
                  { label: 'Last 7 days', days: 7 },
                  { label: 'Last 30 days', days: 30 },
                ].map((p) => (
                  <button key={p.label} onClick={() => { const d = new Date(); setCustomTo(toLocalDateStr(d)); const s = new Date(d.getTime() - p.days * 86400000); setCustomFrom(toLocalDateStr(s)); setRange('custom') }} className="px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-lg text-xs font-semibold text-gray-600 transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <div className="relative">
                <button onClick={() => { setCalOpen(calOpen === 'from' ? null : 'from'); setCalMonth(customFrom ? new Date(customFrom) : new Date()) }} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:border-primary/30 transition-colors">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className={customFrom ? 'text-secondary font-medium' : 'text-gray-400'}>{customFrom ? new Date(customFrom + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'From date'}</span>
                  {customFrom && <button onClick={(e) => { e.stopPropagation(); setCustomFrom(''); setCalOpen(null) }} className="p-0.5 hover:bg-gray-100 rounded"><X className="w-3 h-3 text-gray-400" /></button>}
                </button>
                {calOpen === 'from' && (
                  <>
                    <div className="fixed inset-0 z-[95]" onClick={() => setCalOpen(null)} />
                    <CalendarDropdown date={customFrom} onSelect={(d) => { setCustomFrom(d); setCalOpen(null) }} calMonth={calMonth} setCalMonth={setCalMonth} maxDate={customTo || toLocalDateStr(new Date())} />
                  </>
                )}
              </div>
              <span className="text-gray-300 hidden sm:block">→</span>
              <div className="relative">
                <button onClick={() => { setCalOpen(calOpen === 'to' ? null : 'to'); setCalMonth(customTo ? new Date(customTo) : new Date()) }} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:border-primary/30 transition-colors">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className={customTo ? 'text-secondary font-medium' : 'text-gray-400'}>{customTo ? new Date(customTo + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'To date'}</span>
                  {customTo && <button onClick={(e) => { e.stopPropagation(); setCustomTo(''); setCalOpen(null) }} className="p-0.5 hover:bg-gray-100 rounded"><X className="w-3 h-3 text-gray-400" /></button>}
                </button>
                {calOpen === 'to' && (
                  <>
                    <div className="fixed inset-0 z-[95]" onClick={() => setCalOpen(null)} />
                    <CalendarDropdown date={customTo} onSelect={(d) => { setCustomTo(d); setCalOpen(null) }} calMonth={calMonth} setCalMonth={setCalMonth} minDate={customFrom} />
                  </>
                )}
              </div>
              {customFrom && customTo && (
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                  {Math.ceil((new Date(customTo) - new Date(customFrom)) / 86400000) + 1} days
                </span>
              )}
            </div>
          </div>
        )}

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-gray-200/50 rounded-3xl flex items-center justify-center mb-6 animate-fade-up">
              <BarChart3 className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-secondary mb-2">No Data Yet</h2>
            <p className="text-gray-400 text-sm text-center max-w-sm">No transactions found for this period. Start billing to see analytics here.</p>
            <button onClick={() => navigate('/billing')} className="mt-6 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">Go to Billing</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards — Row 1: Core Metrics */}
            <ScrollReveal animation="reveal" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: fmt(stats.revenue), icon: DollarSign, bg: 'bg-green/10', ic: 'text-green', sub: <>{stats.orders} orders<DiffBadge current={stats.revenue} previous={prevStats.revenue} /></>, target: 'section-sales' },
                { label: 'Avg Order', value: fmt(stats.avgOrder), icon: ShoppingCart, bg: 'bg-blue/10', ic: 'text-blue', sub: <>{stats.totalItems} items sold<DiffBadge current={stats.avgOrder} previous={prevStats.avgOrder} /></>, target: 'section-sales' },
                { label: 'Discount', value: fmt(stats.discount), icon: ArrowDownRight, bg: 'bg-orange/10', ic: 'text-orange', sub: <>{discPercent}% of revenue<DiffBadge current={stats.discount} previous={prevStats.discount} /></>, target: 'section-sales' },
                { label: 'Top Payment', value: stats.topPayment, icon: CreditCard, bg: 'bg-purple/10', ic: 'text-purple', sub: <>{topPaymentCount || 0} orders{topPayValue ? ` · ${fmt(topPayValue)}` : ''}</>, target: 'section-payment' },
              ].map((card, i) => (
                <div key={i} onClick={() => scrollTo(card.target)} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                      <card.icon className={`w-4 h-4 ${card.ic}`} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</span>
                  </div>
                  <p className="text-2xl font-extrabold text-secondary">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center flex-wrap">{card.sub}</p>
                </div>
              ))}
            </ScrollReveal>

            {/* Summary Cards — Row 2: Profit & GST */}
            <ScrollReveal animation="reveal" delay={80} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'COGS', value: fmtDec(profitData.cogs), icon: Package, bg: 'bg-amber/10', ic: 'text-amber', sub: `Usage ${fmtDec(inventoryStats.usageCost)} + Wastage ${fmtDec(inventoryStats.wastageCost)}`, target: 'section-inventory' },
                { label: 'Gross Profit', value: fmtDec(profitData.grossProfit), icon: TrendingUp, bg: profitData.grossProfit >= 0 ? 'bg-green/10' : 'bg-red-100', ic: profitData.grossProfit >= 0 ? 'text-green' : 'text-red-500', sub: profitData.cogsPercent > 0 ? `${profitData.grossMargin.toFixed(1)}% margin` : 'Record inventory usage', target: 'section-inventory' },
                { label: 'Dine-in vs Parcel', value: `${orderTypeData[0]?.count || 0} / ${orderTypeData[1]?.count || 0}`, icon: Utensils, bg: 'bg-green/10', ic: 'text-green', sub: orderTypeData[0]?.revenue || orderTypeData[1]?.revenue ? `₹${(orderTypeData[0]?.revenue || 0).toFixed(0)} vs ₹${(orderTypeData[1]?.revenue || 0).toFixed(0)}` : 'No data' },
                { label: 'GST Collected', value: fmtDec(stats.gst), icon: Receipt, bg: 'bg-blue/10', ic: 'text-blue', sub: `SGST: ${fmtDec(stats.sgst)} + CGST: ${fmtDec(stats.cgst)}`, target: 'section-payment' },
              ].map((card, i) => (
                <div key={i} onClick={() => scrollTo(card.target)} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                      <card.icon className={`w-4 h-4 ${card.ic}`} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</span>
                  </div>
                  <p className="text-2xl font-extrabold text-secondary">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </ScrollReveal>

            {/* Summary Cards — Row 3: Operations */}
            <ScrollReveal animation="reveal" delay={160} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Peak Hour', value: peakHourLabel, icon: Clock, bg: 'bg-orange/10', ic: 'text-orange', sub: peakHours.length > 0 ? `${[...peakHours].sort((a, b) => b.orders - a.orders)[0]?.orders || 0} orders at peak` : 'No data' },
                { label: 'Top Item', value: topItems[0]?.name || '--', icon: ChefHat, bg: 'bg-pink-50', ic: 'text-pink-500', sub: topItems[0] ? `${topItems[0].qty} sold · ${fmt(topItems[0].revenue)}` : 'No item data' },
                { label: 'Orders/Day', value: salesTrend.length > 0 ? Math.round(stats.orders / salesTrend.length) : '0', icon: ShoppingCart, bg: 'bg-blue/10', ic: 'text-blue', sub: `${salesTrend.length} active days` },
                { label: 'Discount %', value: `${discPercent}%`, icon: ArrowDownRight, bg: 'bg-orange/10', ic: 'text-orange', sub: `${discountData.discountOrders} discounted orders out of ${stats.orders}` },
              ].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                      <card.icon className={`w-4 h-4 ${card.ic}`} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{card.label}</span>
                  </div>
                  <p className="text-2xl font-extrabold text-secondary">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </ScrollReveal>

            {/* Sales Trend */}
            {salesTrend.length > 0 && (
              <ScrollReveal animation="reveal-left">
              <div id="section-sales" className="bg-white rounded-2xl p-5 border border-gray-100 scroll-mt-20 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-secondary">Sales Trend</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{salesTrend.length} days with orders</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-primary rounded-full inline-block"></span> Revenue</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue rounded-full inline-block"></span> Orders</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(value, name) => [name === 'revenue' ? fmt(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']} />
                    <Area type="monotone" dataKey="revenue" stroke="#FF6B00" strokeWidth={2.5} fillOpacity={1} fill="url(#gRev)" animationDuration={1200} animationEasing="ease-out" />
                    <Area type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#gOrd)" animationDuration={1200} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              </ScrollReveal>
            )}

            {/* Payment + Order Type */}
            <ScrollReveal animation="reveal-right">
            <div id="section-payment" className="grid grid-cols-1 lg:grid-cols-2 gap-6 scroll-mt-20 overflow-hidden">
              {paymentData.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100">
                  <h3 className="text-sm font-bold text-secondary mb-4">Payment Methods</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie activeIndex={activePayment} activeShape={ActiveShape} data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" onMouseEnter={(_, i) => setActivePayment(i)} onMouseLeave={() => setActivePayment(null)} animationDuration={1000} animationEasing="ease-out">
                        {paymentData.map((entry, i) => (
                          <Cell key={i} fill={PAYMENT_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {paymentData.map((p, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: PAYMENT_COLORS[p.name] || COLORS[i % COLORS.length] }}></span>
                        {p.name} ({fmt(p.value)})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h3 className="text-sm font-bold text-secondary mb-4">Order Type Split</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie activeIndex={activeOrderType} activeShape={ActiveShape} data={orderTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="revenue" nameKey="name" onMouseEnter={(_, i) => setActiveOrderType(i)} onMouseLeave={() => setActiveOrderType(null)} animationDuration={1000} animationEasing="ease-out">
                      {orderTypeData.map((entry, i) => (
                        <Cell key={i} fill={ORDER_TYPE_COLORS[entry.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {orderTypeData.map((d, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ORDER_TYPE_COLORS[d.name] || COLORS[i] }}></span>
                      {d.name} — {d.count} orders · {fmt(d.revenue)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            </ScrollReveal>
            {topItems.length > 0 && (
              <ScrollReveal animation="reveal-left">
              <div id="section-topitems" className="bg-white rounded-2xl p-5 border border-gray-100 scroll-mt-20 overflow-hidden">
                <h3 className="text-sm font-bold text-secondary mb-1">Top Selling Items</h3>
                <p className="text-xs text-gray-400 mb-4">By quantity sold</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(value, name) => [name === 'qty' ? `${value} sold` : fmt(value), name === 'qty' ? 'Quantity' : 'Revenue']} />
                    <Bar dataKey="qty" fill="#FF6B00" radius={[0, 6, 6, 0]} animationDuration={1000} animationEasing="ease-out" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              </ScrollReveal>
            )}

            {/* Peak Hours */}
            {peakHours.length > 0 && (
              <ScrollReveal animation="reveal-right">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-secondary">Peak Hours</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Order distribution by time of day</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange/10 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-orange" />
                    <span className="text-xs font-bold text-orange">Busiest: {peakHourLabel}</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={peakHours} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(value, name) => [`${value} orders`, 'Orders']} />
                    <Bar dataKey="orders" fill="#FF6B00" radius={[4, 4, 0, 0]} animationDuration={1000} animationEasing="ease-out" barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              </ScrollReveal>
            )}

            {/* Inventory & Profitability */}
            <ScrollReveal animation="reveal-scale">
            <div id="section-inventory" className="bg-white rounded-2xl p-5 border border-gray-100 scroll-mt-20 overflow-hidden">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 bg-amber/10 rounded-xl flex items-center justify-center">
                  <Package className="w-4 h-4 text-amber" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-secondary">Inventory & Profitability</h3>
                  <p className="text-xs text-gray-400">Cost analysis from stock movements</p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Purchase Spend', value: fmtDec(inventoryStats.purchaseCost), sub: `${inventoryStats.purchaseQty} units bought`, icon: ShoppingCart, bg: 'bg-blue/10', ic: 'text-blue' },
                  { label: 'Usage Cost', value: fmtDec(inventoryStats.usageCost), sub: `${inventoryStats.usageQty} units consumed`, icon: ChefHat, bg: 'bg-orange/10', ic: 'text-orange' },
                  { label: 'Wastage Loss', value: fmtDec(inventoryStats.wastageCost), sub: `${inventoryStats.wastageQty} units wasted`, icon: Trash2, bg: 'bg-red-100', ic: 'text-red-500' },
                  { label: 'Net Profit', value: fmtDec(inventoryStats.netProfit), sub: inventoryStats.netProfit >= 0 ? 'Revenue - GST - COGS' : 'Loss exceeds revenue', icon: TrendingUp, bg: inventoryStats.netProfit >= 0 ? 'bg-green/10' : 'bg-red-100', ic: inventoryStats.netProfit >= 0 ? 'text-green' : 'text-red-500' },
                ].map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3.5">
                    <div className={`w-7 h-7 ${c.bg} rounded-lg flex items-center justify-center mb-2`}>
                      <c.icon className={`w-3.5 h-3.5 ${c.ic}`} />
                    </div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{c.label}</p>
                    <p className="text-lg font-extrabold text-secondary mt-0.5">{c.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Chart + Category Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Cost Breakdown Pie */}
                {costBreakdownData.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Cost Breakdown</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={costBreakdownData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" animationDuration={1000} animationEasing="ease-out" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {costBreakdownData.map((entry, i) => (
                            <Cell key={i} fill={entry.name === 'Usage' ? '#FF6B00' : entry.name === 'Purchases' ? '#3B82F6' : '#EF4444'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(v) => fmtDec(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-1">
                      {costBreakdownData.map((d, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.name === 'Usage' ? '#FF6B00' : d.name === 'Purchases' ? '#3B82F6' : '#EF4444' }}></span>
                          {d.name} ({fmtDec(d.value)})
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Package className="w-8 h-8 text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400">No stock movements in this period</p>
                    <p className="text-[10px] text-gray-300 mt-1">Record purchases & usage in Inventory</p>
                  </div>
                )}

                {/* Category Table */}
                {inventoryStats.categoryData.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Category-wise Cost</h4>
                    <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-white">
                          <tr className="border-b border-gray-100">
                            <th className="text-left px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Category</th>
                            <th className="text-right px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Purchase</th>
                            <th className="text-right px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Usage</th>
                            <th className="text-right px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Wastage</th>
                            <th className="text-right px-3 py-2 text-[10px] font-bold text-gray-400 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryStats.categoryData.map((c, i) => {
                            const catTotal = c.purchase + c.wastage + c.usage
                            return (
                              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2.5 text-xs font-semibold text-secondary capitalize">{c.category}</td>
                                <td className="px-3 py-2.5 text-right text-xs text-blue font-medium">{c.purchase > 0 ? fmtDec(c.purchase) : '--'}</td>
                                <td className="px-3 py-2.5 text-right text-xs text-purple font-medium">{c.usage > 0 ? fmtDec(c.usage) : '--'}</td>
                                <td className="px-3 py-2.5 text-right text-xs text-red-500 font-medium">{c.wastage > 0 ? fmtDec(c.wastage) : '--'}</td>
                                <td className="px-3 py-2.5 text-right text-xs font-bold text-secondary">{fmtDec(catTotal)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <BarChart3 className="w-8 h-8 text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400">No category data available</p>
                  </div>
                )}
              </div>
            </div>
            </ScrollReveal>

            {/* Table Performance */}
            {tableData.length > 0 && (
              <ScrollReveal animation="reveal">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <h3 className="text-sm font-bold text-secondary">Table Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">Table</th>
                        <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">Orders</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">Revenue</th>
                        <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">Avg/Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((t, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-secondary">{t.name}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{t.orders}</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-secondary">{fmt(t.revenue)}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-500">{t.orders > 0 ? fmt(t.revenue / t.orders) : '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </ScrollReveal>
            )}
          </div>
        )}
      </div>
    </div>
  )
}