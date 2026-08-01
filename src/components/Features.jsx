import { useState, useEffect, useRef } from 'react'
import { Receipt, QrCode, Package, BarChart3, Users, ChefHat, Sparkles, ArrowRight } from 'lucide-react'

const features = [
  {
    id: 'billing',
    icon: Receipt,
    title: 'Lightning-fast restaurant billing',
    description: 'Take orders, punch bills and generate KOT in seconds. Accept payments via UPI QR, card, cash or split across methods. Apply discounts, merge tables, and generate GST-compliant bills — all in 3 clicks.',
    color: 'bg-orange-50 text-orange-600',
    items: ['Quick Billing & KOT', 'UPI / Card / Cash', 'Split & Merge Bills', 'GST-compliant Bills'],
    mockup: {
      title: 'Billing Dashboard',
      stats: [
        { label: 'Payment Methods', value: 'UPI, Card, Cash' },
        { label: 'Bill Generation', value: '< 10 seconds' },
        { label: 'GST Support', value: '5% Auto-calc' },
      ],
      features: [
        { name: 'QR Code Table Menu', desc: 'Customers scan → order → pay from phone' },
        { name: 'Discount Engine', desc: 'Flat, %, or birthday-based auto-discounts' },
        { name: 'Transaction History', desc: 'Searchable log with date filters & export' },
      ],
    },
  },
  {
    id: 'qr-ordering',
    icon: QrCode,
    title: 'QR Code Table Ordering',
    description: 'Each table gets a unique QR code. Customers scan it, browse the full menu with veg/non-veg filters, select items, pay via UPI — and the order auto-reaches your kitchen. Zero staff involvement needed.',
    color: 'bg-green/10 text-green',
    items: ['Table-specific QR Codes', 'Live Menu on Phone', 'UPI Auto-pay', 'Auto KOT Generation'],
    mockup: {
      title: 'QR Order Flow',
      stats: [
        { label: 'Step 1', value: 'Scan QR' },
        { label: 'Step 2', value: 'Order & Pay' },
        { label: 'Step 3', value: 'Auto KOT' },
      ],
      features: [
        { name: 'Phone-first Design', desc: 'No app download needed — works in browser' },
        { name: 'Customer Recognition', desc: 'Remembers returning customers by phone' },
        { name: 'Birthday Discounts', desc: 'Auto-detects birthdays and offers discounts' },
      ],
    },
  },
  {
    id: 'inventory',
    icon: Package,
    title: 'Smart inventory with expiry tracking',
    description: 'Track every ingredient with purchase, usage, and wastage logs. Monitor expiry dates, get low-stock alerts, and see real COGS impact on your profit. No more spoiled ingredients going unnoticed.',
    color: 'bg-blue/10 text-blue',
    items: ['Stock Tracking', 'Expiry Alerts', 'Purchase/Usage/Wastage', 'COGS & Profit Impact'],
    mockup: {
      title: 'Inventory Control',
      stats: [
        { label: 'Track', value: 'Every item' },
        { label: 'Alerts', value: 'Low + Expiry' },
        { label: 'Reports', value: 'COGS Impact' },
      ],
      features: [
        { name: 'Expiry Date Tracking', desc: 'Auto-alerts for items expiring today/soon' },
        { name: 'Wastage Logging', desc: 'Track spoiled items with cost impact' },
        { name: 'Stock Value Reports', desc: 'Real-time inventory valuation' },
      ],
    },
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Real-time business intelligence',
    description: 'Watch your revenue, COGS, net profit, and peak hours update in real-time. Sales trends, payment breakdowns, order-type analysis, and table performance — all with beautiful charts you can filter by date.',
    color: 'bg-purple/10 text-purple',
    items: ['Revenue & Profit', 'Peak Hours Analysis', 'Payment Breakdown', 'Table Performance'],
    mockup: {
      title: 'Live Analytics',
      stats: [
        { label: 'Revenue', value: 'Real-time' },
        { label: 'COGS', value: 'Auto-calculated' },
        { label: 'Net Profit', value: 'Live dashboard' },
      ],
      features: [
        { name: 'Sales Trend Charts', desc: 'Daily/weekly revenue with area charts' },
        { name: 'Top Items & Payments', desc: 'Best sellers, UPI vs cash vs card split' },
        { name: 'Export to Excel', desc: 'Download any report as spreadsheet' },
      ],
    },
  },
  {
    id: 'crm',
    icon: Users,
    title: 'Know your customers',
    description: 'Build a customer database from your billing data. Track visit frequency, total spend, birthdays — and link them to orders. Send targeted offers to your regulars and watch loyalty grow.',
    color: 'bg-pink-100 text-pink-600',
    items: ['Customer Database', 'Birthday Tracking', 'Visit & Spend History', 'Order Linking'],
    mockup: {
      title: 'Customer CRM',
      stats: [
        { label: 'Auto-capture', value: 'From billing' },
        { label: 'Birthdays', value: 'Auto-detected' },
        { label: 'Loyalty', value: 'Track & reward' },
      ],
      features: [
        { name: 'Phone Lookup', desc: 'Find customers instantly by phone number' },
        { name: 'Birthday Discounts', desc: 'Auto-offer 5-15% on birthdays' },
        { name: 'Lifetime Value', desc: 'See total orders, spend, and last visit' },
      ],
    },
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'AI-powered Smart Assistant',
    description: 'Ask questions in plain English and get instant answers about your business. "How was yesterday\'s revenue?" "Which items are expiring?" "What\'s my COGS?" — powered by Llama 3.3 AI, built right into your POS.',
    color: 'bg-amber-100 text-amber-600',
    items: ['Natural Language Queries', 'Revenue Insights', 'Expiry Alerts', 'Smart Recommendations'],
    mockup: {
      title: 'AI Assistant',
      stats: [
        { label: 'Powered by', value: 'Llama 3.3' },
        { label: 'Queries', value: 'Unlimited' },
        { label: 'Alerts', value: 'Smart & proactive' },
      ],
      features: [
        { name: 'Revenue Questions', desc: '"What was my profit last week?"' },
        { name: 'Inventory Alerts', desc: '"Which items expire today?"' },
        { name: 'Smart Alerts', desc: 'Auto-detects anomalies and warns you' },
      ],
    },
  },
]

