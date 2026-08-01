import { useEffect, useRef, useState } from 'react'
import { Zap, Smartphone, Brain, Shield } from 'lucide-react'

const reasons = [
  {
    icon: Zap,
    title: 'Built for speed',
    description: '3-click billing. Sub-second KOT generation. Designed for peak-hour rush when every second counts.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Smartphone,
    title: 'Customers order themselves',
    description: 'QR code table ordering — customers scan, browse, order, and pay from their own phone. Zero staff needed.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Brain,
    title: 'AI that understands your business',
    description: 'Ask "How was yesterday?" in plain English. Built-in Llama AI analyzes your revenue, inventory, and trends.',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    icon: Shield,
    title: 'No hidden charges',
    description: 'No per-bill fees. No transaction cuts. No Swiggy/Zomato commission. You own your data, you keep your profits.',
    gradient: 'from-blue-500 to-cyan-500',
  },
]

export default function Testimonials() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-secondary relative overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,107,0,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)' }}></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Why DaawatDesk</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-3 mb-4">
            Not just another POS
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Built from scratch for modern Indian restaurants
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-primary/30 transition-all duration-500 group hover:bg-white/10 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100 + 200}ms` }}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${reason.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <reason.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{reason.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
