import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi'
import { FaLinkedinIn, FaInstagram, FaYoutube, FaFacebookF } from 'react-icons/fa'

const footerLinks = {
  POSS: [
    { label: 'Billing', href: '#features' },
    { label: 'Inventory', href: '#features' },
    { label: 'Reporting', href: '#features' },
    { label: 'Online Ordering', href: '#features' },
    { label: 'CRM', href: '#features' },
    { label: 'Menu', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
  ],
  'Add-ons': [
    { label: 'Captain Ordering App', href: '#' },
    { label: 'Kitchen Display System', href: '#' },
    { label: 'Scan & Order', href: '#' },
    { label: 'Self-Service Kiosk', href: '#' },
    { label: 'Loyalty Program', href: '#' },
    { label: 'Analytics & Insights', href: '#' },
  ],
  'Outlet Types': [
    { label: 'Fine Dine', href: '#outlets' },
    { label: 'QSR', href: '#outlets' },
    { label: 'Cafe', href: '#outlets' },
    { label: 'Food Court', href: '#outlets' },
    { label: 'Cloud Kitchen', href: '#outlets' },
    { label: 'Bakery', href: '#outlets' },
  ],
  Resources: [
    { label: 'Blog', href: '#' },
    { label: 'Glossary', href: '#' },
    { label: 'Templates', href: '#' },
    { label: 'Free Tools', href: '#' },
    { label: 'Webinars', href: '#' },
    { label: 'Support', href: '#' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Reseller', href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <a href="#" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="DaawatDesk" className="h-24 w-auto object-contain" />
              {/* <span className="text-2xl font-bold">DaawatDesk</span> */}
            </a>
            <p className="text-white/60 text-sm mb-6 max-w-xs">
              Restaurant POS software made simple. Manage all your restaurant operations from one place.
            </p>
            <div className="flex gap-3">
              {[FaLinkedinIn, FaInstagram, FaYoutube, FaFacebookF].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 bg-white/10 hover:bg-primary rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/50 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            Copyright &copy; {new Date().getFullYear()} DaawatDesk. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
