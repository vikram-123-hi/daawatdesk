import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReservations } from '../context/ReservationContext'
import {
  ArrowLeft, Plus, Trash2, Search, X, Calendar, Clock, Users, Phone,
  ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle, MapPin
} from 'lucide-react'

const STATUS_COLORS = {
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', label: 'Confirmed' },
  arrived: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', label: 'Arrived' },
  seated: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Seated' },
  completed: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', label: 'Completed' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', label: 'Cancelled' },
}

const TIME_SLOTS = []
for (let h = 10; h <= 23; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 23) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

export default function Reservations() {
  const navigate = useNavigate()
  const { reservations, loading, addReservation, updateReservation, deleteReservation, todayReservations, upcomingReservations } = useReservations()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    name: '', phone: '', date: new Date().toISOString().split('T')[0],
    time: '19:00', partySize: '2', table: '', notes: '', duration: '60',
  })
  const [saving, setSaving] = useState(false)

  const dateReservations = useMemo(() => {
    let list = reservations.filter((r) => r.date === selectedDate)
    if (filter === 'confirmed') list = list.filter((r) => r.status === 'confirmed')
    else if (filter === 'arrived') list = list.filter((r) => r.status === 'arrived' || r.status === 'seated')
    else if (filter === 'cancelled') list = list.filter((r) => r.status === 'cancelled')
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((r) => (r.name || '').toLowerCase().includes(s) || (r.phone || '').includes(s))
    }
    return list.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  }, [reservations, selectedDate, filter, search])

  function changeDate(delta) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  function openAdd() {
    setEditingId(null)
    setForm({ name: '', phone: '', date: selectedDate, time: '19:00', partySize: '2', table: '', notes: '', duration: '60' })
    setShowForm(true)
  }

  function openEdit(r) {
    setEditingId(r.id)
    setForm({
      name: r.name || '', phone: r.phone || '', date: r.date || '',
      time: r.time || '19:00', partySize: String(r.partySize || 2),
      table: r.table || '', notes: r.notes || '', duration: String(r.duration || 60),
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.date || !form.time) return
    setSaving(true)
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time: form.time,
        partySize: Number(form.partySize) || 2,
        table: form.table.trim(),
        notes: form.notes.trim(),
        duration: Number(form.duration) || 60,
      }
      if (editingId) {
        await updateReservation(editingId, data)
      } else {
        await addReservation(data)
      }
      setShowForm(false)
    } catch {}
    setSaving(false)
  }

  async function handleStatus(id, status) {
    await updateReservation(id, { status })
  }

  async function handleDelete(id) {
    if (!confirm('Delete this reservation?')) return
    await deleteReservation(id)
  }

  const displayDate = new Date(selectedDate + 'T00:00:00')
  const dateLabel = displayDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200/60 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-all duration-200 active:scale-90 group">
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="text-sm font-medium hidden sm:inline group-hover:font-bold min-w-[5rem] text-center">Dashboard</span>
          </button>
          <div className="h-5 w-px bg-gray-200"></div>
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-gray-900"><span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span> <span className="text-gray-400 font-medium">Reservations</span></h1>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95">
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Today's Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Today</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{todayReservations.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">{todayReservations.reduce((s, r) => s + (Number(r.partySize) || 0), 0)} guests</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Checked In</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{todayReservations.filter((r) => r.status === 'arrived' || r.status === 'seated').length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase">Pending</span>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{todayReservations.filter((r) => r.status === 'confirmed').length}</p>
          </div>
        </div>

        {/* Date Navigator */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
          <button onClick={() => changeDate(-1)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-90">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-bold text-gray-900">{dateLabel}</p>
            {isToday && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">TODAY</span>}
          </div>
          <button onClick={() => changeDate(1)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-90">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {[['all', 'All'], ['confirmed', 'Confirmed'], ['arrived', 'Arrived'], ['cancelled', 'Cancelled']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${filter === key ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Reservation List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dateReservations.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No reservations for {dateLabel}</p>
            <p className="text-sm text-gray-300 mt-1">Click "New Booking" to add one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dateReservations.map((r) => {
              const sc = STATUS_COLORS[r.status] || STATUS_COLORS.confirmed
              return (
                <div key={r.id} className={`bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all ${r.status === 'cancelled' ? 'opacity-60 border-red-100' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${sc.bg} border ${sc.border}`}>
                        <span className={`text-lg font-extrabold ${sc.text}`}>{r.time?.slice(0, 5)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{r.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {r.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {r.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {r.partySize} guests
                          </span>
                          {r.table && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Table {r.table}
                            </span>
                          )}
                        </div>
                        {r.notes && <p className="text-xs text-gray-400 mt-1 truncate">{r.notes}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {r.status === 'confirmed' && (
                        <>
                          <button onClick={() => handleStatus(r.id, 'arrived')} className="px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-semibold hover:bg-green-100 transition-all active:scale-90 whitespace-nowrap">
                            Check In
                          </button>
                          <button onClick={() => handleStatus(r.id, 'cancelled')} className="px-2.5 py-1 bg-red-50 text-red-500 rounded-lg text-[10px] font-semibold hover:bg-red-100 transition-all active:scale-90 whitespace-nowrap">
                            Cancel
                          </button>
                        </>
                      )}
                      {r.status === 'arrived' && (
                        <button onClick={() => handleStatus(r.id, 'seated')} className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-semibold hover:bg-emerald-100 transition-all active:scale-90 whitespace-nowrap">
                          Seat
                        </button>
                      )}
                      {(r.status === 'seated') && (
                        <button onClick={() => handleStatus(r.id, 'completed')} className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-semibold hover:bg-gray-200 transition-all active:scale-90 whitespace-nowrap">
                          Done
                        </button>
                      )}
                      <div className="flex gap-1 mt-0.5">
                        <button onClick={() => openEdit(r)} className="px-2 py-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg text-[10px] transition-all">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg text-[10px] transition-all">
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-gray-900">{editingId ? 'Edit Reservation' : 'New Reservation'}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'none' }}>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Guest Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
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
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Party Size *</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="20"
                    value={form.partySize}
                    onChange={(e) => setForm({ ...form, partySize: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Time *</label>
                  <select
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Table</label>
                  <input
                    type="text"
                    value={form.table}
                    onChange={(e) => setForm({ ...form, table: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Duration</label>
                  <select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none"
                  >
                    <option value="30">30 min</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special requests, occasion, etc."
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
                disabled={!form.name.trim() || !form.date || !form.time || saving}
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Book Table'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
