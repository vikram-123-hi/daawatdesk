import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExpenses } from '../context/ExpenseContext'
import {
  ArrowLeft, Plus, Trash2, Search, Calendar, X, ChevronDown, Wallet,
  TrendingUp, TrendingDown, BarChart3, Receipt, PieChart, Target, Zap,
  Download, Building2, AlertCircle, CheckCircle2, DollarSign, Filter, RefreshCw, Edit3
} from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

export default function Expenses() {
  const navigate = useNavigate()
  const {
    expenses, loading, addExpense, updateExpense, deleteExpense, totalThisMonth, totalToday,
    categoryTotals, EXPENSE_CATEGORIES, quickTemplates, updateQuickTemplate, monthlyBudget, setMonthlyBudget, budgetUsedPercent
  } = useExpenses()

  const [showAdd, setShowAdd] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showTplEditModal, setShowTplEditModal] = useState(false)
  const [editingTpl, setEditingTpl] = useState(null)
  const [tplAmountInput, setTplAmountInput] = useState('')
  const [budgetInput, setBudgetInput] = useState(String(monthlyBudget))
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    amount: '',
    category: 'ingredients',
    vendor: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'cash',
    isRecurring: false,
  })

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false
      if (filterPayment !== 'all' && (e.paymentMode || 'cash').toLowerCase() !== filterPayment.toLowerCase()) return false
      if (filterDate && e.date !== filterDate) return false
      if (search) {
        const s = search.toLowerCase()
        const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.category)
        return (
          (e.note || '').toLowerCase().includes(s) ||
          (e.vendor || '').toLowerCase().includes(s) ||
          (cat?.name || '').toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [expenses, filterCategory, filterPayment, filterDate, search, EXPENSE_CATEGORIES])

  function handleOpenAdd() {
    setEditingExpenseId(null)
    setForm({
      amount: '',
      category: 'ingredients',
      vendor: '',
      note: '',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'cash',
      isRecurring: false,
    })
    setShowAdd(true)
  }

  function handleOpenEdit(exp) {
    setEditingExpenseId(exp.id)
    setForm({
      amount: String(exp.amount || ''),
      category: exp.category || 'ingredients',
      vendor: exp.vendor || '',
      note: exp.note || '',
      date: exp.date || new Date().toISOString().split('T')[0],
      paymentMode: exp.paymentMode || 'cash',
      isRecurring: Boolean(exp.isRecurring),
    })
    setShowAdd(true)
  }

  function handleQuickTemplate(tpl) {
    setEditingExpenseId(null)
    setForm({
      amount: String(tpl.amount),
      category: tpl.category,
      vendor: tpl.name,
      note: tpl.note,
      date: new Date().toISOString().split('T')[0],
      paymentMode: tpl.paymentMode || 'cash',
      isRecurring: false,
    })
    setShowAdd(true)
  }

  function openEditTemplate(tpl) {
    setEditingTpl(tpl)
    setTplAmountInput(String(tpl.amount))
    setShowTplEditModal(true)
  }

  function handleSaveTemplateAmount() {
    if (editingTpl && tplAmountInput) {
      updateQuickTemplate(editingTpl.id || editingTpl.name, Number(tplAmountInput))
      setShowTplEditModal(false)
    }
  }

  async function handleAddOrUpdate() {
    if (!form.amount || Number(form.amount) <= 0) return
    setSaving(true)
    try {
      const payload = {
        amount: Number(form.amount),
        category: form.category,
        vendor: form.vendor,
        note: form.note,
        date: form.date,
        paymentMode: form.paymentMode,
        isRecurring: form.isRecurring,
      }
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, payload)
      } else {
        await addExpense(payload)
      }
      setForm({
        amount: '',
        category: 'ingredients',
        vendor: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'cash',
        isRecurring: false,
      })
      setEditingExpenseId(null)
      setShowAdd(false)
    } catch (e) {
      console.error('Error saving expense:', e)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this expense entry?')) return
    await deleteExpense(id)
  }

  function exportExpensesCSV() {
    if (!filtered.length) return
    const headers = ['Date', 'Category', 'Vendor', 'Amount', 'Payment Mode', 'Note', 'Recurring']
    const rows = filtered.map((e) => {
      const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.category)?.name || e.category
      return [e.date, cat, e.vendor || '—', e.amount, (e.paymentMode || 'cash').toUpperCase(), e.note || '—', e.isRecurring ? 'Yes' : 'No']
    })
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSaveBudget() {
    const val = Number(budgetInput)
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudget(val)
      setShowBudgetModal(false)
    }
  }

  const paymentBreakdown = useMemo(() => {
    const map = { cash: 0, upi: 0, card: 0, bank: 0 }
    expenses.forEach((e) => {
      const mode = (e.paymentMode || 'cash').toLowerCase()
      map[mode] = (map[mode] || 0) + (Number(e.amount) || 0)
    })
    return map
  }, [expenses])

  return (
    <div className="min-h-screen bg-gray-100/70">
      {/* Top Sticky Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-all duration-200 active:scale-90 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="text-sm font-medium hidden sm:inline group-hover:font-bold min-w-[5rem] text-center">Dashboard</span>
          </button>
          <div className="h-5 w-px bg-gray-200"></div>
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span>{' '}
            <span className="text-gray-400 font-medium">Expense Tracker</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportExpensesCSV}
            disabled={!filtered.length}
            className="hidden sm:flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Monthly Budget Tracker Bar */}
        <ScrollReveal animation="reveal">
          <div className="bg-gradient-to-br from-gray-900 via-secondary to-gray-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Monthly Expense Budget</span>
                  <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full">Active Month</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white">₹{totalThisMonth.toLocaleString('en-IN')}</h2>
                  <span className="text-sm text-gray-400">of ₹{monthlyBudget.toLocaleString('en-IN')} target</span>
                </div>
              </div>

              <button
                onClick={() => { setBudgetInput(String(monthlyBudget)); setShowBudgetModal(true) }}
                className="self-start sm:self-auto flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/10 transition-all active:scale-95"
              >
                <Target className="w-3.5 h-3.5 text-primary" /> Edit Target
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">{budgetUsedPercent}% of monthly limit used</span>
                <span className={`font-bold ${budgetUsedPercent > 90 ? 'text-red-400' : budgetUsedPercent > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {budgetUsedPercent > 100 ? '⚠️ Budget Exceeded!' : `₹${Math.max(0, monthlyBudget - totalThisMonth).toLocaleString('en-IN')} remaining`}
                </span>
              </div>
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetUsedPercent > 90 ? 'bg-gradient-to-r from-red-500 to-rose-600' : budgetUsedPercent > 70 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetUsedPercent)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* 1-Click Quick Expense Logging Templates */}
        <ScrollReveal animation="reveal" className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">1-Click Quick Expense Log</h3>
              <span className="text-[10px] text-gray-400">tap chip to edit amount & log</span>
            </div>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {(quickTemplates || []).map((tpl, i) => (
              <div
                key={tpl.id || i}
                className="flex-shrink-0 flex items-center bg-gray-50 hover:bg-primary/10 border border-gray-200/80 hover:border-primary/40 rounded-xl transition-all group overflow-hidden"
              >
                <button
                  onClick={() => handleQuickTemplate(tpl)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-left active:scale-95 transition-transform"
                >
                  <div className="w-7 h-7 rounded-lg bg-white group-hover:bg-primary group-hover:text-white flex items-center justify-center text-xs font-bold transition-colors border border-gray-100">
                    +
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">{tpl.name}</p>
                    <p className="text-[10px] font-semibold text-gray-500">₹{tpl.amount} · {(tpl.paymentMode || 'cash').toUpperCase()}</p>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditTemplate(tpl) }}
                  className="px-2.5 py-3 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors border-l border-gray-200/60 text-xs"
                  title="Edit Template Default Price"
                >
                  ✏️
                </button>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Financial KPI Overview */}
        <ScrollReveal animation="reveal" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Today Outflow</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">₹{totalToday.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">This Month Total</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">₹{totalThisMonth.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Top Expense Category</span>
            </div>
            <p className="text-lg font-extrabold text-gray-900 truncate">
              {categoryTotals[0]?.name || 'None'}
            </p>
            <p className="text-[11px] text-gray-400 font-semibold">{categoryTotals[0] ? `₹${categoryTotals[0].total.toLocaleString('en-IN')}` : 'No data'}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Cash Outflow</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">₹{(paymentBreakdown.cash || 0).toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-gray-400">Petty cash used</p>
          </div>
        </ScrollReveal>

        {/* Category Share Breakdown */}
        {categoryTotals.length > 0 && (
          <ScrollReveal animation="reveal" className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                <PieChart className="w-4 h-4 text-primary" /> Category Spending Breakdown
              </h3>
              <span className="text-xs text-gray-400">{categoryTotals.length} categories active</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoryTotals.map((cat) => {
                const percent = totalThisMonth > 0 ? Math.round((cat.total / totalThisMonth) * 100) : 0
                return (
                  <div key={cat.id} className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 hover:border-gray-300 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-[11px] font-bold bg-white text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">{percent}% share</span>
                    </div>
                    <p className="text-xs font-bold text-gray-700 truncate">{cat.name}</p>
                    <p className="text-base font-extrabold text-gray-900 mt-0.5">₹{cat.total.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{cat.count} transaction{cat.count > 1 ? 's' : ''}</p>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses by note, vendor, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
            />

            {(filterCategory !== 'all' || filterPayment !== 'all' || filterDate || search) && (
              <button
                onClick={() => { setFilterCategory('all'); setFilterPayment('all'); setFilterDate(''); setSearch('') }}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                title="Reset Filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expense Log List */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-gray-50/80 border-b border-gray-200/80 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Expense Logs ({filtered.length})</span>
            <span className="text-xs text-gray-400 font-semibold">Total Filtered: ₹{filtered.reduce((s, e) => s + Number(e.amount || 0), 0).toLocaleString('en-IN')}</span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-400 font-medium">Loading expenses...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold">No expense records found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or log a new expense</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((exp) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.id === exp.category)
                return (
                  <div key={exp.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors group">
                    <div className="w-11 h-11 bg-gray-100 group-hover:bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors">
                      {cat?.icon || '📋'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">{cat?.name || 'Other'}</p>
                        {exp.vendor && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-200">
                            🏪 {exp.vendor}
                          </span>
                        )}
                        {exp.isRecurring && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full border border-purple-200">
                            🔄 Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {exp.note || 'No note details'} · <span className="text-gray-400">{exp.date}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-extrabold text-red-500">-₹{Number(exp.amount).toLocaleString('en-IN')}</p>
                      <span className="text-[10px] font-extrabold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {(exp.paymentMode || 'cash').toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(exp)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Expense Record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 animate-fade-up shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900">{editingExpenseId ? 'Edit Expense Record' : 'Record New Expense'}</h3>
              </div>
              <button onClick={() => setShowAdd(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full pl-9 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-extrabold text-gray-900 outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Category *</label>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-gray-100 rounded-xl bg-gray-50">
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-bold transition-all ${
                      form.category === cat.id
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="truncate w-full text-center text-[10px]">{cat.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Vendor / Payee</label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Dairy"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Payment Mode</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="cash">Cash (Petty Cash)</option>
                  <option value="upi">UPI (GPay/PhonePe)</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Expense Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isRecurring}
                    onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                    className="w-4 h-4 text-primary accent-primary rounded"
                  />
                  <span>Monthly Recurring</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Note / Description</label>
              <input
                type="text"
                placeholder="e.g. 50kg Atta & Oil purchase"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              onClick={handleAddOrUpdate}
              disabled={!form.amount || saving}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (editingExpenseId ? 'Update Expense Record' : 'Save Expense Log')}
            </button>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 animate-fade-up shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Set Monthly Budget Limit</h3>
              <button onClick={() => setShowBudgetModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Target Limit (₹)</label>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="50000"
              />
              <p className="text-[11px] text-gray-400 mt-1">Set maximum monthly target for operational expense alerts.</p>
            </div>
            <button
              onClick={handleSaveBudget}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
            >
              Save Budget Limit
            </button>
          </div>
        </div>
      )}

      {/* Edit Template Price Modal */}
      {showTplEditModal && editingTpl && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 animate-fade-up shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Edit Template Default Price</h3>
                <p className="text-xs text-gray-400">{editingTpl.name}</p>
              </div>
              <button onClick={() => setShowTplEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Default Amount (₹)</label>
              <input
                type="number"
                value={tplAmountInput}
                onChange={(e) => setTplAmountInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="1200"
                autoFocus
              />
              <p className="text-[11px] text-gray-400 mt-1">This default amount will be pre-filled whenever you tap this quick template chip.</p>
            </div>
            <button
              onClick={handleSaveTemplateAmount}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all"
            >
              Update Template Price
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
