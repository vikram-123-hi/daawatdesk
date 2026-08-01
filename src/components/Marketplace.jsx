import { useState, useEffect, useRef } from 'react'
import { ChefHat, BarChart3, Sparkles, Shield, ArrowRight } from 'lucide-react'

const categories = [
  {
    id: 'kitchen',
    icon: ChefHat,
    label: 'Kitchen Display',
    title: 'Kitchen orders, organized',
    description: 'A dedicated kitchen screen that receives KOTs in real-time. Mark items as preparing, ready, or serve — the billing counter sees it all instantly. No paper chits flying around.',
    features: ['Live KOT Feed', 'Status Tracking', 'Ready Alerts', 'Sound Notifications'],
    color: 'from-orange-500 to-red-500',
    iconBg: 'bg-orange-50 text-orange-600',
  },
  {
    id: 'reports',
    icon: BarChart3,
    label: 'Smart Reports',
    title: 'Numbers that make sense',
    description: 'Revenue trends, COGS analysis, payment breakdowns, peak hour heatmaps, table performance, inventory value — all updated live. Filter by date, export to Excel, or just ask the AI.',
    features: ['Revenue & Profit', 'COGS Tracking', 'Peak Hours', 'Table Performance'],
    color: 'from-purple-500 to-indigo-500',
    iconBg: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'ai',
    icon: Sparkles,
    label: 'AI Assistant',
    title: 'Ask your business anything',
    description: 'Built-in AI powered by Llama 3.3 that understands your data. Ask "How was last week?" or "What\'s expiring today?" and get instant, actionable answers — no spreadsheets needed.',
    features: ['Natural Language', 'Revenue Insights', 'Expiry Alerts', 'Smart Recommendations'],
    color: 'from-amber-500 to-orange-500',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'security',
    icon: Shield,
    label: 'Access Control',
    title: 'Role-based access for your team',
    description: 'Owner, manager, kitchen staff — each gets their own view. Restrict who can see reports, who can edit menu, who can process refunds. License key system keeps everything secure.',
    features: ['Owner / Staff Roles', 'License Keys', 'Code Access', 'Secure Login'],
    color: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-50 text-blue-600',
  },
]

export default function Marketplace() {
  const [active, setActive] = useState('kitchen')
  const activeCategory = categories.find((c) => c.id === active)
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="marketplace" ref={sectionRef} className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Built-in Tools</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary mt-3 mb-4">
            More than just a POS
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Every tool your restaurant needs is already inside DaawatDesk
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-3">
            {categories.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ${
                  active === cat.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-[1.02]'
                    : 'bg-surface hover:bg-primary-light text-text-secondary hover:text-primary'
                } ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                style={{ transitionDelay: `${i * 80 + 200}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  active === cat.id ? 'bg-white/20' : cat.iconBg
                }`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{cat.label}</p>
                </div>
              </button>
            ))}
          </div>

          <div className={`lg:col-span-8 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
            <div className="bg-gradient-to-br from-surface to-white rounded-2xl p-8 lg:p-10 border border-border h-full">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${activeCategory.iconBg} mb-6`}>
                <activeCategory.icon className="w-5 h-5" />
                <span className="text-sm font-semibold">{activeCategory.label}</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-secondary mb-4">{activeCategory.title}</h3>
              <p className="text-text-secondary mb-8 leading-relaxed">{activeCategory.description}</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {activeCategory.features.map((feature) => (
                  <div key={feature} className="bg-white rounded-xl p-4 flex items-center gap-3 border border-border/50">
                    <div className="w-8 h-8 bg-green/10 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-medium text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
              <a href="#demo" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-full transition-all hover:shadow-lg">
                Try it free <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
