/**
 * Utility helper to extract ingredients, descriptions, and onion/garlic warnings for dish items.
 */
export function getItemIngredientInfo(item) {
  if (!item) return { description: '', ingredientsList: [], hasOnionGarlic: false }

  const name = (item.name || '').toLowerCase()
  let description = item.description || ''
  let rawIngredients = item.ingredients || ''
  let hasOnionGarlic = item.hasOnionGarlic !== undefined ? Boolean(item.hasOnionGarlic) : false

  if (!description) {
    if (name.includes('butter chicken')) {
      description = 'Tender chicken pieces cooked in a rich, velvety tomato and butter gravy with aromatic Indian spices.'
      if (!rawIngredients) rawIngredients = 'Chicken, Butter, Fresh Cream, Tomato Puree, Cashew Paste, Indian Spices, Chopped Onion, Garlic Paste'
    } else if (name.includes('paneer butter masala') || name.includes('paneer tikka')) {
      description = 'Fresh cottage cheese cubes marinated and cooked in a creamy tomato-butter gravy with hand-ground spices.'
      if (!rawIngredients) rawIngredients = 'Paneer, Butter, Fresh Cream, Tomato Gravy, Cashew Paste, Spices, Diced Onion, Minced Garlic'
    } else if (name.includes('dal makhani')) {
      description = 'Slow-cooked black lentils simmered overnight with butter, fresh cream, and traditional spices.'
      if (!rawIngredients) rawIngredients = 'Black Lentils (Urad Dal), Rajma, Butter, Fresh Cream, Tomatoes, Spices, Onion, Garlic'
    } else if (name.includes('garlic naan')) {
      description = 'Soft tandoori flatbread topped with freshly minced garlic and brushed with melted butter.'
      if (!rawIngredients) rawIngredients = 'Refined Wheat Flour, Butter, Fresh Chopped Garlic, Milk, Yogurt, Cilantro'
    } else if (name.includes('biryani')) {
      description = 'Aromatic long-grain basmati rice layered with spiced protein and herbs, dum-cooked to perfection.'
      if (!rawIngredients) rawIngredients = 'Basmati Rice, Protein/Veggies, Ghee, Fried Onions, Garlic Paste, Saffron, Whole Spices'
    } else if (name.includes('momos') || name.includes('spring roll') || name.includes('chilli') || name.includes('65')) {
      description = 'Crispy or steamed Indo-Chinese dish served with spicy chili-garlic dipping sauce.'
      if (!rawIngredients) rawIngredients = 'Wheat Flour, Minced Veggies/Meat, Soy Sauce, Vinegar, Chili Paste, Ginger, Garlic, Onion'
    } else if (name.includes('cold coffee') || name.includes('chai') || name.includes('cola') || name.includes('jamun') || name.includes('rasmalai')) {
      description = 'Freshly crafted specialty beverage / dessert prepared using quality ingredients.'
      if (!rawIngredients) rawIngredients = 'Milk, Coffee/Tea/Sugar, Natural Flavors'
    } else {
      description = 'Freshly prepared house specialty made with carefully selected ingredients.'
      if (!rawIngredients) rawIngredients = 'Fresh Veggies/Meat, Culinary Oil, Signature House Spices, Herbs'
    }
  }

  // Parse ingredients array
  let ingredientsList = []
  if (Array.isArray(rawIngredients)) {
    ingredientsList = rawIngredients
  } else if (typeof rawIngredients === 'string') {
    ingredientsList = rawIngredients.split(',').map((s) => s.trim()).filter(Boolean)
  }

  // Check for Onion & Garlic keywords across name, description, and ingredients
  const fullText = (name + ' ' + description + ' ' + (typeof rawIngredients === 'string' ? rawIngredients : rawIngredients.join(' '))).toLowerCase()
  if (fullText.includes('onion') || fullText.includes('garlic') || fullText.includes('pyaz') || fullText.includes('lahsun')) {
    hasOnionGarlic = true
  }

  return {
    description,
    ingredientsList,
    hasOnionGarlic,
  }
}
