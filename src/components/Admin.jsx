import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { generateKey, isLicenseValid } from '../utils/license'
import { db } from '../firebase'
import { collection, getDocs, updateDoc, doc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore'
import {
  ArrowLeft, Shield, Key, Users, Copy, Check, RefreshCw,
  Search, Clock, AlertTriangle, CheckCircle, XCircle, LogOut,
  LayoutDashboard, Settings, UserPlus, Send, Trash2, ChevronDown,
  Calendar, TrendingUp, Activity, Mail, Store, Eye, EyeOff,
  Download, Filter, MoreVertical, Phone, Globe, BadgeCheck
} from 'lucide-react'

const ADMIN_EMAIL = 'swainvikramaditya99@gmail.com'

export default function Admin() {
  const navigate = useNavigate()
  const { currentUser, userProfile, logout, loginWithGoogle, handleRedirectResult, loading } = useAuth()

  const [clientEmail, setClientEmail] = useState('')
  const [clientName, setClientName] = useState('')
  const [generatedKeys, setGeneratedKeys] = useState([])
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [deletingUserId, setDeletingUserId] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [keyNote, setKeyNote] = useState('')
  const [licenses, setLicenses] = useState([])
  const [loadingLicenses, setLoadingLicenses] = useState(false)
  const [adminLicensesError, setAdminLicensesError] = useState('')
  const [copiedLicense, setCopiedLicense] = useState(null)

  const isAdmin = currentUser?.email === ADMIN_EMAIL

  async function handleAdminGoogleLogin() {
    setAdminError('')
    setAdminLoading(true)
    try {
      await loginWithGoogle({ adminOnly: true })
    } catch (err) {
      if (err.message === 'NOT_ADMIN') {
        setAdminError('This Google account is not authorized as admin.')
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setAdminError('Google sign-in failed. Please try again.')
      }
    }
    setAdminLoading(false)
  }

  useEffect(() => {
    handleRedirectResult().catch(() => {})
  }, [])

  useEffect(() => {
    if (isAdmin) fetchUsers()
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin && (activeTab === 'licenses' || activeTab === 'users')) fetchLicenses()
  }, [isAdmin, activeTab])

  async function fetchLicenses() {
    setLoadingLicenses(true)
    setAdminLicensesError('')
    try {
      const snap = await getDocs(query(collection(db, 'licenses'), orderBy('generatedAt', 'desc'), limit(100)))
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setLicenses(list)
    } catch (err) {
      console.error('Error fetching licenses:', err)
      setAdminLicensesError('Failed to load licenses. Please check your connection and try again.')
    }
    setLoadingLicenses(false)
  }

  async function fetchUsers() {
    setLoadingUsers(true)
    try {
      const snap = await getDocs(collection(db, 'users'))
      const list = []
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
      setUsers(list)
    } catch (err) {
      console.error('Error fetching users:', err)
    }
    setLoadingUsers(false)
  }

  async function handleGenerate() {
    if (!clientEmail.trim()) return
    const email = clientEmail.trim().toLowerCase()
    let keyVersion = 1
    try {
      const q = query(collection(db, 'users'), where('email', '==', email))
      const snap = await getDocs(q)
      if (!snap.empty) {
        keyVersion = snap.docs[0].data().keyVersion || 1
      }
    } catch (err) {
      console.error('Error looking up user:', err)
    }
    const key = generateKey(email, keyVersion)
    const newEntry = {
      key,
      email,
      name: clientName.trim() || email,
      note: keyNote.trim(),
      generatedAt: new Date().toISOString(),
      copied: false,
    }
    setGeneratedKeys((prev) => [newEntry, ...prev])
    setClientEmail('')
    setClientName('')
    setKeyNote('')
    setCopiedIndex(null)
  }

  function handleCopyKey(key, index) {
    navigator.clipboard.writeText(key)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  function handleCopyAllKeys() {
    const allKeys = generatedKeys.map((k) => `${k.email} → ${k.key}`).join('\n')
    navigator.clipboard.writeText(allKeys)
    setCopiedIndex(-1)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  function handleExportKeys() {
    const csv = 'Email,Name,Key,Note,Generated At\n' + generatedKeys.map((k) =>
      `${k.email},${k.name},${k.key},"${k.note}",${new Date(k.generatedAt).toLocaleString()}`
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daawatdesk-keys-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function extendExpiry(userId, months = 12) {
    try {
      const newExpiry = new Date()
      newExpiry.setMonth(newExpiry.getMonth() + months)
      const user = users.find((u) => u.id === userId)
      const newVersion = (user?.keyVersion || 1) + 1
      await updateDoc(doc(db, 'users', userId), { licenseExpiry: newExpiry.toISOString(), keyVersion: newVersion, keyRevoked: false })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, licenseExpiry: newExpiry.toISOString(), keyVersion: newVersion, keyRevoked: false } : u)))
    } catch (err) {
      console.error('Error extending expiry:', err)
    }
  }

  /* ─── TEMPORARY FEATURE: Manual Expire License (TO BE REMOVED LATER) ─── */
  async function expireLicense(userId) {
    try {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      await updateDoc(doc(db, 'users', userId), { licenseExpiry: pastDate.toISOString(), keyRevoked: true })
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, licenseExpiry: pastDate.toISOString(), keyRevoked: true } : u)))
    } catch (err) {
      console.error('Error expiring license:', err)
    }
  }
  /* ─── END TEMPORARY FEATURE ─── */

  async function deleteUser(userId) {
    setDeletingUserId(userId)
    setDeleteError('')
    try {
      await deleteDoc(doc(db, 'users', userId))
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setShowDeleteConfirm(null)
      setShowUserModal(false)
    } catch (err) {
      console.error('Error deleting user:', err)
      setDeleteError('Failed to delete user. Please check your connection and try again.')
    }
    setDeletingUserId(null)
  }

  function getDaysLeft(expiresAt) {
    if (!expiresAt) return null
    const exp = expiresAt?.seconds ? new Date(expiresAt.seconds * 1000) : new Date(expiresAt)
    const now = new Date()
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24))
    return diff
  }

  const totalUsers = users.length
  const activeUsers = users.filter((u) => isLicenseValid(u.licenseExpiry)).length
  const expiredUsers = users.filter((u) => u.licenseExpiry && !isLicenseValid(u.licenseExpiry)).length
  const expiringSoon = users.filter((u) => {
    const days = getDaysLeft(u.licenseExpiry)
    return days !== null && days > 0 && days <= 30
  }).length

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.restaurant?.toLowerCase().includes(searchQuery.toLowerCase())
    if (filterStatus === 'active') return matchSearch && isLicenseValid(u.licenseExpiry)
    if (filterStatus === 'expired') return matchSearch && u.licenseExpiry && !isLicenseValid(u.licenseExpiry)
    if (filterStatus === 'expiring') {
      const days = getDaysLeft(u.licenseExpiry)
      return matchSearch && days !== null && days > 0 && days <= 30
    }
    return matchSearch
  })

  const licenseByEmail = useMemo(() => {
    const map = {}
    for (const lic of licenses) {
      const em = (lic.email || '').toLowerCase()
      if (em && !map[em]) map[em] = lic
    }
    return map
  }, [licenses])

  function displayKeyFor(user) {
    const stored = licenseByEmail[(user.email || '').toLowerCase()]
    return stored?.key || generateKey(user.email, user.keyVersion || 1)
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate Key', icon: Key },
    { id: 'licenses', label: 'Licenses', icon: BadgeCheck, badge: licenses.length },
    { id: 'users', label: 'Users', icon: Users, badge: totalUsers },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-white to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  /* ─── Admin Google Login Screen (show when not logged in OR logged in as non-admin) ─── */
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-white to-secondary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-3xl font-extrabold text-secondary">Admin Access</h1>
            <p className="text-text-secondary mt-2">Sign in with your admin Google account</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-border">
            {adminError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {adminError}
              </div>
            )}
            <button
              onClick={handleAdminGoogleLogin}
              disabled={adminLoading}
              className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {adminLoading ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
            <div className="mt-4 text-center">
              <button onClick={() => navigate('/login')} className="text-sm text-gray-400 hover:text-primary transition-colors">
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo-app.png" alt="DaawatDesk" className="w-7 h-7 rounded-lg flex-shrink-0 object-contain" />
              <h1 className="text-xl font-bold text-secondary hidden sm:inline">Admin Panel</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser?.photoURL && (
              <img src={currentUser.photoURL} alt="" className="w-8 h-8 rounded-full" />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-secondary">{currentUser?.displayName || 'Admin'}</p>
              <p className="text-xs text-gray-400">{currentUser?.email}</p>
            </div>
            <button
              onClick={async () => { await logout(); navigate('/login') }}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-gray-200 p-3 lg:sticky lg:top-20 overflow-x-auto">
            <div className="flex lg:flex-col gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-secondary text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                    }`}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">

          {/* ═══════ DASHBOARD ═══════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary mb-1 hidden sm:block">Dashboard</h2>
                <p className="text-sm text-gray-500 hidden sm:block">Overview of your platform</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue/10 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue" />
                    </div>
                    <span className="text-xs text-green font-semibold bg-green/10 px-2 py-0.5 rounded-full">All Time</span>
                  </div>
                  <p className="text-3xl font-extrabold text-secondary">{totalUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Users</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green/10 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green" />
                    </div>
                    <span className="text-xs text-green font-semibold bg-green/10 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="text-3xl font-extrabold text-green">{activeUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">Active Licenses</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 px-2 py-0.5 rounded-full">Soon</span>
                  </div>
                  <p className="text-3xl font-extrabold text-yellow-600">{expiringSoon}</p>
                  <p className="text-sm text-gray-500 mt-1">Expiring in 30 days</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full">Expired</span>
                  </div>
                  <p className="text-3xl font-extrabold text-red-500">{expiredUsers}</p>
                  <p className="text-sm text-gray-500 mt-1">Expired Licenses</p>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-secondary">Recent Users</h3>
                  <button onClick={() => setActiveTab('users')} className="text-sm text-primary font-semibold hover:underline">
                    View All →
                  </button>
                </div>
                {users.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">No users yet</p>
                ) : (
                  <div className="space-y-3">
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{(u.name || '?')[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-secondary">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isLicenseValid(u.licenseExpiry) ? 'bg-green/10 text-green' : 'bg-red-50 text-red-500'
                        }`}>
                          {isLicenseValid(u.licenseExpiry) ? 'Active' : 'Expired'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ GENERATE KEY ═══════ */}
          {activeTab === 'generate' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary mb-1 hidden sm:block">Generate License Key</h2>
                <p className="text-sm text-gray-500 hidden sm:block">Generate keys for new clients or renewals</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-secondary mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" />
                    New Key
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Client Name</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-sm"
                        placeholder="Rahul Sharma"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Client Email *</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-sm"
                        placeholder="client@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">Note (optional)</label>
                      <input
                        type="text"
                        value={keyNote}
                        onChange={(e) => setKeyNote(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-sm"
                        placeholder="e.g. Premium plan, renewal"
                      />
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={!clientEmail.trim()}
                      className="w-full bg-secondary hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Key className="w-4 h-4" />
                      Generate Key
                    </button>
                  </div>
                </div>

                {/* Generated Keys List */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-secondary flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" />
                      Generated Keys ({generatedKeys.length})
                    </h3>
                    {generatedKeys.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                        <button onClick={handleCopyAllKeys} className="text-xs text-gray-500 hover:text-secondary transition-colors flex items-center gap-1">
                          {copiedIndex === -1 ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy All
                        </button>
                        <button onClick={handleExportKeys} className="text-xs text-gray-500 hover:text-secondary transition-colors flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" />
                          Export CSV
                        </button>
                      </div>
                    )}
                  </div>

                  {generatedKeys.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No keys generated yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {generatedKeys.map((entry, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-secondary">{entry.name}</p>
                              <p className="text-xs text-gray-400">{entry.email}</p>
                            </div>
                            <span className="text-xs text-gray-400">{new Date(entry.generatedAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm font-mono font-bold text-secondary tracking-wider bg-white px-3 py-2 rounded-lg border border-gray-200">
                              {entry.key}
                            </code>
                            <button
                              onClick={() => handleCopyKey(entry.key, i)}
                              className="p-2 bg-green/10 text-green rounded-lg hover:bg-green/20 transition-colors"
                            >
                              {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                          {entry.note && <p className="text-xs text-gray-400 mt-2">📝 {entry.note}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ LICENSES ═══════ */}
          {activeTab === 'licenses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-secondary mb-1 hidden sm:block">Issued Licenses</h2>
                  <p className="text-sm text-gray-500 hidden sm:block">Self-serve purchases from the buy-license store</p>
                </div>
                <button onClick={fetchLicenses} className="flex items-center gap-2 text-sm text-gray-500 hover:text-secondary transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200">
                  <RefreshCw className={`w-4 h-4 ${loadingLicenses ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {adminLicensesError ? (
                  <div className="flex items-center justify-between gap-4 px-5 py-8">
                    <div className="flex items-center gap-3 text-red-600 text-sm">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      {adminLicensesError}
                    </div>
                    <button
                      onClick={() => fetchLicenses()}
                      className="flex-shrink-0 flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry
                    </button>
                  </div>
                ) : loadingLicenses ? (
                  <div className="flex items-center justify-center py-16 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading licenses...
                  </div>
                ) : licenses.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <BadgeCheck className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No licenses issued yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">User</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">License Key</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Plan</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Amount</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Status</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Generated</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Expires</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Payment ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {licenses.map((lic) => {
                          const matchedUser = users.find((u) => (u.email || '').toLowerCase() === (lic.email || '').toLowerCase())
                          const isExpired = lic.expiresAt ? new Date(lic.expiresAt) <= new Date() : false
                          return (
                            <tr key={lic.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-primary">{((lic.name || lic.email || '?')[0] || '?').toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-secondary">{lic.name || matchedUser?.name || '-'}</p>
                                    <p className="text-xs text-gray-400">{lic.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-5">
                                <button
                                  onClick={() => { navigator.clipboard.writeText(lic.key); setCopiedLicense(lic.id); setTimeout(() => setCopiedLicense(null), 2000) }}
                                  className="font-mono text-xs text-gray-500 hover:text-primary bg-gray-50 hover:bg-primary/5 px-2 py-1 rounded transition-colors flex items-center gap-1.5"
                                  title="Click to copy"
                                >
                                  {lic.key}
                                  {copiedLicense === lic.id ? <Check className="w-3 h-3 text-green" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </td>
                              <td className="py-3 px-5">
                                <span className="text-xs font-semibold bg-orange-50 text-primary px-2 py-1 rounded-full capitalize">{lic.planKey || '-'}</span>
                              </td>
                              <td className="py-3 px-5 text-gray-500 tabular-nums">
                                {lic.amount ? `₹${(lic.amount / 100).toLocaleString('en-IN')}` : '-'}
                              </td>
                              <td className="py-3 px-5">
                                {isExpired ? (
                                  <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-semibold bg-red-50 px-2.5 py-1 rounded-full">
                                    <XCircle className="w-3 h-3" />
                                    Expired
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-green text-xs font-semibold bg-green/10 px-2.5 py-1 rounded-full">
                                    <CheckCircle className="w-3 h-3" />
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-5 text-gray-500 text-xs">
                                {lic.generatedAt ? new Date(lic.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="py-3 px-5 text-gray-500 text-xs">
                                {lic.expiresAt ? new Date(lic.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="py-3 px-5">
                                <span className="font-mono text-xs text-gray-400">{lic.paymentId ? lic.paymentId.slice(0, 8) : '-'}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ USERS ═══════ */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-secondary mb-1 hidden sm:block">User Management</h2>
                  <p className="text-sm text-gray-500 hidden sm:block">Manage all registered users</p>
                </div>
                <button onClick={fetchUsers} className="flex items-center gap-2 text-sm text-gray-500 hover:text-secondary transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200">
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-sm"
                    placeholder="Search by name, email, or restaurant..."
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'active', 'expiring', 'expired'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        filterStatus === status
                          ? 'bg-secondary text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-16 text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading users...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">User</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">License Key</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Restaurant</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Status</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Expires</th>
                          <th className="text-left py-3 px-5 font-semibold text-gray-600">Days Left</th>
                          <th className="text-right py-3 px-5 font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => {
                          const valid = isLicenseValid(user.licenseExpiry)
                          const days = getDaysLeft(user.licenseExpiry)
                          return (
                            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 px-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold text-primary">{(user.name || '?')[0].toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-secondary">{user.name}</p>
                                    <p className="text-xs text-gray-400">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-5">
                                <button
                                  onClick={() => { navigator.clipboard.writeText(displayKeyFor(user)); setCopiedIndex(user.id); setTimeout(() => setCopiedIndex(null), 2000) }}
                                  className="font-mono text-xs text-gray-500 hover:text-primary bg-gray-50 hover:bg-primary/5 px-2 py-1 rounded transition-colors flex items-center gap-1.5"
                                  title="Click to copy"
                                >
                                  {displayKeyFor(user)}
                                  {copiedIndex === user.id ? <Check className="w-3 h-3 text-green" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </td>
                              <td className="py-3 px-5 text-gray-500">{user.restaurant || '-'}</td>
                              <td className="py-3 px-5">
                                {user.licenseExpiry ? (
                                  valid ? (
                                    <span className="inline-flex items-center gap-1.5 text-green text-xs font-semibold bg-green/10 px-2.5 py-1 rounded-full">
                                      <CheckCircle className="w-3 h-3" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-semibold bg-red-50 px-2.5 py-1 rounded-full">
                                      <XCircle className="w-3 h-3" />
                                      Expired
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-yellow-600 text-xs font-semibold bg-yellow-50 px-2.5 py-1 rounded-full">
                                    <AlertTriangle className="w-3 h-3" />
                                    No License
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-5 text-gray-500 text-xs">
                                {user.licenseExpiry ? new Date(user.licenseExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </td>
                              <td className="py-3 px-5">
                                {days !== null ? (
                                  <span className={`text-xs font-semibold ${days <= 0 ? 'text-red-500' : days <= 30 ? 'text-yellow-600' : 'text-green'}`}>
                                    {days <= 0 ? 'Expired' : `${days} days`}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="py-3 px-5">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => { setSelectedUser(user); setShowUserModal(true) }}
                                    className="p-2 text-gray-400 hover:text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {/* ─── TEMPORARY: Expire button in table (TO BE REMOVED LATER) ─── */}
                                  {isLicenseValid(user.licenseExpiry) ? (
                                    <button
                                      onClick={() => expireLicense(user.id)}
                                      className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                      title="Expire License"
                                    >
                                      <AlertTriangle className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => extendExpiry(user.id, 12)}
                                      className="p-2 text-gray-400 hover:text-green hover:bg-green/10 rounded-lg transition-colors"
                                      title="Renew License"
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </button>
                                  )}
                                  {/* ─── END TEMPORARY ─── */}
                                  <button
                                    onClick={() => setShowDeleteConfirm(user.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ SETTINGS ═══════ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-secondary mb-1 hidden sm:block">Settings</h2>
                <p className="text-sm text-gray-500 hidden sm:block">Platform configuration and account</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Admin Profile */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-secondary mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Admin Profile
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="" className="w-16 h-16 rounded-full" />
                      ) : (
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{(currentUser?.displayName || 'A')[0].toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-secondary">{currentUser?.displayName}</p>
                        <p className="text-sm text-gray-500">{currentUser?.email}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Role</span>
                        <span className="font-semibold text-secondary">Administrator</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Auth Provider</span>
                        <span className="font-semibold text-secondary">Google</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Users</span>
                        <span className="font-semibold text-secondary">{totalUsers}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-secondary mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    System Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                      <span className="text-gray-500">Platform</span>
                      <span className="font-semibold text-secondary">DaawatDesk POS</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                      <span className="text-gray-500">Version</span>
                      <span className="font-semibold text-secondary">1.0.0</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                      <span className="text-gray-500">Firebase Project</span>
                      <span className="font-semibold text-secondary">daawatdesk-auth</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                      <span className="text-gray-500">License Duration</span>
                      <span className="font-semibold text-secondary">1 Year</span>
                    </div>
                    <div className="flex justify-between text-sm py-2">
                      <span className="text-gray-500">Key Algorithm</span>
                      <span className="font-semibold text-secondary">Hash-based (DAW-XXXX-XXXX-XXXX)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ═══════ USER DETAIL MODAL ═══════ */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-secondary">User Details</h3>
              <button onClick={() => setShowUserModal(false)}>
                <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{(selectedUser.name || '?')[0].toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-bold text-secondary text-lg">{selectedUser.name}</p>
                  <p className="text-sm text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Restaurant</span>
                  <span className="font-medium text-secondary">{selectedUser.restaurant || '-'}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">License Key</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(displayKeyFor(selectedUser)); setCopiedIndex('modal'); setTimeout(() => setCopiedIndex(null), 2000) }}
                    className="font-mono text-xs text-gray-500 hover:text-primary bg-white hover:bg-primary/5 px-2 py-1 rounded transition-colors flex items-center gap-1.5"
                    title="Click to copy"
                  >
                    {displayKeyFor(selectedUser)}
                    {copiedIndex === 'modal' ? <Check className="w-3 h-3 text-green" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-semibold ${isLicenseValid(selectedUser.licenseExpiry) ? 'text-green' : 'text-red-500'}`}>
                    {isLicenseValid(selectedUser.licenseExpiry) ? 'Active' : 'Expired'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registered</span>
                  <span className="font-medium text-secondary">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Expires</span>
                  <span className="font-medium text-secondary">
                    {selectedUser.licenseExpiry ? new Date(selectedUser.licenseExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Days Left</span>
                  <span className={`font-semibold ${(() => { const d = getDaysLeft(selectedUser.licenseExpiry); return d !== null && d <= 30 ? 'text-yellow-600' : 'text-green' })()}`}>
                    {(() => { const d = getDaysLeft(selectedUser.licenseExpiry); return d !== null ? (d <= 0 ? 'Expired' : `${d} days`) : '-' })()}
                  </span>
                </div>
              </div>

              {/* ─── TEMPORARY FEATURE: Expire/Renew buttons (TO BE REMOVED LATER) ─── */}
              <div className="flex gap-2">
                {isLicenseValid(selectedUser.licenseExpiry) ? (
                  <button
                    onClick={() => { expireLicense(selectedUser.id); setShowUserModal(false) }}
                    className="flex-1 bg-yellow-50 text-yellow-600 font-semibold py-2.5 rounded-xl hover:bg-yellow-100 transition-colors text-sm"
                  >
                    Expire Now
                  </button>
                ) : (
                  <button
                    onClick={() => { extendExpiry(selectedUser.id, 12); setShowUserModal(false) }}
                    className="flex-1 bg-green/10 text-green font-semibold py-2.5 rounded-xl hover:bg-green/20 transition-colors text-sm"
                  >
                    Renew (+1 Year)
                  </button>
                )}
                <button
                  onClick={() => { setShowDeleteConfirm(selectedUser.id) }}
                  className="px-4 bg-red-50 text-red-500 font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {/* ─── END TEMPORARY FEATURE ─── */}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DELETE CONFIRM MODAL ═══════ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 text-center animate-fade-up">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-secondary mb-2">Delete User?</h3>
            <p className="text-sm text-gray-500 mb-4">
              This action cannot be undone. The user will need to re-register with a new license key.
            </p>
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(null); setDeleteError('') }}
                disabled={deletingUserId}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(showDeleteConfirm)}
                disabled={deletingUserId}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingUserId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
