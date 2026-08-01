import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'

const FeedbackContext = createContext()

export function useFeedback() {
  return useContext(FeedbackContext)
}

export function FeedbackProvider({ children }) {
  const { currentUser } = useAuth()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) { setFeedbacks([]); setLoading(false); return }
    const q = query(collection(db, 'users', currentUser.uid, 'feedback'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setFeedbacks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return () => unsub()
  }, [currentUser])

  async function addFeedback(data) {
    if (!currentUser) return
    return addDoc(collection(db, 'users', currentUser.uid, 'feedback'), {
      ...data,
      responded: false,
      response: '',
      createdAt: new Date().toISOString(),
    })
  }

  async function respondToFeedback(id, response) {
    if (!currentUser) return
    return updateDoc(doc(db, 'users', currentUser.uid, 'feedback', id), {
      responded: true,
      response,
      respondedAt: new Date().toISOString(),
    })
  }

  async function deleteFeedback(id) {
    if (!currentUser) return
    return updateDoc(doc(db, 'users', currentUser.uid, 'feedback', id), { deleted: true })
  }

  const activeFeedbacks = feedbacks.filter((f) => !f.deleted)
  const avgRating = activeFeedbacks.length > 0
    ? (activeFeedbacks.reduce((s, f) => s + (Number(f.overall) || 0), 0) / activeFeedbacks.length).toFixed(1)
    : '0.0'
  const respondedCount = activeFeedbacks.filter((f) => f.responded).length
  const pendingCount = activeFeedbacks.filter((f) => !f.responded).length
  const fiveStarCount = activeFeedbacks.filter((f) => Number(f.overall) === 5).length
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: activeFeedbacks.filter((f) => Number(f.overall) === star).length,
    pct: activeFeedbacks.length > 0 ? Math.round((activeFeedbacks.filter((f) => Number(f.overall) === star).length / activeFeedbacks.length) * 100) : 0,
  }))

  const value = {
    feedbacks: activeFeedbacks,
    loading,
    addFeedback,
    respondToFeedback,
    deleteFeedback,
    avgRating,
    respondedCount,
    pendingCount,
    fiveStarCount,
    ratingDistribution,
  }

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
}
