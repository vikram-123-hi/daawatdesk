import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCJ31gix6GQ548KiUkxWcKl-oBOXCbJh8g",
  authDomain: "daawatdesk-auth.firebaseapp.com",
  projectId: "daawatdesk-auth",
  storageBucket: "daawatdesk-auth.firebasestorage.app",
  messagingSenderId: "104836169235",
  appId: "1:104836169235:web:9693449c276e84a73889e6",
  measurementId: "G-M69L4Y0DJS"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export default app
