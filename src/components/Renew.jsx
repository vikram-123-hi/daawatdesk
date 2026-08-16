import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { RefreshCw, Key, CheckCircle, ArrowLeft, LogOut } from 'lucide-react'

export default function Renew() {
  const navigate = useNavigate()
  const { currentUser, userProfile, logout, fetchUserProfile } = useAuth()
  const [licenseKey, setLicenseKey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRenew(e) {
    e.preventDefault()
    setError('')

    if (!licenseKey.trim()) {
      setError('Please enter a valid license key.')
      return
    }

    if (!currentUser?.email) {
      setError('Session expired. Please login again.')
      return
    }

    setLoading(true)
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      const userData = userDoc.data()

      if (userData?.keyRevoked) {
        setError('Your license key has been revoked by the administrator. Please contact your administrator to obtain a new license key.')
        setLoading(false)
        return
      }

      const keyOk = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, key: licenseKey }),
      }).then((res) => res.json()).then((data) => Boolean(data && data.valid)).catch(() => null)
      if (keyOk === null) {
        setError('Unable to verify your license key right now. Check your network connection and try again.')
        setLoading(false)
        return
      }
      if (!keyOk) {
        setError('The license key you entered is invalid or does not match your email. Please check and try again.')
        setLoading(false)
        return
      }

      const newExpiry = new Date()
      newExpiry.setFullYear(newExpiry.getFullYear() + 1)

      await updateDoc(doc(db, 'users', currentUser.uid), {
        licenseExpiry: newExpiry.toISOString()
      })

      await fetchUserProfile(currentUser)
      setSuccess(true)
    } catch (err) {
      setError('An error occurred while renewing your license. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green/5 via-white to-green/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-green/20">
            <div className="w-20 h-20 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green" />
            </div>
            <h1 className="text-2xl font-extrabold text-secondary mb-3">License Renewed!</h1>
            <p className="text-gray-500 mb-6">
              Your license has been successfully renewed for 1 year. You now have full access to all features.
            </p>
            <button
              onClick={() => navigate('/billing')}
              className="w-full bg-green hover:bg-green/90 text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Go to Billing
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-secondary">Renew License</h1>
          <p className="text-text-secondary mt-2">Enter your new license key to renew</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
          {userProfile && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">Renewing for</p>
              <p className="font-semibold text-secondary">{userProfile.name}</p>
              <p className="text-sm text-gray-500">{currentUser?.email}</p>
              {userProfile.restaurant && (
                <p className="text-sm text-gray-500">{userProfile.restaurant}</p>
              )}
            </div>
          )}

          <form onSubmit={handleRenew} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="renew-licenseKey" className="block text-sm font-medium text-text-secondary mb-1.5">New License Key</label>
              <div className="relative">
                <Key className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="renew-licenseKey"
                  type="text"
                  required
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-mono tracking-wider"
                  placeholder="DAW-XXXX-XXXX-XXXX"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Need a new license?{' '}
                <Link to="/buy-license" className="text-[#C83E00] font-semibold hover:text-[#9E2E00] transition-colors">
                  Purchase License
                </Link>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Renew License
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
            <button
              onClick={async () => { await logout(); navigate('/login') }}
              className="text-sm text-red-400 hover:text-red-600 transition-colors flex items-center justify-center gap-1 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
