import { useState, useEffect } from 'react'
import { X, Utensils, Leaf, Info } from 'lucide-react'
import { getItemIngredientInfo, isCuratedItem, generateItemDetail } from '../utils/itemDetailHelper'
import { DishImage } from '../utils/foodImageHelper'

// Wrap onion/garlic mentions in the description with an italic + underlined highlight.
function highlightOnionGarlic(text) {
  if (!text) return text
  const parts = text.split(/(onions?|garlic)/gi)
  return parts.map((part, i) =>
    /^(onions?|garlic)$/i.test(part) ? (
      <span key={i} className="italic underline underline-offset-2 decoration-primary/50 font-bold">{part}</span>
    ) : (
      part
    )
  )
}

export default function ItemDetailModal({ item, onClose, onAddToCart }) {
  const [detail, setDetail] = useState(() => (item ? getItemIngredientInfo(item) : { description: '', ingredientsList: [], hasOnionGarlic: false }))
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!item) return
    setDetail(getItemIngredientInfo(item))
    if (isCuratedItem(item.name)) { setGenerating(false); return }
    setGenerating(true)
    let cancelled = false
    generateItemDetail(item).then((gen) => {
      if (cancelled) return
      if (gen && gen.description) {
        setDetail({ description: gen.description, ingredientsList: gen.ingredientsList, hasOnionGarlic: gen.hasOnionGarlic })
      }
      setGenerating(false)
    })
    return () => { cancelled = true }
  }, [item && (item.id + item.name)])

  if (!item) return null

  const isJain = Boolean(item.veg) && !detail.hasOnionGarlic

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
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
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
              {isJain && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> Jain · No Onion Garlic
                </span>
              )}
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

        {/* Item Photo — always shown (auto-resolved when no custom image) */}
        <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80">
          <DishImage
            itemName={item.name}
            categoryId={item.category}
            customImage={item.image}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">About this dish</label>
            {generating && (
              <span className="text-[10px] font-semibold text-primary animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" /> Crafting description…
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 font-medium">
            {detail.hasOnionGarlic ? highlightOnionGarlic(detail.description) : detail.description}
          </p>
        </div>

        {/* Key Ingredients */}
        {detail.ingredientsList.length > 0 && (
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">Key Ingredients</label>
            <div className="flex flex-wrap gap-1.5">
              {detail.ingredientsList.map((ing, idx) => {
                const lowerIng = ing.toLowerCase()
                const isOnionGarlic = /onion|garlic|pyaz|lahsun/.test(lowerIng)
                return (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                      isOnionGarlic
                        ? 'bg-amber-50 text-amber-800 italic underline underline-offset-2 decoration-amber-400/70'
                        : 'bg-slate-100 text-slate-600 border border-slate-200/70'
                    }`}
                  >
                    {ing}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Taste note for jain items */}
        {isJain && !generating && (
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-500" /> Jain-friendly — prepared without onion or garlic.
          </p>
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
