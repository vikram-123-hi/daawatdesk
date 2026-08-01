import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomers } from '../context/CustomerContext'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import {
  ArrowLeft, Users, Plus, Search, Phone, Mail, Calendar, Tag, Edit3, Trash2, X, Save, User, ShoppingBag, Star, Cake, ChevronRight, Filter
} from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

const AVAILABLE_TAGS = ['VIP', 'Regular', 'New', 'Birthday Club', 'Wholesale']

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

function formatDob(dob) {
  if (!dob) return ''
  const [y, m, d] = dob.split('-')
  return `${d}/${m}/${y}`
}

function isBirthdayThisMonth(dob) {
  if (!dob) return false
  const thisMonth = String(new Date().getMonth() + 1).padStart(2, '0')
  return dob.slice(5, 7) === thisMonth
}

function getAge(dob) {
  if (!dob) return null
  const [y, m, d] = dob.split('-').map(Number)
  const birth = new Date(y, m - 1, d)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const mo = today.getMonth() - birth.getMonth()
  if (mo < 0 || (mo === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function isTodayBirthday(dob) {
  if (!dob) return false
  const today = toLocalDateStr(new Date())
  return dob.slice(5) === today.slice(5)
}

export default function CRM() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerTxns, setCustomerTxns] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', dob: '', email: '', tags: [], notes: '' })
  const [dobDisplay, setDobDisplay] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    let list = customers
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((c) =>
        (c.name || '').toLowerCase().includes(s) ||
        (c.phone || '').includes(s) ||
        (c.email || '').toLowerCase().includes(s)
      )
    }
    if (tagFilter) {
      list = list.filter((c) => (c.tags || []).includes(tagFilter))
    }
    return list
  }, [customers, search, tagFilter])

  const stats = useMemo(() => {
    const total = customers.length
    const totalSpent = customers.reduce((s, c) => s + (c.totalSpent || 0), 0)
    const topSpender = [...customers].sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0]
    const birthdayCount = customers.filter((c) => c.dob && isTodayBirthday(c.dob)).length
    return { total, totalSpent, topSpender, birthdayCount }
  }, [customers])

  function openAddModal() {
    setEditingCustomer(null)
    setForm({ name: '', phone: '', dob: '', email: '', tags: [], notes: '' })
    setDobDisplay('')
    setShowModal(true)
  }

  function openEditModal(c) {
    setEditingCustomer(c)
    const dobVal = c.dob || ''
    setForm({ name: c.name || '', phone: c.phone || '', dob: dobVal, email: c.email || '', tags: c.tags || [], notes: c.notes || '' })
    setDobDisplay(dobVal ? dobVal.split('-').reverse().join('/') : '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim() && !form.phone.trim()) return
    setSaving(true)
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, '').slice(-10),
          dob: form.dob || null,
          email: form.email.trim(),
          tags: form.tags,
          notes: form.notes.trim(),
        })
      } else {
        await addCustomer({
          name: form.name.trim(),
          phone: form.phone.replace(/\D/g, '').slice(-10),
          dob: form.dob || null,
          email: form.email.trim(),
          tags: form.tags,
          notes: form.notes.trim(),
        })
      }
      setShowModal(false)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  async function handleDelete(c) {
    if (!confirm(`Delete customer "${c.name}"? This cannot be undone.`)) return
    await deleteCustomer(c.id)
    if (selectedCustomer?.id === c.id) setSelectedCustomer(null)
  }

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  useEffect(() => {
    if (!selectedCustomer) return
    const updated = customers.find((c) => c.id === selectedCustomer.id)
    if (updated && updated !== selectedCustomer) setSelectedCustomer(updated)
  }, [customers])

  useEffect(() => {
    if (!selectedCustomer || !currentUser) return
    setCustomerTxns([])
    let unsub = null
    let fallback = false
    const tryQuery = () => {
      const q = query(
        collection(db, 'users', currentUser.uid, 'transactions'),
        where('customerId', '==', selectedCustomer.id),
        orderBy('createdAt', 'desc')
      )
      unsub = onSnapshot(q, (snap) => {
        setCustomerTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }, (err) => {
        if (!fallback) {
          fallback = true
          if (unsub) unsub()
          const q2 = query(
            collection(db, 'users', currentUser.uid, 'transactions'),
            where('customerId', '==', selectedCustomer.id)
          )
          unsub = onSnapshot(q2, (snap) => {
            const txns = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
            txns.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
            setCustomerTxns(txns)
          }, () => setCustomerTxns([]))
        }
      })
    }
    tryQuery()
    return () => { if (unsub) unsub() }
  }, [selectedCustomer, currentUser])

  if (selectedCustomer) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
          <button onClick={() => setSelectedCustomer(null)} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>
          <div className="h-5 w-px bg-gray-200"></div>
          <img src="/logo-app.png" alt="DaawatDesk" className="w-7 h-7 rounded-lg flex-shrink-0 object-contain" />
          <h1 className="text-lg font-bold text-secondary truncate">{selectedCustomer.name || 'Customer'}</h1>
          <div className="ml-auto flex gap-2">
            <button onClick={() => openEditModal(selectedCustomer)} className="p-2 text-gray-400 hover:text-blue hover:bg-blue/5 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
            <button onClick={() => handleDelete(selectedCustomer)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${isTodayBirthday(selectedCustomer.dob) ? 'bg-pink-100 text-pink-600' : 'bg-purple/10 text-purple'}`}>
                {(selectedCustomer.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-secondary">{selectedCustomer.name}</h2>
                  {isTodayBirthday(selectedCustomer.dob) && <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-bold rounded-full">Birthday Today!</span>}
                  {!isTodayBirthday(selectedCustomer.dob) && isBirthdayThisMonth(selectedCustomer.dob) && <span className="px-2 py-0.5 bg-pink-50 text-pink-500 text-xs font-bold rounded-full">Birthday this month</span>}
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  {selectedCustomer.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selectedCustomer.phone}</span>}
                  {selectedCustomer.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{selectedCustomer.email}</span>}
                  <span className="flex items-center gap-1"><Cake className="w-3.5 h-3.5" />DOB: {selectedCustomer.dob ? `${formatDate(selectedCustomer.dob)} (Age: ${getAge(selectedCustomer.dob)})` : 'Not set'}</span>
                </div>
                {(selectedCustomer.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedCustomer.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 bg-purple/10 text-purple text-xs font-semibold rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                {selectedCustomer.notes && <p className="text-sm text-gray-400 mt-3 italic">"{selectedCustomer.notes}"</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{selectedCustomer.totalOrders || 0}</p>
                <p className="text-xs text-gray-400">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{formatCurrency(selectedCustomer.totalSpent)}</p>
                <p className="text-xs text-gray-400">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-secondary">{selectedCustomer.lastVisit ? formatDate(selectedCustomer.lastVisit) : '—'}</p>
                <p className="text-xs text-gray-400">Last Visit</p>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Order History</h3>
          {customerTxns.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No orders linked yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customerTxns.map((t) => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-secondary">{formatDate(t.createdAt)}</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded">{t.table || 'Parcel'}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{(t.items || []).map((i) => `${i.name} x${i.qty}`).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green">{formatCurrency(t.total)}</p>
                    <p className="text-[10px] text-gray-400">{t.payment || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {showModal && <CustomerModal form={form} setForm={setForm} editingCustomer={editingCustomer} saving={saving} onClose={() => setShowModal(false)} onSave={handleSave} toggleTag={toggleTag} dobDisplay={dobDisplay} setDobDisplay={setDobDisplay} />}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-50">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-all duration-200 active:scale-90 group">
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          <span className="text-sm font-medium hidden sm:inline group-hover:font-bold min-w-[5rem] text-center">Dashboard</span>
        </button>
        <div className="h-5 w-px bg-gray-200"></div>
        <img src="/logo-app.png" alt="DaawatDesk" className="w-7 h-7 rounded-lg flex-shrink-0 object-contain" />
        <h1 className="text-lg font-bold text-secondary hidden sm:inline"><span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span> <span className="text-gray-400 font-medium">CRM / Customers</span></h1>
        <button onClick={openAddModal} className="ml-auto flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Customer</span>
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <ScrollReveal animation="reveal" className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-purple" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Total</span>
            </div>
            <p className="text-2xl font-bold text-secondary">{stats.total}</p>
            <p className="text-[10px] text-gray-400">customers</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green/10 rounded-lg flex items-center justify-center"><Star className="w-4 h-4 text-green" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-secondary">{formatCurrency(stats.totalSpent)}</p>
            <p className="text-[10px] text-gray-400">from customers</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-blue" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Top</span>
            </div>
            <p className="text-lg font-bold text-secondary truncate">{stats.topSpender?.name || '—'}</p>
            <p className="text-[10px] text-gray-400">{stats.topSpender ? formatCurrency(stats.topSpender.totalSpent) : 'no data'}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center"><Cake className="w-4 h-4 text-pink-500" /></div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Today</span>
            </div>
            <p className="text-2xl font-bold text-secondary">{stats.birthdayCount}</p>
            <p className="text-[10px] text-gray-400">birthday{stats.birthdayCount !== 1 ? 's' : ''}</p>
          </div>
        </ScrollReveal>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or email..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {AVAILABLE_TAGS.map((t) => (
              <button key={t} onClick={() => setTagFilter(tagFilter === t ? '' : t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${tagFilter === t ? 'bg-purple text-white border-purple' : 'bg-white text-gray-500 border-gray-200 hover:border-purple hover:text-purple'}`}>{t}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm">Loading customers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">{search || tagFilter ? 'No matching customers' : 'No customers yet'}</h3>
            <p className="text-sm text-gray-400 mb-4">{search || tagFilter ? 'Try a different search or filter' : 'Add your first customer to start tracking orders'}</p>
            {!search && !tagFilter && (
              <button onClick={openAddModal} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Add Customer</button>
            )}
          </div>
        ) : (
          <ScrollReveal animation="reveal" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedCustomer(c)}>
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isTodayBirthday(c.dob) ? 'bg-pink-100 text-pink-600' : 'bg-purple/10 text-purple'}`}>
                    {(c.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-secondary truncate">{c.name}</h4>
                      {isTodayBirthday(c.dob) && <span className="px-1.5 py-0.5 bg-pink-100 text-pink-600 text-[10px] font-bold rounded-full whitespace-nowrap">Birthday!</span>}
                    </div>
                    {c.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{c.phone}</p>}
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Cake className="w-3 h-3" />
                      {c.dob ? formatDob(c.dob) : 'No DOB'}
                      {!isTodayBirthday(c.dob) && isBirthdayThisMonth(c.dob) && <span className="px-1 py-0.5 bg-pink-50 text-pink-500 text-[9px] font-bold rounded">This month</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                      <span>{c.totalOrders || 0} orders</span>
                      <span>{formatCurrency(c.totalSpent)}</span>
                    </div>
                    {(c.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 bg-purple/10 text-purple text-[10px] font-semibold rounded-full">{t}</span>
                        ))}
                        {c.tags.length > 3 && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded-full">+{c.tags.length - 3}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEditModal(c)} className="p-1.5 text-gray-300 hover:text-blue hover:bg-blue/5 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </ScrollReveal>
        )}
      </div>

      {showModal && <CustomerModal form={form} setForm={setForm} editingCustomer={editingCustomer} saving={saving} onClose={() => setShowModal(false)} onSave={handleSave} toggleTag={toggleTag} dobDisplay={dobDisplay} setDobDisplay={setDobDisplay} />}
    </div>
  )
}

function CustomerModal({ form, setForm, editingCustomer, saving, onClose, onSave, toggleTag, dobDisplay, setDobDisplay }) {
  function handleDobInput(e) {
    let raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 8) raw = raw.slice(0, 8)
    let formatted = raw
    if (raw.length > 2) formatted = raw.slice(0, 2) + '/' + raw.slice(2)
    if (raw.length > 4) formatted = raw.slice(0, 2) + '/' + raw.slice(2, 4) + '/' + raw.slice(4)
    setDobDisplay(formatted)
    if (raw.length === 8) {
      const dd = raw.slice(0, 2), mm = raw.slice(2, 4), yyyy = raw.slice(4, 8)
      setForm((prev) => ({ ...prev, dob: `${yyyy}-${mm}-${dd}` }))
    } else {
      setForm((prev) => ({ ...prev, dob: '' }))
    }
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 rounded-t-2xl">
          <h3 className="text-lg font-bold text-secondary">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-hide">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
            <input type="tel" inputMode="tel" pattern="[0-9]*" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile number" maxLength={10} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Date of Birth (optional)</label>
            <input
              type="text"
              placeholder="DD/MM/YYYY"
              value={dobDisplay}
              onChange={handleDobInput}
              maxLength={10}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="customer@email.com" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTag(t)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${form.tags.includes(t) ? 'bg-purple text-white border-purple' : 'bg-white text-gray-500 border-gray-200 hover:border-purple hover:text-purple'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Preferences, allergies, etc." rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-4 border-t border-gray-100 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onSave} disabled={saving || (!form.name.trim() && !form.phone.trim())} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {editingCustomer ? 'Update' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  )
}
