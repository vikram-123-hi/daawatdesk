/**
 * Utility helper to extract ingredients, descriptions, and onion/garlic warnings for dish items.
 *
 * Curated detail (itemDetailData.js) covers every default menu item instantly.
 * User-added items fall back to a generic entry, and the modal can upgrade them
 * on demand via Groq (generateItemDetail), cached in localStorage.
 */
import { resolveCuratedDetail } from './itemDetailData'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY

const CACHE_PREFIX = 'dd_item_detail_v1_'

// True when the item name is covered by the curated map (no API needed).
export function isCuratedItem(name) {
  return resolveCuratedDetail(name) != null
}

export function getItemIngredientInfo(item) {
  if (!item) return { description: '', ingredientsList: [], hasOnionGarlic: false }

  const name = (item.name || '').toLowerCase()
  const curated = resolveCuratedDetail(item.name)
  if (curated) {
    return {
      description: curated.desc,
      ingredientsList: curated.ings,
      hasOnionGarlic: Boolean(curated.og),
    }
  }

  // Fallback for user-added items (before the API call resolves or when offline)
  let description = item.description || ''
  let rawIngredients = item.ingredients || ''
  let hasOnionGarlic = item.hasOnionGarlic !== undefined ? Boolean(item.hasOnionGarlic) : false

  if (!description) {
    description = 'Freshly prepared house specialty made with carefully selected ingredients and signature spices.'
  }
  if (!rawIngredients) rawIngredients = 'Fresh Veggies/Meat, Culinary Oil, Signature House Spices, Herbs'

  let ingredientsList = []
  if (Array.isArray(rawIngredients)) {
    ingredientsList = rawIngredients
  } else if (typeof rawIngredients === 'string') {
    ingredientsList = rawIngredients.split(',').map((s) => s.trim()).filter(Boolean)
  }

  const fullText = (name + ' ' + description + ' ' + (typeof rawIngredients === 'string' ? rawIngredients : rawIngredients.join(' '))).toLowerCase()
  if (/onion|garlic|pyaz|lahsun/.test(fullText)) hasOnionGarlic = true

  return { description, ingredientsList, hasOnionGarlic }
}

// Generate a detailed description + ingredients for items NOT in the curated map.
// Cached in localStorage so each dish only calls the API once.
export async function generateItemDetail(item) {
  if (!item) return null
  const key = (item.name || '').toLowerCase().replace(/\s+/g, ' ').trim()
  if (!key) return null

  const cached = localStorage.getItem(CACHE_PREFIX + key)
  if (cached) {
    try { return JSON.parse(cached) } catch { /* fall through */ }
  }

  const isVeg = Boolean(item.veg)
  const prompt = `You are a restaurant menu copywriter. For the dish "${item.name}" (${isVeg ? 'VEG' : 'NON-VEG'}), write a short appetizing description (2 sentences, under 180 characters) and a comma-separated ingredients list.
Reply STRICTLY as JSON only:
{"description":"...","ingredients":"...","hasOnionGarlic":trueOrFalse}
hasOnionGarlic must be true if the dish contains onion OR garlic. For beverages, desserts, breads or jain-style dishes without onion/garlic, set false.`

  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You output valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 240,
      }),
    })
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])

    const result = {
      description: String(parsed.description || '').trim(),
      ingredientsList: String(parsed.ingredients || '').split(',').map((s) => s.trim()).filter(Boolean),
      hasOnionGarlic: Boolean(parsed.hasOnionGarlic),
    }
    try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(result)) } catch { /* ignore */ }
    return result
  } catch (err) {
    console.error('Description generation failed:', err)
    return null
  }
}
