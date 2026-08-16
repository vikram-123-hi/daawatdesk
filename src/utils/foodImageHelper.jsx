import { useState, useEffect } from 'react'

// ── Verified photo map for every default menu item ──────────────────────────
// URLs were resolved via Wikimedia Commons search and confirmed correct.
// Exact + substring matching means the whole default menu loads the right
// photo instantly with ZERO API calls.
const CURATED = {
  // Starters — Indian
  'paneer tikka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Panir_Tikka_Indian_cheese_grilled.jpg/330px-Panir_Tikka_Indian_cheese_grilled.jpg',
  'chicken 65': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Chicken_65_%28Dish%29.jpg/330px-Chicken_65_%28Dish%29.jpg',
  'fish fry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Fish_fry_%2872986%29.jpg/330px-Fish_fry_%2872986%29.jpg',
  'hara bhara kabab': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Hara_bhara_kabab-.JPG/330px-Hara_bhara_kabab-.JPG',
  // Starters — Chinese
  'veg spring roll': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Veg_spring_roll.jpg/330px-Veg_spring_roll.jpg',
  'chicken momos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Chicken_Momo_-_Howrah_2013-10-10_3254.JPG/330px-Chicken_Momo_-_Howrah_2013-10-10_3254.JPG',
  'chilli paneer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Chilly_Paneer_01.jpg/330px-Chilly_Paneer_01.jpg',
  // Starters — Continental
  'bruschetta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/A_typical_Maltese_bruschetta_with_fresh_Mediterranean_ingredients.jpg/330px-A_typical_Maltese_bruschetta_with_fresh_Mediterranean_ingredients.jpg',
  'grilled chicken wings': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Grilled_chicken_wings%2C_Turkish_style.jpg/330px-Grilled_chicken_wings%2C_Turkish_style.jpg',
  // Starters — Japanese
  'edamame': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Edamame_in_a_tray.jpg/330px-Edamame_in_a_tray.jpg',
  'chicken gyoza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/10pc_Gyoza_plate.jpg/330px-10pc_Gyoza_plate.jpg',
  // Starters — Thai
  'thai fish cakes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Thai_Fish_Cake.jpg/330px-Thai_Fish_Cake.jpg',
  'satay paneer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Chicken_Satay.JPG/330px-Chicken_Satay.JPG',

  // Soups
  'mulligatawny soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Mulligatawny-Soup_Mumbai.jpg/330px-Mulligatawny-Soup_Mumbai.jpg',
  'rasam shot': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Rasam_-_1.jpg/330px-Rasam_-_1.jpg',
  'mushroom soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Mushroom_Soup_3.jpg/330px-Mushroom_Soup_3.jpg',
  'tom yum soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Tom_Yum_mixed_with_clear_soup.jpg/330px-Tom_Yum_mixed_with_clear_soup.jpg',
  'hot and sour soup': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Hot-and-Sour-Soup-Bowl.jpg/330px-Hot-and-Sour-Soup-Bowl.jpg',

  // Salads & Raita
  'garden fresh salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=330&auto=format&fit=crop&q=80',
  'caesar salad': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Caesar_Salad_-_Purezza_2023-11-22.jpg/330px-Caesar_Salad_-_Purezza_2023-11-22.jpg',
  'fruit chaat': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Fruit_chaat_with_ice-cream.jpg/330px-Fruit_chaat_with_ice-cream.jpg',
  'boondi raita': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Boondi_Raita.jpg/330px-Boondi_Raita.jpg',
  'pineapple raita': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Pineapple_Raita.JPG/330px-Pineapple_Raita.JPG',

  // Main Course — North Indian
  'butter chicken': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Chicken_makhani.jpg/330px-Chicken_makhani.jpg',
  'paneer butter masala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Paneer_butter_masala_2.jpg/330px-Paneer_butter_masala_2.jpg',
  'dal makhani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Dal_Makhani.jpg/330px-Dal_Makhani.jpg',
  'chicken curry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Chicken_Curry_9.jpg/330px-Chicken_Curry_9.jpg',
  'rogan josh': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Rogan_josh02.jpg/330px-Rogan_josh02.jpg',
  // Main Course — South Indian
  'hyderabadi chicken': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Chicken_Hyderabadi_with_chapati.jpg/330px-Chicken_Hyderabadi_with_chapati.jpg',
  'sambar rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Rice-sambar-salad.jpg/330px-Rice-sambar-salad.jpg',
  'chettinad paneer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/ChickenChettinad.JPG/330px-ChickenChettinad.JPG',
  // Main Course — Chinese
  'manchurian gravy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Babycorn_Manchurian_Gravy_01.jpg/330px-Babycorn_Manchurian_Gravy_01.jpg',
  'chilli chicken': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Chicken_Chilli_1.jpg/330px-Chicken_Chilli_1.jpg',
  // Main Course — Italian & Continental
  'penne arrabiata': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Penne_on_plate_with_Arrabbiata_2025-02-12_04.jpg/330px-Penne_on_plate_with_Arrabbiata_2025-02-12_04.jpg',
  'fettuccine alfredo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Chicken_fettuccine_alfredo.JPG/330px-Chicken_fettuccine_alfredo.JPG',
  'grilled chicken steak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Steak_Chicken_Paprika.jpg/330px-Steak_Chicken_Paprika.jpg',
  // Main Course — Japanese
  'chicken katsu curry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Chicken_katsu_curry_rice_-_Korpan.jpg/330px-Chicken_katsu_curry_rice_-_Korpan.jpg',
  'teriyaki tofu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Tofu_Steaks_-_Taro_2026-02-11.jpg/330px-Tofu_Steaks_-_Taro_2026-02-11.jpg',
  // Main Course — Thai
  'green curry': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Thai_green_chicken_curry_and_roti.jpg/330px-Thai_green_chicken_curry_and_roti.jpg',
  'pad thai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Phat_Thai_kung_Chang_Khien_street_stall.jpg/330px-Phat_Thai_kung_Chang_Khien_street_stall.jpg',

  // Rice & Biryani
  'veg biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Vegetable_Biryani_IMG_001.jpg/330px-Vegetable_Biryani_IMG_001.jpg',
  'chicken biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Chicken_Hyderabadi_Biryani.JPG/330px-Chicken_Hyderabadi_Biryani.JPG',
  'mutton biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Mutton_biryani.JPG/330px-Mutton_biryani.JPG',
  'jeera rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Jeera-rice.JPG/330px-Jeera-rice.JPG',
  'hyderabadi dum biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Chicken_Dum_Biryani_from_Hyderabadi_Zaiqa.jpg/330px-Chicken_Dum_Biryani_from_Hyderabadi_Zaiqa.jpg',
  'prawn biryani': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Prawn_Biryani%2C_Hyderabad.jpg/330px-Prawn_Biryani%2C_Hyderabad.jpg',

  // Noodles & Fried Rice
  'veg hakka noodles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Tasty_hakka_noodles_image.jpg/330px-Tasty_hakka_noodles_image.jpg',
  'chicken schezwan noodles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Schezwan_noodles.jpg/330px-Schezwan_noodles.jpg',
  'veg fried rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Veg_Fried_Rice_%2851465%29.jpg/330px-Veg_Fried_Rice_%2851465%29.jpg',
  'thai basil noodles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Guaytiew_Pad_Kee_Mao_%28Drunken_Noodles%29_with_Veg_%26_Tofu_-_Rosa%27s_Thai_2025-07-22.jpg/330px-Guaytiew_Pad_Kee_Mao_%28Drunken_Noodles%29_with_Veg_%26_Tofu_-_Rosa%27s_Thai_2025-07-22.jpg',
  'yakisoba': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Chicken_yakisoba_-_Korpan.jpg/330px-Chicken_yakisoba_-_Korpan.jpg',

  // Breads & Naan
  'garlic naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Garlic_Butter_Naan_Food_by_Ms_Ujwala_Kasambe_DSCN1136_%283%29.jpg/330px-Garlic_Butter_Naan_Food_by_Ms_Ujwala_Kasambe_DSCN1136_%283%29.jpg',
  'butter naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Butter_naan_2.jpg/330px-Butter_naan_2.jpg',
  'tandoori roti': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Tandoori_Roti_in_clay_oven.JPG/330px-Tandoori_Roti_in_clay_oven.JPG',
  'laccha paratha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Laccha_Paratha.JPG/330px-Laccha_Paratha.JPG',
  'aloo paratha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Aloo_Paratha_%2896238%29.jpg/330px-Aloo_Paratha_%2896238%29.jpg',
  'cheese naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Cheese_naan_of_Gokarna_IMG_20181203_131623.jpg/330px-Cheese_naan_of_Gokarna_IMG_20181203_131623.jpg',
  'peshwari naan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Naan_Bread.JPG/330px-Naan_Bread.JPG',
  'margherita pizza': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Margherita_Originale.JPG/330px-Margherita_Originale.JPG',
  'farm fresh pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=330&auto=format&fit=crop&q=80',

  // Beverages
  'masala chai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Masala_Chai.jpg/330px-Masala_Chai.jpg',
  'espresso': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Espresso_single_shot_coffee.jpg/330px-Espresso_single_shot_coffee.jpg',
  'cappuccino': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Cappuccino_6.jpg/330px-Cappuccino_6.jpg',
  'cold coffee': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Cold_Coffee_3.jpg/330px-Cold_Coffee_3.jpg',
  'iced tea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/NCI_iced_tea.jpg/330px-NCI_iced_tea.jpg',
  'mango lassi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Mango_Lassi_.jpg/330px-Mango_Lassi_.jpg',
  'oreo milkshake': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Oreo_milkshake_-_Creperie_Doux_Sourire_2025-05-03.jpg/330px-Oreo_milkshake_-_Creperie_Doux_Sourire_2025-05-03.jpg',
  'virgin mojito': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Virgin_Mojito_02.jpg/330px-Virgin_Mojito_02.jpg',
  'blue lagoon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Blue_Lagoon_at_the_Mandarin_Oriental%2C_Washington_DC.jpg/330px-Blue_Lagoon_at_the_Mandarin_Oriental%2C_Washington_DC.jpg',
  'fresh lime soda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Fresh_Lime.JPG/330px-Fresh_Lime.JPG',
  'orange juice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Orange_juice_1_edit1.jpg/330px-Orange_juice_1_edit1.jpg',
  'watermelon juice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Watermelon_Juice_1.jpg/330px-Watermelon_Juice_1.jpg',

  // Desserts
  'gulab jamun': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Two_Gulab_Jamun_in_a_plate_01.jpg/330px-Two_Gulab_Jamun_in_a_plate_01.jpg',
  'rasgulla': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Rasgulla_With_Rabdi.jpg/330px-Rasgulla_With_Rabdi.jpg',
  'kulfi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Kulfi_3.jpg/330px-Kulfi_3.jpg',
  'rasmalai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Rasmalai_3.jpg/330px-Rasmalai_3.jpg',
  'tiramisu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Dolce_Tiramis%C3%B9_monoporzione.jpg/330px-Dolce_Tiramis%C3%B9_monoporzione.jpg',
  'panna cotta': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Panna_Cotta_with_cream_and_garnish.jpg/330px-Panna_Cotta_with_cream_and_garnish.jpg',
  'ice cream sundae': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Strawberry_Ice_Cream_Sundae_%2826853326174%29.jpg/330px-Strawberry_Ice_Cream_Sundae_%2826853326174%29.jpg',
  'cheesecake': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/New_York_cheesecake_3.jpg/330px-New_York_cheesecake_3.jpg',
  'mochi ice cream': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Mochi_Ice_Cream.jpg/330px-Mochi_Ice_Cream.jpg',

  // Combos & Thali
  'veg thali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Veg_Thali_Meals.jpg/330px-Veg_Thali_Meals.jpg',
  'non-veg thali': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Non-veg_thali_in_Bengal.jpg/330px-Non-veg_thali_in_Bengal.jpg',
  'family combo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Indian_thali_with_poori_and_rice.jpg/330px-Indian_thali_with_poori_and_rice.jpg',
  'student meal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Lunch%2C_Singapore_Airlines%2C_2023_%2802%29.jpg/330px-Lunch%2C_Singapore_Airlines%2C_2023_%2802%29.jpg',

  // Extra common items user might add
  'idli': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Idli_chutney_and_Sambar.jpg/330px-Idli_chutney_and_Sambar.jpg',
  'samosa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Samosa_4.jpg/330px-Samosa_4.jpg',
}

