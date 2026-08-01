import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'

const ReservationContext = createContext()

export function useReservations() {
  return useContext(ReservationContext)
}

export function ReservationProvider({ children }) {
  const { currentUser } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) { setReservations([]); setLoading(false); return }
    const q = query(collection(db, 'users', currentUser.uid, 'reservations'), orderBy('date'), orderBy('time'))
    const unsub = onSnapshot(q, (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [currentUser])

  async function addReservation(data) {
    if (!currentUser) return
    return addDoc(collection(db, 'users', currentUser.uid, 'reservations'), {
      ...data,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    })
  }

  async function updateReservation(id, data) {
    if (!currentUser) return
    return updateDoc(doc(db, 'users', currentUser.uid, 'reservations', id), data)
  }

  async function deleteReservation(id) {
    if (!currentUser) return
    return deleteDoc(doc(db, 'users', currentUser.uid, 'reservations', id))
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const todayReservations = reservations.filter((r) => r.date === todayStr && r.status !== 'cancelled')
  const upcomingReservations = reservations.filter((r) => r.date > todayStr && r.status !== 'cancelled')
  const cancelledCount = reservations.filter((r) => r.status === 'cancelled').length

  function getReservationsForDate(dateStr) {
    return reservations.filter((r) => r.date === dateStr && r.status !== 'cancelled')
  }

  function isTableAvailable(tableNum, date, time, excludeId) {
    const conflicts = reservations.filter((r) =>
      r.id !== excludeId &&
      r.date === date &&
      r.table === tableNum &&
      r.status !== 'cancelled'
    )
    if (conflicts.length === 0) return true
    return !conflicts.some((r) => {
      const rStart = timeToMin(r.time)
      const rEnd = rStart + (r.duration || 60)
      const newStart = timeToMin(time)
      const newEnd = newStart + 60
      return newStart < rEnd && newEnd > rStart
    })
  }

  function timeToMin(t) {
    const [h, m] = (t || '00:00').split(':').map(Number)
    return h * 60 + m
  }

  const value = {
    reservations,
    loading,
    addReservation,
    updateReservation,
    deleteReservation,
    todayReservations,
    upcomingReservations,
    cancelledCount,
    getReservationsForDate,
    isTableAvailable,
  }

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>
}
