import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  const bgRef = useRef(null)
  const float1Ref = useRef(null)
  const float2Ref = useRef(null)
  const float3Ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    let ticking = false
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY
          if (bgRef.current) bgRef.current.style.transform = `translateY(${y * 0.3}px)`
          if (float1Ref.current) float1Ref.current.style.transform = `translateY(${y * -0.15}px) rotate(${y * 0.02}deg)`
          if (float2Ref.current) float2Ref.current.style.transform = `translateY(${y * -0.1}px) rotate(${y * -0.015}deg)`
          if (float3Ref.current) float3Ref.current.style.transform = `translateY(${y * -0.2}px)`
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden min-h-[90vh] flex items-center">
      {/* Parallax background */}
      <div ref={bgRef} className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform" style={{ backgroundImage: "url('/hero-bg.png')" }}></div>
      <div className="absolute inset-0 bg-white/85"></div>

      {/* Floating decorative elements */}
      <div ref={float1Ref} className="absolute top-20 right-[15%] w-20 h-20 bg-primary/10 rounded-2xl rotate-12 will-change-transform hidden lg:block"></div>
      <div ref={float2Ref} className="absolute bottom-32 left-[10%] w-16 h-16 bg-blue/10 rounded-full will-change-transform hidden lg:block"></div>
      <div ref={float3Ref} className="absolute top-40 left-[20%] w-12 h-12 bg-green/10 rounded-xl rotate-45 will-change-transform hidden lg:block"></div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/8 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue/5 rounded-full blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className={`text-center lg:text-left transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Restaurant POS, reimagined
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-secondary leading-tight mb-6">
              Restaurant POS software{' '}
              <span className="gradient-text">made simple!</span>
            </h1>
            <p className="text-lg text-text-secondary mb-8 max-w-xl mx-auto lg:mx-0">
              Billing, QR ordering, inventory, CRM, AI assistant — everything your restaurant needs, nothing it doesn't.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full text-base transition-all hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                Take a Free Demo
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 border-2 border-border hover:border-primary text-text-secondary hover:text-primary font-semibold px-8 py-4 rounded-full text-base transition-all"
              >
                See Features
              </a>
            </div>
          </div>

          <div className={`relative transition-all duration-1000 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 lg:p-12">
              <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-secondary">New Order</h3>
                  <span className="bg-green/10 text-green text-xs font-semibold px-3 py-1 rounded-full">Table 5</span>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Butter Chicken', qty: 1, price: '₹320' },
                    { name: 'Garlic Naan', qty: 2, price: '₹80' },
                    { name: 'Jeera Rice', qty: 1, price: '₹150' },
                    { name: 'Mango Lassi', qty: 2, price: '₹120' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 bg-primary/10 text-primary text-xs font-bold rounded-lg flex items-center justify-center">{item.qty}x</span>
                        <span className="text-sm font-medium text-secondary">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-secondary">{item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t-2 border-dashed border-border pt-3 flex items-center justify-between">
                  <span className="font-bold text-secondary">Total</span>
                  <span className="font-bold-xl text-primary">₹750</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button className="bg-primary text-white font-semibold py-3 rounded-xl text-sm hover:bg-primary-dark transition-colors">
                    Pay Now
                  </button>
                  <button className="border-2 border-border text-text-secondary font-semibold py-3 rounded-xl text-sm hover:border-primary hover:text-primary transition-colors">
                    Print KOT
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
