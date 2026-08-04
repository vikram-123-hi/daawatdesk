import { X, Utensils, Info, CheckCircle2, AlertTriangle, Leaf } from 'lucide-react'
import { getItemIngredientInfo } from '../utils/itemDetailHelper'

export default function ItemDetailModal({ item, onClose, onAddToCart }) {
  if (!item) return null

  const { description, ingredientsList, hasOnionGarlic } = getItemIngredientInfo(item)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs transition-opacity duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md p-6 space-y-4 animate-fade-up-fast shadow-2xl max-h-[90vh] overflow-y-auto cursor-default"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {item.veg ? (
                <span className="w-4 h-4 rounded-[3px] border-[1.5px] border-emerald-600 flex items-center justify-center flex-shrink-0 bg-white" title="Pure Veg">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                </span>
              ) : (
                <span className="w-4 h-4 rounded-[3px] border-[1.5px] border-rose-600 flex items-center justify-center flex-shrink-0 bg-white" title="Non-Veg">
                  <svg className="w-2.5 h-2.5 fill-rose-600" viewBox="0 0 12 12">
                    <polygon points="6,1 11,10 1,10" />
                  </svg>
                </span>
              )}
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${item.veg ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {item.veg ? 'Pure Veg' : 'Non-Veg'}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 font-header-pro leading-tight">{item.name}</h3>
            <p className="text-base font-extrabold text-primary mt-0.5">₹{item.price}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Image (if available) */}
        {item.image && (
          <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Description & Taste Notes</label>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 font-medium">
            {description}
          </p>
        </div>

        {/* Onion & Garlic Dietary Warning Badge */}
        {hasOnionGarlic ? (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border-2 border-amber-400/80 rounded-2xl p-3.5 text-xs flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500/20 text-amber-700 rounded-xl flex items-center justify-center text-lg shrink-0 border border-amber-300">
              🧅🧄
            </div>
            <div>
              <p className="font-extrabold italic text-amber-900 text-sm">Contains Onion & Garlic</p>
              <p className="text-[11px] text-amber-700/90 font-medium mt-0.5">
                Prepared with fresh <span className="font-extrabold italic underline decoration-amber-400">onions</span> & <span className="font-extrabold italic underline decoration-amber-400">garlic</span> seasonings.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/90 border-2 border-emerald-300/80 rounded-2xl p-3.5 text-xs flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-lg shrink-0 border border-emerald-300">
              🌿
            </div>
            <div>
              <p className="font-extrabold italic text-emerald-900 text-sm">No Onion & No Garlic (Jain Friendly)</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                Specially crafted without any onion or garlic ingredients.
              </p>
            </div>
          </div>
        )}

        {/* Ingredients List with Highlighted Onion & Garlic */}
        {ingredientsList.length > 0 && (
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Key Ingredients</label>
            <div className="flex flex-wrap gap-1.5">
              {ingredientsList.map((ing, idx) => {
                const lowerIng = ing.toLowerCase()
                const isOnionGarlic = lowerIng.includes('onion') || lowerIng.includes('garlic') || lowerIng.includes('pyaz') || lowerIng.includes('lahsun')

                return (
                  <span
                    key={idx}
                    className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                      isOnionGarlic
                        ? 'bg-amber-100 text-amber-900 font-extrabold italic border-2 border-amber-400 shadow-2xs ring-1 ring-amber-400/40 animate-pulse'
                        : 'bg-slate-100 text-slate-700 font-semibold border border-slate-200/70'
                    }`}
                  >
                    {isOnionGarlic ? (lowerIng.includes('onion') ? '🧅 ' : '🧄 ') : ''}
                    {ing}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Button (Add to Order) */}
        {onAddToCart && (
          <button
            onClick={() => { onAddToCart(item); onClose() }}
            className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl transition-all shadow-md shadow-primary/25 active:scale-95 text-sm flex items-center justify-center gap-2 mt-2"
          >
            <Utensils className="w-4 h-4" /> Add to Order · ₹{item.price}
          </button>
        )}
      </div>
    </div>
  )
}
