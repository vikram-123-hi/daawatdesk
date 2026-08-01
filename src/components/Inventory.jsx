import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInventory, DEFAULT_CATEGORIES, UNITS, SHELF_LIFE_DAYS } from '../context/InventoryContext'
import {
  ArrowLeft, Plus, Search, Package, AlertTriangle, TrendingDown,
  TrendingUp, Edit3, Trash2, X, Save, Filter, Clock, RotateCcw,
  ShoppingCart, Trash, ChevronDown, DollarSign, Timer, AlertCircle,
  ScanBarcode
} from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'
import { ScrollReveal } from './ScrollReveal'

function fixStock(n) {
  return Number(Number(n || 0).toFixed(2))
}

export default function Inventory() {
  const navigate = useNavigate()
  const { items, movements, categories, loading, addItem, updateItem, deleteItem, adjustStock, lowStockItems, totalValue, seedDummyItems, canWrite, expiringItems, expiredItems, expiringToday, expiringSoon } = useInventory()

  const [tab, setTab] = useState('items')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [showCatDrop, setShowCatDrop] = useState(false)
  const [showLowStock, setShowLowStock] = useState(false)
  const [showExpiryFilter, setShowExpiryFilter] = useState(false)
  const [expiryFilterType, setExpiryFilterType] = useState('all')
  const [showModalCatDrop, setShowModalCatDrop] = useState(false)
  const [showModalUnitDrop, setShowModalUnitDrop] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustItem, setAdjustItem] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deletedItem, setDeletedItem] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const revertTimerRef = useRef(null)

  const [form, setForm] = useState({ name: '', sku: '', barcode: '', category: 'other', unit: 'pcs', costPrice: '', currentStock: '', minStock: '', supplier: '', notes: '', expiryDate: '' })
  const [adjustForm, setAdjustForm] = useState({ type: 'add', quantity: '', reason: '', expiryDate: '' })
  const seededRef = useRef(false)

  const getCatName = (id) => categories.find((c) => c.id === id)?.name || 'Other'
  const getCatColor = (id) => categories.find((c) => c.id === id)?.color || 'gray'

  const getExpiryStatus = (item) => {
    if (!item.expiryDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const exp = new Date(item.expiryDate)
    exp.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / 86400000)
    if (diffDays < 0) return { label: 'Expired', color: 'bg-red-500 text-white', days: diffDays }
    if (diffDays === 0) return { label: 'Expires today', color: 'bg-red-500 text-white', days: 0 }
    if (diffDays <= 3) return { label: `${diffDays}d left`, color: 'bg-orange text-white', days: diffDays }
    return null
  }

  useEffect(() => {
    if (!loading && items.length === 0 && !seededRef.current) {
      seededRef.current = true
      seedDummyItems()
    }
  }, [loading, items.length])

  const filteredItems = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || (i.sku || '').toLowerCase().includes(search.toLowerCase()) || (i.barcode || '').includes(search)
    const matchCat = filterCat === 'all' || i.category === filterCat
    const matchLow = !showLowStock || (i.minStock > 0 && i.currentStock <= i.minStock)
    let matchExpiry = true
    if (showExpiryFilter && expiryFilterType !== 'all') {
      const status = getExpiryStatus(i)
      if (expiryFilterType === 'expired') matchExpiry = status && status.days < 0
      else if (expiryFilterType === 'today') matchExpiry = status && status.days === 0
      else if (expiryFilterType === 'soon') matchExpiry = status && status.days > 0
      else if (expiryFilterType === 'safe') matchExpiry = !status
    }
    return matchSearch && matchCat && matchLow && matchExpiry
  })

  const openAdd = () => { setForm({ name: '', sku: '', barcode: '', category: 'other', unit: 'pcs', costPrice: '', currentStock: '', minStock: '', supplier: '', notes: '', expiryDate: '' }); setEditingItem(null); setShowAddModal(true) }
  const openEdit = (item) => { setForm({ name: item.name, sku: item.sku || '', barcode: item.barcode || '', category: item.category || 'other', unit: item.unit || 'pcs', costPrice: item.costPrice || '', currentStock: item.currentStock || '', minStock: item.minStock || '', supplier: item.supplier || '', notes: item.notes || '', expiryDate: item.expiryDate || '' }); setEditingItem(item); setShowAddModal(true) }
  const openAdjust = (item) => {
    const shelfLife = SHELF_LIFE_DAYS[item.category] || 30
    const defaultExpiry = new Date()
    defaultExpiry.setDate(defaultExpiry.getDate() + shelfLife)
    const expiryStr = defaultExpiry.toISOString().slice(0, 10)
    setAdjustItem(item)
    setAdjustForm({ type: 'add', quantity: '', reason: '', expiryDate: item.expiryDate || expiryStr })
    setShowAdjustModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    if (editingItem) {
      await updateItem(editingItem.id, { ...form, costPrice: Number(form.costPrice) || 0, currentStock: Number(form.currentStock) || 0, minStock: Number(form.minStock) || 0, expiryDate: form.expiryDate || '' })
    } else {
      await addItem({ ...form, expiryDate: form.expiryDate || '' })
    }
    setShowAddModal(false)
    setEditingItem(null)
  }

  const handleAdjust = async () => {
    if (!adjustItem || !adjustForm.quantity || Number(adjustForm.quantity) <= 0) return
    await adjustStock(adjustItem.id, adjustForm.type, Number(adjustForm.quantity), adjustForm.reason, adjustForm.expiryDate || '')
    setShowAdjustModal(false)
    setAdjustItem(null)
  }

  const handleDelete = async (item) => {
    await deleteItem(item.id)
    setDeleteConfirm(null)
    setDeletedItem(item)
    if (revertTimerRef.current) clearTimeout(revertTimerRef.current)
    revertTimerRef.current = setTimeout(() => setDeletedItem(null), 10000)
  }

  const handleRevert = async () => {
    if (!deletedItem) return
    await addItem({ name: deletedItem.name, sku: deletedItem.sku, category: deletedItem.category, unit: deletedItem.unit, costPrice: deletedItem.costPrice, currentStock: deletedItem.currentStock, minStock: deletedItem.minStock, supplier: deletedItem.supplier, notes: deletedItem.notes })
    setDeletedItem(null)
    if (revertTimerRef.current) clearTimeout(revertTimerRef.current)
  }

  const catColorMap = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue/10 text-blue',
    gray: 'bg-gray-100 text-gray-600',
    teal: 'bg-teal-100 text-teal-700',
    purple: 'bg-purple-100 text-purple-700',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
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
            <h1 className="text-lg font-bold text-secondary hidden sm:inline"><span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span> <span className="text-gray-400 font-medium">Inventory Management</span></h1>
          </div>
          {canWrite && (
            <div className="flex gap-2">
              <button onClick={() => setShowScanner(true)} className="flex items-center gap-1.5 bg-orange/10 text-orange px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange/20 transition-colors">
                <ScanBarcode className="w-4 h-4" /> <span className="hidden sm:inline">Scan</span>
              </button>
              <button onClick={openAdd} className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* Summary Cards */}
        <ScrollReveal animation="reveal" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"><Package className="w-4 h-4 text-primary" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-secondary">{items.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-500" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{lowStockItems.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><AlertCircle className="w-4 h-4 text-red-500" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Expired</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{expiredItems.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange/10 rounded-lg flex items-center justify-center"><Timer className="w-4 h-4 text-orange" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Expiring</span>
            </div>
            <p className="text-2xl font-bold text-orange">{expiringItems.length - expiredItems.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green/10 rounded-lg flex items-center justify-center"><DollarSign className="w-4 h-4 text-green" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Stock Value</span>
            </div>
            <p className="text-2xl font-bold text-secondary">₹{totalValue.toLocaleString('en-IN')}</p>
          </div>
        </ScrollReveal>

        {/* Low Stock Alert Banner */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">{lowStockItems.length} items below minimum stock level</p>
              <p className="text-xs text-red-500 mt-0.5">{lowStockItems.map((i) => i.name).join(', ')}</p>
            </div>
            <button onClick={() => { setTab('items'); setFilterCat('all'); setSearch(''); setShowLowStock(true) }} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-200 transition-colors">View</button>
          </div>
        )}

        {/* Expiry Alert Banner */}
        {expiringItems.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
            <Timer className="w-5 h-5 text-orange flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange">{expiredItems.length > 0 ? `${expiredItems.length} expired! ` : ''}{expiringItems.length - expiredItems.length} item{expiringItems.length !== 1 ? 's' : ''} expiring soon</p>
              <p className="text-xs text-orange/70 mt-0.5">{expiringItems.map((i) => `${i.name} (${i.daysLeft < 0 ? 'expired' : i.daysLeft === 0 ? 'today' : i.daysLeft + 'd'})`).join(', ')}</p>
            </div>
          </div>
        )}

        {/* Expiry Filter Chips */}
        {expiringItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { id: 'all', label: `All (${items.length})`, color: 'border-gray-200 text-gray-500 bg-white' },
              { id: 'expired', label: `Expired (${expiredItems.length})`, color: 'border-red-200 text-red-600 bg-red-50' },
              { id: 'today', label: `Today (${expiringToday.length})`, color: 'border-red-200 text-red-500 bg-red-50' },
              { id: 'soon', label: `≤3 Days (${expiringSoon.length})`, color: 'border-orange-200 text-orange bg-orange/5' },
              { id: 'safe', label: `Safe (${items.length - expiringItems.length})`, color: 'border-green-200 text-green bg-green/5' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  if (f.id === 'all') { setShowExpiryFilter(false); setExpiryFilterType('all') }
                  else { setShowExpiryFilter(true); setExpiryFilterType(f.id); setShowLowStock(false) }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  (f.id === 'all' && !showExpiryFilter) || (showExpiryFilter && expiryFilterType === f.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : f.color
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-gray-100 w-fit overflow-x-auto">
          {[
            { id: 'items', label: 'Items', icon: Package, count: items.length },
            { id: 'movements', label: 'Stock History', icon: Clock, count: movements.length },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.id ? 'bg-white/20' : 'bg-gray-100'}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Items Tab */}
        {tab === 'items' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search items..." value={search} onChange={(e) => { setSearch(e.target.value); setShowLowStock(false) }} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="relative">
                <button onClick={() => setShowCatDrop(!showCatDrop)} className={`flex items-center gap-2 px-3 py-2 border rounded-xl text-sm font-medium transition-colors ${filterCat !== 'all' ? 'border-primary/30 bg-primary/5 text-primary' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  <Filter className="w-4 h-4" />
                  {filterCat === 'all' ? 'All Categories' : getCatName(filterCat)}
                  {filterCat !== 'all' && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">{items.filter((i) => i.category === filterCat).length}</span>}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCatDrop ? 'rotate-180' : ''}`} />
                </button>
                {showCatDrop && (
                  <>
                    <div className="fixed inset-0 z-[80]" onClick={() => setShowCatDrop(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-[85] w-64 animate-fade-up">
                      <button onClick={() => { setFilterCat('all'); setShowCatDrop(false); setShowLowStock(false) }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${filterCat === 'all' ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"><Package className="w-3.5 h-3.5 text-primary" /></div>
                        <span className="flex-1 text-left">All Categories</span>
                        <span className="text-[10px] text-gray-400 font-bold">{items.length}</span>
                        {filterCat === 'all' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      {categories.map((c) => {
                        const count = items.filter((i) => i.category === c.id).length
                        const isSelected = filterCat === c.id
                        return (
                          <button key={c.id} onClick={() => { setFilterCat(c.id); setShowCatDrop(false); setShowLowStock(false) }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isSelected ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${catColorMap[c.color]?.split(' ')[0] || 'bg-gray-100'}`}>
                              <span className="text-[10px]">{count}</span>
                            </div>
                            <span className="flex-1 text-left truncate">{c.name}</span>
                            {isSelected && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {showLowStock && (
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange/10 text-orange rounded-lg text-xs font-semibold border border-orange/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Showing Low Stock Items ({filteredItems.length})
                  <button onClick={() => setShowLowStock(false)} className="ml-1 p-0.5 hover:bg-orange/20 rounded-full transition-colors"><X className="w-3 h-3" /></button>
                </span>
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">{items.length === 0 ? 'No items yet. Add your first inventory item.' : 'No items match your search.'}</p>
                {items.length === 0 && (
                  <button onClick={openAdd} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Add First Item</button>
                )}
              </div>
            ) : (
              <ScrollReveal animation="reveal" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredItems.map((item) => {
                  const isLow = item.minStock > 0 && item.currentStock <= item.minStock
                  const isOut = item.currentStock <= 0
                  const stockPercent = item.minStock > 0 ? Math.min(100, (item.currentStock / (item.minStock * 3)) * 100) : 100
                  return (
                    <div key={item.id} onClick={() => canWrite && openAdjust(item)} className={`bg-white rounded-2xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 group relative overflow-hidden ${canWrite ? 'cursor-pointer' : ''} ${isOut ? 'border-red-200 bg-red-50/30' : isLow ? 'border-orange-200 bg-orange-50/20' : 'border-gray-100 hover:border-primary/30'}`}>
                      {isOut && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-xl uppercase">Out</div>}
                      {isLow && !isOut && <div className="absolute top-0 right-0 bg-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-xl uppercase">Low</div>}
                      {(() => { const exp = getExpiryStatus(item); return exp ? <div className={`absolute top-0 left-0 ${exp.color} text-[9px] font-bold px-2 py-0.5 rounded-br-xl uppercase flex items-center gap-1`}><Timer className="w-2.5 h-2.5" />{exp.label}</div> : null })()}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-secondary truncate">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${catColorMap[getCatColor(item.category)] || 'bg-gray-100 text-gray-600'}`}>{getCatName(item.category)}</span>
                              {item.sku && <span className="text-[9px] text-gray-400 font-mono">#{item.sku}</span>}
                            </div>
                          </div>
                          {canWrite && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue/10 text-blue transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => setDeleteConfirm(item)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 mb-3">
                          <div className="flex items-end justify-between mb-2">
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Current Stock</p>
                              <p className={`text-xl font-extrabold leading-tight ${isOut ? 'text-red-500' : isLow ? 'text-orange' : 'text-secondary'}`}>
                                {fixStock(item.currentStock)} <span className="text-xs font-bold text-gray-400">{item.unit}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Cost</p>
                              <p className="text-sm font-bold text-gray-500">₹{item.costPrice}<span className="text-[9px] font-normal text-gray-400">/{item.unit}</span></p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${isOut ? 'bg-red-400' : isLow ? 'bg-orange' : 'bg-green'}`} style={{ width: `${Math.max(2, stockPercent)}%` }}></div>
                          </div>
                          {item.minStock > 0 && (
                            <p className="text-[9px] text-gray-400 mt-1">Min: {item.minStock} {item.unit}</p>
                          )}
                        </div>

                        {item.supplier && (
                          <p className="text-[10px] text-gray-400 truncate">📦 {item.supplier}</p>
                        )}
                        {item.expiryDate && (
                          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Timer className="w-3 h-3" /> Exp: {new Date(item.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </ScrollReveal>
            )}
          </>
        )}

        {/* Movements Tab */}
        {tab === 'movements' && (
          <>
            {movements.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No stock movements recorded yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Time</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Item</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Type</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Qty</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Stock Change</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.slice(0, 100).map((m) => {
                        const typeStyles = {
                          add: { icon: TrendingUp, color: 'text-green', bg: 'bg-green-100', label: 'Purchase' },
                          purchase: { icon: ShoppingCart, color: 'text-blue', bg: 'bg-blue/10', label: 'Purchase' },
                          reduce: { icon: TrendingDown, color: 'text-orange', bg: 'bg-orange-100', label: 'Used' },
                          wastage: { icon: Trash, color: 'text-red-500', bg: 'bg-red-100', label: 'Wastage' },
                        }
                        const ts = typeStyles[m.type] || typeStyles.reduce
                        const Icon = ts.icon
                        return (
                          <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                              <p className="text-[10px] text-gray-400">{new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-secondary">{m.itemName}</p>
                              <p className="text-[10px] text-gray-400">{getCatName(m.category)}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ts.bg} ${ts.color}`}>
                                <Icon className="w-3 h-3" />{ts.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-bold ${(m.type === 'add' || m.type === 'purchase') ? 'text-green' : 'text-red-500'}`}>
                                {(m.type === 'add' || m.type === 'purchase') ? '+' : '-'}{m.quantity} {m.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                              <span className="text-xs text-gray-500">{m.previousStock} → {m.newStock}</span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs text-gray-400">{m.reason || '—'}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col animate-fade-up">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {editingItem ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-secondary">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                    <p className="text-[11px] text-gray-400">{editingItem ? 'Update item details' : 'Fill in item information'}</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Item Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Paneer, Basmati Rice" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all" />
              </div>

              {/* SKU + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">SKU / Code</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Optional" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Barcode</label>
                  <div className="flex gap-1.5">
                    <input type="text" inputMode="numeric" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value.replace(/[^0-9]/g, '') })} placeholder="Scan or type" className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono transition-all" />
                    <button type="button" onClick={() => setShowScanner(true)} className="px-3 bg-orange/10 text-orange rounded-xl hover:bg-orange/20 transition-all">
                      <ScanBarcode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Category</label>
                  <div className="relative">
                    <button type="button" onClick={() => { setShowModalCatDrop(!showModalCatDrop); setShowModalUnitDrop(false) }} className="w-full flex items-center gap-2 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${catColorMap[categories.find((c) => c.id === form.category)?.color]?.split(' ')[0] || 'bg-gray-100'}`}>
                        <span className="text-[8px] font-bold text-gray-500">{categories.findIndex((c) => c.id === form.category) + 1}</span>
                      </div>
                      <span className="flex-1 font-medium text-secondary truncate">{categories.find((c) => c.id === form.category)?.name || 'Other'}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showModalCatDrop ? 'rotate-180' : ''}`} />
                    </button>
                    {showModalCatDrop && (
                      <>
                        <div className="fixed inset-0 z-[95]" onClick={() => setShowModalCatDrop(false)} />
                        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-[100] w-full max-h-52 overflow-y-auto scrollbar-hide animate-fade-up">
                          {categories.map((c) => (
                            <button key={c.id} type="button" onClick={() => { setForm({ ...form, category: c.id }); setShowModalCatDrop(false) }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${form.category === c.id ? 'bg-primary/5 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${catColorMap[c.color]?.split(' ')[0] || 'bg-gray-100'}`}>
                                <span className="text-[8px] font-bold text-gray-500">{categories.indexOf(c) + 1}</span>
                              </div>
                              <span className="flex-1 text-left">{c.name}</span>
                              {form.category === c.id && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Unit + Cost + Min Stock */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Unit</label>
                  <div className="relative">
                    <button type="button" onClick={() => { setShowModalUnitDrop(!showModalUnitDrop); setShowModalCatDrop(false) }} className="w-full flex items-center justify-between px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all">
                      <span className="font-mono font-bold text-secondary">{form.unit}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showModalUnitDrop ? 'rotate-180' : ''}`} />
                    </button>
                    {showModalUnitDrop && (
                      <>
                        <div className="fixed inset-0 z-[95]" onClick={() => setShowModalUnitDrop(false)} />
                        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[100] w-[170%] max-w-[380px] animate-fade-up">
                          <div className="grid grid-cols-5 gap-1.5 p-2">
                            {UNITS.map((u) => (
                              <button key={u} type="button" onClick={() => { setForm({ ...form, unit: u }); setShowModalUnitDrop(false) }} className={`py-2.5 rounded-lg text-sm font-mono font-bold transition-all ${form.unit === u ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Cost (₹)</label>
                  <input type="number" inputMode="decimal" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Min Stock</label>
                  <input type="number" inputMode="numeric" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                </div>
              </div>

              {/* Stock + Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                {!editingItem && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Current Stock</label>
                    <input type="number" inputMode="numeric" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  </div>
                )}
                <div className={editingItem ? 'col-span-2' : ''}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" /> Expiry Date
                  </label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  <p className="text-[10px] text-gray-400 mt-1">Optional — helps track expiry alerts</p>
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Supplier</label>
                <input type="text" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Optional" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim()} className="flex-[2] py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && adjustItem && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl sm:rounded-2xl w-full max-w-md flex flex-col animate-fade-up max-h-[92vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-secondary">Adjust Stock</h3>
                  <p className="text-[11px] text-gray-400">{adjustItem.name}</p>
                </div>
              </div>
              <button onClick={() => setShowAdjustModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Stock</p>
                    <p className="text-xl font-extrabold text-secondary">{fixStock(adjustItem.currentStock)} <span className="text-xs font-bold text-gray-400">{adjustItem.unit}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cost</p>
                    <p className="text-sm font-bold text-gray-500">₹{adjustItem.costPrice}/{adjustItem.unit}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mb-5">
                {[
                  { type: 'add', label: 'Purchase', icon: ShoppingCart, active: 'border-blue bg-blue/10 text-blue', activeIcon: 'bg-blue/20' },
                  { type: 'reduce', label: 'Usage', icon: TrendingDown, active: 'border-orange bg-orange/10 text-orange', activeIcon: 'bg-orange/20' },
                  { type: 'wastage', label: 'Wastage', icon: Trash, active: 'border-red-500 bg-red-50 text-red-500', activeIcon: 'bg-red-500/20' },
                ].map((opt) => {
                  const isActive = adjustForm.type === opt.type
                  const Icon = opt.icon
                  return (
                    <button key={opt.type} onClick={() => setAdjustForm({ ...adjustForm, type: opt.type })} className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl text-sm font-semibold border-2 transition-all ${isActive ? opt.active : 'border-gray-200 text-gray-400 hover:border-gray-300 bg-white'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? opt.activeIcon : 'bg-gray-100'}`}>
                        <Icon className={`w-5 h-5 ${isActive ? '' : 'text-gray-400'}`} />
                      </div>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Quantity ({adjustItem.unit})</label>
                <input type="number" inputMode="numeric" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} placeholder="Enter quantity" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 text-lg font-bold transition-all" autoFocus />
              </div>
              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Reason / Note</label>
                <input type="text" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value.toUpperCase() })} placeholder="e.g. Daily purchase, Spoiled" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 uppercase transition-all" />
              </div>
              {adjustForm.type === 'add' && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" /> Expiry Date
                  </label>
                  <input type="date" value={adjustForm.expiryDate} onChange={(e) => setAdjustForm({ ...adjustForm, expiryDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
                  <p className="text-[10px] text-gray-400 mt-1">Default: {SHELF_LIFE_DAYS[adjustItem?.category] || 30} days from today</p>
                </div>
              )}
              {adjustForm.quantity && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Stock will be:</span>
                  <span className="text-lg font-bold text-secondary">
                    {adjustForm.type === 'add' || adjustForm.type === 'purchase'
                      ? `${fixStock(adjustItem.currentStock)} + ${adjustForm.quantity || 0} = ${fixStock(adjustItem.currentStock + Number(adjustForm.quantity || 0))}`
                      : `${fixStock(adjustItem.currentStock)} - ${adjustForm.quantity || 0} = ${fixStock(Math.max(0, adjustItem.currentStock - Number(adjustForm.quantity || 0)))}`
                    } {adjustItem.unit}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowAdjustModal(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleAdjust} disabled={!adjustForm.quantity || Number(adjustForm.quantity) <= 0} className="flex-[2] py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Confirm Adjust</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 text-center animate-fade-up">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-secondary mb-1">Delete Item?</h3>
            <p className="text-sm text-gray-400 mb-6">"{deleteConfirm.name}" will be permanently removed from inventory.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {deletedItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-secondary text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-up w-[calc(100vw-2rem)] max-w-[360px]">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">"<span className="text-white font-bold">{deletedItem.name}</span>" deleted</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ animation: 'shrink 10s linear forwards' }}></div>
            </div>
          </div>
          <button onClick={handleRevert} className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-bold transition-colors flex-shrink-0">Revert</button>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={(code, productData) => {
            if (productData) {
              setForm((prev) => ({
                ...prev,
                barcode: code,
                name: productData.name || prev.name,
                notes: productData.brand ? `Brand: ${productData.brand}${productData.quantity ? ` | Qty: ${productData.quantity}` : ''}${productData.category ? ` | Cat: ${productData.category}` : ''}` : prev.notes,
              }))
            } else {
              setForm((prev) => ({ ...prev, barcode: code }))
            }
            setSearch(code)
            setShowScanner(false)
            setShowAddModal(true)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
