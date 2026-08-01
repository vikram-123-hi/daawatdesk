import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

const capabilities = [
  { name: 'Google Pay', category: 'UPI', desc: 'QR code payment' },
  { name: 'PhonePe', category: 'UPI', desc: 'QR code payment' },
  { name: 'Paytm', category: 'UPI', desc: 'QR code payment' },
  { name: 'Any UPI', category: 'UPI', desc: 'Generic QR scan' },
  { name: 'Credit Card', category: 'Card', desc: 'Manual entry' },
  { name: 'Debit Card', category: 'Card', desc: 'Manual entry' },
  { name: 'Menu OCR', category: 'AI', desc: 'Scan menu cards' },
  { name: 'Smart Assistant', category: 'AI', desc: 'Llama 3.3 powered' },
  { name: 'Excel Export', category: 'Reports', desc: 'Download reports' },
  { name: 'GST Filing', category: 'Finance', desc: 'Auto-calculated' },
  { name: 'QR Ordering', category: 'Orders', desc: 'Table QR codes' },
  { name: 'PDF Bills', category: 'Billing', desc: 'Print-ready bills' },
]

const categoryColors = {
  UPI: 'bg-green/10 text-green border-green/20',
  Card: 'bg-blue/10 text-blue border-blue/20',
  AI: 'bg-amber-100 text-amber-600 border-amber-200',
  Reports: 'bg-purple/10 text-purple border-purple/20',
  Finance: 'bg-orange-50 text-orange-600 border-orange-200',
  Orders: 'bg-pink-100 text-pink-600 border-pink-200',
  Billing: 'bg-indigo-100 text-indigo-600 border-indigo-200',
}

export default function Integrations() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="integrations" ref={sectionRef} className="py-20 lg:py-28 bg-surface relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Payment & Integrations</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary mt-3 mb-4">
            Accept every payment,<br />automate everything
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            UPI, cards, GST, OCR — DaawatDesk handles it all out of the box
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
          {capabilities.map((cap, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group text-center ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${i * 50 + 200}ms` }}
            >
              <div className="w-12 h-12 mx-auto bg-surface rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <span className="text-lg font-bold text-text-secondary group-hover:text-primary transition-colors">
                  {cap.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-semibold text-secondary mb-1">{cap.name}</p>
              <p className="text-[11px] text-text-light mb-2">{cap.desc}</p>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryColors[cap.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {cap.category}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="#demo" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-full transition-all hover:shadow-xl hover:shadow-primary/25">
            Get started free <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
