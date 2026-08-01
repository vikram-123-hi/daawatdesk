import { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'

const CodeAccessContext = createContext()

export function useCodeAccess() {
  return useContext(CodeAccessContext)
}

export function CodeAccessProvider({ children }) {
  const [codeUser, setCodeUser] = useState(() => {
    try {
      const stored = localStorage.getItem('daawatdesk_code_access')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    if (codeUser) {
      localStorage.setItem('daawatdesk_code_access', JSON.stringify(codeUser))
    } else {
      localStorage.removeItem('daawatdesk_code_access')
    }
  }, [codeUser])

  async function validateCode(code) {
    if (!code || code.trim().length < 4) return { success: false, error: 'Enter a valid code' }
    setValidating(true)
    try {
      const q = query(collection(db, 'users'), where('restaurantCode', '==', code.trim().toUpperCase()), limit(1))
      const snap = await getDocs(q)
      if (snap.empty) {
        setValidating(false)
        return { success: false, error: 'Invalid code. Check and try again.' }
      }
      const userDoc = snap.docs[0]
      const data = userDoc.data()
      const user = { uid: userDoc.id, restaurantCode: data.restaurantCode, name: data.name || data.restaurant || 'Restaurant' }
      setCodeUser(user)
      setValidating(false)
      return { success: true }
    } catch {
      setValidating(false)
      return { success: false, error: 'Connection error. Try again.' }
    }
  }

  function clearCodeAccess() {
    setCodeUser(null)
    localStorage.removeItem('daawatdesk_code_access')
  }

  const value = { codeUser, validating, validateCode, clearCodeAccess }
  return <CodeAccessContext.Provider value={value}>{children}</CodeAccessContext.Provider>
}
