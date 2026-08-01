import { useEffect, useRef, useState } from 'react'

const steps = [
  {
    number: '01',
    title: 'Set up your menu',
    description: 'Add items, categories, prices. Or just upload a photo of your menu card — our AI extracts everything automatically.',
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
  {
    number: '02',
    title: 'Print QR codes',
    description: 'Generate unique QR codes for each table. Customers scan → see your full menu → order → pay. Orders reach your kitchen instantly.',
    color: 'bg-green/10 text-green border-green/20',
  },
  {
    number: '03',
    title: 'Run your restaurant',
    description: 'Billing, KOT, inventory, reports, CRM — everything runs from one dashboard. Ask the AI anything about your business.',
    color: 'bg-purple/10 text-purple border-purple/20',
  },
]

export default function Ratings() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">How it works</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary mt-3">
            Up and running in 3 steps
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 150 + 200}ms` }}
            >
              <div className={`w-16 h-16 ${step.color} border-2 rounded-2xl flex items-center justify-center mb-6`}>
                <span className="text-xl font-extrabold">{step.number}</span>
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">{step.title}</h3>
              <p className="text-text-secondary leading-relaxed">{step.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent -translate-x-1/2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
