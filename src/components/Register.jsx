import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { validateKey, isLicenseValid } from '../utils/license'
import { db } from '../firebase'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { Mail, Lock, Eye, EyeOff, User, Store, UserPlus, Key, X } from 'lucide-react'

export default function Register() {
  const [name, setName] = useState('')
  const [restaurant, setRestaurant] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, login, logout } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!licenseKey.trim()) {
      setError('A valid license key is required for registration. Please contact your administrator.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    let keyVersion = 1
    try {
      const q = query(collection(db, 'users'), where('email', '==', normalizedEmail))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const existingUser = snap.docs[0].data()
        keyVersion = existingUser.keyVersion || 1
        if (existingUser.keyRevoked) {
          setError('Your license key has been revoked by the administrator. Please contact your administrator to obtain a new license key.')
          return
        }
        if (existingUser.licenseExpiry && !isLicenseValid(existingUser.licenseExpiry)) {
          setError('Your license has expired. Please contact your administrator to obtain a renewed license key.')
          return
        }
      }
    } catch (err) {
      console.error('Error checking existing user:', err)
    }

    if (!validateKey(normalizedEmail, licenseKey.trim(), keyVersion)) {
      setError('The license key you entered is invalid or does not match your email. Please check and try again.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.')
      return
    }

    setLoading(true)
    try {
      await register(normalizedEmail, password, name, restaurant)
      navigate('/billing')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          const userCredential = await login(normalizedEmail, password)
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
          if (!userDoc.exists()) {
            const now = new Date()
            const expiry = new Date(now)
            expiry.setFullYear(expiry.getFullYear() + 1)
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              name,
              email: normalizedEmail,
              restaurant,
              profilePic: '',
              createdAt: now.toISOString(),
              licenseExpiry: expiry.toISOString(),
              keyVersion: 1,
              role: 'client'
            })
            navigate('/billing')
            return
          }
          const existingData = userDoc.data()
          if (existingData.keyRevoked) {
            await logout()
            setError('Your license key has been revoked by the administrator. Please contact your administrator to obtain a new license key.')
            return
          }
          if (existingData.licenseExpiry && !isLicenseValid(existingData.licenseExpiry)) {
            await logout()
            setError('Your license has expired. Please contact your administrator to obtain a renewed license key.')
            return
          }
          await logout()
          setError('An account with this email already exists. Please login instead.')
        } catch (loginErr) {
          setError('An account with this email already exists. Please login instead.')
        }
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.')
      } else {
        setError('An error occurred during registration. Please try again.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-secondary">
      {/* Video — full page background on desktop */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/login-video.mp4"
        />
        {/* Darkens left side, fades to transparent toward center */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.4) 30%, rgba(10,10,10,0.1) 50%, transparent 65%)' }} />
        {/* Bottom vignette */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 50%)' }} />
      </div>

      {/* Mobile background */}
      <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-orange-50/30" />

      {/* Content layer */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left — text on video (desktop only) */}
        <div className="hidden lg:flex lg:w-[55%] items-center justify-center px-16">
          <div className="text-center max-w-lg -mt-16">
            <h2 className="text-5xl text-white mb-4 leading-tight drop-shadow-lg" style={{ fontFamily: "'Great Vibes', cursive" }}>Start Managing Today</h2>
            <p className="text-white/60 text-lg font-light tracking-wide drop-shadow" style={{ fontFamily: "'Inter', sans-serif" }}>Create your account and run your restaurant in minutes.</p>
            <div className="mt-8 flex items-center justify-center gap-6 text-white/40 text-xs font-medium tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span>Free Setup</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span>No Hidden Fees</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Right — form card */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-12 relative">
          {/* Dot pattern (mobile only) */}
          <div className="lg:hidden absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #DC2626 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="w-full max-w-md relative z-10">
          {/* Logo (mobile only) */}
          <div className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <img src="/logo-app.png" alt="DaawatDesk" className="h-16 w-auto object-contain" />
            </Link>
            <h1 className="text-3xl font-extrabold text-secondary tracking-tight">Create Account</h1>
            <p className="text-gray-500 mt-2 text-sm">Set up your restaurant in minutes</p>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <img src="/logo-app.png" alt="DaawatDesk" className="h-12 w-auto object-contain" />
            </Link>
            <h1 className="text-3xl font-extrabold text-secondary tracking-tight">Create Account</h1>
            <p className="text-gray-500 mt-2 text-sm">Set up your restaurant in minutes</p>
          </div>

        <div className="bg-white/40 backdrop-blur-lg rounded-[2rem] shadow-2xl shadow-black/5 border border-white/20 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange to-amber-500" />
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200/80 text-red-600 text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </div>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Your Name</label>
              <div className="relative">
                <User className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all text-sm"
                  placeholder="Rajesh Kumar"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Restaurant Name</label>
              <div className="relative">
                <Store className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={restaurant}
                  onChange={(e) => setRestaurant(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all text-sm"
                  placeholder="Spice Garden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all text-sm"
                  placeholder="you@restaurant.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">License Key</label>
              <div className="relative">
                <Key className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all text-sm font-mono tracking-wider"
                  placeholder="DAW-XXXX-XXXX-XXXX"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">Contact your administrator for a license key.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all text-sm"
                  placeholder="6+ characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all text-sm"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary via-red-600 to-orange hover:from-primary-dark hover:via-red-700 hover:to-orange text-white font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.97] flex items-center justify-center gap-2.5 disabled:opacity-50 text-sm tracking-wide"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:text-primary-dark transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:text-white/60 transition-colors">← Back to Home</Link>
        </p>
        </div>
      </div>
      </div>
    </div>
  )
}
