import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PLANS, formatINR } from '../lib/plans'
import { openRazorpay } from '../lib/razorpay'
import {
  ShieldCheck, Mail, User, CreditCard, CheckCircle2, Copy, Check,
  ArrowLeft, AlertTriangle, BadgeCheck, Zap, Infinity as InfinityIcon,
  Clock, RefreshCw
} from 'lucide-react'

const FUNCTIONS_BASE = '/api'

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function BuyLicense() {
  const { currentUser } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState('yearly')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [cancelNotice, setCancelNotice] = useState(false)
  const [step, setStep] = useState('idle')
  const [success, setSuccess] = useState(null)
  const [copied, setCopied] = useState(false)
  const [verifyAttempt, setVerifyAttempt] = useState(null)
  const [verifyFailed, setVerifyFailed] = useState(false)
  const inFlight = useRef(false)

  const keyConfigured = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID)
  const isDummy = !keyConfigured
  const plan = PLANS[selectedPlan]

  async function doVerify(payload) {
    setStep('verifying')
    setVerifyFailed(false)
    try {
      const verifyRes = await fetch(`${FUNCTIONS_BASE}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment could not be verified')
      }
      setSuccess(verifyData)
      setStep('success')
      setVerifyAttempt(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Verify payment error:', err)
      setVerifyFailed(true)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setError('')
    setCancelNotice(false)

    // TODO(future): Restore real Razorpay key gate once a live/test key is set.
    // if (!keyConfigured) {
    //   setError('Razorpay is not configured on this site yet. Set VITE_RAZORPAY_KEY_ID to enable purchases.')
    //   inFlight.current = false
    //   return
    // }
    const trimmedEmail = email.trim().toLowerCase()
    if (!name.trim()) {
      setError('Please enter your name.')
      inFlight.current = false
      return
    }
    if (!isEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      inFlight.current = false
      return
    }

    // DUMMY TEST MODE — simulates a successful payment without a Razorpay key.
    if (isDummy) {
      setStep('creating')
      await new Promise((r) => setTimeout(r, 900))
      const months = PLANS[selectedPlan]?.durationMonths || 1
      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + months)
      setSuccess({
        key: `DAW-TEST-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        email: trimmedEmail,
        name: name.trim(),
        planKey: selectedPlan,
        expiresAt: expiresAt.toISOString(),
      })
      setStep('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setStep('creating')
    try {
      const orderRes = await fetch(`${FUNCTIONS_BASE}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, name: name.trim(), planKey: selectedPlan }),
      })
      const orderData = await orderRes.json()
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      setStep('checkout')
      let payment
      try {
        payment = await openRazorpay({
          keyId: orderData.key_id,
          orderId: orderData.order_id,
          amountMs: orderData.amount,
          email: trimmedEmail,
          name: orderData.name,
          planLabel: orderData.label,
        })
      } catch (err) {
        if (err?.message === 'PAYMENT_CANCELLED') {
          setCancelNotice(true)
          setStep('idle')
          return
        }
        throw err
      }

      const payload = {
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
        email: trimmedEmail,
        name: name.trim(),
        planKey: selectedPlan,
        userId: currentUser?.uid || '',
      }
      setVerifyAttempt(payload)
      await doVerify(payload)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStep('idle')
    } finally {
      inFlight.current = false
    }
  }

  function handleStartOver() {
    setSuccess(null)
    setVerifyAttempt(null)
    setVerifyFailed(false)
    setStep('idle')
    setError('')
    setCancelNotice(false)
  }

  async function handleCopy() {
    if (!success) return
    try {
      await navigator.clipboard.writeText(success.key)
    } catch {
      // Silent fallback — feedback is still shown via the copied state.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bld-bg">
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-primary/25 blur-[110px] animate-blob pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[380px] h-[380px] rounded-full bg-orange-400/10 blur-[110px] animate-blob pointer-events-none" style={{ animationDelay: '3s' }} />
      <div className="absolute -bottom-20 left-1/4 w-[360px] h-[360px] rounded-full bg-[#FF8C38]/15 blur-[110px] animate-blob pointer-events-none" style={{ animationDelay: '6s' }} />
      <div className="absolute inset-0 noise-overlay" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8 animate-card-in">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <img src="/logo-app.png" alt="DaawatDesk" className="h-14 w-auto object-contain drop-shadow-[0_0_24px_rgba(255,107,0,0.4)]" />
            </Link>
            <h1 className="text-4xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Buy a License
            </h1>
            <p className="text-white/60 mt-2 text-sm">Self-serve activation for your DaawatDesk restaurant license</p>
          </div>

          <div className="bld-panel rounded-[2.25rem] p-6 lg:p-10 animate-card-in">
            <div className="bld-top" />

            {success ? (
              <div role="status" aria-live="polite" className="text-center py-6 animate-card-in">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <span className="absolute inset-0 rounded-full bg-green/30 blur-lg animate-pulse" />
                  <span className="relative w-20 h-20 bg-green/15 border border-green/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">Payment Successful!</h2>
                <p className="text-white/60 mt-2 text-sm">
                  We emailed your key to <span className="font-semibold text-white">{success.email}</span>
                </p>

                <div className="mt-6 bld-key-box rounded-2xl p-6 max-w-md mx-auto">
                  <span role="status" aria-live="polite" className="sr-only">{copied ? 'Key copied' : ''}</span>
                  <div className="text-[11px] font-bold text-orange-300 uppercase tracking-widest mb-2">Your License Key</div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={copied ? 'Key copied' : 'Copy license key'}
                    className="flex flex-wrap items-center justify-center gap-3 w-full min-w-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#FF8C38] ring-offset-2 ring-offset-[#0D0D1A] rounded-xl"
                  >
                    <code className="break-all text-sm sm:text-lg font-mono font-bold text-[#FFC98A] tracking-[0.15em] bg-white/5 px-4 py-3 rounded-xl border border-white/10 min-w-0">
                      {success.key}
                    </code>
                    <span className="flex-shrink-0 p-3 bg-white/10 text-green-400 rounded-xl border border-white/10">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </span>
                  </button>
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs text-white/50 flex-wrap">
                    <span>Plan: <strong className="text-white">{PLANS[success.planKey]?.label || success.planKey}</strong></span>
                    <span>Valid until <strong className="text-white">{new Date(success.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to="/login" className="bld-btn w-full sm:w-auto text-white font-bold py-3 px-8 rounded-2xl text-center focus-visible:ring-2 focus-visible:ring-[#FF8C38] ring-offset-2 ring-offset-[#0D0D1A]">
                    Activate Now
                  </Link>
                  <Link to="/renew" className="w-full sm:w-auto bg-white/5 text-white font-bold py-3 px-8 rounded-2xl border border-white/10 hover:border-primary hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-[#FF8C38] ring-offset-2 ring-offset-[#0D0D1A]">
                    Renew Existing License
                  </Link>
                </div>
              </div>
            ) : step === 'verifying' && verifyFailed ? (
              <div role="status" aria-live="polite" className="text-center py-6">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-400/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Clock className="w-8 h-8 text-amber-300" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">Payment received!</h2>
                <p className="text-white/60 mt-2 text-sm max-w-sm mx-auto">
                  Payment received — we're confirming your license. Check your email for your key. If you don't get it, click retry.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => doVerify(verifyAttempt)}
                    className="bld-btn w-full sm:w-auto flex items-center justify-center gap-2 text-white font-bold py-3 px-8 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#FF8C38] ring-offset-2 ring-offset-[#0D0D1A]"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="text-sm text-white/50 hover:text-white underline transition-colors focus-visible:ring-2 focus-visible:ring-[#FF8C38] ring-offset-2 ring-offset-[#0D0D1A] rounded"
                  >
                    Start over
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-orange-400" />
                  </span>
                  <h2 className="text-lg font-bold text-white">Choose your plan</h2>
                </div>

                {/* TODO(future): Restore real Razorpay config warning once a live/test key is set. */}
                {/* {!keyConfigured && (
                  <div className="bg-yellow-500/10 border border-yellow-400/30 text-yellow-200 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5 mb-5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Razorpay is not configured yet. Set <code className="font-mono">VITE_RAZORPAY_KEY_ID</code> to enable purchases.
                  </div>
                )} */}

                {isDummy && (
                  <div className="bg-sky-500/10 border border-sky-400/30 text-sky-200 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5 mb-5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Test mode — Razorpay key is not set. This will generate a dummy license key without charging anything.
                  </div>
                )}

                {cancelNotice && (
                  <div role="status" className="bg-amber-500/10 border border-amber-400/30 text-amber-200 text-sm px-4 py-3 rounded-xl flex items-center gap-2.5 mb-5">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Payment was cancelled — nothing was charged. You can try again.
                  </div>
                )}

                {error && (
                  <div role="alert" className="bg-red-500/10 border border-red-400/30 text-red-200 text-sm px-4 py-3 rounded-xl mb-5">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(PLANS).map((p) => {
                      const selected = p.key === selectedPlan
                      return (
                        <button
                          type="button"
                          key={p.key}
                          onClick={() => setSelectedPlan(p.key)}
                          className={`bld-card relative text-left rounded-3xl p-5 group focus-visible:ring-2 focus-visible:ring-[#FF8C38] ring-offset-2 ring-offset-[#0D0D1A] ${
                            selected ? 'bld-card-active' : ''
                          }`}
                        >
                          <span className="bld-shine" aria-hidden="true" />
                          {p.key === 'yearly' && (
                            <span className="absolute top-3 left-3 bld-best text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                              BEST VALUE
                            </span>
                          )}
                          {selected && (
                            <span className="absolute top-3 right-3 w-6 h-6 bg-gradient-to-br from-[#FF7A1A] to-[#E8550A] rounded-full flex items-center justify-center shadow-[0_0_14px_rgba(255,107,0,0.7)]">
                              <Check className="w-4 h-4 text-white" />
                            </span>
                          )}
                          <div className="flex items-center gap-2 text-white font-bold mt-6">
                            {p.key === 'yearly' ? <Zap className="w-4 h-4 text-orange-400" /> : <InfinityIcon className="w-4 h-4 text-orange-400" />}
                            {p.label}
                          </div>
                          <div className="text-3xl font-extrabold text-white mt-3 tabular-nums">
                            {formatINR(p.amount)}
                            <span className="text-sm font-medium text-white/50 ml-1">/one-time</span>
                          </div>
                          <div className="text-xs text-white/50 mt-2">
                            {p.key === 'yearly' ? 'Best value — 2 months free' : 'Perfect for a quick start'}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="buy-name" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">Your Name</label>
                      <div className="relative">
                        <User className="w-[18px] h-[18px] text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="buy-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bld-input w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none"
                          placeholder="Rajesh Kumar"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="buy-email" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="w-[18px] h-[18px] text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="buy-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bld-input w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none"
                          placeholder="you@restaurant.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 bld-chip rounded-2xl px-5 py-4">
                    <div>
                      <p className="text-xs text-white/50">Total payable</p>
                      <p className="text-xl font-extrabold text-white tabular-nums">{formatINR(plan.amount)}</p>
                    </div>
                    <button
                      type="submit"
                      disabled={step === 'creating' || step === 'checkout' || step === 'verifying'}
                      className="bld-btn text-white font-bold py-3.5 px-8 rounded-2xl flex items-center justify-center gap-2.5 text-sm tracking-wide disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-[#FF8C38] ring-offset-2 ring-offset-[#0D0D1A]"
                    >
                      <span aria-live="polite" className="inline-flex items-center gap-2.5">
                      {step === 'creating' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating order...
                        </>
                      ) : step === 'checkout' || step === 'verifying' ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Confirming payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          {isDummy ? 'Test Pay & Activate' : 'Pay & Activate'}
                        </>
                      )}
                      </span>
                    </button>
                  </div>
                </form>

                <div className="mt-6 flex items-center justify-center gap-3 flex-wrap text-xs text-white/50">
                  <span className="bld-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                    <BadgeCheck className="w-4 h-4 text-green-400" /> Secure payment
                  </span>
                  <span className="bld-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                    <BadgeCheck className="w-4 h-4 text-green-400" /> Instant email delivery
                  </span>
                  <span className="bld-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                    <BadgeCheck className="w-4 h-4 text-green-400" /> Instant activation
                  </span>
                </div>
              </>
            )}

            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-white/50 hover:text-white transition-colors inline-flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
