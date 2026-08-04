import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from '../firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore'

const FeedbackContext = createContext()

export function useFeedback() {
  return useContext(FeedbackContext)
}

export const QUICK_REPLIES = [
  "Thank you for dining with us! We are thrilled you enjoyed the food and service. Hope to see you again soon! 😊",
  "Thank you so much for your glowing review! Our team is delighted to serve you. 🌟",
  "We sincerely apologize that your experience did not meet expectations. We are looking into this and will improve immediately. 🙏",
  "Thank you for your valuable feedback! We appreciate your suggestions and hope to serve you better on your next visit.",
]

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
      overall: Number(data.overall) || 5,
      foodRating: Number(data.foodRating) || Number(data.overall) || 5,
      serviceRating: Number(data.serviceRating) || Number(data.overall) || 5,
      ambienceRating: Number(data.ambienceRating) || Number(data.overall) || 5,
      valueRating: Number(data.valueRating) || Number(data.overall) || 5,
      customerName: (data.customerName || 'Guest').trim(),
      customerPhone: (data.customerPhone || '').trim(),
      table: data.table || '',
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
    return deleteDoc(doc(db, 'users', currentUser.uid, 'feedback', id))
  }

  const activeFeedbacks = feedbacks.filter((f) => !f.deleted)
  const avgRating = activeFeedbacks.length > 0
    ? (activeFeedbacks.reduce((s, f) => s + (Number(f.overall) || 0), 0) / activeFeedbacks.length).toFixed(1)
    : '0.0'

  const satisfiedCount = activeFeedbacks.filter((f) => Number(f.overall) >= 4).length
  const satisfiedPercent = activeFeedbacks.length > 0 ? Math.round((satisfiedCount / activeFeedbacks.length) * 100) : 0

  const respondedCount = activeFeedbacks.filter((f) => f.responded).length
  const pendingCount = activeFeedbacks.filter((f) => !f.responded).length
  const fiveStarCount = activeFeedbacks.filter((f) => Number(f.overall) === 5).length

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: activeFeedbacks.filter((f) => Number(f.overall) === star).length,
    pct: activeFeedbacks.length > 0 ? Math.round((activeFeedbacks.filter((f) => Number(f.overall) === star).length / activeFeedbacks.length) * 100) : 0,
  }))

  const categoryAverages = {
    food: activeFeedbacks.length > 0 ? (activeFeedbacks.reduce((s, f) => s + (Number(f.foodRating || f.overall) || 0), 0) / activeFeedbacks.length).toFixed(1) : '5.0',
    service: activeFeedbacks.length > 0 ? (activeFeedbacks.reduce((s, f) => s + (Number(f.serviceRating || f.overall) || 0), 0) / activeFeedbacks.length).toFixed(1) : '5.0',
    ambience: activeFeedbacks.length > 0 ? (activeFeedbacks.reduce((s, f) => s + (Number(f.ambienceRating || f.overall) || 0), 0) / activeFeedbacks.length).toFixed(1) : '5.0',
    value: activeFeedbacks.length > 0 ? (activeFeedbacks.reduce((s, f) => s + (Number(f.valueRating || f.overall) || 0), 0) / activeFeedbacks.length).toFixed(1) : '5.0',
  }

  const value = {
    feedbacks: activeFeedbacks,
    loading,
    addFeedback,
    respondToFeedback,
    deleteFeedback,
    avgRating,
    satisfiedPercent,
    respondedCount,
    pendingCount,
    fiveStarCount,
    ratingDistribution,
    categoryAverages,
    QUICK_REPLIES,
  }

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
}
