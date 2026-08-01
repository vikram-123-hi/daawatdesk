import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isLicenseValid } from '../utils/license'
import { db } from '../firebase'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { Mail, Lock, Eye, EyeOff, LogIn, KeyRound, X, CheckCircle } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

function FloatingOrb({ size, color, top, left, delay }) {
  return (
    <div
      className="absolute rounded-full opacity-20 blur-3xl animate-float"
      style={{ width: size, height: size, background: color, top, left, animationDelay: delay, animationDuration: `${6 + Math.random() * 4}s` }}
    />
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [expiredLicense, setExpiredLicense] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const { currentUser, login, logout, forgotPassword } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) {
      setCheckingSession(false)
      return
    }
    let cancelled = false
    async function checkSession() {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (cancelled) return
        if (!userDoc.exists()) {
          setCheckingSession(false)
          return
        }
        const userData = userDoc.data()
        if (userData.licenseExpiry && !isLicenseValid(userData.licenseExpiry)) {
          setExpiredLicense({ email: userData.email, expiry: userData.licenseExpiry })
          setCheckingSession(false)
          return
        }
        navigate('/dashboard', { replace: true })
      } catch {
        if (!cancelled) {
          navigate('/dashboard', { replace: true })
        }
      }
    }
    checkSession()
    return () => { cancelled = true }
  }, [currentUser])

  if (checkingSession && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
        <div className="text-center animate-scale-in">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Verifying license...</p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userCredential = await login(email, password)
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      if (!userDoc.exists()) {
        setError('Your account has been removed. Please register again with a new license key.')
        await logout()
        setLoading(false)
        return
      }
      const userData = userDoc.data()
      if (userData.licenseExpiry && !isLicenseValid(userData.licenseExpiry)) {
        setExpiredLicense({ email: userData.email, expiry: userData.licenseExpiry })
        setLoading(false)
        return
      }
      navigate('/dashboard')
      return
    } catch (err) {
      console.error('Login error:', err.code, err.message)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()))
        const snap = await getDocs(q)
        if (!snap.empty) {
          const userData = snap.docs[0].data()
          if (userData.licenseExpiry && !isLicenseValid(userData.licenseExpiry)) {
            setExpiredLicense({ email: userData.email, expiry: userData.licenseExpiry })
            setLoading(false)
            return
          }
          setError('Your account was removed. Please register again with a new license key.')
          setLoading(false)
          return
        }
        setError('No account found with this email. Please register first.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Please enter a valid email and password.')
      }
    }
    setLoading(false)
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setForgotError('')
    setForgotLoading(true)
    try {
      await forgotPassword(forgotEmail)
      setForgotSuccess(true)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setForgotError('No account found with this email address.')
      } else if (err.code === 'auth/invalid-email') {
        setForgotError('Please enter a valid email address.')
      } else {
        setForgotError('Failed to send reset email. Please try again.')
      }
    }
    setForgotLoading(false)
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
        {/* Darkens left side, fades to transparent toward center — no hard edge */}
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
            <h2 className="text-5xl text-white mb-4 leading-tight drop-shadow-lg" style={{ fontFamily: "'Great Vibes', cursive" }}>Run Your Restaurant Smarter</h2>
            <p className="text-white/60 text-lg font-light tracking-wide drop-shadow" style={{ fontFamily: "'Inter', sans-serif" }}>Billing, inventory, orders, CRM — everything in one place.</p>
            <div className="mt-8 flex items-center justify-center gap-6 text-white/40 text-xs font-medium tracking-widest uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              <span>Billing</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span>Inventory</span>
              <span className="w-1 h-1 bg-white/40 rounded-full" />
              <span>CRM</span>
            </div>
          </div>
        </div>

        {/* Right — form card */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-12 relative">
          {/* Dot pattern on form side only (mobile) */}
          <div className="lg:hidden absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #DC2626 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <FloatingOrb size="300px" color="#FF6B00" top="-100px" left="-80px" delay="0s" />
          <FloatingOrb size="250px" color="#FF8C38" top="60%" left="70%" delay="1s" />
          <FloatingOrb size="200px" color="#F97316" top="20%" left="80%" delay="2s" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo (mobile only) */}
          <ScrollReveal animation="reveal" className="text-center mb-8 lg:hidden">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="relative">
                <img src="/logo-app.png" alt="DaawatDesk" className="h-16 w-auto object-contain" />
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-glow-pulse" />
              </div>
            </Link>
            <h1 className="text-3xl font-extrabold text-secondary tracking-tight">Welcome Back!</h1>
            <p className="text-gray-500 mt-2 text-sm">Sign in to manage your restaurant</p>
          </ScrollReveal>

          {/* Desktop Title */}
          <ScrollReveal animation="reveal" className="hidden lg:block text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <img src="/logo-app.png" alt="DaawatDesk" className="h-12 w-auto object-contain" />
            </Link>
            <h1 className="text-3xl font-extrabold text-secondary tracking-tight">Welcome Back!</h1>
            <p className="text-gray-500 mt-2 text-sm">Sign in to manage your restaurant</p>
          </ScrollReveal>

          {/* Card */}
        <ScrollReveal animation="reveal" delay={100} className="bg-white/40 backdrop-blur-lg rounded-[2rem] shadow-2xl shadow-black/5 border border-white/20 p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange to-amber-500" />
          {expiredLicense ? (
            <div className="text-center py-4 animate-scale-in">
              <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-yellow-500" />
              </div>
              <h2 className="text-xl font-bold text-secondary mb-2">License Expired</h2>
              <p className="text-sm text-gray-500 mb-1">
                Your license for <strong>{expiredLicense.email}</strong> has expired.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Please contact your administrator to obtain a new license key.
              </p>
              <Link
                to="/renew"
                className="block w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] mb-3"
              >
                Renew License
              </Link>
              <button
                onClick={() => { setExpiredLicense(null); setError(''); setEmail(''); setPassword('') }}
                className="w-full text-sm text-gray-400 hover:text-secondary font-medium transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200/80 text-red-600 text-sm px-4 py-3 rounded-2xl animate-fade-up flex items-center gap-2.5">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </div>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <Mail className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all duration-200 text-sm"
                  placeholder="you@restaurant.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSuccess(false); setForgotError('') }}
                  className="text-[11px] text-primary font-bold hover:text-primary-dark transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all duration-200 text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary via-red-600 to-orange hover:from-primary-dark hover:via-red-700 hover:to-orange text-white font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 active:scale-[0.97] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm tracking-wide"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-bold hover:text-primary-dark transition-colors">
                Register here
              </Link>
            </p>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100/80 text-center space-y-2.5">
            <Link to="/kitchen-staff" className="text-xs text-gray-400 hover:text-primary font-semibold transition-all duration-200 block hover:translate-x-0.5 tracking-wide">
              Kitchen Staff Login →
            </Link>
            <Link to="/admin" className="text-xs text-gray-400 hover:text-secondary font-semibold transition-all duration-200 block hover:translate-x-0.5 tracking-wide">
              Admin Panel →
            </Link>
          </div>
          </>
          )}
        </ScrollReveal>

        <ScrollReveal animation="reveal-fade" delay={200} className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:text-white/60 transition-colors">← Back to Home</Link>
        </ScrollReveal>
        </div>
      </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-6 animate-scale-in shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange to-amber-500" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-secondary tracking-tight flex items-center gap-2.5">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-[18px] h-[18px] text-primary" />
                </div>
                Forgot Password
              </h3>
              <button onClick={() => setShowForgot(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="text-center py-4 animate-scale-in">
                <div className="w-16 h-16 bg-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green" />
                </div>
                <h4 className="font-bold text-secondary text-lg mb-2">Email Sent!</h4>
                <p className="text-sm text-gray-500 mb-6">
                  Reset link sent to <strong>{forgotEmail}</strong>. Check inbox or spam folder.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setForgotSuccess(false) }}
                  className="w-full bg-gradient-to-r from-primary via-red-600 to-orange text-white font-bold py-3.5 rounded-2xl hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.97] text-sm"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-gray-500">
                  Enter your email and we'll send a reset link.
                </p>

                {forgotError && (
                  <div className="bg-red-50 border border-red-200/80 text-red-600 text-sm px-4 py-3 rounded-2xl animate-fade-up">
                    {forgotError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-[18px] h-[18px] text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 focus:bg-white outline-none transition-all text-sm"
                      placeholder="you@restaurant.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-gradient-to-r from-primary via-red-600 to-orange text-white font-bold py-3.5 rounded-2xl transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {forgotLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
