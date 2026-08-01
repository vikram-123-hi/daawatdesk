import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import {
  ArrowLeft, Plus, Trash2, Search, Calendar, X, ChevronDown, Wallet,
  TrendingUp, TrendingDown, BarChart3, Receipt, PieChart
} from 'lucide-react'

export default function Expenses() {
  const navigate = useNavigate()
  const { expenses, loading, addExpense, deleteExpense, totalThisMonth, totalToday, categoryTotals, EXPENSE_CATEGORIES } = useExpenses()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [form, setForm] = useState({ amount: '', category: 'rent', note: '', date: new Date().toISOString().split('T')[0], paymentMode: 'cash' })
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false
      if (filterDate && e.date !== filterDate) return false
      if (search) {
        const s = search.toLowerCase()
        const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.category)
        return (e.note || '').toLowerCase().includes(s) || (cat?.name || '').toLowerCase().includes(s)
      }
      return true
    })
  }, [expenses, filterCategory, filterDate, search])

  async function handleAdd() {
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    try {
      await addExpense({
        amount: Number(form.amount),
        category: form.category,
        note: form.note,
        date: form.date,
        paymentMode: form.paymentMode,
      })
      setForm({ amount: '', category: 'rent', note: '', date: new Date().toISOString().split('T')[0], paymentMode: 'cash' })
      setShowAdd(false)
    } catch {}
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
  }

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const monthDaily = useMemo(() => {
    const map = {}
    expenses.forEach((e) => {
      if (e.date && e.date.startsWith(thisMonth)) {
        const day = e.date.split('-')[2]
        map[day] = (map[day] || 0) + (Number(e.amount) || 0)
      }
    })
    return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b))
  }, [expenses, thisMonth])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-all duration-200 active:scale-90 group">
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="text-sm font-medium hidden sm:inline group-hover:font-bold min-w-[5rem] text-center">Dashboard</span>
          </button>
          <div className="h-5 w-px bg-gray-200"></div>
          <Receipt className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-gray-900"><span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span> <span className="text-gray-400 font-medium">Expenses</span></h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Today</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">₹{totalToday.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">This Month</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">₹{totalThisMonth.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Categories</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{categoryTotals.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Total Entries</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{expenses.length}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" /> Category Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryTotals.map((cat) => (
                <div key={cat.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-xs font-semibold text-gray-600 truncate">{cat.name}</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">₹{cat.total.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-gray-400">{cat.count} entries</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Expense List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">Loading expenses...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No expenses found</p>
              <p className="text-xs text-gray-300 mt-1">Add your first expense to start tracking</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((exp) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.id === exp.category)
                return (
                  <div key={exp.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                      {cat?.icon || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{cat?.name || 'Other'}</p>
                      <p className="text-xs text-gray-400 truncate">{exp.note || 'No note'} · {exp.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-red-500">-₹{Number(exp.amount).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-300 uppercase">{exp.paymentMode}</p>
                    </div>
                    <button onClick={() => handleDelete(exp.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Add Expense</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Amount (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-bold outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-all ${
                      form.category === cat.id
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="truncate w-full text-center">{cat.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Payment</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Note (optional)</label>
              <input
                type="text"
                placeholder="e.g. Monthly rent, Staff advance"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!form.amount || saving}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