export default function Features() {
  const [active, setActive] = useState('billing')
  const activeFeature = features.find((f) => f.id === active)
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="features" ref={sectionRef} className="py-20 lg:py-28 bg-surface relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,107,0,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.06) 0%, transparent 50%)' }}></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary mt-3 mb-4">
            Everything your restaurant<br />needs, nothing it doesn't
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Built by restaurateurs, for restaurateurs. Every feature solves a real problem.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {features.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                active === f.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                  : 'bg-white text-text-secondary hover:bg-primary-light hover:text-primary border border-border hover:scale-105'
              } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <f.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{f.id === 'qr-ordering' ? 'QR Ordering' : f.id === 'ai' ? 'AI Assistant' : f.id.charAt(0).toUpperCase() + f.id.slice(1)}</span>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`space-y-6 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${activeFeature.color}`}>
              <activeFeature.icon className="w-5 h-5" />
              <span className="text-sm font-semibold capitalize">{activeFeature.id === 'qr-ordering' ? 'QR Ordering' : activeFeature.id === 'ai' ? 'AI Assistant' : activeFeature.id}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-secondary">{activeFeature.title}</h3>
            <p className="text-text-secondary leading-relaxed">{activeFeature.description}</p>
            <div className="grid grid-cols-2 gap-3">
              {activeFeature.items.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <div className="w-5 h-5 bg-green/10 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <a href="#demo" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
              Try it yourself <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className={`bg-white rounded-2xl shadow-xl border border-border p-6 lg:p-8 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-bold text-secondary">{activeFeature.mockup.title}</h4>
              <span className="text-xs text-green font-semibold bg-green/10 px-2 py-1 rounded-full">Live</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {activeFeature.mockup.stats.map((stat) => (
                <div key={stat.label} className="bg-surface rounded-xl p-3 text-center">
                  <p className="text-[11px] text-text-light mb-1">{stat.label}</p>
                  <p className="text-sm font-bold text-secondary">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {activeFeature.mockup.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 py-3 px-4 bg-surface rounded-xl">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <activeFeature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-secondary">{feat.name}</p>
                    <p className="text-xs text-text-light">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
