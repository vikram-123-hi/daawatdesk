import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSuppliers } from '../context/SupplierContext'
import { useInventory } from '../context/InventoryContext'
import {
  ArrowLeft, Plus, Trash2, Search, X, Truck, Phone, Mail, MapPin,
  Edit, Archive, RotateCcw, Package, IndianRupee, Star, Users
} from 'lucide-react'

export default function Suppliers() {
  const navigate = useNavigate()
  const { suppliers, activeSuppliers, loading, addSupplier, updateSupplier, deleteSupplier, totalSpent, topSuppliers } = useSuppliers()
  const { items } = useInventory()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active')
  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', gstNumber: '',
    paymentTerms: 'cash', itemsSupplied: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    let list = filter === 'archived' ? suppliers.filter((s) => s.archived) : activeSuppliers
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((s) =>
        (s.name || '').toLowerCase().includes(s) ||
        (s.phone || '').includes(s) ||
        (s.email || '').toLowerCase().includes(s)
      )
    }
    return list
  }, [suppliers, activeSuppliers, filter, search])

  function openAdd() {
    setEditingId(null)
    setForm({ name: '', phone: '', email: '', address: '', gstNumber: '', paymentTerms: 'cash', itemsSupplied: '', notes: '' })
    setShowForm(true)
  }

  function openEdit(s) {
    setEditingId(s.id)
    setForm({
      name: s.name || '', phone: s.phone || '', email: s.email || '',
      address: s.address || '', gstNumber: s.gstNumber || '',
      paymentTerms: s.paymentTerms || 'cash', itemsSupplied: (s.itemsSupplied || []).join(', '),
      notes: s.notes || '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        gstNumber: form.gstNumber.trim(),
        paymentTerms: form.paymentTerms,
        itemsSupplied: form.itemsSupplied.split(',').map((i) => i.trim()).filter(Boolean),
        notes: form.notes.trim(),
      }
      if (editingId) {
        await updateSupplier(editingId, data)
      } else {
        await addSupplier(data)
      }
      setShowForm(false)
    } catch {}
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this supplier?')) return
    await deleteSupplier(id)
  }

  async function handleArchive(id, archived) {
    await updateSupplier(id, { archived: !archived })
  }

  const paymentLabels = { cash: 'Cash', credit: 'Credit (30 days)', weekly: 'Weekly', monthly: 'Monthly' }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-all duration-200 active:scale-90 group">
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="text-sm font-medium hidden sm:inline group-hover:font-bold min-w-[5rem] text-center">Dashboard</span>
          </button>
          <div className="h-5 w-px bg-gray-200"></div>
          <Truck className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-gray-900"><span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span> <span className="text-gray-400 font-medium">Suppliers</span></h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95">
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Total</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{suppliers.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Active</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{activeSuppliers.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Total Spent</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">₹{totalSpent.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Top Supplier</span>
            </div>
            <p className="text-lg font-extrabold text-gray-900 truncate">{topSuppliers[0]?.name || '—'}</p>
            {topSuppliers[0] && <p className="text-xs text-gray-400 mt-0.5">₹{(topSuppliers[0].totalSpent || 0).toLocaleString('en-IN')}</p>}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
            />
          </div>
          <div className="flex gap-2">
            {[['active', 'Active'], ['archived', 'Archived']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === key ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Supplier List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No suppliers found</p>
            <p className="text-sm text-gray-300 mt-1">Add your first supplier to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <div key={s.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all ${s.archived ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm">
                      {(s.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{s.name}</h3>
                      <p className="text-xs text-gray-400">{paymentLabels[s.paymentTerms] || s.paymentTerms}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleArchive(s.id, s.archived)} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all">
                      {s.archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  {s.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{s.phone}</span>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  )}
                </div>
                {s.itemsSupplied && s.itemsSupplied.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.itemsSupplied.slice(0, 3).map((item, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">{item}</span>
                    ))}
                    {s.itemsSupplied.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md text-[10px]">+{s.itemsSupplied.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total orders: <span className="font-semibold text-gray-600">{s.totalOrders || 0}</span></span>
                  <span className="text-gray-400">Spent: <span className="font-semibold text-orange-600">₹{(s.totalSpent || 0).toLocaleString('en-IN')}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-gray-900">{editingId ? 'Edit Supplier' : 'Add Supplier'}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'none' }}>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Raj Vegetable Supply"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Phone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit number"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="supplier@email.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address"
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">GST Number</label>
                  <input
                    type="text"
                    value={form.gstNumber}
                    onChange={(e) => setForm({ ...form, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Payment Terms</label>
                  <select
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit">Credit (30 days)</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Items Supplied</label>
                <input
                  type="text"
                  value={form.itemsSupplied}
                  onChange={(e) => setForm({ ...form, itemsSupplied: e.target.value })}
                  placeholder="Comma separated: Onions, Tomatoes, Potatoes"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || saving}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