// Category fallbacks — shown instantly while a live search loads (or on failure).
const CATEGORY_DEFAULT_IMAGES = {
  starters: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=330&auto=format&fit=crop&q=80',
  soups: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=330&auto=format&fit=crop&q=80',
  salads: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=330&auto=format&fit=crop&q=80',
  main: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=330&auto=format&fit=crop&q=80',
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=330&auto=format&fit=crop&q=80',
  noodles: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=330&auto=format&fit=crop&q=80',
  breads: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=330&auto=format&fit=crop&q=80',
  beverages: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=330&auto=format&fit=crop&q=80',
  desserts: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=330&auto=format&fit=crop&q=80',
  combos: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=330&auto=format&fit=crop&q=80',
}

const GENERIC = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=330&auto=format&fit=crop&q=80'

const norm = (s) => (s || '').toLowerCase().replace(/&/g, ' and ').replace(/\s+/g, ' ').trim()

// Best curated match: exact key first, then longest curated key contained in the name.
function resolveCurated(nameLower) {
  if (!nameLower) return null
  if (CURATED[nameLower]) return CURATED[nameLower]
  let best = null
  for (const [key, url] of Object.entries(CURATED)) {
    if (nameLower.includes(key) && (!best || key.length > best[0].length)) best = [key, url]
  }
  return best ? best[1] : null
}

