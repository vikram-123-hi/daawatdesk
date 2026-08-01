import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

const navLinks = [
  {
    label: 'POSS',
    children: [
      { label: 'Billing', href: '/billing' },
      { label: 'Inventory', href: '#features' },
      { label: 'Online Ordering', href: '#features' },
      { label: 'Reporting', href: '#features' },
      { label: 'Menu', href: '#features' },
      { label: 'CRM', href: '#features' },
    ],
  },
  {
    label: 'Add-ons',
    children: [
      { label: 'Marketplace', href: '#marketplace' },
      { label: 'Integrations', href: '#integrations' },
    ],
  },
  {
    label: 'Outlet Types',
    children: [
      { label: 'Fine Dine', href: '#outlets' },
      { label: 'QSR', href: '#outlets' },
      { label: 'Cafe', href: '#outlets' },
      { label: 'Cloud Kitchen', href: '#outlets' },
    ],
  },
  { label: 'Pricing', href: '#pricing' },
  {
    label: 'Resources',
    children: [
      { label: 'Blog', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-24 lg:h-32">
          <a href="#" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="DaawatDesk" className="h-44 w-auto object-contain" />
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.children && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <a
                  href={link.href || '#'}
                  className="flex items-center gap-1 px-4 py-2 text-lg font-medium text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-primary-light"
                >
                  {link.label}
                  {link.children && <ChevronDown className="w-3.5 h-3.5" />}
                </a>
                {link.children && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-border py-2 animate-fade-up">
                    {link.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link to="/login" className="text-lg font-medium text-text-secondary hover:text-primary transition-colors px-4 py-2">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-primary hover:bg-primary-dark text-white text-lg font-semibold px-8 py-3 rounded-full transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Register
            </Link>
          </div>

          <button
            className="lg:hidden p-2 text-text-secondary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border shadow-lg">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <a
                  href={link.href || '#'}
                  className="block px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                  onClick={() => {
                    if (!link.children) setMobileOpen(false)
                  }}
                >
                  {link.label}
                </a>
                {link.children && (
                  <div className="pl-4">
                    {link.children.map((child) => (
                      <a
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-text-light hover:text-primary transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 space-y-2">
              <a href="#demo" className="block w-full text-center bg-primary text-white text-sm font-semibold px-6 py-3 rounded-full">
                Book A Demo
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
