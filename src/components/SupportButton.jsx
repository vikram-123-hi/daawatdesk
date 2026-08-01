import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Headphones, MessageCircle, Phone, Mail, X } from 'lucide-react'

export default function SupportButton() {
  const { userProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const restaurantName = userProfile?.restaurant || 'Restaurant'

  return (
    <div className="fixed bottom-20 right-5 z-[70]">
      <div
        className={`mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden transition-all duration-300 ease-out origin-bottom-right ${
          open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white">Need Help?</h3>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-white/70 text-xs mt-1">We're here to help you succeed</p>
        </div>
        <div className="p-3 space-y-2">
          <a
            href={`https://wa.me/917008938983?text=${encodeURIComponent(`Hi\nI am from ${restaurantName} trying to connect with you.\nPlease call back!`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green/5 transition-colors"
          >
            <div className="w-9 h-9 bg-green/10 rounded-lg flex items-center justify-center flex-shrink-0"><MessageCircle className="w-4 h-4 text-green" /></div>
            <div>
              <p className="text-sm font-semibold text-secondary">WhatsApp</p>
              <p className="text-[10px] text-gray-400">Quick response</p>
            </div>
          </a>
          <a href="tel:7008938983" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue/5 transition-colors">
            <div className="w-9 h-9 bg-blue/10 rounded-lg flex items-center justify-center flex-shrink-0"><Phone className="w-4 h-4 text-blue" /></div>
            <div>
              <p className="text-sm font-semibold text-secondary">Call Us</p>
              <p className="text-[10px] text-gray-400">7008938983</p>
            </div>
          </a>
          <a href="mailto:swainvikramaditya99@gmail.com" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange/5 transition-colors">
            <div className="w-9 h-9 bg-orange/10 rounded-lg flex items-center justify-center flex-shrink-0"><Mail className="w-4 h-4 text-orange" /></div>
            <div>
              <p className="text-sm font-semibold text-secondary">Email</p>
              <p className="text-[10px] text-gray-400">swainvikramaditya99@gmail.com</p>
            </div>
          </a>
        </div>
      </div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-out hover:scale-110 ${open ? 'bg-gray-700 rotate-0' : 'bg-primary hover:shadow-xl'}`}
      >
        {open ? <X className="w-5 h-5 text-white transition-transform duration-300" /> : <Headphones className="w-5 h-5 text-white" />}
      </button>
    </div>
  )
}
