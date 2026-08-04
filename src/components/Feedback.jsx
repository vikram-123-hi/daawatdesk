import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeedback } from '../context/FeedbackContext'
import {
  ArrowLeft, Star, Search, X, MessageSquare, Send, Trash2,
  ThumbsUp, ThumbsDown, Utensils, Users, Sparkles, IndianRupee,
  Plus, Download, CheckCircle2, AlertCircle, Heart, Zap, Award
} from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

const CATEGORIES = [
  { id: 'food', label: 'Food Quality', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'service', label: 'Service Speed', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'ambience', label: 'Ambience & Hygiene', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'value', label: 'Value for Money', icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-50' },
]

function StarRating({ value, onChange, readonly = false, size = 'w-5 h-5' }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(s)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform focus:outline-none`}
        >
          <Star
            className={`${size} ${(hovered || value) >= s ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
          />
        </button>
      ))}
    </div>
  )
}

export default function FeedbackPage() {
  const navigate = useNavigate()
  const {
    feedbacks, loading, addFeedback, respondToFeedback, deleteFeedback,
    avgRating, satisfiedPercent, respondedCount, pendingCount, fiveStarCount,
    ratingDistribution, categoryAverages, QUICK_REPLIES
  } = useFeedback()

  const [search, setSearch] = useState('')
  const [filterRating, setFilterRating] = useState(0)
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'pending', 'responded'
  const [showRespond, setShowRespond] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [sending, setSending] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const [addForm, setAddForm] = useState({
    customerName: '',
    customerPhone: '',
    table: '',
    overall: 5,
    foodRating: 5,
    serviceRating: 5,
    ambienceRating: 5,
    valueRating: 5,
    comment: '',
  })

  const filtered = useMemo(() => {
    return feedbacks.filter((f) => {
      if (filterRating > 0 && Number(f.overall) !== filterRating) return false
      if (filterStatus === 'pending' && f.responded) return false
      if (filterStatus === 'responded' && !f.responded) return false
      if (search) {
        const s = search.toLowerCase()
        return (
          (f.customerName || '').toLowerCase().includes(s) ||
          (f.comment || '').toLowerCase().includes(s) ||
          (f.table || '').toLowerCase().includes(s)
        )
      }
      return true
    })
  }, [feedbacks, filterRating, filterStatus, search])

  async function handleRespond(id) {
    if (!responseText.trim()) return
    setSending(true)
    try {
      await respondToFeedback(id, responseText.trim())
      setShowRespond(null)
      setResponseText('')
    } catch (e) {
      console.error('Error responding:', e)
    }
    setSending(false)
  }

  async function handleAddSubmission() {
    if (!addForm.overall) return
    setSending(true)
    try {
      await addFeedback(addForm)
      setAddForm({
        customerName: '',
        customerPhone: '',
        table: '',
        overall: 5,
        foodRating: 5,
        serviceRating: 5,
        ambienceRating: 5,
        valueRating: 5,
        comment: '',
      })
      setShowAddModal(false)
    } catch (e) {
      console.error('Add feedback error:', e)
    }
    setSending(false)
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this customer feedback?')) return
    await deleteFeedback(id)
  }

  function exportCSV() {
    if (!filtered.length) return
    const headers = ['Date', 'Customer', 'Table', 'Rating', 'Comment', 'Responded', 'Response']
    const rows = filtered.map((f) => [
      f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-IN') : '—',
      f.customerName || 'Guest',
      f.table || 'N/A',
      f.overall,
      f.comment || '—',
      f.responded ? 'Yes' : 'No',
      f.response || '—',
    ])
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customer-feedback-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-100/70">
      {/* Header */}
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
          <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          </div>
          <h1 className="text-lg font-bold text-gray-900">
            <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span>{' '}
            <span className="text-gray-400 font-medium">Customer Feedback</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={!filtered.length}
            className="hidden sm:flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md shadow-primary/20 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Log Review
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* NPS Rating Overview Banner */}
        <ScrollReveal animation="reveal">
          <div className="bg-gradient-to-br from-gray-900 via-secondary to-gray-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 items-center">
              {/* Overall Score */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-amber-500/20 border-2 border-amber-400/50 rounded-2xl flex flex-col items-center justify-center shrink-0">
                  <span className="text-3xl font-extrabold text-amber-300">{avgRating}</span>
                  <span className="text-[10px] text-amber-200/80 font-bold uppercase">out of 5.0</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <StarRating value={Math.round(Number(avgRating))} readonly size="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-extrabold text-white">Overall Customer Score</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Based on {feedbacks.length} customer reviews</p>
                </div>
              </div>

              {/* CSAT Satisfaction Gauge */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Customer Satisfaction</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{satisfiedPercent}%</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">Rated 4★ or 5★ stars</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-400/40">
                  <Award className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              {/* Review Response Status */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Pending Responses</span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">{pendingCount}</span>
                  <p className="text-[10px] text-gray-400 mt-0.5">{respondedCount} reviews replied</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-400/40">
                  <Send className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Category Performance Breakdown */}
        <ScrollReveal animation="reveal" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const avg = categoryAverages[cat.id] || '5.0'
            return (
              <div key={cat.id} className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${cat.bg} rounded-xl flex items-center justify-center`}>
                    <cat.icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <span className="text-xs font-extrabold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    {avg} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                </div>
                <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">{cat.label}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">{avg} / 5.0</p>
              </div>
            )
          })}
        </ScrollReveal>

        {/* Rating Distribution Progress */}
        <ScrollReveal animation="reveal" className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Star Rating Distribution
            </h3>
            <span className="text-xs text-gray-400 font-medium">{fiveStarCount} 5-Star reviews</span>
          </div>

          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-gray-600 w-8 text-right flex items-center gap-0.5 justify-end">
                  {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                </span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-500 w-12 text-right">{count} ({pct}%)</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback by customer name, table, or comment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex bg-white border border-gray-200 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'all' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                All Status
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'pending' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Pending Reply ({pendingCount})
              </button>
              <button
                onClick={() => setFilterStatus('responded')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterStatus === 'responded' ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                Responded ({respondedCount})
              </button>
            </div>

            <div className="flex bg-white border border-gray-200 rounded-xl p-1 shrink-0">
              {[0, 5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRating(r)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filterRating === r ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {r === 0 ? 'All Stars' : <>{r}<Star className="w-3 h-3 fill-current text-amber-400" /></>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback List Log */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-400 font-medium">Loading customer reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-bold text-base">No matching reviews</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your rating or status filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((f) => (
              <div
                key={f.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md ${
                  !f.responded ? 'border-amber-300/80 ring-1 ring-amber-400/20' : 'border-gray-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarRating value={Number(f.overall)} readonly size="w-4 h-4" />
                      <span className="text-sm font-extrabold text-gray-900">{f.overall}.0</span>

                      {f.table && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-md">
                          Table {f.table}
                        </span>
                      )}

                      {!f.responded ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full border border-amber-300">
                          ⏳ Pending Response
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full border border-emerald-300">
                          ✅ Replied
                        </span>
                      )}

                      <span className="text-xs text-gray-400 ml-auto font-medium">
                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{f.customerName || 'Guest Customer'}</p>
                      {f.customerPhone && <span className="text-xs text-gray-400 font-medium">({f.customerPhone})</span>}
                    </div>

                    {/* Sub-ratings breakdown */}
                    <div className="flex gap-3 text-[11px] text-gray-500 font-medium flex-wrap pt-1">
                      <span>🍲 Food: <strong className="text-gray-800">{f.foodRating || f.overall}★</strong></span>
                      <span>⚡ Service: <strong className="text-gray-800">{f.serviceRating || f.overall}★</strong></span>
                      <span>✨ Ambience: <strong className="text-gray-800">{f.ambienceRating || f.overall}★</strong></span>
                      <span>💰 Value: <strong className="text-gray-800">{f.valueRating || f.overall}★</strong></span>
                    </div>

                    {f.comment && (
                      <p className="text-sm text-gray-700 bg-gray-50/80 p-3 rounded-xl border border-gray-100 leading-relaxed italic">
                        "{f.comment}"
                      </p>
                    )}

                    {f.responded && f.response && (
                      <div className="bg-blue-50/80 rounded-xl p-3.5 border border-blue-100 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-blue-700 uppercase">
                          <span>Manager Response</span>
                          <span className="text-[10px] text-blue-400 font-normal">
                            {f.respondedAt ? new Date(f.respondedAt).toLocaleDateString('en-IN') : ''}
                          </span>
                        </div>
                        <p className="text-xs text-blue-900 font-medium">{f.response}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!f.responded ? (
                      <button
                        onClick={() => { setShowRespond(f.id); setResponseText('') }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark transition-all shadow-xs active:scale-95 whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" /> Reply
                      </button>
                    ) : (
                      <button
                        onClick={() => { setShowRespond(f.id); setResponseText(f.response || '') }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                      >
                        Edit Reply
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(f.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manager Respond Modal with Quick Reply Chips */}
      {showRespond && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-3xl sm:rounded-2xl p-6 space-y-4 animate-fade-up shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-gray-900">Reply to Customer Review</h3>
              </div>
              <button onClick={() => setShowRespond(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Template Replies */}
            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-2 block">1-Tap Reply Templates</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {QUICK_REPLIES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setResponseText(tpl)}
                    className="w-full text-left text-xs p-2 bg-gray-50 hover:bg-primary/10 hover:text-primary rounded-xl border border-gray-200/80 transition-all truncate"
                  >
                    "{tpl}"
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Your Reply Message *</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response to the customer..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none font-medium"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowRespond(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button
                onClick={() => handleRespond(showRespond)}
                disabled={!responseText.trim() || sending}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-all shadow-md shadow-primary/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Feedback Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full sm:max-w-md rounded-3xl sm:rounded-2xl p-6 space-y-4 animate-fade-up shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-lg font-bold text-gray-900">Record Customer Review</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={addForm.customerName}
                  onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={addForm.customerPhone}
                    onChange={(e) => setAddForm({ ...addForm, customerPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">Table No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 4"
                    value={addForm.table}
                    onChange={(e) => setAddForm({ ...addForm, table: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1.5 block">Overall Rating ⭐</label>
                <StarRating value={addForm.overall} onChange={(r) => setAddForm({ ...addForm, overall: r })} size="w-7 h-7" />
              </div>

              <div>
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">Comment / Review</label>
                <textarea
                  placeholder="What did the customer say about food, speed, or ambience?"
                  value={addForm.comment}
                  onChange={(e) => setAddForm({ ...addForm, comment: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleAddSubmission}
              disabled={sending}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 text-sm"
            >
              {sending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Submit Review Record'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
