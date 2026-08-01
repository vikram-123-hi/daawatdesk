import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertTriangle, Mail, Phone, LogOut, RefreshCw } from 'lucide-react'

export default function LicenseExpired() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl font-extrabold text-secondary mb-3">License Expired</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Your DaawatDesk license has expired. You no longer have access to the POS features.
            Please contact the administrator to renew your license.
          </p>

          <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
            <h3 className="font-semibold text-secondary mb-3">How to Renew</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary mt-0.5">1.</span>
                <span>Contact the administrator and complete your renewal payment.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary mt-0.5">2.</span>
                <span>Obtain your new license key from the administrator.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary mt-0.5">3.</span>
                <span>Click "Renew License" below and enter your new key.</span>
              </li>
            </ol>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/renew')}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Renew License
            </button>

            <button
              onClick={async () => { await logout(); navigate('/login') }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Need help? Contact us at{' '}
          <a href="mailto:support@daawatdesk.com" className="text-primary hover:underline">
            support@daawatdesk.com
          </a>
        </p>
      </div>
    </div>
  )
}
