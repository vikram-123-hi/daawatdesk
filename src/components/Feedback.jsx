import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFeedback } from '../context/FeedbackContext'
import {
  ArrowLeft, Star, Search, X, MessageSquare, Send, Trash2,
  ThumbsUp, ThumbsDown, Utensils, Users, Sparkles, IndianRupee
} from 'lucide-react'

const CATEGORIES = [
  { id: 'food', label: 'Food Quality', icon: Utensils, color: 'text-orange-500' },
  { id: 'service', label: 'Service', icon: Users, color: 'text-blue-500' },
  { id: 'ambience', label: 'Ambience', icon: Sparkles, color: 'text-purple-500' },
  { id: 'value', label: 'Value for Money', icon: IndianRupee, color: 'text-green-500' },
]

function StarRating({ value, onChange, readonly = false, size = 'w-6 h-6' }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHovered(s)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(s)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
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
  const { feedbacks, loading, addFeedback, respondToFeedback, deleteFeedback, avgRating, respondedCount, pendingCount, ratingDistribution } = useFeedback()
  const [search, setSearch] = useState('')
  const [filterRating, setFilterRating] = useState(0)
  const [filterCategory, setFilterCategory] = useState('all')
  const [showRespond, setShowRespond] = useState(null)
  const [responseText, setResponseText] = useState('')
  const [sending, setSending] = useState(false)

  const filtered = useMemo(() => {
    return feedbacks.filter((f) => {
      if (filterRating > 0 && Number(f.overall) !== filterRating) return false
      if (filterCategory !== 'all' && f.category !== filterCategory) return false
      if (search) {
        const s = search.toLowerCase()
        return (f.customerName || '').toLowerCase().includes(s) || (f.comment || '').toLowerCase().includes(s)
      }
      return true
    })
  }, [feedbacks, filterRating, filterCategory, search])

  async function handleRespond(id) {
    if (!responseText.trim()) return
    setSending(true)
    try {
      await respondToFeedback(id, responseText.trim())
      setShowRespond(null)
      setResponseText('')
    } catch {}
    setSending(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this feedback?')) return
    await deleteFeedback(id)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-all duration-200 active:scale-90 group">
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="text-sm font-medium hidden sm:inline group-hover:font-bold min-w-[5rem] text-center">Dashboard</span>
          </button>
          <div className="h-5 w-px bg-gray-200"></div>
          <MessageSquare className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-gray-900"><span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span> <span className="text-gray-400 font-medium">Customer Feedback</span></h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Avg Rating</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{avgRating}</p>
            <p className="text-xs text-gray-400 mt-0.5">{feedbacks.length} reviews</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Responded</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{respondedCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <ThumbsDown className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Pending</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-500 fill-purple-400" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">5 Star</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{fiveStarCount || 0}</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Rating Distribution</h3>
          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500 w-6 text-right">{star}★</span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-400 w-10 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[0, 5, 4, 3, 2, 1].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRating(r)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${filterRating === r ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {r === 0 ? 'All' : <>{r}<Star className="w-3 h-3 fill-current" /></>}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No feedback yet</p>
            <p className="text-sm text-gray-300 mt-1">Customer feedback will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((f) => {
              const cat = CATEGORIES.find((c) => c.id === f.category)
              return (
                <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating value={Number(f.overall)} readonly size="w-4 h-4" />
                        {cat && (
                          <span className={`flex items-center gap-1 text-[10px] font-semibold ${cat.color} bg-gray-50 px-2 py-0.5 rounded-full`}>
                            <cat.icon className="w-3 h-3" /> {cat.label}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>
                      {f.customerName && (
                        <p className="text-xs font-semibold text-gray-700 mb-1">{f.customerName}</p>
                      )}
                      {f.comment && (
                        <p className="text-sm text-gray-600 leading-relaxed">{f.comment}</p>
                      )}
                      {f.responded && f.response && (
                        <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
                          <p className="text-[10px] font-semibold text-blue-600 mb-1">Your Response</p>
                          <p className="text-xs text-blue-700">{f.response}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {!f.responded && (
                        <button
                          onClick={() => { setShowRespond(f.id); setResponseText('') }}
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-semibold hover:bg-blue-100 transition-all active:scale-90 whitespace-nowrap"
                        >
                          Reply
                        </button>
                      )}
                      <button onClick={() => handleDelete(f.id)} className="px-2.5 py-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-[10px] transition-all">
                        Del
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Respond Modal */}
      {showRespond && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-gray-900">Respond to Feedback</h2>
              </div>
              <button onClick={() => setShowRespond(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write your response..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowRespond(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => handleRespond(showRespond)}
                  disabled={!responseText.trim() || sending}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
