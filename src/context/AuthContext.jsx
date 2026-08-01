import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth'
import { auth, db, googleProvider } from '../firebase'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'

const IMGBB_API_KEY = 'e13bb1788b74bf8725b6b2344c8fc6fb'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

async function uploadToImgBB(file) {
  const formData = new FormData()
  formData.append('image', file)
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  })
  const data = await res.json()
  console.log('imgBB response:', data)
  if (data.success) {
    return data.data.url
  }
  throw new Error(data.error?.message || 'imgBB upload failed')
}

function generateRestaurantCode(uid) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const seed = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  for (let i = 0; i < 6; i++) {
    code += chars[(seed.charCodeAt(i % seed.length) + i * 7) % chars.length]
  }
  return code
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileFetched, setProfileFetched] = useState(false)

  async function register(email, password, name, restaurant) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(userCredential.user, { displayName: name })
    const now = new Date()
    const expiry = new Date(now)
    expiry.setFullYear(expiry.getFullYear() + 1)
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      restaurant,
      profilePic: '',
      createdAt: now.toISOString(),
      licenseExpiry: expiry.toISOString(),
      keyVersion: 1,
      role: 'client',
      restaurantCode: generateRestaurantCode(userCredential.user.uid),
      readyCount: 0,
    })
    return userCredential
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function loginWithGoogle({ adminOnly = false } = {}) {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      if (adminOnly && user.email !== 'swainvikramaditya99@gmail.com') {
        await signOut(auth)
        throw new Error('NOT_ADMIN')
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        const now = new Date()
        const expiry = new Date(now)
        expiry.setFullYear(expiry.getFullYear() + 1)
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || '',
          email: user.email,
          restaurant: '',
          profilePic: user.photoURL || '',
          createdAt: now.toISOString(),
          licenseExpiry: expiry.toISOString(),
          role: user.email === 'swainvikramaditya99@gmail.com' ? 'admin' : 'client',
          restaurantCode: generateRestaurantCode(user.uid),
          readyCount: 0,
        })
      }
      return result
    } catch (err) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        if (adminOnly) sessionStorage.setItem('googleAdminOnly', 'true')
        await signInWithRedirect(auth, googleProvider)
        return null
      }
      throw err
    }
  }

  async function handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth)
      if (!result) return null
      const user = result.user
      const adminOnly = sessionStorage.getItem('googleAdminOnly') === 'true'
      sessionStorage.removeItem('googleAdminOnly')
      if (adminOnly && user.email !== 'swainvikramaditya99@gmail.com') {
        await signOut(auth)
        throw new Error('NOT_ADMIN')
      }
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        const now = new Date()
        const expiry = new Date(now)
        expiry.setFullYear(expiry.getFullYear() + 1)
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || '',
          email: user.email,
          restaurant: '',
          profilePic: user.photoURL || '',
          createdAt: now.toISOString(),
          licenseExpiry: expiry.toISOString(),
          role: user.email === 'swainvikramaditya99@gmail.com' ? 'admin' : 'client',
          restaurantCode: generateRestaurantCode(user.uid),
          readyCount: 0,
        })
      }
      return result
    } catch (err) {
      console.error('Redirect result error:', err)
      return null
    }
  }

  function forgotPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  function logout() {
    setUserProfile(null)
    return signOut(auth)
  }

  async function uploadProfilePic(file) {
    if (!currentUser) return
    const url = await uploadToImgBB(file)
    await updateDoc(doc(db, 'users', currentUser.uid), { profilePic: url })
    await updateProfile(currentUser, { photoURL: url })
    setUserProfile((prev) => ({ ...prev, profilePic: url }))
    return url
  }

  async function removeProfilePic() {
    if (!currentUser) return
    await updateDoc(doc(db, 'users', currentUser.uid), { profilePic: '' })
    await updateProfile(currentUser, { photoURL: null })
    setUserProfile((prev) => ({ ...prev, profilePic: '' }))
  }

  async function fetchUserProfile(user) {
    if (!user) { setUserProfile(null); setProfileFetched(true); return }
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid))
      if (docSnap.exists()) {
        const data = docSnap.data()
        if (!data.restaurantCode) {
          const code = generateRestaurantCode(user.uid)
          await updateDoc(doc(db, 'users', user.uid), { restaurantCode: code, readyCount: 0 })
          data.restaurantCode = code
        } else if (data.readyCount === undefined) {
          await updateDoc(doc(db, 'users', user.uid), { readyCount: 0 })
        }
        setUserProfile(data)
      } else {
        setUserProfile(null)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
    setProfileFetched(true)
  }

  async function refreshProfile() {
    if (!currentUser) return null
    try {
      const docSnap = await getDoc(doc(db, 'users', currentUser.uid))
      if (docSnap.exists()) {
        const data = docSnap.data()
        setUserProfile(data)
        return data
      } else {
        setUserProfile(null)
        return null
      }
    } catch (err) {
      console.error('Error refreshing profile:', err)
      return userProfile
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      if (user) {
        fetchUserProfile(user)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const value = { currentUser, userProfile, profileFetched, register, login, loginWithGoogle, handleRedirectResult, forgotPassword, logout, uploadProfilePic, removeProfilePic, fetchUserProfile, refreshProfile, loading }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
