import { useEffect, useState, useRef } from 'react'

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, end, duration])

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

const stats = [
  {
    value: 6,
    suffix: '',
    label: 'Payment Methods',
    desc: 'UPI, Card, Cash, Split, Wallet, QR',
    color: 'text-green',
    bg: 'bg-green/10',
  },
  {
    value: 12,
    suffix: '+',
    label: 'Built-in Reports',
    desc: 'Revenue, COGS, Peak Hours, Table Performance',
    color: 'text-blue',
    bg: 'bg-blue/10',
  },
  {
    value: 3,
    suffix: '',
    label: 'Click Billing',
    desc: 'Item → KOT → Bill in under 10 seconds',
    color: 'text-primary',
    bg: 'bg-orange-50',
  },
]

export default function Stats() {
  const sectionRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-white to-primary/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className={`w-16 h-16 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <span className={`text-2xl font-extrabold ${stat.color}`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </span>
              </div>
              <p className="text-xl font-bold text-secondary mb-1">{stat.label}</p>
              <p className="text-sm text-text-secondary">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
