import { useNavigate } from 'react-router-dom'
import { useKOT } from '../context/KOTContext'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Clock, ChefHat, RefreshCw, Eye } from 'lucide-react'

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', dot: 'bg-yellow-500' },
  preparing: { label: 'Preparing', color: 'bg-blue/10 text-blue border-blue/30', dot: 'bg-blue' },
  ready: { label: 'Ready', color: 'bg-green/10 text-green border-green/30', dot: 'bg-green' },
}

export default function Kitchen() {
  const navigate = useNavigate()
  const { kots } = useKOT()
  const { logout } = useAuth()

  const pending = kots.filter((k) => k.status === 'pending')
  const preparing = kots.filter((k) => k.status === 'preparing')
  const ready = kots.filter((k) => k.status === 'ready')

  function renderKOT(kot) {
    const config = statusConfig[kot.status]
    return (
      <div
        key={kot.id}
        className={`bg-white rounded-2xl border-2 p-5 transition-all hover:shadow-lg ${config.border}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-secondary">{kot.table}</span>
            {kot.source === 'qr-order' && (
              <span className="text-[10px] font-bold text-purple bg-purple/10 px-2 py-0.5 rounded-full">📱 QR</span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            {kot.createdAt}
          </div>
        </div>

        <div className="space-y-1.5">
          {kot.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm border-[1.5px] ${item.veg ? 'border-green' : 'border-red-500'}`}>
                  <span className={`block w-1 h-1 rounded-full mx-auto mt-[1px] ${item.veg ? 'bg-green' : 'bg-red-500'}`}></span>
                </span>
                <span className="text-sm font-medium text-secondary">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-secondary">x{item.qty}</span>
            </div>
          ))}
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
            <button
              onClick={() => navigate('/billing')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Billing</span>
            </button>
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo-app.png" alt="DaawatDesk" className="w-7 h-7 rounded-lg flex-shrink-0 object-contain" />
              <h1 className="text-xl font-bold text-secondary truncate">Kitchen Display</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
                Pending: <strong>{pending.length}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue rounded-full"></span>
                Preparing: <strong>{preparing.length}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-green rounded-full"></span>
                Ready: <strong>{ready.length}</strong>
              </span>
            </div>
            <button
              onClick={() => navigate('/kitchen-staff')}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <ChefHat className="w-4 h-4" />
              <span className="hidden sm:inline">Kitchen Staff</span>
            </button>
            <button
              onClick={async () => { await logout(); navigate('/login') }}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">✕</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {kots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ChefHat className="w-20 h-20 mb-4 opacity-30" />
            <p className="text-xl font-semibold mb-2">No orders yet</p>
            <p className="text-sm">KOTs from billing will appear here</p>
            <button
              onClick={() => navigate('/billing')}
              className="mt-6 flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Go to Billing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kots.map(renderKOT)}
          </div>
        )}
      </div>
    </div>
  )
}
