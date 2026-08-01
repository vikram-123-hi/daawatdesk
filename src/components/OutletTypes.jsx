import { Coffee, Utensils, Wine, Pizza, Zap, IceCream, Cake, Beer, Store, Cloud } from 'lucide-react'

const outlets = [
  { icon: Utensils, label: 'Fine Dine', color: 'from-amber-500 to-orange-600' },
  { icon: Zap, label: 'QSR', color: 'from-red-500 to-rose-600' },
  { icon: Coffee, label: 'Cafe', color: 'from-yellow-600 to-amber-600' },
  { icon: Store, label: 'Food Court', color: 'from-blue-500 to-indigo-600' },
  { icon: Cloud, label: 'Cloud Kitchen', color: 'from-gray-500 to-slate-600' },
  { icon: IceCream, label: 'Desserts', color: 'from-pink-400 to-rose-500' },
  { icon: Cake, label: 'Bakery', color: 'from-orange-400 to-amber-500' },
  { icon: Beer, label: 'Bar & Brewery', color: 'from-purple-500 to-violet-600' },
  { icon: Pizza, label: 'Pizzeria', color: 'from-green-500 to-emerald-600' },
  { icon: Wine, label: 'Large Chains', color: 'from-indigo-500 to-blue-600' },
]

export default function OutletTypes() {
  return (
    <section id="outlets" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Outlet Types</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-secondary mt-3 mb-4">
            Built for all types of<br />food business
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            The all-in-one Restaurant Management System for all types of restaurant formats and food outlets
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 lg:gap-6">
          {outlets.map((outlet, i) => (
            <a
              key={i}
              href="#demo"
              className="group relative bg-white rounded-2xl p-6 border border-border hover:border-transparent hover:shadow-xl transition-all duration-300 text-center overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${outlet.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}></div>
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                  <outlet.icon className="w-8 h-8 text-text-secondary group-hover:text-white transition-colors" />
                </div>
                <p className="text-sm font-semibold text-text-secondary group-hover:text-white transition-colors">
                  {outlet.label}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
