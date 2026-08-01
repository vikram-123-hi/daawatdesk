import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, increment } from 'firebase/firestore'

const KOTContext = createContext()

export function useKOT() {
  return useContext(KOTContext)
}

function playBeepSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.value = 0.3
    osc.start()
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.stop(ctx.currentTime + 0.3)
  } catch {}
}

function playReadySound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523, 659, 784]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.value = 0.25
      osc.start(ctx.currentTime + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.25)
      osc.stop(ctx.currentTime + i * 0.15 + 0.25)
    })
  } catch {}
}

function playPaymentSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.value = 0.2
      osc.start(ctx.currentTime + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2)
      osc.stop(ctx.currentTime + i * 0.12 + 0.2)
    })
  } catch {}
}

export function KOTProvider({ children }) {
  const { currentUser } = useAuth()
  const [kots, setKots] = useState([])
  const [readyCount, setReadyCount] = useState(0)
  const [readyAlerts, setReadyAlerts] = useState([])
  const [qrPayments, setQrPayments] = useState([])
  const prevKotsRef = useRef([])
  const initialLoadDone = useRef(false)

  // Subscribe to active KOTs only (pending + preparing)
  useEffect(() => {
    if (!currentUser) { setKots([]); return }
    const q = query(
      collection(db, 'users', currentUser.uid, 'kots'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      const prev = prevKotsRef.current
      const isInitial = !initialLoadDone.current
      if (isInitial) initialLoadDone.current = true

      items.forEach((kot) => {
        const old = prev.find((p) => p.id === kot.id)
        if (!isInitial && !old && kot.status !== 'ready') {
          playBeepSound()
        }
        if (old && old.status !== 'ready' && kot.status === 'ready') {
          playReadySound()
          setReadyAlerts((a) => [...a, { id: kot.id, table: kot.table, time: Date.now() }])
        }
        if (!isInitial && !old && kot.source === 'qr-order' && kot.payment === 'UPI (QR)') {
          playPaymentSound()
          setQrPayments((a) => [...a, {
            id: kot.id,
            table: kot.table,
            total: kot.total,
            customerName: kot.customerName || 'Guest',
            time: Date.now(),
          }])
        }
      })

      prevKotsRef.current = items
      setKots(items)
    })
    return () => unsub()
  }, [currentUser])

  // Subscribe to readyCount from user doc (single read)
  useEffect(() => {
    if (!currentUser) { setReadyCount(0); return }
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) setReadyCount(snap.data().readyCount || 0)
    })
    return () => unsub()
  }, [currentUser])

  function dismissReadyAlert(id) {
    setReadyAlerts((a) => a.filter((r) => r.id !== id))
  }

  function dismissQrPayment(id) {
    setQrPayments((a) => a.filter((p) => p.id !== id))
  }

  async function addKOT(kot) {
    if (!currentUser) return
    const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'kots'), {
      ...kot,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: kot.notes || '',
      itemStatus: (kot.items || []).map(() => 'pending'),
    })
    return docRef
  }

  async function addOrUpdateKOT(kot) {
    if (!currentUser) return
    const existingKot = kots.find(
      (k) => k.table === kot.table && (k.status === 'pending' || k.status === 'preparing' || k.status === 'ready')
    )
    if (existingKot) {
      const mergedItems = [...existingKot.items]
      const mergedStatus = [...(existingKot.itemStatus || existingKot.items.map(() => 'done'))]
      kot.items.forEach((newItem) => {
        const idx = mergedItems.findIndex((i) => i.name === newItem.name && i.price === newItem.price)
        if (idx >= 0) {
          if (mergedStatus[idx] === 'done') {
            mergedItems.push({ ...newItem })
            mergedStatus.push('pending')
          } else {
            mergedItems[idx] = { ...mergedItems[idx], qty: mergedItems[idx].qty + newItem.qty }
          }
        } else {
          mergedItems.push({ ...newItem })
          mergedStatus.push('pending')
        }
      })
      const newSubtotal = mergedItems.reduce((s, i) => s + i.price * i.qty, 0)
      const gstVal = Number((newSubtotal * 0.05).toFixed(2))
      const newTotal = Number((newSubtotal + gstVal).toFixed(2))
      const hasPending = mergedStatus.includes('pending')
      await updateDoc(doc(db, 'users', currentUser.uid, 'kots', existingKot.id), {
        items: mergedItems,
        itemStatus: mergedStatus,
        subtotal: newSubtotal,
        gst: gstVal,
        total: newTotal,
        status: hasPending ? 'pending' : existingKot.status,
        updatedAt: new Date().toISOString(),
      })
      if (existingKot.status === 'ready' && hasPending) {
        await updateDoc(doc(db, 'users', currentUser.uid), { readyCount: increment(-1) })
      }
      return existingKot.id
    } else {
      return addKOT(kot)
    }
  }

  async function updateKOTStatus(id, status) {
    if (!currentUser) return
    await updateDoc(doc(db, 'users', currentUser.uid, 'kots', id), { status })
    if (status === 'ready') {
      await updateDoc(doc(db, 'users', currentUser.uid), { readyCount: increment(1) })
    }
  }

  async function markItemReady(id, itemIndex) {
    if (!currentUser) return
    const kot = kots.find((k) => k.id === id)
    if (!kot) return
    const newItemStatus = [...(kot.itemStatus || kot.items.map(() => 'pending'))]
    newItemStatus[itemIndex] = newItemStatus[itemIndex] === 'done' ? 'pending' : 'done'
    const allDone = newItemStatus.every((s) => s === 'done')
    await updateDoc(doc(db, 'users', currentUser.uid, 'kots', id), {
      itemStatus: newItemStatus,
      status: allDone ? 'ready' : kot.status === 'pending' ? 'preparing' : kot.status,
    })
    if (allDone) {
      await updateDoc(doc(db, 'users', currentUser.uid), { readyCount: increment(1) })
    }
  }

  async function removeKOT(id) {
    if (!currentUser) return
    const kot = kots.find((k) => k.id === id)
    await deleteDoc(doc(db, 'users', currentUser.uid, 'kots', id))
    if (kot?.status === 'ready') {
      await updateDoc(doc(db, 'users', currentUser.uid), { readyCount: increment(-1) })
    }
  }

  const value = { kots, addKOT, addOrUpdateKOT, updateKOTStatus, markItemReady, removeKOT, readyCount, readyAlerts, dismissReadyAlert, playPaymentSound, qrPayments, dismissQrPayment }
  return <KOTContext.Provider value={value}>{children}</KOTContext.Provider>
}
