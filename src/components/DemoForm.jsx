import { useState, useRef, useEffect } from 'react'
import { Send, Phone, Mail, MapPin, ChevronDown, Check, Utensils, Zap, Coffee, ShoppingBag, Cloud, Cake, Beer, Pizza, Store } from 'lucide-react'

const OUTLET_TYPES = [
  { id: 'Fine Dine', label: 'Fine Dine', icon: Utensils, desc: 'Full service & luxury dining' },
  { id: 'QSR', label: 'QSR', icon: Zap, desc: 'Quick service & fast food' },
  { id: 'Cafe', label: 'Cafe', icon: Coffee, desc: 'Coffee, drinks & light snacks' },
  { id: 'Food Court', label: 'Food Court', icon: ShoppingBag, desc: 'Multi-vendor food court counter' },
  { id: 'Cloud Kitchen', label: 'Cloud Kitchen', icon: Cloud, desc: 'Delivery-only virtual kitchen' },
  { id: 'Bakery', label: 'Bakery', icon: Cake, desc: 'Cakes, pastries & fresh breads' },
  { id: 'Bar & Brewery', label: 'Bar & Brewery', icon: Beer, desc: 'Pubs, bars & microbreweries' },
  { id: 'Pizzeria', label: 'Pizzeria', icon: Pizza, desc: 'Pizza parlour & fast casual' },
]

export default function DemoForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    restaurant: '',
    city: '',
    outletType: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <section id="demo" className="py-20 lg:py-28 bg-gradient-to-br from-primary via-primary-dark to-primary relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-white">
            <span className="text-sm font-semibold text-white/70 uppercase tracking-wider">Schedule a free demo</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-3 mb-6">
              Get in touch with our team to clarify your queries
            </h2>
            <p className="text-white/80 text-lg mb-10 leading-relaxed">
              Book a free demo and see how DaawatDesk can transform your restaurant operations. Our team is here to help you get started.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Call us at</p>
                  <p className="font-semibold">+91 7008938983</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Email us at</p>
                  <p className="font-semibold">swainvikramaditya99@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-white/60">Visit us at</p>
                  <p className="font-semibold">Khandagiri, Bhubaneswar, Odisha, India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 lg:p-10 shadow-2xl">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-secondary mb-2">Thank you!</h3>
                <p className="text-text-secondary">Our team will contact you within 24 hours to schedule your free demo.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      inputMode="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      placeholder="+91 7008938983"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    placeholder="swainvikramaditya99@gmail.com"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Restaurant Name *</label>
                    <input
                      type="text"
                      name="restaurant"
                      required
                      value={formData.restaurant}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      placeholder="Restaurant Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                      placeholder="Bhubaneswar"
                    />
                  </div>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Outlet Type</label>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all text-sm bg-white cursor-pointer ${
                      isDropdownOpen 
                        ? 'border-primary ring-2 ring-primary/20 shadow-md' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {formData.outletType ? (
                      <span className="flex items-center gap-2.5 font-medium text-secondary">
                        {(() => {
                          const selected = OUTLET_TYPES.find(t => t.id === formData.outletType)
                          if (!selected) return formData.outletType
                          const SelectedIcon = selected.icon
                          return (
                            <>
                              <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                <SelectedIcon className="w-3.5 h-3.5" />
                              </span>
                              <span>{selected.label}</span>
                            </>
                          )
                        })()}
                      </span>
                    ) : (
                      <span className="text-gray-400 flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        Select outlet type
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden py-1 max-h-64 overflow-y-auto premium-scroll animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/80 border-b border-gray-100">
                        Choose restaurant format
                      </div>
                      {OUTLET_TYPES.map((type) => {
                        const IconComponent = type.icon
                        const isSelected = formData.outletType === type.id
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, outletType: type.id })
                              setIsDropdownOpen(false)
                            }}
                            className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-all hover:bg-orange-50/60 ${
                              isSelected ? 'bg-orange-50 text-primary font-semibold' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary'
                              }`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium leading-tight">{type.label}</div>
                                <div className="text-[11px] text-gray-400 font-normal">{type.desc}</div>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Message</label>
                  <textarea
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
                    placeholder="Tell us about your requirements..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-primary/25 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Book Free Demo
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

