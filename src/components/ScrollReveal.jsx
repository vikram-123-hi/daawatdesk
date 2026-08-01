import { useScrollReveal, useParallax } from '../hooks/useScrollReveal'

export function ScrollReveal({ children, className = '', animation = 'reveal', delay = 0, parallax = false, parallaxSpeed = 0.3, ...props }) {
  const revealRef = useScrollReveal()
  const parallaxRef = useParallax(parallaxSpeed)

  const animClass = `sr-${animation}`
  const delayStyle = delay ? { animationDelay: `${delay}ms` } : {}

  if (parallax) {
    return (
      <div ref={parallaxRef} className="sr-element" {...props}>
        <div ref={revealRef} className={`${animClass} ${className}`} style={delayStyle}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div ref={revealRef} className={`${animClass} ${className}`} style={delayStyle} {...props}>
      {children}
    </div>
  )
}

export function ParallaxSection({ children, className = '', speed = 0.2, bg = false, ...props }) {
  const ref = useParallax(speed)

  if (bg) {
    return (
      <div ref={ref} className={`sr-parallax-bg ${className}`} {...props}>
        {children}
      </div>
    )
  }

  return (
    <div ref={ref} className={`sr-element ${className}`} {...props}>
      {children}
    </div>
  )
}