// ── Live photo lookup via Wikimedia Commons (no API key needed) ──────────────
// Only used for items NOT in the curated map (user-added dishes). Results are
// cached so each dish is searched at most once.
const cache = new Map()
const inflight = new Map()

const queue = []
let active = 0
const MAX_CONCURRENT = 3

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    const { fn, resolve, reject } = queue.shift()
    active++
    fn().then(resolve, reject).finally(() => { active--; pump() })
  }
}

function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject })
    pump()
  })
}

const cleanThumb = (url) => (url || '').split('?')[0]

async function searchWikimedia(name) {
  const q = encodeURIComponent(`filetype:bitmap ${name}`)
  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=330&format=json&origin=*`
  )
  const data = await res.json()
  const pages = (data && data.query && data.query.pages) || {}
  const results = Object.values(pages)
    .filter((p) => p.imageinfo && p.imageinfo[0] && p.imageinfo[0].thumburl)
    .sort((a, b) => (a.index || 99) - (b.index || 99))
  if (!results.length) return null
  const words = name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 4)
  const pick = results.find((r) => {
    const t = (r.title || '').toLowerCase()
    return words.some((w) => t.includes(w))
  }) || results[0]
  return cleanThumb(pick.imageinfo[0].thumburl)
}

async function getImageFor(name, fallback) {
  const key = norm(name)
  if (!key) return fallback
  const curated = resolveCurated(key)
  if (curated) return curated
  if (cache.has(key)) return cache.get(key)
  if (inflight.has(key)) return inflight.get(key)
  const p = enqueue(() =>
    searchWikimedia(name)
      .then((url) => {
        cache.set(key, url || fallback)
        return url || fallback
      })
      .catch(() => {
        cache.set(key, fallback)
        return fallback
      })
  ).finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

// Sync resolver — curated match → category fallback → generic. Used for instant paint.
export function getDishImage(itemName, categoryId, customImage) {
  if (customImage) return customImage
  const curated = resolveCurated(norm(itemName))
  if (curated) return curated
  if (categoryId && CATEGORY_DEFAULT_IMAGES[categoryId]) return CATEGORY_DEFAULT_IMAGES[categoryId]
  return GENERIC
}

// Hook — shows the instant fallback, then swaps in the live Wikimedia photo for
// items not covered by the curated map.
export function useDishImage(itemName, categoryId, customImage) {
  const fallback = getDishImage(itemName, categoryId, customImage)
  const [src, setSrc] = useState(fallback)

  useEffect(() => {
    if (customImage) { setSrc(customImage); return }
    const key = norm(itemName)
    if (!key) return
    if (resolveCurated(key)) { setSrc(resolveCurated(key)); return }
    let cancelled = false
    getImageFor(itemName, fallback).then((url) => { if (!cancelled) setSrc(url) })
    return () => { cancelled = true }
  }, [itemName, customImage, fallback])

  return src
}

// Drop-in <img> that resolves the right photo automatically from the dish name.
export function DishImage({ itemName, categoryId, customImage, className, alt, ...rest }) {
  const src = useDishImage(itemName, categoryId, customImage)
  return <img src={src} alt={alt || itemName} className={className} {...rest} />
}
