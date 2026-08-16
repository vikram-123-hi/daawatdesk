/**
 * Curated, detailed dish info (description, ingredients, onion/garlic flag)
 * for every default menu item. Mirrors foodImageHelper.jsx — exact + substring
 * matching means the whole default menu gets accurate, detailed info instantly
 * with ZERO API calls.
 *
 * og = hasOnionGarlic. A dish is Jain-friendly when veg && !og.
 */
const DISH_DETAILS = {
  // ── Starters — Indian ────────────────────────────────────────────────────
  'paneer tikka': {
    desc: 'Charcoal-grilled cottage cheese cubes in a spiced yogurt marinade, finished with charred peppers and a smoky tandoor edge.',
    ings: ['Paneer', 'Hung Curd', 'Ginger', 'Garlic', 'Red Chilli Powder', 'Garam Masala', 'Capsicum', 'Onion', 'Charcoal Smoke'],
    og: true,
  },
  'chicken 65': {
    desc: 'Fiery, crisp chicken bites tossed with curry leaves, ginger-garlic and a punchy red chilli paste — a South Indian party classic.',
    ings: ['Chicken', 'Red Chilli Paste', 'Ginger', 'Garlic', 'Curry Leaves', 'Cornflour', 'Cumin', 'Lemon'],
    og: true,
  },
  'fish fry': {
    desc: 'Golden, crisp fish fillets marinated in fiery coastal spices with lemon and curry leaves for a tangy, crunchy bite.',
    ings: ['Fish Fillets', 'Red Chilli Powder', 'Turmeric', 'Ginger', 'Garlic', 'Curry Leaves', 'Rice Flour', 'Lemon'],
    og: true,
  },
  'hara bhara kabab': {
    desc: 'Crisp green patties of spinach, green peas and potato with ginger and garam masala, pan-seared and served with mint chutney.',
    ings: ['Spinach', 'Green Peas', 'Potato', 'Ginger', 'Garam Masala', 'Green Chilli', 'Cornflour', 'Mint Chutney'],
    og: true,
  },

  // ── Starters — Chinese ───────────────────────────────────────────────────
  'veg spring roll': {
    desc: 'Crunchy golden rolls stuffed with shredded vegetables and tangy Indo-Chinese seasonings, served with sweet chilli dip.',
    ings: ['Spring Roll Sheets', 'Cabbage', 'Carrot', 'Onion', 'Ginger', 'Garlic', 'Soy Sauce', 'Black Pepper'],
    og: true,
  },
  'chicken momos': {
    desc: 'Steamed dumplings filled with spiced minced chicken, served hot with fiery red chutney.',
    ings: ['Wheat Flour', 'Minced Chicken', 'Onion', 'Ginger', 'Garlic', 'Soy Sauce', 'Black Pepper', 'Red Chutney'],
    og: true,
  },
  'chilli paneer': {
    desc: 'Wok-tossed paneer with crunchy peppers and onions in a glossy soy-chilli-garlic sauce.',
    ings: ['Paneer', 'Capsicum', 'Onion', 'Soy Sauce', 'Chilli Sauce', 'Garlic', 'Ginger', 'Spring Onion', 'Cornflour'],
    og: true,
  },

  // ── Starters — Continental ───────────────────────────────────────────────
  'bruschetta': {
    desc: 'Charred artisan bread topped with juicy tomatoes, fresh basil and olive oil, finished with a garlic rub.',
    ings: ['Bread', 'Tomatoes', 'Basil', 'Olive Oil', 'Garlic', 'Balsamic Glaze', 'Black Pepper'],
    og: true,
  },
  'grilled chicken wings': {
    desc: 'Smoky grilled wings with a sticky glaze and herbed seasoning, served with a cooling dip.',
    ings: ['Chicken Wings', 'Butter', 'Paprika', 'Garlic', 'Herbs', 'Lemon', 'BBQ Glaze'],
    og: true,
  },

  // ── Starters — Japanese ──────────────────────────────────────────────────
  'edamame': {
    desc: 'Steamed young soybeans tossed in flaky sea salt — a light, healthy start to any meal.',
    ings: ['Edamame', 'Sea Salt', 'Lemon'],
    og: false,
  },
  'chicken gyoza': {
    desc: 'Pan-seared Japanese dumplings with a juicy chicken filling, served with a soy-vinegar chilli dip.',
    ings: ['Gyoza Wrappers', 'Minced Chicken', 'Ginger', 'Garlic', 'Cabbage', 'Soy Sauce', 'Sesame Oil', 'Chilli Oil'],
    og: true,
  },

  // ── Starters — Thai ──────────────────────────────────────────────────────
  'thai fish cakes': {
    desc: 'Herb-packed fish patties with Thai curry paste, pan-fried until golden and served with sweet chilli sauce.',
    ings: ['Fish', 'Red Thai Curry Paste', 'Kaffir Lime Leaves', 'Lemon Grass', 'Fish Sauce', 'Green Beans', 'Sweet Chilli Sauce'],
    og: true,
  },
  'satay paneer': {
    desc: 'Grilled paneer skewers glazed in creamy peanut satay sauce with a touch of lime.',
    ings: ['Paneer', 'Peanuts', 'Coconut Milk', 'Soy Sauce', 'Lime', 'Turmeric', 'Cumin', 'Garlic'],
    og: true,
  },

  // ── Soups ────────────────────────────────────────────────────────────────
  'mulligatawny soup': {
    desc: 'A silky, pepper-spiced lentil soup with a mild curry aroma and a drizzle of cream.',
    ings: ['Red Lentils', 'Onion', 'Garlic', 'Curry Powder', 'Apple', 'Coconut Milk', 'Black Pepper', 'Cream'],
    og: true,
  },
  'rasam shot': {
    desc: 'A tangy South Indian pepper-tamarind broth served as a zesty shot to whet the appetite.',
    ings: ['Tamarind', 'Tomato', 'Black Pepper', 'Cumin', 'Curry Leaves', 'Mustard Seeds', 'Coriander'],
    og: false,
  },
  'mushroom soup': {
    desc: 'Velvety blended mushroom soup with roasted garlic, herbs and a swirl of cream.',
    ings: ['Mushrooms', 'Onion', 'Garlic', 'Butter', 'Fresh Cream', 'Thyme', 'Black Pepper'],
    og: true,
  },
  'tom yum soup': {
    desc: 'Hot and sour Thai broth with lemongrass, kaffir lime and aromatic herbs, finished with fresh chilli.',
    ings: ['Shrimp/Chicken', 'Lemon Grass', 'Kaffir Lime Leaves', 'Galangal', 'Chilli', 'Mushrooms', 'Lime Juice', 'Fish Sauce'],
    og: true,
  },
  'hot and sour soup': {
    desc: 'A classic Indo-Chinese soup with silky tofu, bamboo shoots and a punchy vinegar-chilli broth.',
    ings: ['Tofu', 'Mushrooms', 'Bamboo Shoots', 'Carrot', 'Vinegar', 'Chilli Sauce', 'Soy Sauce', 'Black Pepper'],
    og: true,
  },

  // ── Salads & Raita ───────────────────────────────────────────────────────
  'garden fresh salad': {
    desc: 'Crisp lettuce, cucumber and tomato tossed with a light lemon-herb dressing.',
    ings: ['Lettuce', 'Cucumber', 'Tomato', 'Carrot', 'Capsicum', 'Lemon', 'Olive Oil', 'Herbs'],
    og: false,
  },
  'caesar salad': {
    desc: 'Crisp romaine, crunchy croutons and parmesan tossed in a creamy garlic-herb caesar dressing.',
    ings: ['Romaine Lettuce', 'Croutons', 'Parmesan', 'Caesar Dressing', 'Garlic', 'Olive Oil', 'Black Pepper'],
    og: true,
  },
  'fruit chaat': {
    desc: 'A lively bowl of seasonal fruits with chaat masala, lemon and a hint of chilli.',
    ings: ['Seasonal Fruits', 'Chaat Masala', 'Lemon Juice', 'Black Salt', 'Mint'],
    og: false,
  },
  'boondi raita': {
    desc: 'Cooling whipped yogurt with crisp boondi pearls, roasted cumin and a pinch of chilli.',
    ings: ['Curd', 'Boondi', 'Roasted Cumin', 'Black Salt', 'Red Chilli Powder', 'Coriander'],
    og: false,
  },
  'pineapple raita': {
    desc: 'Sweet-tangy pineapple folded into spiced yogurt with a crunchy tempering.',
    ings: ['Curd', 'Pineapple', 'Cumin Powder', 'Black Salt', 'Mustard Seeds', 'Curry Leaves', 'Green Chilli'],
    og: false,
  },

  // ── Main Course — North Indian ───────────────────────────────────────────
  'butter chicken': {
    desc: 'Tender chicken simmered in a rich tomato-butter gravy with cream, cashew and aromatic spices.',
    ings: ['Chicken', 'Butter', 'Fresh Cream', 'Tomato Puree', 'Cashew Paste', 'Onion', 'Garlic', 'Ginger', 'Garam Masala'],
    og: true,
  },
  'paneer butter masala': {
    desc: 'Soft paneer cubes in a velvety tomato-butter gravy with cream and hand-ground spices.',
    ings: ['Paneer', 'Butter', 'Fresh Cream', 'Tomato Gravy', 'Cashew Paste', 'Onion', 'Garlic', 'Cinnamon', 'Cardamom'],
    og: true,
  },
  'dal makhani': {
    desc: 'Black lentils slow-simmered overnight with butter, cream and a gentle smoky finish.',
    ings: ['Black Lentils', 'Rajma', 'Butter', 'Fresh Cream', 'Tomato', 'Onion', 'Garlic', 'Ginger', 'Garam Masala'],
    og: true,
  },
  'chicken curry': {
    desc: 'A hearty homestyle chicken curry in a spiced onion-tomato masala, best with hot rotis.',
    ings: ['Chicken', 'Onion', 'Tomato', 'Ginger', 'Garlic', 'Coriander Powder', 'Turmeric', 'Cumin', 'Green Chilli'],
    og: true,
  },
  'rogan josh': {
    desc: 'Kashmiri-style mutton curry with a deep red gravy of Kashmiri chillies and aromatic spices.',
    ings: ['Mutton', 'Kashmiri Chilli', 'Onion', 'Yogurt', 'Ginger', 'Garlic', 'Fennel', 'Garam Masala', 'Bay Leaf'],
    og: true,
  },

  // ── Main Course — South Indian ───────────────────────────────────────────
  'hyderabadi chicken': {
    desc: 'Deccan-style chicken curry with coconut, tamarind and roasted spices.',
    ings: ['Chicken', 'Onion', 'Tomato', 'Coconut', 'Tamarind', 'Ginger', 'Garlic', 'Red Chilli', 'Coriander'],
    og: true,
  },
  'sambar rice': {
    desc: 'Steamed rice served with piping-hot lentil-vegetable sambar and a spoon of ghee.',
    ings: ['Rice', 'Toor Dal', 'Mixed Vegetables', 'Tamarind', 'Sambar Powder', 'Mustard Seeds', 'Curry Leaves', 'Ghee'],
    og: true,
  },
  'chettinad paneer': {
    desc: 'Paneer in a fiery Chettinad masala of roasted spices, coconut and curry leaves.',
    ings: ['Paneer', 'Chettinad Masala', 'Coconut', 'Onion', 'Tomato', 'Garlic', 'Curry Leaves', 'Mustard Seeds'],
    og: true,
  },

  // ── Main Course — Chinese ────────────────────────────────────────────────
  'manchurian gravy': {
    desc: 'Crisp vegetable dumplings tossed in a glossy ginger-garlic soy gravy with peppers.',
    ings: ['Cabbage', 'Carrot', 'Ginger', 'Garlic', 'Soy Sauce', 'Chilli Sauce', 'Spring Onion', 'Cornflour', 'Capsicum'],
    og: true,
  },
  'chilli chicken': {
    desc: 'Crispy chicken tossed with peppers and onion in a sticky sweet-spicy soy chilli sauce.',
    ings: ['Chicken', 'Capsicum', 'Onion', 'Soy Sauce', 'Chilli Sauce', 'Garlic', 'Ginger', 'Spring Onion', 'Cornflour'],
    og: true,
  },

  // ── Main Course — Italian & Continental ──────────────────────────────────
  'penne arrabiata': {
    desc: 'Penne tossed in a fiery tomato-garlic sauce with crushed red chilli and fresh basil.',
    ings: ['Penne Pasta', 'Tomatoes', 'Garlic', 'Red Chilli Flakes', 'Olive Oil', 'Basil', 'Parmesan'],
    og: true,
  },
  'fettuccine alfredo': {
    desc: 'Silky fettuccine in a rich parmesan-cream sauce with garlic and cracked pepper.',
    ings: ['Fettuccine', 'Fresh Cream', 'Parmesan', 'Butter', 'Garlic', 'Black Pepper', 'Parsley'],
    og: true,
  },
  'grilled chicken steak': {
    desc: 'Juicy grilled chicken breast with garlic-herb butter, served with mash and seasonal veggies.',
    ings: ['Chicken Breast', 'Butter', 'Garlic', 'Herbs', 'Potato Mash', 'Seasonal Vegetables', 'Black Pepper'],
    og: true,
  },

  // ── Main Course — Japanese ───────────────────────────────────────────────
  'chicken katsu curry': {
    desc: 'Crispy panko-crumbed chicken cutlet over steamed rice, smothered in rich Japanese curry.',
    ings: ['Chicken', 'Panko Breadcrumbs', 'Rice', 'Japanese Curry', 'Onion', 'Carrot', 'Flour', 'Egg'],
    og: true,
  },
  'teriyaki tofu': {
    desc: 'Golden seared tofu glazed in sweet-savoury teriyaki with sesame and spring onion.',
    ings: ['Tofu', 'Soy Sauce', 'Mirin', 'Sugar', 'Ginger', 'Garlic', 'Sesame Seeds', 'Spring Onion'],
    og: true,
  },

  // ── Main Course — Thai ───────────────────────────────────────────────────
  'green curry': {
    desc: 'A fragrant Thai green curry with coconut milk, bamboo shoots and Thai basil.',
    ings: ['Mixed Veg/Chicken', 'Coconut Milk', 'Green Curry Paste', 'Thai Basil', 'Bamboo Shoots', 'Kaffir Lime', 'Fish Sauce'],
    og: true,
  },
  'pad thai': {
    desc: 'Stir-fried rice noodles with tamarind, peanuts and a tangy balance of sweet and sour.',
    ings: ['Rice Noodles', 'Tamarind', 'Peanuts', 'Bean Sprouts', 'Tofu/Egg', 'Fish Sauce', 'Lime', 'Garlic'],
    og: true,
  },

  // ── Rice & Biryani ───────────────────────────────────────────────────────
  'veg biryani': {
    desc: 'Fragrant basmati layered with garden vegetables, saffron and whole spices, dum-cooked.',
    ings: ['Basmati Rice', 'Mixed Vegetables', 'Ghee', 'Fried Onion', 'Garlic Paste', 'Saffron', 'Mint', 'Whole Spices'],
    og: true,
  },
  'chicken biryani': {
    desc: 'Aromatic basmati and spiced chicken sealed and slow-steamed under a dum of saffron and mint.',
    ings: ['Basmati Rice', 'Chicken', 'Yogurt', 'Fried Onion', 'Garlic', 'Ginger', 'Saffron', 'Mint', 'Whole Spices'],
    og: true,
  },
  'mutton biryani': {
    desc: 'Tender mutton and fragrant basmati layered with caramelised onion and warm biryani spices.',
    ings: ['Basmati Rice', 'Mutton', 'Yogurt', 'Fried Onion', 'Garlic', 'Ginger', 'Saffron', 'Mint', 'Whole Spices'],
    og: true,
  },
  'jeera rice': {
    desc: 'Fluffy steamed basmati tempered with roasted cumin and a whisper of ghee.',
    ings: ['Basmati Rice', 'Cumin Seeds', 'Ghee', 'Green Chilli'],
    og: false,
  },
  'hyderabadi dum biryani': {
    desc: 'The classic slow-sealed dum biryani — saffron rice over marinated meat with fried onions and mint.',
    ings: ['Basmati Rice', 'Chicken/Mutton', 'Saffron', 'Fried Onion', 'Yogurt', 'Mint', 'Garlic', 'Whole Spices'],
    og: true,
  },
  'prawn biryani': {
    desc: 'Juicy prawns layered with fragrant basmati, coastal spices and a hint of coconut.',
    ings: ['Basmati Rice', 'Prawns', 'Coconut', 'Onion', 'Tomato', 'Ginger', 'Garlic', 'Red Chilli', 'Mint'],
    og: true,
  },

  // ── Noodles & Fried Rice ─────────────────────────────────────────────────
  'veg hakka noodles': {
    desc: 'Wok-tossed noodles with crunchy vegetables in a smoky soy-garlic finish.',
    ings: ['Noodles', 'Cabbage', 'Carrot', 'Capsicum', 'Soy Sauce', 'Garlic', 'Ginger', 'Spring Onion', 'Chilli Oil'],
    og: true,
  },
  'chicken schezwan noodles': {
    desc: 'Spicy schezwan-tossed noodles with chicken and vegetables, wok-fried on high heat.',
    ings: ['Noodles', 'Chicken', 'Schezwan Paste', 'Soy Sauce', 'Garlic', 'Capsicum', 'Spring Onion', 'Chilli Oil'],
    og: true,
  },
  'veg fried rice': {
    desc: 'Smoky wok-fried rice with garden vegetables and a soy-garlic seasoning.',
    ings: ['Rice', 'Carrot', 'Capsicum', 'Beans', 'Soy Sauce', 'Garlic', 'Spring Onion', 'Black Pepper'],
    og: true,
  },
  'thai basil noodles': {
    desc: 'Stir-fried noodles with Thai basil, chilli and a punchy soy-fish sauce glaze.',
    ings: ['Noodles', 'Thai Basil', 'Chilli', 'Garlic', 'Soy Sauce', 'Fish Sauce', 'Capsicum', 'Lime'],
    og: true,
  },
  'yakisoba': {
    desc: 'Japanese street-style pan-fried noodles with veggies and a sweet-savoury yakisoba sauce.',
    ings: ['Yakisoba Noodles', 'Cabbage', 'Carrot', 'Onion', 'Yakisoba Sauce', 'Soy Sauce', 'Ginger', 'Spring Onion'],
    og: true,
  },

  // ── Breads & Naan ────────────────────────────────────────────────────────
  'garlic naan': {
    desc: 'Tandoor-baked flatbread brushed with butter and crowned with freshly chopped garlic.',
    ings: ['Wheat Flour', 'Garlic', 'Butter', 'Milk', 'Yogurt', 'Cilantro'],
    og: true,
  },
  'butter naan': {
    desc: 'Soft, pillowy tandoor naan slathered with melted butter — the perfect curry partner.',
    ings: ['Wheat Flour', 'Butter', 'Milk', 'Yogurt'],
    og: false,
  },
  'tandoori roti': {
    desc: 'Whole-wheat flatbread baked in the tandoor, lightly brushed with ghee.',
    ings: ['Whole Wheat Flour', 'Ghee'],
    og: false,
  },
  'laccha paratha': {
    desc: 'Flaky, layered whole-wheat paratha crisped on the griddle with ghee.',
    ings: ['Whole Wheat Flour', 'Ghee', 'Maida'],
    og: false,
  },
  'aloo paratha': {
    desc: 'Stuffed whole-wheat paratha with spiced potato filling, served with curd and pickle.',
    ings: ['Whole Wheat Flour', 'Potato', 'Ghee', 'Cumin', 'Green Chilli', 'Coriander', 'Amchur'],
    og: false,
  },
  'cheese naan': {
    desc: 'Tandoor naan stuffed with molten cheese and a hint of herbs.',
    ings: ['Wheat Flour', 'Cheese', 'Butter', 'Milk', 'Herbs'],
    og: false,
  },
  'peshwari naan': {
    desc: 'Sweet naan stuffed with coconut, dried fruits and nuts — a Peshawari delight.',
    ings: ['Wheat Flour', 'Coconut', 'Raisins', 'Almonds', 'Sugar', 'Milk', 'Ghee'],
    og: false,
  },
  'margherita pizza': {
    desc: 'Wood-fired style pizza with tomato sauce, fresh mozzarella and basil.',
    ings: ['Pizza Base', 'Tomato Sauce', 'Mozzarella', 'Basil', 'Olive Oil'],
    og: false,
  },
  'farm fresh pizza': {
    desc: 'Loaded veggie pizza with peppers, onion, mushroom and olives over melted cheese.',
    ings: ['Pizza Base', 'Mozzarella', 'Tomato Sauce', 'Capsicum', 'Onion', 'Mushroom', 'Olives', 'Sweet Corn'],
    og: true,
  },

  // ── Beverages ────────────────────────────────────────────────────────────
  'masala chai': {
    desc: 'Spiced Indian tea brewed with crushed ginger, cardamom and whole spices.',
    ings: ['Milk', 'Tea Leaves', 'Ginger', 'Cardamom', 'Cinnamon', 'Clove', 'Sugar'],
    og: false,
  },
  'espresso': {
    desc: 'A rich, intense single shot of freshly pulled espresso with golden crema.',
    ings: ['Freshly Ground Coffee Beans'],
    og: false,
  },
  'cappuccino': {
    desc: 'Espresso topped with velvety steamed milk and a cloud of milk foam.',
    ings: ['Espresso', 'Steamed Milk', 'Milk Foam', 'Cocoa Dust'],
    og: false,
  },
  'cold coffee': {
    desc: 'Chilled blended coffee with milk and a scoop of vanilla ice cream.',
    ings: ['Coffee', 'Milk', 'Vanilla Ice Cream', 'Sugar'],
    og: false,
  },
  'iced tea': {
    desc: 'Refreshing chilled black tea with lemon and a hint of mint.',
    ings: ['Black Tea', 'Lemon', 'Mint', 'Sugar', 'Ice'],
    og: false,
  },
  'mango lassi': {
    desc: 'Thick, creamy yogurt shake blended with sweet ripe mango and cardamom.',
    ings: ['Curd', 'Mango', 'Milk', 'Sugar', 'Cardamom'],
    og: false,
  },
  'oreo milkshake': {
    desc: 'Indulgent cookie-crunch milkshake blended with vanilla ice cream.',
    ings: ['Milk', 'Vanilla Ice Cream', 'Oreo Cookies', 'Sugar'],
    og: false,
  },
  'virgin mojito': {
    desc: 'Bubbly lime and mint cooler over crushed ice with a soda fizz.',
    ings: ['Lime', 'Mint', 'Sugar', 'Soda', 'Crushed Ice'],
    og: false,
  },
  'blue lagoon': {
    desc: 'A vibrant blue mocktail with citrus, lemonade and a fizzy soda finish.',
    ings: ['Blue Curacao Syrup', 'Lemonade', 'Lemon', 'Soda', 'Ice'],
    og: false,
  },
  'fresh lime soda': {
    desc: 'Zesty lime soda served sweet, salted or plain over ice.',
    ings: ['Lime', 'Sugar', 'Black Salt', 'Soda', 'Ice'],
    og: false,
  },
  'orange juice': {
    desc: 'Freshly squeezed oranges, served chilled without any additives.',
    ings: ['Fresh Oranges'],
    og: false,
  },
  'watermelon juice': {
    desc: 'Cooling watermelon blended fresh and served over ice.',
    ings: ['Watermelon', 'Lemon'],
    og: false,
  },

  // ── Desserts ─────────────────────────────────────────────────────────────
  'gulab jamun': {
    desc: 'Soft khoya dumplings soaked in warm rose-cardamom sugar syrup.',
    ings: ['Khoya', 'Sugar', 'Rose Water', 'Cardamom', 'Saffron'],
    og: false,
  },
  'rasgulla': {
    desc: 'Spongy chenna balls simmered in a light cardamom sugar syrup.',
    ings: ['Chenna', 'Sugar', 'Cardamom', 'Rose Water'],
    og: false,
  },
  'kulfi': {
    desc: 'Dense, slow-set Indian ice cream flavoured with cardamom and pistachio.',
    ings: ['Milk', 'Sugar', 'Cardamom', 'Pistachio', 'Saffron'],
    og: false,
  },
  'rasmalai': {
    desc: 'Soft chenna discs soaked in saffron-pistachio milk cream.',
    ings: ['Chenna', 'Milk', 'Sugar', 'Saffron', 'Pistachio', 'Cardamom'],
    og: false,
  },
  'tiramisu': {
    desc: 'Coffee-soaked ladyfingers layered with mascarpone cream and cocoa.',
    ings: ['Ladyfingers', 'Mascarpone', 'Espresso', 'Cocoa', 'Sugar', 'Cream'],
    og: false,
  },
  'panna cotta': {
    desc: 'Silky vanilla-scented Italian custard set with a berry compote.',
    ings: ['Fresh Cream', 'Milk', 'Sugar', 'Vanilla', 'Gelatin', 'Berry Compote'],
    og: false,
  },
  'ice cream sundae': {
    desc: 'Scoops of ice cream crowned with chocolate syrup, nuts and a cherry.',
    ings: ['Vanilla/Chocolate Ice Cream', 'Chocolate Syrup', 'Nuts', 'Cherry', 'Wafers'],
    og: false,
  },
  'cheesecake': {
    desc: 'Baked New York-style cheesecake with a buttery biscuit base and berry topping.',
    ings: ['Cream Cheese', 'Biscuit Base', 'Fresh Cream', 'Sugar', 'Egg', 'Berries'],
    og: false,
  },
  'mochi ice cream': {
    desc: 'Chewy Japanese rice-dough parcels wrapped around ice cream.',
    ings: ['Glutinous Rice Flour', 'Ice Cream', 'Sugar', 'Cornflour'],
    og: false,
  },

  // ── Combos & Thali ───────────────────────────────────────────────────────
  'veg thali': {
    desc: 'A wholesome platter with dal, seasonal sabzi, rice, roti, raita, salad and dessert.',
    ings: ['Dal', 'Seasonal Sabzi', 'Rice', 'Roti', 'Raita', 'Salad', 'Dessert', 'Papad'],
    og: true,
  },
  'non-veg thali': {
    desc: 'A hearty platter with chicken curry, dal, rice, roti, raita, salad and dessert.',
    ings: ['Chicken Curry', 'Dal', 'Rice', 'Roti', 'Raita', 'Salad', 'Dessert', 'Papad'],
    og: true,
  },
  'family combo': {
    desc: 'A generous shareable feast of biryani, curries, breads and dessert for four.',
    ings: ['Biryani', 'Curries', 'Breads', 'Raita', 'Salad', 'Dessert'],
    og: true,
  },
  'student meal': {
    desc: 'A quick, filling budget plate with rice, dal, seasonal sabzi, roti and pickle.',
    ings: ['Rice', 'Dal', 'Seasonal Sabzi', 'Roti', 'Pickle', 'Salad'],
    og: true,
  },
}

const norm = (s) => (s || '').toLowerCase().replace(/&/g, ' and ').replace(/\s+/g, ' ').trim()

// Best curated match: exact key first, then longest curated key contained in the name.
export function resolveCuratedDetail(name) {
  const key = norm(name)
  if (!key) return null
  if (DISH_DETAILS[key]) return DISH_DETAILS[key]
  let best = null
  for (const [k, v] of Object.entries(DISH_DETAILS)) {
    if (key.includes(k) && (!best || k.length > best[0].length)) best = [k, v]
  }
  return best ? best[1] : null
}

export default DISH_DETAILS
