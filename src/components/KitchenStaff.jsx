import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, updateDoc, deleteDoc, doc, where, getDocs, limit, writeBatch, increment } from 'firebase/firestore'

function getElapsed(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return { mins, secs, totalSecs: Math.floor(diff / 1000) }
}

function ElapsedTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState(() => getElapsed(createdAt))
  useEffect(() => {
    const iv = setInterval(() => setElapsed(getElapsed(createdAt)), 1000)
    return () => clearInterval(iv)
  }, [createdAt])
  const isStale = elapsed.totalSecs > 300
  return (
    <span className={`flex items-center gap-1 text-xs ${isStale ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
      {isStale && <span className="text-xs">⚠</span>}
      {elapsed.mins > 0 ? `${elapsed.mins}m ${elapsed.secs}s` : `${elapsed.secs}s`}
    </span>
  )
}

const columnConfig = {
  pending: { title: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
  preparing: { title: 'Preparing', color: 'text-blue', bg: 'bg-blue/5', border: 'border-blue/20', dot: 'bg-blue' },
  ready: { title: 'Ready', color: 'text-green', bg: 'bg-green/5', border: 'border-green/20', dot: 'bg-green' },
}

function CodeEntryScreen({ onSuccess }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    if (code.trim().length !== 6) { setError('Enter 6-character code'); return }
    setLoading(true)
    setError('')
    try {
      const q = query(collection(db, 'users'), where('restaurantCode', '==', code.trim().toUpperCase()), limit(1))
      const snap = await getDocs(q)
      if (snap.empty) { setError('Invalid code. Check and try again.'); setLoading(false); return }
      const userDoc = snap.docs[0]
      onSuccess(userDoc.id, userDoc.data())
    } catch {
      setError('Connection error. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">👨‍🍳</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary mb-1">Kitchen Staff</h1>
          <p className="text-sm text-gray-500">Enter restaurant code to view orders</p>
        </div>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] border-2 border-gray-200 rounded-xl outline-none focus:border-primary transition-colors"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>
          <button
            onClick={handleLogin}
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Connect'}
          </button>
        </div>
        <button onClick={() => navigate('/login')} className="w-full mt-4 text-sm text-gray-400 hover:text-primary text-center transition-colors">
          ← Back to Login
        </button>
      </div>
    </div>
  )
}

function KitchenDashboard({ ownerUid }) {
  const navigate = useNavigate()
  const [kots, setKots] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [restaurantName, setRestaurantName] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', ownerUid), (snap) => {
      if (snap.exists()) setRestaurantName(snap.data().restaurant || snap.data().name || '')
    })
    return () => unsub()
  }, [ownerUid])

  useEffect(() => {
    const q = query(collection(db, 'users', ownerUid, 'kots'))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      setKots(items)
    }, () => {})
    return () => unsub()
  }, [ownerUid])

  const filtered = kots.filter((k) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return k.table?.toLowerCase().includes(q) || k.items?.some((i) => i.name.toLowerCase().includes(q))
  })

  const pending = filtered.filter((k) => k.status === 'pending')
  const preparing = filtered.filter((k) => k.status === 'preparing')
  const ready = filtered.filter((k) => k.status === 'ready')

  async function handleUpdateStatus(id, status) {
    await updateDoc(doc(db, 'users', ownerUid, 'kots', id), { status })
    if (status === 'ready') {
      await updateDoc(doc(db, 'users', ownerUid), { readyCount: increment(1) })
    }
  }

  async function handleMarkItemReady(id, itemIndex) {
    const kot = kots.find((k) => k.id === id)
    if (!kot) return
    const newItemStatus = [...(kot.itemStatus || kot.items.map(() => 'pending'))]
    newItemStatus[itemIndex] = newItemStatus[itemIndex] === 'done' ? 'pending' : 'done'
    const allDone = newItemStatus.every((s) => s === 'done')
    const newStatus = allDone ? 'ready' : kot.status === 'pending' ? 'preparing' : kot.status
    await updateDoc(doc(db, 'users', ownerUid, 'kots', id), { itemStatus: newItemStatus, status: newStatus })
    if (allDone) {
      await updateDoc(doc(db, 'users', ownerUid), { readyCount: increment(1) })
    }
  }

  async function handleMarkAllReady(id) {
    const kot = kots.find((k) => k.id === id)
    if (!kot) return
    const allDoneItems = (kot.items || []).map(() => 'done')
    await updateDoc(doc(db, 'users', ownerUid, 'kots', id), { itemStatus: allDoneItems, status: 'ready' })
    await updateDoc(doc(db, 'users', ownerUid), { readyCount: increment(1) })
  }

  async function handleRemove(id) {
    const kot = kots.find((k) => k.id === id)
    await deleteDoc(doc(db, 'users', ownerUid, 'kots', id))
    if (kot?.status === 'ready') {
      await updateDoc(doc(db, 'users', ownerUid), { readyCount: increment(-1) })
    }
  }

  function renderKOT(kot) {
    const isStale = getElapsed(kot.createdAt).totalSecs > 300
    const itemStatus = kot.itemStatus || kot.items.map(() => 'pending')
    const doneCount = itemStatus.filter((s) => s === 'done').length

    return (
      <div
        key={kot.id}
        className={`bg-white rounded-2xl border-2 p-4 transition-all hover:shadow-lg ${
          isStale && kot.status === 'pending' ? 'border-red-300 shadow-red-100' : columnConfig[kot.status]?.border || 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-secondary">{kot.table}</span>
            {kot.source === 'qr-order' && (
              <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">📱 QR</span>
            )}
            {kot.status === 'preparing' && (
              <span className="text-[10px] font-medium text-blue bg-blue/10 px-2 py-0.5 rounded-full">
                {doneCount}/{itemStatus.length}
              </span>
            )}
          </div>
          <ElapsedTimer createdAt={kot.createdAt} />
        </div>

        {kot.notes && (
          <div className="flex items-start gap-1.5 mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-amber-500 mt-0.5 text-xs">📝</span>
            <span className="text-xs text-amber-700 leading-relaxed">{kot.notes}</span>
          </div>
        )}

        <div className="space-y-1.5 mb-4">
          {kot.items.map((item, i) => {
            const isDone = itemStatus[i] === 'done'
            return (
              <div
                key={i}
                onClick={() => kot.status === 'preparing' && handleMarkItemReady(kot.id, i)}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all ${
                  kot.status === 'preparing' ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${isDone ? 'bg-green/5 opacity-60' : 'bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  {kot.status === 'preparing' ? (
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isDone ? 'bg-green border-green' : 'border-gray-300'
                    }`}>
                      {isDone && <span className="text-white text-xs">✓</span>}
                    </div>
                  ) : (
                    <span className={`w-2.5 h-2.5 rounded-sm border-[1.5px] ${item.veg ? 'border-green' : 'border-red-500'}`}>
                      <span className={`block w-1 h-1 rounded-full mx-auto mt-[1px] ${item.veg ? 'bg-green' : 'bg-red-500'}`}></span>
                    </span>
                  )}
                  <span className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-secondary'}`}>{item.name}</span>
                </div>
                <span className={`text-sm font-bold ${isDone ? 'text-gray-400' : 'text-secondary'}`}>x{item.qty}</span>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2">
          {kot.status === 'pending' && (
            <button onClick={() => handleUpdateStatus(kot.id, 'preparing')} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue/10 text-blue font-semibold rounded-xl hover:bg-blue/20 transition-colors text-sm">
              Start Preparing
            </button>
          )}
          {kot.status === 'preparing' && (
            <button onClick={() => handleMarkAllReady(kot.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green/10 text-green font-semibold rounded-xl hover:bg-green/20 transition-colors text-sm">
              Mark All Ready
            </button>
          )}
          {kot.status === 'ready' && (
            <button onClick={() => handleRemove(kot.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-500 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm">
              Clear
            </button>
          )}
          {kot.status !== 'ready' && (
            <button onClick={() => handleRemove(kot.id)} className="px-3 py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors text-sm">
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  function renderColumn(status, items) {
    const config = columnConfig[status]
    return (
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`}></span>
          <h2 className={`font-bold text-sm ${config.color}`}>{config.title}</h2>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
        </div>
        <div className={`flex-1 rounded-2xl p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-180px)] ${config.bg} border ${config.border}`}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <p className="text-sm">No orders</p>
            </div>
          ) : (
            items.map(renderKOT)
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
              <span className="text-lg">←</span>
              <span className="font-medium hidden sm:inline">Switch</span>
            </button>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">👨‍🍳</span>
              <h1 className="text-xl font-bold text-secondary truncate hidden sm:block">{restaurantName || 'Kitchen Staff'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-4 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-48"
              />
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span><strong>{pending.length}</strong></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue rounded-full"></span><strong>{preparing.length}</strong></span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green rounded-full"></span><strong>{ready.length}</strong></span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-[1600px] mx-auto w-full p-4">
        {kots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-6xl mb-4 opacity-30">👨‍🍳</span>
            <p className="text-xl font-semibold mb-2">No orders yet</p>
            <p className="text-sm">KOTs from billing will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {renderColumn('pending', pending)}
            {renderColumn('preparing', preparing)}
            {renderColumn('ready', ready)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function KitchenStaff() {
  const [connected, setConnected] = useState(false)
  const [ownerUid, setOwnerUid] = useState(null)

  if (!connected) {
    return <CodeEntryScreen onSuccess={(uid) => { setOwnerUid(uid); setConnected(true) }} />
  }

  return <KitchenDashboard ownerUid={ownerUid} />
}
