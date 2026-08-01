import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCodeAccess } from '../context/CodeAccessContext'
import { LogIn, Package, BarChart3, ArrowLeft } from 'lucide-react'
import SmartAssistant from './SmartAssistant'

const PAGE_CONFIG = {
  '/inventory': { icon: Package, title: 'Inventory', desc: 'View stock levels and inventory data', color: 'bg-orange' },
  '/reports': { icon: BarChart3, title: 'Reports', desc: 'View sales analytics and reports', color: 'bg-blue' },
}

export default function CodeAccessRoute({ children, pagePath }) {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { codeUser, validating, validateCode } = useCodeAccess()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  if (currentUser) return <>{children}<SmartAssistant /></>
  if (codeUser) return <>{children}<SmartAssistant /></>

  const config = PAGE_CONFIG[pagePath] || { icon: LogIn, title: 'Access', desc: 'Enter restaurant code', color: 'bg-primary' }
  const Icon = config.icon

  async function handleSubmit() {
    if (code.trim().length < 4) { setError('Enter a valid code'); return }
    const result = await validateCode(code)
    if (result.success) {
      setError('')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${config.color}/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-8 h-8 ${config.color}`} />
          </div>
          <h1 className="text-2xl font-bold text-secondary mb-1">{config.title}</h1>
          <p className="text-sm text-gray-500">{config.desc}</p>
          <p className="text-xs text-gray-400 mt-1">Enter the restaurant access code to continue</p>
        </div>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter access code"
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] border-2 border-gray-200 rounded-xl outline-none focus:border-primary transition-colors"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={validating || code.length < 4}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {validating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Access'}
          </button>
        </div>
        <button onClick={() => navigate('/')} className="w-full mt-4 text-sm text-gray-400 hover:text-primary text-center transition-colors flex items-center justify-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Home
        </button>
      </div>
    </div>
  )
}
