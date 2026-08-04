import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useKOT } from '../context/KOTContext'
import { useCustomers } from '../context/CustomerContext'
import { db } from '../firebase'
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, orderBy, deleteDoc, writeBatch, increment, onSnapshot, limit } from 'firebase/firestore'
import {
  ArrowLeft, Plus, Minus, Trash2, Percent, CreditCard, Banknote, QrCode,
  Printer, Search, Grid3X3, ShoppingBag, Users, X, Check, ChevronDown,
  Utensils, Coffee, IceCream, Pizza, Cake, LogOut, User, ChefHat, Receipt,
  Settings, GripVertical, Edit3, Save, Package, TableProperties, Tag, Key, History, Download, Calendar, ChevronLeft, ChevronRight, Phone,
  Camera, Loader2, Sparkles, Image, Zap, ScanLine, MapPin, Globe, Info
} from 'lucide-react'
import { vibrate } from '../utils/haptics'
import ItemDetailModal from './ItemDetailModal'

function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const MENU_VERSION = 2

const defaultCategories = [
  { id: 'starters', name: 'Starters', icon: 'Utensils', subCategories: [
    { id: 'start-indian', name: 'Indian' }, { id: 'start-chinese', name: 'Chinese' },
    { id: 'start-continental', name: 'Continental' }, { id: 'start-japanese', name: 'Japanese' },
    { id: 'start-thai', name: 'Thai' },
  ]},
  { id: 'soups', name: 'Soups', icon: 'Coffee', subCategories: [
    { id: 'soup-indian', name: 'Indian' }, { id: 'soup-continental', name: 'Continental' },
    { id: 'soup-asian', name: 'Asian' },
  ]},
  { id: 'salads', name: 'Salads & Raita', icon: 'Utensils', subCategories: [
    { id: 'sal-green', name: 'Green Salads' }, { id: 'sal-fruit', name: 'Fruit Salads' },
    { id: 'sal-raita', name: 'Raita' },
  ]},
  { id: 'main', name: 'Main Course', icon: 'Grid3X3', subCategories: [
    { id: 'main-north', name: 'North Indian' }, { id: 'main-south', name: 'South Indian' },
    { id: 'main-chinese', name: 'Chinese' }, { id: 'main-italian', name: 'Italian' },
    { id: 'main-continental', name: 'Continental' }, { id: 'main-japanese', name: 'Japanese' },
    { id: 'main-thai', name: 'Thai' },
  ]},
  { id: 'biryani', name: 'Rice & Biryani', icon: 'Package', subCategories: [
    { id: 'bir-veg', name: 'Veg' }, { id: 'bir-nonveg', name: 'Non-Veg' },
    { id: 'bir-special', name: 'Special' },
  ]},
  { id: 'noodles', name: 'Noodles & Fried Rice', icon: 'Package', subCategories: [
    { id: 'noodle-chinese', name: 'Chinese' }, { id: 'noodle-thai', name: 'Thai' },
    { id: 'noodle-japanese', name: 'Japanese' },
  ]},
  { id: 'breads', name: 'Breads & Naan', icon: 'Pizza', subCategories: [
    { id: 'bread-tandoor', name: 'Tandoor' }, { id: 'bread-paratha', name: 'Paratha' },
    { id: 'bread-specialty', name: 'Specialty' }, { id: 'bread-italian', name: 'Italian (Pizza/Pasta)' },
  ]},
  { id: 'beverages', name: 'Beverages', icon: 'Coffee', subCategories: [
    { id: 'bev-hot', name: 'Hot Drinks' }, { id: 'bev-cold', name: 'Cold Drinks' },
    { id: 'bev-mocktail', name: 'Mocktails' }, { id: 'bev-juice', name: 'Fresh Juices' },
    { id: 'bev-milkshake', name: 'Milkshakes' },
  ]},
  { id: 'desserts', name: 'Desserts', icon: 'IceCream', subCategories: [
    { id: 'dess-indian', name: 'Indian' }, { id: 'dess-continental', name: 'Continental' },
    { id: 'dess-italian', name: 'Italian' }, { id: 'dess-japanese', name: 'Japanese' },
  ]},
  { id: 'combos', name: 'Combos & Thali', icon: 'Tag', subCategories: [
    { id: 'combo-veg', name: 'Veg Thali' }, { id: 'combo-nonveg', name: 'Non-Veg Thali' },
    { id: 'combo-special', name: 'Special Combos' },
  ]},
]

const defaultItems = [
  // Starters — Indian
  { id: 1, name: 'Paneer Tikka', category: 'starters', subCategory: 'start-indian', price: 220, veg: true },
  { id: 2, name: 'Chicken 65', category: 'starters', subCategory: 'start-indian', price: 280, veg: false },
  { id: 3, name: 'Fish Fry', category: 'starters', subCategory: 'start-indian', price: 320, veg: false },
  { id: 4, name: 'Hara Bhara Kabab', category: 'starters', subCategory: 'start-indian', price: 180, veg: true },
  // Starters — Chinese
  { id: 5, name: 'Veg Spring Roll', category: 'starters', subCategory: 'start-chinese', price: 160, veg: true },
  { id: 6, name: 'Chicken Momos', category: 'starters', subCategory: 'start-chinese', price: 180, veg: false },
  { id: 7, name: 'Chilli Paneer', category: 'starters', subCategory: 'start-chinese', price: 200, veg: true },
  // Starters — Continental
  { id: 8, name: 'Bruschetta', category: 'starters', subCategory: 'start-continental', price: 200, veg: true },
  { id: 9, name: 'Grilled Chicken Wings', category: 'starters', subCategory: 'start-continental', price: 300, veg: false },
  // Starters — Japanese
  { id: 10, name: 'Edamame', category: 'starters', subCategory: 'start-japanese', price: 180, veg: true },
  { id: 11, name: 'Chicken Gyoza', category: 'starters', subCategory: 'start-japanese', price: 220, veg: false },
  // Starters — Thai
  { id: 12, name: 'Thai Fish Cakes', category: 'starters', subCategory: 'start-thai', price: 260, veg: false },
  { id: 13, name: 'Satay Paneer', category: 'starters', subCategory: 'start-thai', price: 200, veg: true },

  // Soups
  { id: 14, name: 'Mulligatawny Soup', category: 'soups', subCategory: 'soup-indian', price: 120, veg: true },
  { id: 15, name: 'Rasam Shot', category: 'soups', subCategory: 'soup-indian', price: 80, veg: true },
  { id: 16, name: 'Mushroom Soup', category: 'soups', subCategory: 'soup-continental', price: 160, veg: true },
  { id: 17, name: 'Tom Yum Soup', category: 'soups', subCategory: 'soup-asian', price: 180, veg: false },
  { id: 18, name: 'Hot & Sour Soup', category: 'soups', subCategory: 'soup-asian', price: 150, veg: true },

  // Salads & Raita
  { id: 19, name: 'Garden Fresh Salad', category: 'salads', subCategory: 'sal-green', price: 140, veg: true },
  { id: 20, name: 'Caesar Salad', category: 'salads', subCategory: 'sal-green', price: 180, veg: true },
  { id: 21, name: 'Fruit Chaat', category: 'salads', subCategory: 'sal-fruit', price: 120, veg: true },
  { id: 22, name: 'Boondi Raita', category: 'salads', subCategory: 'sal-raita', price: 80, veg: true },
  { id: 23, name: 'Pineapple Raita', category: 'salads', subCategory: 'sal-raita', price: 90, veg: true },

  // Main Course — North Indian
  { id: 24, name: 'Butter Chicken', category: 'main', subCategory: 'main-north', price: 320, veg: false },
  { id: 25, name: 'Paneer Butter Masala', category: 'main', subCategory: 'main-north', price: 260, veg: true },
  { id: 26, name: 'Dal Makhani', category: 'main', subCategory: 'main-north', price: 200, veg: true },
  { id: 27, name: 'Chicken Curry', category: 'main', subCategory: 'main-north', price: 300, veg: false },
  { id: 28, name: 'Rogan Josh', category: 'main', subCategory: 'main-north', price: 340, veg: false },
  // Main Course — South Indian
  { id: 29, name: 'Hyderabadi Chicken', category: 'main', subCategory: 'main-south', price: 320, veg: false },
  { id: 30, name: 'Sambar Rice', category: 'main', subCategory: 'main-south', price: 160, veg: true },
  { id: 31, name: 'Chettinad Paneer', category: 'main', subCategory: 'main-south', price: 240, veg: true },
  // Main Course — Chinese
  { id: 32, name: 'Manchurian Gravy', category: 'main', subCategory: 'main-chinese', price: 200, veg: true },
  { id: 33, name: 'Chilli Chicken', category: 'main', subCategory: 'main-chinese', price: 280, veg: false },
  // Main Course — Italian
  { id: 34, name: 'Penne Arrabiata', category: 'main', subCategory: 'main-italian', price: 220, veg: true },
  { id: 35, name: 'Fettuccine Alfredo', category: 'main', subCategory: 'main-italian', price: 260, veg: true },
  { id: 36, name: 'Grilled Chicken Steak', category: 'main', subCategory: 'main-continental', price: 380, veg: false },
  // Main Course — Japanese
  { id: 37, name: 'Chicken Katsu Curry', category: 'main', subCategory: 'main-japanese', price: 340, veg: false },
  { id: 38, name: 'Teriyaki Tofu', category: 'main', subCategory: 'main-japanese', price: 260, veg: true },
  // Main Course — Thai
  { id: 39, name: 'Green Curry', category: 'main', subCategory: 'main-thai', price: 280, veg: true },
  { id: 40, name: 'Pad Thai', category: 'main', subCategory: 'main-thai', price: 240, veg: true },

  // Rice & Biryani
  { id: 41, name: 'Veg Biryani', category: 'biryani', subCategory: 'bir-veg', price: 220, veg: true },
  { id: 42, name: 'Chicken Biryani', category: 'biryani', subCategory: 'bir-nonveg', price: 300, veg: false },
  { id: 43, name: 'Mutton Biryani', category: 'biryani', subCategory: 'bir-nonveg', price: 380, veg: false },
  { id: 44, name: 'Jeera Rice', category: 'biryani', subCategory: 'bir-veg', price: 150, veg: true },
  { id: 45, name: 'Hyderabadi Dum Biryani', category: 'biryani', subCategory: 'bir-special', price: 350, veg: false },
  { id: 46, name: 'Prawn Biryani', category: 'biryani', subCategory: 'bir-special', price: 400, veg: false },

  // Noodles & Fried Rice
  { id: 47, name: 'Veg Hakka Noodles', category: 'noodles', subCategory: 'noodle-chinese', price: 180, veg: true },
  { id: 48, name: 'Chicken Schezwan Noodles', category: 'noodles', subCategory: 'noodle-chinese', price: 220, veg: false },
  { id: 49, name: 'Veg Fried Rice', category: 'noodles', subCategory: 'noodle-chinese', price: 160, veg: true },
  { id: 50, name: 'Thai Basil Noodles', category: 'noodles', subCategory: 'noodle-thai', price: 200, veg: true },
  { id: 51, name: 'Yakisoba', category: 'noodles', subCategory: 'noodle-japanese', price: 220, veg: true },

  // Breads & Naan
  { id: 52, name: 'Garlic Naan', category: 'breads', subCategory: 'bread-tandoor', price: 40, veg: true },
  { id: 53, name: 'Butter Naan', category: 'breads', subCategory: 'bread-tandoor', price: 45, veg: true },
  { id: 54, name: 'Tandoori Roti', category: 'breads', subCategory: 'bread-tandoor', price: 30, veg: true },
  { id: 55, name: 'Laccha Paratha', category: 'breads', subCategory: 'bread-paratha', price: 50, veg: true },
  { id: 56, name: 'Aloo Paratha', category: 'breads', subCategory: 'bread-paratha', price: 60, veg: true },
  { id: 57, name: 'Cheese Naan', category: 'breads', subCategory: 'bread-specialty', price: 70, veg: true },
  { id: 58, name: 'Peshwari Naan', category: 'breads', subCategory: 'bread-specialty', price: 75, veg: true },
  { id: 59, name: 'Margherita Pizza', category: 'breads', subCategory: 'bread-italian', price: 200, veg: true },
  { id: 60, name: 'Farm Fresh Pizza', category: 'breads', subCategory: 'bread-italian', price: 260, veg: true },

  // Beverages
  { id: 61, name: 'Masala Chai', category: 'beverages', subCategory: 'bev-hot', price: 30, veg: true },
  { id: 62, name: 'Espresso', category: 'beverages', subCategory: 'bev-hot', price: 80, veg: true },
  { id: 63, name: 'Cappuccino', category: 'beverages', subCategory: 'bev-hot', price: 100, veg: true },
  { id: 64, name: 'Cold Coffee', category: 'beverages', subCategory: 'bev-cold', price: 120, veg: true },
  { id: 65, name: 'Iced Tea', category: 'beverages', subCategory: 'bev-cold', price: 90, veg: true },
  { id: 66, name: 'Mango Lassi', category: 'beverages', subCategory: 'bev-milkshake', price: 80, veg: true },
  { id: 67, name: 'Oreo Milkshake', category: 'beverages', subCategory: 'bev-milkshake', price: 120, veg: true },
  { id: 68, name: 'Virgin Mojito', category: 'beverages', subCategory: 'bev-mocktail', price: 140, veg: true },
  { id: 69, name: 'Blue Lagoon', category: 'beverages', subCategory: 'bev-mocktail', price: 130, veg: true },
  { id: 70, name: 'Fresh Lime Soda', category: 'beverages', subCategory: 'bev-juice', price: 60, veg: true },
  { id: 71, name: 'Orange Juice', category: 'beverages', subCategory: 'bev-juice', price: 80, veg: true },
  { id: 72, name: 'Watermelon Juice', category: 'beverages', subCategory: 'bev-juice', price: 70, veg: true },

  // Desserts
  { id: 73, name: 'Gulab Jamun', category: 'desserts', subCategory: 'dess-indian', price: 100, veg: true },
  { id: 74, name: 'Rasgulla', category: 'desserts', subCategory: 'dess-indian', price: 90, veg: true },
  { id: 75, name: 'Kulfi', category: 'desserts', subCategory: 'dess-indian', price: 80, veg: true },
  { id: 76, name: 'Rasmalai', category: 'desserts', subCategory: 'dess-indian', price: 110, veg: true },
  { id: 77, name: 'Tiramisu', category: 'desserts', subCategory: 'dess-italian', price: 200, veg: true },
  { id: 78, name: 'Panna Cotta', category: 'desserts', subCategory: 'dess-italian', price: 180, veg: true },
  { id: 79, name: 'Ice Cream Sundae', category: 'desserts', subCategory: 'dess-continental', price: 150, veg: true },
  { id: 80, name: 'Cheesecake', category: 'desserts', subCategory: 'dess-continental', price: 180, veg: true },
  { id: 81, name: 'Mochi Ice Cream', category: 'desserts', subCategory: 'dess-japanese', price: 160, veg: true },

  // Combos & Thali
  { id: 82, name: 'Veg Thali', category: 'combos', subCategory: 'combo-veg', price: 250, veg: true },
  { id: 83, name: 'Non-Veg Thali', category: 'combos', subCategory: 'combo-nonveg', price: 350, veg: false },
  { id: 84, name: 'Family Combo (Serves 4)', category: 'combos', subCategory: 'combo-special', price: 999, veg: true },
  { id: 85, name: 'Student Meal', category: 'combos', subCategory: 'combo-special', price: 180, veg: true },
]

const defaultTables = [
  { id: 1, name: 'Table 1', seats: 4 },
  { id: 2, name: 'Table 2', seats: 4 },
  { id: 3, name: 'Table 3', seats: 6 },
  { id: 4, name: 'Table 4', seats: 2 },
  { id: 5, name: 'Table 5', seats: 8 },
  { id: 6, name: 'Table 6', seats: 4 },
  { id: 7, name: 'Table 7', seats: 6 },
  { id: 8, name: 'Table 8', seats: 4 },
]

const iconComponents = { Utensils, Grid3X3, Pizza, Coffee, IceCream, Cake, Package, Tag }

const iconOptions = ['Utensils', 'Grid3X3', 'Pizza', 'Coffee', 'IceCream', 'Cake', 'Package', 'Tag']

export default function Billing() {
  const navigate = useNavigate()
  const billRef = useRef(null)
  const { currentUser, userProfile, logout, uploadProfilePic, removeProfilePic, refreshProfile } = useAuth()
  const { addKOT, addOrUpdateKOT, readyCount, readyAlerts, dismissReadyAlert, kots, playPaymentSound, qrPayments, dismissQrPayment } = useKOT()
  const { findCustomerByPhone, createQuickCustomer, incrementCustomerStats, updateCustomer } = useCustomers()
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [showUpiQr, setShowUpiQr] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [upiInput, setUpiInput] = useState('')
  const [upiSaving, setUpiSaving] = useState(false)
  const [cardType, setCardType] = useState('')
  const billingInProgress = useRef(false)
  const freshOrder = useRef(false)

  const [menuCategories, setMenuCategories] = useState(defaultCategories)
  const [menuItems, setMenuItems] = useState(defaultItems)
  const [tables, setTables] = useState(defaultTables)
  const [menuLoaded, setMenuLoaded] = useState(false)
  const [customerPhone, setCustomerPhone] = useState('')
  const [activeCustomer, setActiveCustomer] = useState(null)

  const [activeCategory, setActiveCategory] = useState('starters')
  const [activeSubCategory, setActiveSubCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [vegFilter, setVegFilter] = useState('all')
  const [orderItems, setOrderItems] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [selectedDetailItem, setSelectedDetailItem] = useState(null)
  const [discount, setDiscount] = useState({ type: 'percent', value: 0 })
  const [showDiscount, setShowDiscount] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showTableModal, setShowTableModal] = useState(false)
  const [showMergeSplit, setShowMergeSplit] = useState(false)
  const [mergeSplitTab, setMergeSplitTab] = useState('merge')
  const [selectedTablesForMerge, setSelectedTablesForMerge] = useState([])
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrTableName, setQrTableName] = useState('')
  const [qrTableNum, setQrTableNum] = useState('')
  const [splitCount, setSplitCount] = useState(2)
  const [tableOrders, setTableOrders] = useState({})
  const [splitItemTargets, setSplitItemTargets] = useState({})
  const [kotNotes, setKotNotes] = useState('')
  const [loadedKotIds, setLoadedKotIds] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [orderComplete, setOrderComplete] = useState(false)
  const [kotGenerated, setKotGenerated] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [showMenuManager, setShowMenuManager] = useState(false)
  const [menuTab, setMenuTab] = useState('categories')
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [editingTable, setEditingTable] = useState(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('Utensils')
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('starters')
  const [newItemVeg, setNewItemVeg] = useState(true)
  const [newTableName, setNewTableName] = useState('')
  const [newTableSeats, setNewTableSeats] = useState(4)
  const [newSubCatName, setNewSubCatName] = useState('')
  const [editingSubCat, setEditingSubCat] = useState(null)
  const [newItemSubCategory, setNewItemSubCategory] = useState('')
  const [menuSaving, setMenuSaving] = useState(false)
  const [menuCardUploading, setMenuCardUploading] = useState(false)
  const [menuCardExtracted, setMenuCardExtracted] = useState([])
  const [showMenuCardReview, setShowMenuCardReview] = useState(false)
  const [menuCardPreview, setMenuCardPreview] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [showMenuCardDownload, setShowMenuCardDownload] = useState(false)
  const [menuCardTheme, setMenuCardTheme] = useState('light')
  const [menuCardPdfGenerating, setMenuCardPdfGenerating] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showCalDrop, setShowCalDrop] = useState(false)
  const [historyDate, setHistoryDate] = useState(() => toLocalDateStr(new Date()))
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { month: d.getMonth(), year: d.getFullYear() } })
  const [historyTxns, setHistoryTxns] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedTxnId, setExpandedTxnId] = useState(null)
  const [showKitchenClear, setShowKitchenClear] = useState(false)
  const [showProfileDrop, setShowProfileDrop] = useState(false)
  const [showWaiterDrop, setShowWaiterDrop] = useState(false)
  const [showCustModal, setShowCustModal] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [custModalName, setCustModalName] = useState('')
  const [custModalDob, setCustModalDob] = useState('')
  const [custModalDobDisplay, setCustModalDobDisplay] = useState('')
  const [custModalPhone, setCustModalPhone] = useState('')
  const [custModalSearching, setCustModalSearching] = useState(false)
  const [custModalFound, setCustModalFound] = useState(null)
  const [custModalBday, setCustModalBday] = useState(false)
  const [custModalBdayDiscount, setCustModalBdayDiscount] = useState(0)
  const [showNewOrderModal, setShowNewOrderModal] = useState(true)
  const [newOrderType, setNewOrderType] = useState('dine-in')
  const [newOrderPax, setNewOrderPax] = useState(2)
  const [newOrderPhone, setNewOrderPhone] = useState('')
  const [newOrderName, setNewOrderName] = useState('')
  const [newOrderDob, setNewOrderDob] = useState('')
  const [newOrderDobDisplay, setNewOrderDobDisplay] = useState('')
  const [newOrderTable, setNewOrderTable] = useState(null)
  const [newOrderCustomer, setNewOrderCustomer] = useState(null)
  const [tableAssignments, setTableAssignments] = useState({})

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    async function loadMenu() {
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid))
        if (cancelled) return
        if (snap.exists()) {
          const data = snap.data()
          if (data.menuConfig) {
            if ((data.menuConfig.menuVersion || 1) < MENU_VERSION) {
              await updateDoc(doc(db, 'users', currentUser.uid), {
                menuConfig: { categories: defaultCategories, items: defaultItems, tables: defaultTables, menuVersion: MENU_VERSION }
              })
            } else {
              if (data.menuConfig.categories?.length) setMenuCategories(data.menuConfig.categories)
              if (data.menuConfig.items?.length) setMenuItems(data.menuConfig.items)
              if (data.menuConfig.tables?.length) setTables(data.menuConfig.tables)
            }
          }
          if (data.upiId) setUpiId(data.upiId)
        }
      } catch (err) {
        console.error('Error loading menu:', err)
      }
      if (!cancelled) setMenuLoaded(true)
    }
    loadMenu()
    return () => { cancelled = true }
  }, [currentUser])

  useEffect(() => {
    if (!readyAlerts.length) return
    const timers = readyAlerts.map((a) => setTimeout(() => dismissReadyAlert(a.id), 5000))
    return () => timers.forEach(clearTimeout)
  }, [readyAlerts, dismissReadyAlert])

  const [waiterAlerts, setWaiterAlerts] = useState([])
  const waiterRingtoneRef = useRef(null)
  const waiterRingTimeoutRef = useRef(null)

  function startWaiterRingtone() {
    stopWaiterRingtone()
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const gain = ctx.createGain()
      gain.connect(ctx.destination)
      gain.gain.value = 0.15

      const osc1 = ctx.createOscillator()
      osc1.type = 'sine'
      osc1.frequency.value = 440
      osc1.connect(gain)
      osc1.start()

      const osc2 = ctx.createOscillator()
      osc2.type = 'sine'
      osc2.frequency.value = 480
      osc2.connect(gain)
      osc2.start()

      waiterRingtoneRef.current = { ctx, osc1, osc2, gain }
      waiterRingTimeoutRef.current = setTimeout(stopWaiterRingtone, 5000)
    } catch (e) {
      // audio not supported
    }
  }

  function stopWaiterRingtone() {
    if (waiterRingTimeoutRef.current) {
      clearTimeout(waiterRingTimeoutRef.current)
      waiterRingTimeoutRef.current = null
    }
    if (waiterRingtoneRef.current) {
      try { waiterRingtoneRef.current.osc1.stop() } catch (e) {}
      try { waiterRingtoneRef.current.osc2.stop() } catch (e) {}
      try { waiterRingtoneRef.current.ctx.close() } catch (e) {}
      waiterRingtoneRef.current = null
    }
  }

  function dismissWaiterAlert(id) {
    stopWaiterRingtone()
    setWaiterAlerts((a) => a.filter((w) => w.id !== id))
    updateDoc(doc(db, 'users', currentUser.uid, 'notifications', id), { read: true }).catch(() => {})
  }

  useEffect(() => {
    return () => stopWaiterRingtone()
  }, [])

  useEffect(() => {
    if (!currentUser) return
    const q = query(collection(db, 'users', currentUser.uid, 'notifications'), where('type', '==', 'waiter'), where('read', '==', false))
    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          setWaiterAlerts((prev) => {
            if (prev.find((a) => a.id === change.doc.id)) return prev
            return [{ id: change.doc.id, ...data }, ...prev]
          })
          startWaiterRingtone()
          setTimeout(() => {
            setWaiterAlerts((prev) => prev.map((a) => a.id === change.doc.id ? { ...a, popupDismissed: true } : a))
          }, 5000)
        }
      })
    }, (err) => {
      console.error('Waiter notification listener error:', err)
    })
    return () => unsub()
  }, [currentUser])

  const allPendingKots = (kots || []).filter(
    (k) => (k.status === 'pending' || k.status === 'preparing' || k.status === 'ready') && !k.paid && k.paymentStatus !== 'paid'
  )

  const activeKots = allPendingKots.filter(
    (k) => selectedTable && k.table === `Table ${selectedTable}` && !loadedKotIds.includes(k.id)
  )

  function suggestTable(pax, tableList, occupiedIds) {
    const available = tableList.filter(t => !occupiedIds.includes(t.id) && t.seats >= pax)
    available.sort((a, b) => a.seats - b.seats)
    return available.length > 0 ? available[0] : null
  }

  function getOccupiedTableIds() {
    const ids = new Set()
    allPendingKots.forEach(k => {
      const isPaid = k.paid || k.paymentStatus === 'paid' || k.status === 'completed'
      if (!isPaid) {
        const match = k.table?.match(/Table\s*(\d+)/)
        if (match) ids.add(Number(match[1]))
      }
    })
    Object.keys(tableAssignments).forEach(id => {
      ids.add(Number(id))
    })
    return [...ids]
  }

  function releaseTable(tableId) {
    setTableAssignments((prev) => {
      const next = { ...prev }
      delete next[tableId]
      return next
    })
    vibrate(10)
  }

  function getTableAssignment(tableId) {
    return tableAssignments[tableId] || null
  }

  function hasKotForTable(tableId) {
    return allPendingKots.some(k => {
      const match = k.table?.match(/Table\s*(\d+)/)
      return match && Number(match[1]) === tableId
    })
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTableAssignments((prev) => {
        let changed = false
        const next = { ...prev }
        Object.entries(next).forEach(([id, assignment]) => {
          if (now - assignment.assignedAt > 30 * 60 * 1000 && !hasKotForTable(Number(id))) {
            delete next[id]
            changed = true
          }
        })
        return changed ? next : prev
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [allPendingKots])

  // Real-time payment status sync for loaded/active KOTs in Billing POS
  useEffect(() => {
    if (loadedKotIds.length === 0) return
    const loadedKot = (kots || []).find((k) => loadedKotIds.includes(k.id))
    if (loadedKot) {
      if (loadedKot.paid || loadedKot.paymentStatus === 'paid') {
        setPaymentConfirmed(true)
        setPaymentMethod((loadedKot.payment || 'upi').toLowerCase())
      }
    }
  }, [kots, loadedKotIds])

  const loadKOT = (kot) => {
    if (kot.table) {
      const match = kot.table.match(/\d+/)
      if (match) {
        setSelectedTable(Number(match[0]))
      }
    }
    setOrderItems((prev) => {
      const merged = [...prev]
      kot.items.forEach((item) => {
        const existing = merged.find((i) => i.name === item.name && i.price === item.price)
        if (existing) existing.qty += item.qty
        else merged.push({ ...item, id: Date.now() + Math.random() })
      })
      return merged
    })
    setLoadedKotIds((prev) => (prev.includes(kot.id) ? prev : [...prev, kot.id]))
    setKotNotes(kot.notes || '')
    if (kot.paid || kot.paymentStatus === 'paid') {
      setPaymentConfirmed(true)
      setPaymentMethod((kot.payment || 'upi').toLowerCase())
    } else {
      setPaymentConfirmed(false)
      setPaymentMethod('')
    }
    if (kot.customerName || kot.customerPhone) {
      const phone = (kot.customerPhone || '').replace(/\D/g, '').slice(-10)
      setCustomerPhone(phone)
      if (phone.length >= 10) {
        findCustomerByPhone(phone).then((c) => {
          if (c) setActiveCustomer(c)
        }).catch(() => {})
      }
    }
    freshOrder.current = false
    setShowCart(true)
  }

  const activeKotsTotal = activeKots.reduce((sum, k) => {
    const kSub = k.items.reduce((s, i) => s + i.price * i.qty, 0)
    return sum + kSub
  }, 0)

  const saveMenu = useCallback(async (cats, items, tbls) => {
    if (!currentUser) return
    setMenuSaving(true)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        menuConfig: { categories: cats, items: items, tables: tbls, menuVersion: MENU_VERSION }
      })
    } catch (err) {
      console.error('Error saving menu:', err)
    }
    setMenuSaving(false)
  }, [currentUser])

  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
  const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
  const GROQ_KEY = import.meta.env.VITE_GROQ_KEY
  const IMGBB_KEY = import.meta.env.VITE_IMGBB_KEY

  const VISION_PROMPT = `You are a menu card OCR assistant. Extract ALL menu items from this restaurant menu card image.

Return ONLY a valid JSON array (no markdown, no explanation, no extra text):
[
  {
    "name": "Item Name",
    "price": 220,
    "category": "Starters",
    "veg": true
  }
]

Rules:
- price must be a number (no ₹ symbol, no commas, no dashes for missing)
- veg: true if vegetarian, false if non-vegetarian
- If item type not clear, set veg to true
- category: use one of: Starters, Soups, Salads, Main Course, Rice & Biryani, Noodles & Fried Rice, Breads, Beverages, Desserts, Combos
- If price not visible, set price to 0
- Include ALL visible items from the image
- Do not add items not visible in the image
- Do not include section headers, only actual menu items with prices`

  async function handleMenuCardUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Only image files allowed'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Image must be less than 10MB'); return }

    setMenuCardUploading(true)
    setMenuCardPreview(URL.createObjectURL(file))
    try {
      const formData = new FormData()
      formData.append('image', file)
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: 'POST', body: formData })
      const imgData = await imgRes.json()
      if (!imgData.success) throw new Error(imgData.error?.message || 'Image upload failed')
      const imageUrl = imgData.data.url

      const aiRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: GROQ_VISION_MODEL,
          messages: [
            { role: 'system', content: VISION_PROMPT },
            { role: 'user', content: [
              { type: 'text', text: 'Extract all menu items from this menu card image as JSON.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]}
          ],
          temperature: 0.1,
          max_completion_tokens: 4096,
        })
      })
      const aiData = await aiRes.json()
      if (aiData.error) throw new Error(aiData.error.message || 'AI extraction failed')

      let rawText = aiData.choices?.[0]?.message?.content || ''
      const jsonMatch = rawText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('AI could not detect menu items. Try a clearer photo.')

      let items = JSON.parse(jsonMatch[0])
      items = items.filter((it) => it.name && typeof it.name === 'string').map((it, idx) => ({
        id: Date.now() + idx,
        name: String(it.name).trim(),
        price: Number(it.price) || 0,
        category: String(it.category || 'Main Course').trim(),
        veg: it.veg !== false,
        _selected: true,
      }))

      if (items.length === 0) throw new Error('No menu items found in the image')

      setMenuCardExtracted(items)
      setShowMenuCardReview(true)
    } catch (err) {
      console.error('Menu card upload error:', err)
      alert('Error: ' + err.message)
    }
    setMenuCardUploading(false)
    e.target.value = ''
  }

  function toggleExtractedItem(idx) {
    setMenuCardExtracted((prev) => prev.map((it, i) => i === idx ? { ...it, _selected: !it._selected } : it))
  }

  function updateExtractedItem(idx, field, value) {
    setMenuCardExtracted((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  function removeExtractedItem(idx) {
    setMenuCardExtracted((prev) => prev.filter((_, i) => i !== idx))
  }

  function addExtractedItem() {
    setMenuCardExtracted((prev) => [...prev, { id: Date.now(), name: '', price: 0, category: 'Main Course', veg: true, _selected: true }])
  }

  function matchCategory(catName) {
    const lower = catName.toLowerCase()
    const found = menuCategories.find((c) => c.name.toLowerCase() === lower || c.id.toLowerCase().includes(lower))
    return found ? found.id : menuCategories[0]?.id || 'starters'
  }

  function handleExtractedAdd() {
    const selected = menuCardExtracted.filter((it) => it._selected && it.name.trim())
    if (selected.length === 0) { alert('Select at least one item'); return }
    const newItems = selected.map((it) => ({ id: Date.now() + Math.random() * 1000, name: it.name.trim(), price: Number(it.price) || 0, category: matchCategory(it.category), subCategory: '', veg: it.veg }))
    const existingNames = new Set(menuItems.map((i) => i.name.toLowerCase()))
    const merged = [...menuItems, ...newItems.filter((ni) => !existingNames.has(ni.name.toLowerCase()))]
    setMenuItems(merged)
    saveMenu(menuCategories, merged, tables)
    setShowMenuCardReview(false)
    setMenuCardExtracted([])
    setMenuCardPreview('')
  }

  function handleExtractedReplace() {
    const selected = menuCardExtracted.filter((it) => it._selected && it.name.trim())
    if (selected.length === 0) { alert('Select at least one item'); return }

    const newCats = []
    const catMap = {}
    selected.forEach((it) => {
      const catName = it.category || 'Main Course'
      const catId = matchCategory(catName)
      if (!catMap[catId]) {
        const existing = menuCategories.find((c) => c.id === catId)
        catMap[catId] = true
        if (existing) newCats.push(existing)
        else newCats.push({ id: catId, name: catName, icon: 'Utensils', subCategories: [] })
      }
    })

    const newItems = selected.map((it, idx) => ({
      id: Date.now() + idx,
      name: it.name.trim(),
      price: Number(it.price) || 0,
      category: matchCategory(it.category),
      subCategory: '',
      veg: it.veg,
    }))

    setMenuCategories(newCats)
    setMenuItems(newItems)
    saveMenu(newCats, newItems, tables)
    setShowMenuCardReview(false)
    setMenuCardExtracted([])
    setMenuCardPreview('')
  }

  const handleSaveProfile = async () => {
    if (!currentUser) return
    setProfileSaving(true)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        restaurant: (userProfile?.restaurant || '').trim(),
        address: (userProfile?.address || '').trim(),
        phone: (userProfile?.phone || '').trim(),
        instagram: (userProfile?.instagram || '').trim(),
        facebook: (userProfile?.facebook || '').trim(),
      })
      await refreshProfile()
    } catch (err) {
      console.error('Error saving profile:', err)
    }
    setProfileSaving(false)
  }

  function updateProfileField(field, value) {
    setUserProfile((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  async function downloadMenuCard(theme) {
    setMenuCardPdfGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const pageWidth = 800
      const pageHeight = 1130
      const pages = document.querySelectorAll('.menu-card-page')
      if (!pages.length) { setMenuCardPdfGenerating(false); return }

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [pageWidth, pageHeight] })

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: null, width: pageWidth, height: pageHeight })
        const imgData = canvas.toDataURL('image/png')
        if (i > 0) pdf.addPage([pageWidth, pageHeight], 'portrait')
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)
      }

      const restName = userProfile?.restaurant || 'menu'
      pdf.save(`${restName}-menu-card.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Failed to generate PDF. Please try again.')
    }
    setMenuCardPdfGenerating(false)
  }

  const filteredItems = menuItems.filter((item) => {
    const matchVeg = vegFilter === 'all' || item.veg
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (searchQuery) return matchSearch && matchVeg
    const matchCategory = item.category === activeCategory
    if (!matchCategory) return false
    if (activeSubCategory) return item.subCategory === activeSubCategory && matchVeg
    return matchVeg
  })

  const addItem = (item) => {
    vibrate(10)
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setOrderItems((prev) => {
      return prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    })
  }

  const removeItem = (id) => {
    setOrderItems((prev) => prev.filter((i) => i.id !== id))
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0)
  const discountAmount =
    discount.type === 'percent' ? (subtotal * discount.value) / 100 : discount.value
  const cgst = ((subtotal - discountAmount) * 2.5) / 100
  const sgst = ((subtotal - discountAmount) * 2.5) / 100
  const gst = cgst + sgst
  const total = subtotal - discountAmount + gst

  const toggleMergeTable = (tableId) => {
    setSelectedTablesForMerge((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId]
    )
  }

  const switchTable = (newTableId) => {
    if (selectedTable === newTableId) return
    if (orderItems.length > 0) {
      setTableOrders((prev) => ({ ...prev, [selectedTable]: { items: orderItems, discount } }))
    }
    setSelectedTable(newTableId)
    setShowTableModal(false)
    setPaymentConfirmed(false)
    setPaymentMethod('')
    setDiscount({ type: 'percent', value: 0 })
    setShowCart(true)
    // load pending KOTs for this table
    const tableKots = allPendingKots.filter((k) => k.table === `Table ${newTableId}`)
    if (tableKots.length > 0) {
      const allItems = []
      const allIds = []
      tableKots.forEach((kot) => {
        allIds.push(kot.id)
        kot.items.forEach((item) => {
          const existing = allItems.find((i) => i.name === item.name && i.price === item.price)
          if (existing) existing.qty += item.qty
          else allItems.push({ ...item, id: Date.now() + Math.random() })
        })
      })
      setOrderItems(allItems)
      setLoadedKotIds(allIds)
      const allNotes = tableKots.map((k) => k.notes).filter(Boolean).join('; ')
      setKotNotes(allNotes)
      // set customer info from first KOT that has it
      const kotWithCust = tableKots.find((k) => k.customerName || k.customerPhone)
      if (kotWithCust) {
        const phone = (kotWithCust.customerPhone || '').replace(/\D/g, '').slice(-10)
        setCustomerPhone(phone)
        if (phone.length >= 10) {
          findCustomerByPhone(phone).then((c) => {
            if (c) setActiveCustomer(c)
          }).catch(() => {})
        }
      }
    } else {
      setOrderItems([])
      setLoadedKotIds([])
      setKotNotes('')
    }
  }

  const executeMerge = () => {
    if (selectedTablesForMerge.length < 2) return
    let mergedItems = []
    let mergedDiscount = { type: 'percent', value: 0 }
    const primaryTable = selectedTablesForMerge[0]
    selectedTablesForMerge.forEach((tId) => {
      if (tId === selectedTable && orderItems.length > 0) {
        mergedItems = [...mergedItems, ...orderItems]
      } else if (tableOrders[tId]) {
        mergedItems = [...mergedItems, ...(tableOrders[tId].items || [])]
      }
    })
    const combined = {}
    mergedItems.forEach((item) => {
      if (combined[item.id]) {
        combined[item.id] = { ...combined[item.id], qty: combined[item.id].qty + item.qty }
      } else {
        combined[item.id] = { ...item }
      }
    })
    const finalItems = Object.values(combined)
    setOrderItems(finalItems)
    setTableOrders((prev) => {
      const updated = { ...prev }
      selectedTablesForMerge.forEach((tId) => {
        delete updated[tId]
      })
      return updated
    })
    setSelectedTable(primaryTable)
    setSelectedTablesForMerge([])
    setShowMergeSplit(false)
    setPaymentConfirmed(false)
    setPaymentMethod('')
  }

  const executeSplitEvenly = () => {
    if (orderItems.length === 0) return
    const perPerson = total / splitCount
    setSplitCount(splitCount)
    setShowMergeSplit(false)
  }


  const getElapsed = (createdAt) => {
    if (!createdAt) return { mins: 0, secs: 0 }
    const ts = typeof createdAt === 'string' ? new Date(createdAt).getTime()
      : createdAt.seconds ? createdAt.seconds * 1000
        : typeof createdAt === 'number' ? createdAt : 0
    if (!ts) return { mins: 0, secs: 0 }
    const diff = Date.now() - ts
    return { mins: Math.floor(diff / 60000), secs: Math.floor((diff % 60000) / 1000) }
  }

  const isTableOccupied = (tableId) => {
    const tblName = `Table ${tableId}`
    return (kots || []).some((k) => k.table === tblName && (k.status === 'pending' || k.status === 'preparing' || k.status === 'ready'))
  }

  const getTableItemCount = (tableId) => {
    if (tableId === selectedTable) return orderItems.length
    const tblName = `Table ${tableId}`
    const activeKotItems = (kots || [])
      .filter((k) => k.table === tblName && (k.status === 'pending' || k.status === 'preparing'))
      .reduce((sum, k) => sum + k.items.length, 0)
    if (activeKotItems > 0) return activeKotItems
    if (tableOrders[tableId]) return (tableOrders[tableId].items || []).length
    return 0
  }

  const getTableTotal = (tableId) => {
    if (tableId === selectedTable) return orderItems.reduce((s, i) => s + i.price * i.qty, 0)
    const tblName = `Table ${tableId}`
    const activeKotTotal = (kots || [])
      .filter((k) => k.table === tblName && (k.status === 'pending' || k.status === 'preparing'))
      .reduce((sum, k) => sum + k.items.reduce((s, i) => s + i.price * i.qty, 0), 0)
    if (activeKotTotal > 0) return activeKotTotal
    if (tableOrders[tableId]) return (tableOrders[tableId].items || []).reduce((s, i) => s + i.price * i.qty, 0)
    return 0
  }

  const completePayment = () => {
    if (!paymentMethod || orderItems.length === 0) return
    if (paymentMethod === 'card' && !cardType) return
    setShowPayment(false)
    setPaymentConfirmed(true)
    setCardType('')
  }

  const generateKOT = () => {
    if (orderItems.length === 0) return
    vibrate(15)
    const loadedItemKeys = new Set()
    loadedKotIds.forEach((kid) => {
      const kot = kots.find((k) => k.id === kid)
      if (kot) kot.items.forEach((item) => loadedItemKeys.add(`${item.name}__${item.price}`))
    })
    const newItems = orderItems.filter((i) => !loadedItemKeys.has(`${i.name}__${i.price}`))
    if (newItems.length === 0) {
      setOrderItems([])
      setKotNotes('')
      setLoadedKotIds([])
      setDiscount({ type: 'percent', value: 0 })
      setPaymentMethod('')
      setPaymentConfirmed(false)
      setShowPayment(false)
      return
    }
    if (freshOrder.current) {
      addKOT({
        table: selectedTable ? `Table ${selectedTable}` : 'Parcel',
        items: newItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price, veg: i.veg })),
        subtotal: newItems.reduce((s, i) => s + i.price * i.qty, 0),
        discountAmount: 0,
        discountType: '',
        gst: 0,
        total: 0,
        payment: null,
        user: currentUser?.displayName || currentUser?.email,
        notes: kotNotes.trim(),
      })
    } else {
      addOrUpdateKOT({
        table: selectedTable ? `Table ${selectedTable}` : 'Parcel',
        items: newItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price, veg: i.veg })),
        subtotal: newItems.reduce((s, i) => s + i.price * i.qty, 0),
        discountAmount: 0,
        discountType: '',
        gst: 0,
        total: 0,
        payment: null,
        user: currentUser?.displayName || currentUser?.email,
        notes: kotNotes.trim(),
      })
    }
    freshOrder.current = false
    setOrderItems([])
    setKotNotes('')
    setLoadedKotIds([])
    setDiscount({ type: 'percent', value: 0 })
    setPaymentMethod('')
    setPaymentConfirmed(false)
    setShowPayment(false)
    setKotGenerated(true)
    setTimeout(() => setKotGenerated(false), 2000)
    printKOT()
  }

  function checkBday(dob) {
    if (!dob) return false
    const today = toLocalDateStr(new Date())
    return dob.slice(5) === today.slice(5)
  }

  function openCustModal() {
    setCustModalPhone(customerPhone)
    setCustModalName(activeCustomer?.name || '')
    const dobVal = activeCustomer?.dob || ''
    setCustModalDob(dobVal)
    setCustModalDobDisplay(dobVal ? dobVal.split('-').reverse().join('/') : '')
    setCustModalFound(activeCustomer || null)
    const isBday = checkBday(dobVal)
    setCustModalBday(isBday)
    setCustModalBdayDiscount(isBday ? 10 : 0)
    setShowCustModal(true)
    if (!activeCustomer && customerPhone.replace(/\D/g, '').length >= 10) {
      setCustModalSearching(true)
      findCustomerByPhone(customerPhone).then((c) => {
        if (c) {
          setCustModalFound(c); setCustModalName(c.name || ''); setCustModalDob(c.dob || ''); setCustModalDobDisplay(c.dob ? c.dob.split('-').reverse().join('/') : '')
          const bday = checkBday(c.dob)
          setCustModalBday(bday)
          setCustModalBdayDiscount(bday ? 10 : 0)
        }
        setCustModalSearching(false)
      }).catch(() => setCustModalSearching(false))
    }
  }

  async function handleCustModalPhoneChange(val) {
    setCustModalPhone(val)
    const cleaned = val.replace(/\D/g, '').slice(-10)
    if (cleaned.length < 10) { setCustModalFound(null); setCustModalName(''); setCustModalDob(''); setCustModalDobDisplay(''); setCustModalBday(false); setCustModalBdayDiscount(0); return }
    setCustModalSearching(true)
    try {
      const c = await findCustomerByPhone(cleaned)
      if (c) {
        setCustModalFound(c); setCustModalName(c.name || ''); setCustModalDob(c.dob || ''); setCustModalDobDisplay(c.dob ? c.dob.split('-').reverse().join('/') : '')
        const bday = checkBday(c.dob)
        setCustModalBday(bday)
        setCustModalBdayDiscount(bday ? 10 : 0)
      } else { setCustModalFound(null); setCustModalName(''); setCustModalDob(''); setCustModalDobDisplay(''); setCustModalBday(false); setCustModalBdayDiscount(0) }
    } catch { setCustModalFound(null) }
    setCustModalSearching(false)
  }

  async function confirmCustAndBill() {
    if (billingInProgress.current) return
    billingInProgress.current = true
    const birthdayDiscount = custModalBday && custModalBdayDiscount > 0 ? custModalBdayDiscount : 0
    setShowCustModal(false)
    if (birthdayDiscount > 0) {
      setDiscount({ type: 'percent', value: birthdayDiscount })
    }
    const cleanedPhone = custModalPhone.replace(/\D/g, '').slice(-10)
    let linkedId = custModalFound?.id || null
    if (!linkedId && cleanedPhone.length >= 10) {
      const nc = await createQuickCustomer(cleanedPhone, custModalName || 'Customer')
      if (nc) {
        linkedId = nc.id
        if (custModalName.trim() && custModalName !== 'Customer') {
          updateCustomer(nc.id, { name: custModalName.trim(), dob: custModalDob || null }).catch(() => {})
        } else if (custModalDob) {
          updateCustomer(nc.id, { dob: custModalDob }).catch(() => {})
        }
      }
    } else if (linkedId && (custModalName !== custModalFound?.name || custModalDob !== custModalFound?.dob)) {
      const updates = {}
      if (custModalName.trim() && custModalName !== custModalFound?.name) updates.name = custModalName.trim()
      if (custModalDob !== custModalFound?.dob) updates.dob = custModalDob || null
      if (Object.keys(updates).length > 0) updateCustomer(linkedId, updates).catch(() => {})
    }
    await doGenerateBill(linkedId, cleanedPhone)
  }

  async function skipCustAndBill() {
    if (billingInProgress.current) return
    billingInProgress.current = true
    setShowCustModal(false)
    const cleanedPhone = custModalPhone.replace(/\D/g, '').slice(-10)
    let linkedId = custModalFound?.id || null
    if (!linkedId && cleanedPhone.length >= 10) {
      const nc = await createQuickCustomer(cleanedPhone, '')
      if (nc) linkedId = nc.id
    }
    await doGenerateBill(linkedId, cleanedPhone)
  }

  async function doGenerateBill(linkedCustomerId, phoneUsed) {
    printBill()
    let cid = linkedCustomerId || activeCustomer?.id || null
    if (!cid && (phoneUsed || customerPhone).replace(/\D/g, '').length >= 10) {
      const nc = await createQuickCustomer(phoneUsed || customerPhone, '')
      if (nc) cid = nc.id
    }
    addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
      table: selectedTable ? `Table ${selectedTable}` : 'Parcel',
      items: orderItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price, veg: i.veg })),
      subtotal,
      discount: discountAmount,
      gst,
      total,
      payment: paymentMethod ? paymentMethod.toUpperCase() : 'N/A',
      createdAt: new Date().toISOString(),
      ...(cid ? { customerId: cid } : {}),
    }).catch(() => {})
    if (cid) incrementCustomerStats(cid, total).catch(() => {})
    if (loadedKotIds.length > 0) {
      const batch = writeBatch(db)
      let readyDeleted = 0
      loadedKotIds.forEach((kid) => {
        const kotRef = doc(db, 'users', currentUser.uid, 'kots', kid)
        const kotData = kots.find((k) => k.id === kid)
        if (kotData?.status === 'ready') readyDeleted++
        batch.delete(kotRef)
      })
      if (readyDeleted > 0) batch.update(doc(db, 'users', currentUser.uid), { readyCount: increment(-readyDeleted) })
      await batch.commit()
    }
    vibrate(20)
    setOrderComplete(true)
    playPaymentSound()
    setTimeout(() => {
      setOrderComplete(false)
      setOrderItems([])
      setLoadedKotIds([])
      setKotNotes('')
      setDiscount({ type: 'percent', value: 0 })
      setSelectedTable(null)
      setPaymentMethod('')
      setPaymentConfirmed(false)
      setCustomerPhone('')
      setActiveCustomer(null)
      if (selectedTable) {
        setTableAssignments((prev) => {
          const next = { ...prev }
          delete next[selectedTable]
          return next
        })
      }
      billingInProgress.current = false
    }, 2000)
  }

  const generateBill = () => {
    if (orderItems.length === 0 || !paymentConfirmed || billingInProgress.current) return
    billingInProgress.current = true
    const cleaned = customerPhone.replace(/\D/g, '').slice(-10)
    doGenerateBill(activeCustomer?.id || null, cleaned)
  }

  const clearAllReady = async () => {
    const q = query(collection(db, 'users', currentUser.uid, 'kots'), where('status', '==', 'ready'))
    const snap = await getDocs(q)
    if (snap.empty) { setShowKitchenClear(false); return }
    const batch = writeBatch(db)
    snap.docs.forEach((d) => batch.delete(d.ref))
    batch.update(doc(db, 'users', currentUser.uid), { readyCount: increment(-snap.docs.length) })
    await batch.commit()
    setShowKitchenClear(false)
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    const start = parseLocalDate(historyDate).toISOString()
    const end = new Date(parseLocalDate(historyDate).getTime() + 86399999).toISOString()
    const q = query(
      collection(db, 'users', currentUser.uid, 'transactions'),
      where('createdAt', '>=', start),
      where('createdAt', '<=', end),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    setHistoryTxns(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setHistoryLoading(false)
  }

  useEffect(() => { if (showHistory) loadHistory() }, [showHistory, historyDate])

  useEffect(() => {
    if (!showProfileDrop && !showKitchenClear && !showWaiterDrop) return
    const handler = () => { setShowProfileDrop(false); setShowKitchenClear(false); setShowWaiterDrop(false) }
    setTimeout(() => document.addEventListener('click', handler), 0)
    return () => document.removeEventListener('click', handler)
  }, [showProfileDrop, showKitchenClear, showWaiterDrop])

  const exportCSV = () => {
    if (!historyTxns.length) return
    const headers = ['Time', 'Table', 'Items', 'Subtotal', 'Discount', 'GST', 'Total', 'Payment']
    const rows = historyTxns.map((t) => [
      new Date(t.createdAt).toLocaleTimeString('en-IN'),
      t.table,
      t.items.map((i) => `${i.name}x${i.qty}`).join('; '),
      t.subtotal?.toFixed(2),
      t.discount?.toFixed(2),
      t.gst?.toFixed(2),
      t.total?.toFixed(2),
      t.payment,
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${historyDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const historyTotal = historyTxns.reduce((s, t) => s + (t.total || 0), 0)

  const printKOT = () => {
    const kotWindow = window.open('', '_blank', 'width=400,height=700')
    const itemsHTML = orderItems
      .map(
        (item, idx) => `
        <div style="display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px dashed #ddd;">
          <span style="font-size:11px;color:#888;min-width:18px;">${idx + 1}.</span>
          <span style="font-size:14px;">${item.veg ? '🟢' : '🔴'}</span>
          <div style="flex:1;">
            <span style="font-size:14px;font-weight:600;">${item.name}</span>
          </div>
          <span style="font-size:16px;font-weight:bold;min-width:30px;text-align:right;">×${item.qty}</span>
        </div>`
      )
      .join('')

    const notesHTML = kotNotes.trim()
      ? `<div style="margin-top:10px;padding:8px;background:#fffbeb;border:1px dashed #f59e0b;border-radius:4px;">
          <strong style="font-size:11px;color:#b45309;">📝 NOTES:</strong>
          <p style="margin:4px 0 0;font-size:13px;color:#92400e;">${kotNotes.trim()}</p>
        </div>`
      : ''

    kotWindow.document.write(`
      <html><head><title>KOT - ${selectedTable ? 'Table ' + selectedTable : 'Parcel'}</title>
      <style>
        body { font-family: monospace; padding: 20px; max-width: 350px; margin: 0 auto; }
        h1 { text-align: center; font-size: 20px; margin: 0; letter-spacing: 2px; }
        h2 { text-align: center; font-size: 13px; color: #666; margin: 4px 0 10px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
        .info { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px solid #000; font-size: 11px; color: #666; }
      </style></head><body>
        <div class="header">
          <h1>DAAWATDESK</h1>
          <h2>Kitchen Order Ticket</h2>
        </div>
        <div class="info">
          <span style="font-size:16px;"><strong>${selectedTable ? 'Table ' + selectedTable : 'Parcel / Takeaway'}</strong></span>
          <span>${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="info">
          <span>Server: ${currentUser?.displayName || 'N/A'}</span>
        </div>
        <div style="border-top:2px solid #000;margin:8px 0;"></div>
        ${itemsHTML}
        <div style="border-top:2px solid #000;margin:8px 0;"></div>
        <div style="text-align:center;margin-top:6px;">
          <span style="font-size:14px;font-weight:bold;">TOTAL: ${orderItems.reduce((s, i) => s + i.qty, 0)} items</span>
        </div>
        ${notesHTML}
        <div class="footer">
          <p style="font-size:14px;font-weight:bold;">** PREPARE ABOVE ITEMS **</p>
        </div>
      </body></html>`)
    kotWindow.document.close()
    setTimeout(() => { kotWindow.print() }, 500)
  }

  const printBill = () => {
    const billWindow = window.open('', '_blank', 'width=400,height=700')
    const itemsHTML = orderItems
      .map(
        (item) => `
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #ddd;">
          <span>${item.name} x${item.qty}</span>
          <span style="font-weight:600;">₹${(item.price * item.qty).toFixed(2)}</span>
        </div>`
      )
      .join('')

    const discountRow = discountAmount > 0
      ? `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;">
          <span style="color:#16a34a;">Discount (${discount.type === 'percent' ? `${discount.value}%` : `₹${discount.value}`})</span>
          <span style="color:#16a34a;font-weight:600;">-₹${discountAmount.toFixed(2)}</span>
        </div>`
      : ''

    const paymentLabel = paymentMethod === 'card' && cardType ? `CARD (${cardType.toUpperCase()})` : paymentMethod ? paymentMethod.toUpperCase() : 'N/A'

    const restName = userProfile?.restaurant || 'Restaurant'
    const restAddr = userProfile?.address || ''
    const restPhone = userProfile?.phone || ''
    const restLogo = userProfile?.profilePic || ''

    const logoHTML = restLogo ? `<img src="${restLogo}" style="width:50px;height:50px;border-radius:10px;object-fit:cover;margin:0 auto 8px;display:block;" crossorigin="anonymous" />` : ''
    const addrHTML = restAddr ? `<p style="text-align:center;font-size:11px;color:#666;margin:2px 0;">${restAddr}</p>` : ''
    const phoneHTML = restPhone ? `<p style="text-align:center;font-size:11px;color:#666;margin:2px 0;">${restPhone}</p>` : ''

    billWindow.document.write(`
      <html><head><title>Bill - ${selectedTable ? 'Table ' + selectedTable : 'Parcel'}</title>
      <style>
        body { font-family: monospace; padding: 20px; max-width: 350px; margin: 0 auto; }
        h1 { text-align: center; font-size: 22px; margin: 0; letter-spacing: 3px; }
        h2 { text-align: center; font-size: 13px; color: #666; margin: 4px 0 10px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
        .info { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
        .divider-solid { border-top: 2px solid #000; margin: 8px 0; }
        .total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; padding-top: 8px; margin-top: 8px; }
        .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px solid #000; font-size: 11px; color: #666; }
      </style></head><body>
        <div class="header">
          ${logoHTML}
          <h1>${restName}</h1>
          <h2>Restaurant Bill</h2>
          ${addrHTML}
          ${phoneHTML}
        </div>
        <div class="info">
          <span><strong>${selectedTable ? 'Table ' + selectedTable : 'Parcel / Takeaway'}</strong></span>
          <span>${new Date().toLocaleString()}</span>
        </div>
        <div class="info">
          <span>Served by: ${currentUser?.displayName || 'N/A'}</span>
        </div>
        ${activeCustomer && checkBday(activeCustomer.dob) ? `<p style="text-align:center;font-size:15px;font-weight:bold;margin:10px 0;">Happy Birthday, ${activeCustomer.name || 'Dear Customer'}!</p>` : ''}
        <div class="divider"></div>
        ${itemsHTML}
        <div class="divider-solid"></div>
        <div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;">
            <span>Subtotal</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          ${discountRow}
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;">
            <span>CGST (2.5%)</span>
            <span>₹${cgst.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:13px;">
            <span>SGST (2.5%)</span>
            <span>₹${sgst.toFixed(2)}</span>
          </div>
          <div class="total" style="display:flex;justify-content:space-between;">
            <span>TOTAL</span>
            <span>₹${total.toFixed(2)}</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;margin-top:8px;">
          <span><strong>Payment Mode</strong></span>
          <span><strong>${paymentLabel}</strong></span>
        </div>
        <div class="footer">
          <p>Thank you for dining with ${restName}!</p>
          <p>Please visit again.</p>
        </div>
      </body></html>`)
    billWindow.document.close()
    setTimeout(() => { billWindow.print() }, 500)
  }

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB.')
      return
    }
    setUploading(true)
    try {
      await uploadProfilePic(file)
      setShowProfileModal(false)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Error: ' + err.message)
    }
    setUploading(false)
  }

  const handleRemovePic = async () => {
    try {
      await removeProfilePic()
      setShowProfileModal(false)
    } catch (err) {
      alert('Failed to remove profile picture. Please try again.')
    }
  }

  const handleSaveUpi = async () => {
    const val = upiInput.trim()
    if (!val) return
    setUpiSaving(true)
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { upiId: val })
      setUpiId(val)
      setShowUpiModal(false)
    } catch (err) {
      alert('Failed to save UPI ID')
    }
    setUpiSaving(false)
  }

  function addCategory() {
    if (!newCategoryName.trim()) return
    const id = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const updated = [...menuCategories, { id, name: newCategoryName.trim(), icon: newCategoryIcon }]
    setMenuCategories(updated)
    setNewCategoryName('')
    setNewCategoryIcon('Utensils')
    saveMenu(updated, menuItems, tables)
  }

  function updateCategory(id, name, icon) {
    const updated = menuCategories.map((c) => (c.id === id ? { ...c, name, icon } : c))
    setMenuCategories(updated)
    setEditingCategory(null)
    saveMenu(updated, menuItems, tables)
  }

  function deleteCategory(id) {
    const updated = menuCategories.filter((c) => c.id !== id)
    const updatedItems = menuItems.filter((i) => i.category !== id)
    setMenuCategories(updated)
    setMenuItems(updatedItems)
    saveMenu(updated, updatedItems, tables)
  }

  function addSubCategory(catId) {
    if (!newSubCatName.trim()) return
    const subId = catId + '-' + newSubCatName.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const updated = menuCategories.map((c) =>
      c.id === catId ? { ...c, subCategories: [...(c.subCategories || []), { id: subId, name: newSubCatName.trim() }] } : c
    )
    setMenuCategories(updated)
    setNewSubCatName('')
    saveMenu(updated, menuItems, tables)
  }

  function updateSubCategory(catId, subId, newName) {
    const updated = menuCategories.map((c) =>
      c.id === catId ? { ...c, subCategories: (c.subCategories || []).map((s) => (s.id === subId ? { ...s, name: newName } : s)) } : c
    )
    setMenuCategories(updated)
    setEditingSubCat(null)
    saveMenu(updated, menuItems, tables)
  }

  function deleteSubCategory(catId, subId) {
    const updated = menuCategories.map((c) =>
      c.id === catId ? { ...c, subCategories: (c.subCategories || []).filter((s) => s.id !== subId) } : c
    )
    const updatedItems = menuItems.filter((i) => i.subCategory !== subId)
    setMenuCategories(updated)
    setMenuItems(updatedItems)
    saveMenu(updated, updatedItems, tables)
  }

  function addItem_() {
    if (!newItemName.trim() || !newItemPrice) return
    const id = Date.now()
    const newItem = { id, name: newItemName.trim(), category: newItemCategory, subCategory: newItemSubCategory || '', price: Number(newItemPrice), veg: newItemVeg }
    const updated = [...menuItems, newItem]
    setMenuItems(updated)
    setNewItemName('')
    setNewItemPrice('')
    setNewItemSubCategory('')
    saveMenu(menuCategories, updated, tables)
  }

  function updateItem(id, name, price, veg, category, subCategory) {
    const updated = menuItems.map((i) => (i.id === id ? { ...i, name, price: Number(price), veg, category, subCategory } : i))
    setMenuItems(updated)
    setEditingItem(null)
    saveMenu(menuCategories, updated, tables)
  }

  function deleteItem(id) {
    const updated = menuItems.filter((i) => i.id !== id)
    setMenuItems(updated)
    saveMenu(menuCategories, updated, tables)
  }

  function addTable() {
    if (!newTableName.trim()) return
    const id = Date.now()
    const updated = [...tables, { id, name: newTableName.trim(), seats: Number(newTableSeats) }]
    setTables(updated)
    setNewTableName('')
    setNewTableSeats(4)
    saveMenu(menuItems.length ? menuCategories : defaultCategories, menuItems.length ? menuItems : defaultItems, updated)
  }

  function updateTable(id, name, seats) {
    const updated = tables.map((t) => (t.id === id ? { ...t, name, seats: Number(seats) } : t))
    setTables(updated)
    setEditingTable(null)
    saveMenu(menuCategories, menuItems, updated)
  }

  function deleteTable(id) {
    const updated = tables.filter((t) => t.id !== id)
    setTables(updated)
    saveMenu(menuCategories, menuItems, updated)
  }

  const IconComp = (name) => iconComponents[name] || Utensils

  function renderItemRow(item) {
    return (
      <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-2">
        {editingItem === item.id ? (
          <>
            <input type="text" defaultValue={item.name} id={`item-name-${item.id}`} className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="number" inputMode="numeric" defaultValue={item.price} id={`item-price-${item.id}`} className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            <div className="relative">
              <select defaultValue={String(item.veg)} id={`item-veg-${item.id}`} className="appearance-none pr-8 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
                <option value="true">Veg</option>
                <option value="false">Non-Veg</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select defaultValue={item.category} id={`item-cat-${item.id}`} className="appearance-none pr-8 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
                {menuCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {(() => {
              const cat = menuCategories.find((c) => c.id === item.category)
              const subs = cat?.subCategories || []
              if (subs.length === 0) return null
                return (
                <div className="relative">
                  <select defaultValue={item.subCategory || ''} id={`item-sub-${item.id}`} className="appearance-none pr-8 px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
                    <option value="">None</option>
                    {subs.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )
            })()}
            <button
              onClick={() => {
                const name = document.getElementById(`item-name-${item.id}`).value
                const price = document.getElementById(`item-price-${item.id}`).value
                const veg = document.getElementById(`item-veg-${item.id}`).value === 'true'
                const category = document.getElementById(`item-cat-${item.id}`).value
                const subEl = document.getElementById(`item-sub-${item.id}`)
                const subCategory = subEl ? subEl.value : item.subCategory || ''
                updateItem(item.id, name, price, veg, category, subCategory)
              }}
              className="p-2 text-green hover:bg-green/10 rounded-lg"
            >
              <Save className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingItem(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className={`w-3 h-3 rounded-sm border-2 ${item.veg ? 'border-green' : 'border-red-500'}`}>
              <div className={`w-1.5 h-1.5 mx-auto mt-0.5 ${item.veg ? 'bg-green rounded-full' : 'bg-red-500'}`} style={!item.veg ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {}}></div>
            </div>
            <span className="flex-1 font-medium text-sm text-secondary">{item.name}</span>
            <span className="text-sm font-bold text-primary">₹{item.price}</span>
            <button onClick={() => setEditingItem(item.id)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => { if (window.confirm(`Delete "${item.name}"?`)) deleteItem(item.id) }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )
  }

  function resetNewOrder() {
    setNewOrderType('dine-in')
    setNewOrderPax(2)
    setNewOrderPhone('')
    setNewOrderName('')
    setNewOrderDob('')
    setNewOrderDobDisplay('')
    setNewOrderTable(null)
    setNewOrderCustomer(null)
  }

  async function startNewOrder() {
    if (newOrderType === 'dine-in' && !newOrderTable) return

    if (newOrderType === 'parcel') {
      setSelectedTable(null)
    } else {
      setSelectedTable(newOrderTable)
    }

    if (newOrderCustomer) {
      setActiveCustomer(newOrderCustomer)
      setCustomerPhone(newOrderPhone)
      if (checkBday(newOrderCustomer.dob)) {
        setDiscount({ type: 'percent', value: 10 })
      }
    } else if (newOrderPhone.length === 10) {
      setCustomerPhone(newOrderPhone)
      const nc = await createQuickCustomer(newOrderPhone, newOrderName || 'Customer')
      if (nc) {
        setActiveCustomer(nc)
        const updates = {}
        if (newOrderName.trim() && newOrderName !== 'Customer') updates.name = newOrderName.trim()
        if (newOrderDob) updates.dob = newOrderDob
        if (Object.keys(updates).length > 0) updateCustomer(nc.id, updates).catch(() => {})
      }
    }

    setOrderItems([])
    setLoadedKotIds([])
    setKotNotes('')
    setDiscount({ type: 'percent', value: 0 })
    setPaymentMethod('')
    setPaymentConfirmed(false)
    setShowPayment(false)
    setOrderComplete(false)
    freshOrder.current = true

    const assignedTable = newOrderType === 'dine-in' ? newOrderTable : null
    if (assignedTable) {
      setTableAssignments((prev) => ({
        ...prev,
        [assignedTable]: {
          phone: newOrderPhone,
          name: newOrderCustomer?.name || newOrderName || '',
          assignedAt: Date.now(),
        }
      }))
    }

    setShowNewOrderModal(false)
    resetNewOrder()
    vibrate(15)
  }

  return (
    <div className="h-dvh flex flex-col relative">
      <div className="fixed inset-0 bg-[url('/bg-billing.png')] bg-cover bg-center bg-fixed pointer-events-none"></div>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-md pointer-events-none"></div>
      <div className="relative z-10 flex flex-col h-dvh">
      <header className="bg-white/90 border-b border-gray-200/60 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-[85]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-gray-500 hover:text-primary transition-all duration-200 active:scale-90 group">
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="text-sm font-medium hidden sm:inline group-hover:font-bold min-w-[5rem] text-center">Dashboard</span>
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <img src="/logo-app.png" alt="DaawatDesk" className="w-9 h-9 rounded-xl flex-shrink-0 object-contain" />
          <h1 className="text-xl font-extrabold text-secondary tracking-tight">
            <span className="bg-gradient-to-r from-primary to-orange bg-clip-text text-transparent">DaawatDesk</span>
            <span className="text-gray-400 font-medium ml-1">POS</span>
          </h1>
          {userProfile?.restaurantCode && (
            <button
              onClick={() => { navigator.clipboard.writeText(userProfile.restaurantCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 1500) }}
              className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-2 sm:px-2.5 py-1 rounded-lg text-sm font-mono font-bold tracking-wider transition-colors"
              title="Click to copy kitchen code"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{codeCopied ? 'Copied!' : userProfile.restaurantCode}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-primary to-orange text-white px-3 py-2 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Order</span>
          </button>
          <button onClick={() => setShowTableModal(true)} className="flex items-center gap-1.5 bg-surface hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">{selectedTable ? `Table ${selectedTable}` : 'Parcel'}</span>
          </button>
          <button onClick={() => setShowMergeSplit(true)} className="hidden sm:flex items-center gap-1.5 bg-surface hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            Merge / Split
          </button>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowKitchenClear(!showKitchenClear); setShowProfileDrop(false); setShowWaiterDrop(false) }} className="relative flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <ChefHat className="w-4 h-4" />
              <span className="hidden sm:inline">Kitchen</span>
              {readyCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">{readyCount}</span>
              )}
            </button>
            {showKitchenClear && (
              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-48 py-1">
                <button onClick={() => { setShowKitchenClear(false); navigate('/kitchen') }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <ChefHat className="w-4 h-4" /> View Kitchen
                </button>
                <button onClick={clearAllReady} disabled={readyCount === 0} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <Trash2 className="w-4 h-4" /> Clear All Ready
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setShowWaiterDrop(!showWaiterDrop); setShowProfileDrop(false); setShowKitchenClear(false) }} className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${waiterAlerts.length > 0 ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 animate-pulse' : 'bg-surface hover:bg-gray-200'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Waiter
              {waiterAlerts.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{waiterAlerts.length}</span>
              )}
            </button>
            {showWaiterDrop && (
              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-64 py-1 max-h-80 overflow-y-auto">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Waiter Requests</p>
                  {waiterAlerts.length > 0 && (
                    <span className="text-xs text-gray-400">{waiterAlerts.length} pending</span>
                  )}
                </div>
                {waiterAlerts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No pending requests</p>
                ) : (
                  waiterAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{alert.table}</p>
                          <p className="text-xs text-gray-400">{alert.message || 'Requesting assistance'}</p>
                        </div>
                      </div>
                      <button onClick={() => dismissWaiterAlert(alert.id)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {currentUser && (
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setShowProfileDrop(!showProfileDrop); setShowKitchenClear(false); setShowWaiterDrop(false) }} className="flex items-center gap-2 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                  {(userProfile?.profilePic || currentUser.photoURL) ? (
                    <img src={userProfile?.profilePic || currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{(currentUser.displayName || currentUser.email || '?')[0].toUpperCase()}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-secondary hidden sm:inline">{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {showProfileDrop && (
                <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 py-1">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-secondary truncate">{currentUser.displayName || currentUser.email}</p>
                  </div>
                  <button onClick={() => { setShowProfileDrop(false); setShowProfileModal(true) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button onClick={() => { setShowProfileDrop(false); setShowMenuManager(true) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4" /> Manage Menu
                  </button>
                  <button onClick={() => { setShowProfileDrop(false); setShowHistory(true) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <History className="w-4 h-4" /> Transaction History
                  </button>
                  <button onClick={() => { setShowProfileDrop(false); setUpiInput(upiId || ''); setShowUpiModal(true) }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <QrCode className="w-4 h-4" /> UPI Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button onClick={async () => { setShowProfileDrop(false); await logout(); navigate('/login') }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {waiterAlerts.filter((a) => !a.popupDismissed).map((alert) => (
          <div
            key={alert.id}
            className="pointer-events-auto bg-gradient-to-r from-blue to-indigo-500 text-white rounded-2xl shadow-2xl animate-slide-in-right overflow-hidden min-w-[300px]"
          >
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base">Waiter Help!</p>
                <p className="text-sm text-white/90 mt-0.5">
                  <span className="font-bold">{alert.table}</span> is requesting help
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismissWaiterAlert(alert.id) }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="h-1.5 bg-white/20">
              <div className="h-full bg-white/60 rounded-full" style={{ animation: 'shrink 5s linear forwards' }}></div>
            </div>
          </div>
        ))}
        {readyAlerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => dismissReadyAlert(alert.id)}
            className="pointer-events-auto bg-green text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 cursor-pointer animate-slide-in-right"
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Order Ready!</p>
              <p className="text-xs opacity-90">Table {alert.table} — serve now</p>
            </div>
          </div>
        ))}
        {qrPayments.map((payment) => (
          <div
            key={payment.id}
            onClick={() => dismissQrPayment(payment.id)}
            className="pointer-events-auto bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer animate-slide-in-right border border-emerald-400/40"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shrink-0">
              💳
            </div>
            <div>
              <p className="font-extrabold text-sm flex items-center gap-1.5">
                <span>Payment Received!</span>
                <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">{payment.payment || 'UPI'}</span>
              </p>
              <p className="text-xs opacity-95 mt-0.5">
                <strong className="font-bold">{payment.table}</strong> paid <strong className="font-bold">₹{payment.total}</strong> ({payment.customerName})
              </p>
            </div>
            <button className="text-white/60 hover:text-white p-1 text-xs font-bold">✕</button>
          </div>
        ))}
      </div>

      {orderComplete && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-10 text-center animate-fade-up">
            <div className="w-20 h-20 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green" />
            </div>
            <h2 className="text-2xl font-bold text-secondary mb-2">Payment Successful!</h2>
            <p className="text-text-secondary">Order completed. Ready for next customer.</p>
          </div>
        </div>
      )}

      {kotGenerated && (
        <div className="fixed top-20 right-4 bg-green text-white px-6 py-3 rounded-xl shadow-lg z-[100] animate-fade-up">
          <p className="font-semibold">KOT Generated & Sent to Kitchen!</p>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-up">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-purple" />
                <h2 className="text-lg font-bold text-secondary">Transaction History</h2>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="relative flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <button onClick={() => { const d = parseLocalDate(historyDate); d.setDate(d.getDate() - 1); setHistoryDate(toLocalDateStr(d)) }} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => setHistoryDate(toLocalDateStr(new Date()))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${historyDate === toLocalDateStr(new Date()) ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-primary/10 hover:text-primary hover:border-primary/30'}`}>
                  Today
                </button>
                <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg min-w-[180px] text-center">
                  <p className="text-sm font-bold text-secondary">{new Date(historyDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <button onClick={() => { const d = parseLocalDate(historyDate); d.setDate(d.getDate() + 1); setHistoryDate(toLocalDateStr(d)) }} disabled={historyDate === toLocalDateStr(new Date())} className={`p-1.5 rounded-lg transition-colors ${historyDate === toLocalDateStr(new Date()) ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-200'}`}>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => { setShowCalDrop(!showCalDrop); setCalMonth({ month: new Date(historyDate + 'T00:00:00').getMonth(), year: new Date(historyDate + 'T00:00:00').getFullYear() }) }} className={`p-1.5 rounded-lg transition-colors ${showCalDrop ? 'bg-primary/10 text-primary' : 'hover:bg-gray-200 text-gray-500'}`}>
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
              <button onClick={exportCSV} disabled={!historyTxns.length} className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-green/10 text-green rounded-lg text-sm font-medium hover:bg-green/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                <Download className="w-4 h-4" /> Export CSV
              </button>

              {showCalDrop && (
                <>
                  <div className="fixed inset-0 z-[99]" onClick={() => setShowCalDrop(false)} />
                  <div className="absolute top-full left-5 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-[100] w-[320px] animate-fade-up">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setCalMonth((p) => p.month === 0 ? { month: 11, year: p.year - 1 } : { month: p.month - 1, year: p.year })} className="p-1 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-4 h-4" /></button>
                      <p className="text-sm font-bold text-secondary">{new Date(calMonth.year, calMonth.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                      {(() => { const now = new Date(); const atMax = calMonth.year === now.getFullYear() && calMonth.month === now.getMonth(); return (
                        <button onClick={() => !atMax && setCalMonth((p) => p.month === 11 ? { month: 0, year: p.year + 1 } : { month: p.month + 1, year: p.year })} disabled={atMax} className={`p-1 rounded-lg ${atMax ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-100'}`}><ChevronRight className="w-4 h-4" /></button>
                      )})()}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {['S','M','T','W','T','F','S'].map((d, i) => (
                        <div key={i} className="text-[10px] font-bold text-gray-400 text-center py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {(() => {
                        const firstDay = new Date(calMonth.year, calMonth.month, 1).getDay()
                        const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate()
                        const today = toLocalDateStr(new Date())
                        const now = new Date()
                        const todayObj = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                        const cells = []
                        for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />)
                        for (let d = 1; d <= daysInMonth; d++) {
                          const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                          const isSelected = dateStr === historyDate
                          const isToday = dateStr === today
                          const isFuture = new Date(calMonth.year, calMonth.month, d) > todayObj
                          cells.push(
                            <button key={d} onClick={() => { if (!isFuture) { setHistoryDate(dateStr); setShowCalDrop(false) } }} disabled={isFuture}
                              className={`relative py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isSelected ? 'bg-primary text-white font-bold shadow-md' : isToday ? 'bg-primary/10 text-primary font-bold' : isFuture ? 'text-gray-200 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'
                              }`}>
                              {d}
                              {isToday && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></span>}
                            </button>
                          )
                        }
                        return cells
                      })()}
                    </div>
                    <div className="border-t border-gray-100 mt-3 pt-3 flex gap-1.5 flex-wrap">
                      {[
                        { label: 'Yesterday', offset: -1 },
                        { label: 'Last 7 days', offset: -6 },
                        { label: 'Last 30 days', offset: -29 },
                      ].map(({ label, offset }) => (
                        <button key={label} onClick={() => { const d = new Date(); d.setDate(d.getDate() + offset); setHistoryDate(toLocalDateStr(d)); setShowCalDrop(false) }}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-primary/10 hover:text-primary text-[10px] font-semibold text-gray-500 rounded-full transition-colors">
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {historyLoading ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : historyTxns.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No transactions on this date</p>
              ) : (
                <div className="space-y-2">
                  {historyTxns.map((t) => {
                    const isExpanded = expandedTxnId === t.id
                    const subtotal = t.subtotal || t.items.reduce((s, i) => s + i.price * i.qty, 0)
                    const gst = t.gst || Number((subtotal * 0.05).toFixed(2))
                    return (
                      <div key={t.id} className={`rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? 'bg-white border border-primary/20 shadow-md' : 'bg-gray-50 hover:bg-gray-100 cursor-pointer'}`}>
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer"
                          onClick={() => setExpandedTxnId(isExpanded ? null : t.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                              {new Date(t.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-secondary">{t.table}</p>
                              {!isExpanded && (
                                <p className="text-xs text-gray-400 max-w-[200px] truncate">{t.items.map((i) => `${i.name}x${i.qty}`).join(', ')}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-sm font-bold text-secondary">₹{t.total?.toFixed(2)}</p>
                              <p className="text-[10px] text-gray-400">{t.payment}</p>
                            </div>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 animate-fade-up">
                            <div className="border-t border-gray-100 pt-3 space-y-1.5">
                              {t.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-sm border flex-shrink-0 ${item.veg !== false ? 'border-green' : 'border-red-500'}`}>
                                      <span className={`block w-1 h-1 mx-auto mt-[1px] ${item.veg !== false ? 'bg-green rounded-full' : 'bg-red-500'}`} style={item.veg === false ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {}}></span>
                                    </span>
                                    <span className="text-gray-700">{item.name}</span>
                                    <span className="text-gray-400 text-xs">×{item.qty}</span>
                                  </div>
                                  <span className="font-semibold text-gray-700">₹{(item.price * item.qty).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="border-t border-dashed border-gray-200 mt-3 pt-2.5 space-y-1">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>CGST (2.5%)</span>
                                <span>₹{(gst / 2).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>SGST (2.5%)</span>
                                <span>₹{(gst / 2).toFixed(2)}</span>
                              </div>
                              {t.discount > 0 && (
                                <div className="flex justify-between text-xs text-green">
                                  <span>Discount</span>
                                  <span>-₹{t.discount.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-bold text-secondary pt-1 border-t border-gray-100">
                                <span>Total</span>
                                <span>₹{t.total?.toFixed(2)}</span>
                              </div>
                            </div>
                            {(t.customerName || t.customerId) && (
                              <div className="mt-2.5 flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5">
                                <span className="text-[10px] font-semibold text-blue-600">👤 {t.customerName || 'Guest'}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {historyTxns.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <span className="text-sm text-gray-500">{historyTxns.length} transactions</span>
                <span className="text-sm font-bold text-secondary">Total: ₹{historyTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {allPendingKots.length > 0 && (
        <div className="bg-gradient-to-r from-secondary via-secondary to-gray-800 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">Pending Orders</span>
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">{allPendingKots.length}</span>
            </div>
            <span className="text-[10px] text-white/40">tap to load & pay</span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {Array.from(
              allPendingKots.reduce((map, kot) => {
                const tbl = kot.table || 'Unknown'
                if (!map.has(tbl)) map.set(tbl, [])
                map.get(tbl).push(kot)
                return map
              }, new Map())
            ).map(([table, kots]) => {
              const allItems = kots.reduce((s, k) => s + k.items.length, 0)
              const tableTotal = kots.reduce((s, k) => s + k.items.reduce((s2, i) => s2 + i.price * i.qty, 0), 0)
              const statusOrder = { pending: 0, preparing: 1, ready: 2 }
              const worstKot = kots.reduce((w, k) => statusOrder[k.status] > statusOrder[w.status] ? k : w, kots[0])
              const isPaid = kots.some((k) => k.paid || k.paymentStatus === 'paid')
              const statusStyles = isPaid
                ? { dot: 'bg-emerald-400 shadow-emerald-400/50 animate-pulse', border: 'border-emerald-400/40 hover:border-emerald-400/80', badge: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40', label: worstKot.status === 'ready' ? 'Ready · PAID 🟢' : `${worstKot.status === 'pending' ? 'Pending' : 'Cooking'} · PAID 🟢` }
                : worstKot.status === 'pending'
                  ? { dot: 'bg-yellow-400 shadow-yellow-400/50', border: 'border-yellow-400/30 hover:border-yellow-400/60', badge: 'bg-yellow-400/20 text-yellow-300', label: 'Pending' }
                  : worstKot.status === 'preparing'
                    ? { dot: 'bg-blue shadow-blue/50', border: 'border-blue/30 hover:border-blue/60', badge: 'bg-blue/20 text-blue', label: 'Cooking' }
                    : { dot: 'bg-green shadow-green/50', border: 'border-green/30 hover:border-green/60', badge: 'bg-green/20 text-green', label: 'Ready' }
              const earliestKot = kots.reduce((e, k) => new Date(k.createdAt) < new Date(e.createdAt) ? k : e, kots[0])
              const elapsed = getElapsed(earliestKot.createdAt)
              return (
                <button
                  key={table}
                  onClick={() => {
                    const tbl = table.replace('Table ', '')
                    const clickedTable = /^\d+$/.test(tbl) ? tbl : null
                    const isDifferentTable = selectedTable && clickedTable !== selectedTable
                    if (isDifferentTable) {
                      setOrderItems([])
                      setLoadedKotIds([])
                      setKotNotes('')
                      setDiscount({ type: 'percent', value: 0 })
                      setPaymentMethod('')
                      setPaymentConfirmed(false)
                    }
                    setSelectedTable(clickedTable)
                    setOrderItems((prev) => {
                      const merged = [...prev]
                      kots.forEach((kot) => {
                        if (loadedKotIds.includes(kot.id)) return
                        kot.items.forEach((item) => {
                          const existing = merged.find((i) => i.name === item.name && i.price === item.price)
                          if (existing) existing.qty += item.qty
                          else merged.push({ ...item, id: Date.now() + Math.random() })
                        })
                      })
                      return merged
                    })
                    setLoadedKotIds((prev) => {
                      const ids = kots.map((k) => k.id)
                      return [...new Set([...prev, ...ids])]
                    })
                    const allNotes = kots.map((k) => k.notes).filter(Boolean).join('; ')
                    setKotNotes(allNotes)
                    if (isPaid) {
                      const paidKot = kots.find((k) => k.paid || k.paymentStatus === 'paid')
                      setPaymentConfirmed(true)
                      setPaymentMethod((paidKot?.payment || 'upi').toLowerCase())
                    } else {
                      setPaymentConfirmed(false)
                      setPaymentMethod('')
                    }
                    freshOrder.current = false
                    setShowCart(true)
                  }}
                  className={`flex-shrink-0 flex items-center gap-3 bg-white/5 hover:bg-white/10 border ${statusStyles.border} rounded-xl px-4 py-2.5 transition-all text-left group active:scale-95`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${statusStyles.dot} shadow-lg flex-shrink-0`}></div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{table}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${statusStyles.badge}`}>{statusStyles.label}</span>
                      {kots.length > 1 && <span className="text-[9px] text-white/40 font-medium">{kots.length} KOTs</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-white/50">{allItems} items</span>
                      <span className="text-[11px] text-white/30">·</span>
                      <span className="text-[11px] text-white/50">{elapsed.mins > 0 ? `${elapsed.mins}m ago` : `${elapsed.secs}s ago`}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <span className="text-sm font-bold text-white">₹{tableTotal.toFixed(0)}</span>
                    <span className="text-[9px] text-white/30 group-hover:text-white/60 transition-colors">load →</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-2 mt-3 h-7">
              <button
                onClick={() => setVegFilter(vegFilter === 'veg' ? 'all' : 'veg')}
                className={`relative w-12 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${vegFilter === 'veg' ? 'bg-green' : 'bg-gray-300'}`}
              >
                <span
                  className="absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow-md transition-all duration-300"
                  style={{ left: vegFilter === 'veg' ? '23px' : '3px' }}
                ></span>
              </button>
              <span className="w-3 h-3 rounded-sm border-[1.5px] border-green flex items-center justify-center flex-shrink-0"><span className="w-1 h-1 bg-green rounded-full"></span></span>
              <span className="text-xs font-bold text-green">Veg Only</span>
            </div>
          </div>

          <div className="flex gap-2 p-4 bg-white border-b border-gray-200 overflow-x-auto">
            {menuCategories.map((cat) => {
              const IC = IconComp(cat.icon)
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setActiveSubCategory(null); setSearchQuery('') }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat.id && !searchQuery
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <IC className="w-4 h-4" />
                  {cat.name}
                </button>
              )
            })}
          </div>

          {(() => {
            const currentCat = menuCategories.find((c) => c.id === activeCategory)
            const subs = currentCat?.subCategories || []
            if (subs.length === 0 || searchQuery) return null
            return (
              <div className="flex gap-1.5 px-4 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setActiveSubCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    !activeSubCategory
                      ? 'bg-secondary text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  All
                </button>
                {subs.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setActiveSubCategory(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      activeSubCategory === sub.id
                        ? 'bg-secondary text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )
          })()}

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const inOrder = orderItems.find((i) => i.id === item.id)
                return (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className={`relative bg-white rounded-xl p-4 text-left border-2 transition-all duration-200 hover:shadow-md active:scale-[0.96] ${
                      inOrder ? 'border-primary shadow-sm shadow-primary/10' : 'border-transparent hover:border-gray-200'
                    }`}
                  >
                    {inOrder && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {inOrder.qty}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <div className={`w-3 h-3 rounded-sm border-2 ${item.veg ? 'border-green' : 'border-red-500'}`}>
                        <div className={`w-1.5 h-1.5 mx-auto mt-0.5 ${item.veg ? 'bg-green rounded-full' : 'bg-red-500'}`} style={!item.veg ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {}}></div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedDetailItem(item) }}
                        className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title="View Details & Ingredients"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-semibold text-sm text-secondary mb-1 leading-tight">{item.name}</p>
                    <p className="text-primary font-bold">₹{item.price}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className={`${showCart ? 'fixed inset-0 z-[80] flex flex-col' : 'hidden'} lg:relative lg:flex lg:w-[420px] lg:border-l bg-white border-l border-gray-200 flex-col`}>
          <button onClick={() => setShowCart(false)} className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
            <span>Cart</span>
            <X className="w-5 h-5" />
          </button>
          {selectedTable && (
            <div className="px-4 py-2 bg-primary/5 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Table {selectedTable}</span>
              <button onClick={() => {
                if (orderItems.length > 0) setTableOrders((prev) => ({ ...prev, [selectedTable]: { items: orderItems, discount } }))
                setSelectedTable(null)
                setOrderItems([])
                setLoadedKotIds([])
                setKotNotes('')
                setDiscount({ type: 'percent', value: 0 })
                setPaymentConfirmed(false)
                setPaymentMethod('')
              }} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          )}

          {selectedTable && activeKots.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="px-4 py-2 bg-orange-50 flex items-center justify-between">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Active Orders — Table {selectedTable}</span>
                <span className="text-xs font-semibold text-orange-500">₹{activeKotsTotal.toFixed(2)}</span>
              </div>
              <div className="px-4 py-2 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {activeKots.map((kot) => {
                  const kotTotal = kot.items.reduce((s, i) => s + i.price * i.qty, 0)
                  const statusColor = kot.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : kot.status === 'preparing' ? 'bg-blue/10 text-blue' : 'bg-green/10 text-green'
                  return (
                    <div key={kot.id} className="flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-xl text-sm">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor}`}>{kot.status}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary truncate">{kot.items.map((i) => i.name).join(', ')}</p>
                        <p className="text-[10px] text-gray-400">{kot.items.length} items • {new Date(kot.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="font-bold text-secondary whitespace-nowrap">₹{kotTotal.toFixed(0)}</span>
                      <button onClick={() => loadKOT(kot)} className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-colors whitespace-nowrap">Load</button>
                    </div>
                  )
                })}
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 text-center">Tap Load to add KOT items to current order</p>
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg text-secondary">Current Order</h2>
            </div>
            <span className="text-sm text-gray-500">{orderItems.length} items</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
                <p className="font-medium">No items in order</p>
                <p className="text-sm">Click "New Order" to start</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-sm border-[1.5px] ${item.veg ? 'border-green' : 'border-red-500'}`}>
                          <div className={`w-1 h-1 mx-auto mt-[1px] ${item.veg ? 'bg-green rounded-full' : 'bg-red-500'}`} style={!item.veg ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {}}></div>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-secondary">{item.name}</p>
                          <p className="text-xs text-gray-500">₹{item.price} each</p>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-secondary">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-bold text-secondary">₹{item.price * item.qty}</p>
                    </div>
                  </div>
                ))}
                {activeCustomer && (
                  <div className="px-4 py-3 bg-primary/[0.03] rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-green/10 rounded-lg flex items-center justify-center"><Check className="w-3.5 h-3.5 text-green" /></div>
                        <span className="text-xs font-bold text-green uppercase tracking-wider">Customer</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 mt-2 bg-green/5 border border-green/20 rounded-xl">
                      <span className="text-sm font-bold text-green truncate">{activeCustomer.name || activeCustomer.phone}</span>
                      {activeCustomer.phone && <span className="text-xs text-gray-400">{activeCustomer.phone}</span>}
                      {checkBday(activeCustomer.dob) && (
                        <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-[10px] font-bold rounded-full">Birthday!</span>
                      )}
                    </div>
                    {checkBday(activeCustomer.dob) && (
                      <div className="flex items-center gap-1.5 px-3 py-2 mt-2 bg-pink-50 border border-pink-100 rounded-xl">
                        <span className="text-[11px] text-pink-600 font-semibold mr-1">Birthday discount:</span>
                        {[0, 5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setDiscount({ type: 'percent', value: pct })}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              (pct === 0 && discount.value === 0 && discount.type === 'percent') || (pct > 0 && discount.value === pct && discount.type === 'percent')
                                ? 'bg-pink-500 text-white border-pink-500'
                                : 'bg-white text-pink-600 border-pink-200 hover:border-pink-400'
                            }`}
                          >
                            {pct === 0 ? 'None' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!showDiscount ? (
                  <button onClick={() => setShowDiscount(true)} className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors">
                    <Percent className="w-4 h-4" />
                    Apply Discount
                  </button>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-secondary">Discount</span>
                      <button onClick={() => { setShowDiscount(false); setDiscount({ type: 'percent', value: 0 }) }}>
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setDiscount((d) => ({ ...d, type: 'percent' }))} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${discount.type === 'percent' ? 'bg-primary text-white' : 'bg-white border border-gray-300'}`}>
                        % Percent
                      </button>
                      <button onClick={() => setDiscount((d) => ({ ...d, type: 'flat' }))} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${discount.type === 'flat' ? 'bg-primary text-white' : 'bg-white border border-gray-300'}`}>
                        ₹ Flat
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder={discount.type === 'percent' ? 'e.g. 10' : 'e.g. 50'}
                        value={discount.value || ''}
                        onChange={(e) => setDiscount((d) => ({ ...d, value: Number(e.target.value) }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button onClick={() => setShowDiscount(false)} className="bg-green text-white px-4 py-2 rounded-lg text-sm font-semibold">Apply</button>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green font-medium">Discount ({discount.type === 'percent' ? `${discount.value}%` : `₹${discount.value}`})</span>
                      <span className="text-green font-medium">-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">CGST (2.5%)</span>
                    <span className="font-medium">₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">SGST (2.5%)</span>
                    <span className="font-medium">₹{sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Total</span>
                    <span className="text-primary">₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="ORDER NOTES (OPTIONAL)"
                  value={kotNotes}
                  onChange={(e) => setKotNotes(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50 uppercase tracking-wide"
                />
                <button onClick={generateKOT} disabled={orderItems.length === 0} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-secondary to-gray-800 text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-gray-300/50 transition-all duration-200 active:scale-[0.97]">
                  <ChefHat className="w-4 h-4" />
                  Generate KOT
                </button>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setPaymentMethod('cash'); setShowPayment(true) }} disabled={orderItems.length === 0 || paymentConfirmed} className="flex flex-col items-center gap-1 py-3 bg-green/10 text-green font-medium rounded-xl disabled:opacity-40 hover:bg-green/20 transition-all duration-200 active:scale-95">
                    <Banknote className="w-5 h-5" />
                    <span className="text-xs">Cash</span>
                  </button>
                  <button onClick={() => { setPaymentMethod('upi'); setPaymentConfirmed(true); setShowUpiQr(true) }} disabled={orderItems.length === 0 || paymentConfirmed} className="flex flex-col items-center gap-1 py-3 bg-blue/10 text-blue font-medium rounded-xl disabled:opacity-40 hover:bg-blue/20 transition-all duration-200 active:scale-95">
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs">UPI</span>
                  </button>
                  <button onClick={() => { setPaymentMethod('card'); setShowPayment(true) }} disabled={orderItems.length === 0 || paymentConfirmed} className="flex flex-col items-center gap-1 py-3 bg-purple/10 text-purple font-medium rounded-xl disabled:opacity-40 hover:bg-purple/20 transition-all duration-200 active:scale-95">
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Card</span>
                  </button>
                </div>
                <button onClick={generateBill} disabled={orderItems.length === 0 || !paymentConfirmed} className={`w-full flex items-center justify-center gap-2 py-3 font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] ${paymentConfirmed ? 'bg-gradient-to-r from-green to-emerald-500 text-white hover:shadow-lg hover:shadow-green/25' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  <Receipt className="w-4 h-4" />
                  {paymentConfirmed ? 'Generate Bill' : 'Complete Payment First'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {orderItems.length > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-6 right-6 z-[70] bg-gradient-to-br from-primary to-orange text-white w-14 h-14 rounded-full shadow-xl shadow-primary/30 flex items-center justify-center active:scale-90 transition-all duration-200 hover:shadow-2xl hover:shadow-primary/40"
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {orderItems.reduce((s, i) => s + i.qty, 0)}
          </span>
        </button>
      )}

      {/* Table Selection Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-up">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-secondary">Select Table</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{tables.length} tables · {tables.filter((t) => isTableOccupied(t.id)).length} occupied</p>
                </div>
                <button onClick={() => setShowTableModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {/* Legend */}
              <div className="flex gap-4 text-[11px] text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green"></span>Free</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange"></span>Seated</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span>Ordered</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary"></span>Selected</span>
              </div>
            </div>

            {/* Scrollable Tables Grid */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
              <div className="grid grid-cols-3 gap-3">
                {/* Parcel / Takeaway Button */}
                <button
                  onClick={() => { setNewOrderType('parcel'); setShowNewOrderModal(true); setShowTableModal(false) }}
                  className={`relative p-4 rounded-2xl text-center border-2 transition-all col-span-3 ${
                    !selectedTable
                      ? 'border-green bg-green/5 shadow-sm shadow-green/10'
                      : 'border-gray-200 hover:border-green/40 hover:bg-green/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!selectedTable ? 'bg-green/10' : 'bg-gray-100'}`}>
                      <ShoppingBag className={`w-5 h-5 ${!selectedTable ? 'text-green' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-bold text-sm ${!selectedTable ? 'text-green' : 'text-secondary'}`}>Parcel / Takeaway</p>
                      <p className="text-[11px] text-gray-400">Quick order — no table</p>
                    </div>
                  </div>
                  {!selectedTable && <span className="absolute top-2 right-2 w-5 h-5 bg-green rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></span>}
                </button>

                {/* Table Cards */}
                {tables.map((table) => {
                  const hasOrder = getTableItemCount(table.id) > 0
                  const occupied = isTableOccupied(table.id)
                  const isSelected = selectedTable === table.id
                  const assignment = getTableAssignment(table.id)
                  const hasKot = hasKotForTable(table.id)
                  const elapsedMs = assignment ? Date.now() - assignment.assignedAt : 0
                  const elapsedMins = Math.floor(elapsedMs / 60000)
                  const remainingMins = Math.max(0, 30 - elapsedMins)
                  const canRelease = assignment && !hasKot
                  return (
                    <div key={table.id} className="space-y-1.5">
                      <button
                        onClick={() => switchTable(table.id)}
                        className={`w-full p-3.5 rounded-2xl text-center border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                            : occupied
                              ? 'border-orange/30 bg-orange/5 hover:border-primary/40 hover:bg-primary/5'
                              : hasOrder
                                ? 'border-blue/30 bg-blue/5 hover:border-primary/40 hover:bg-primary/5'
                                : 'border-gray-200 hover:border-primary/40 hover:bg-primary/5'
                        }`}
                      >
                        <p className={`font-bold text-xl ${isSelected ? 'text-primary' : occupied ? 'text-orange' : hasOrder ? 'text-blue' : 'text-secondary'}`}>
                          {table.name?.replace('Table ', '') || table.id}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{table.seats} seats</p>
                        {occupied && assignment && hasKot && (
                          <p className="text-[10px] font-bold text-orange mt-1">Busy — ordered</p>
                        )}
                        {occupied && assignment && !hasKot && (
                          <p className="text-[10px] font-semibold text-orange mt-1">Seated · {remainingMins}m left</p>
                        )}
                        {occupied && !assignment && hasOrder && (
                          <p className="text-[10px] font-bold text-orange mt-1">₹{getTableTotal(table.id)}</p>
                        )}
                        {!occupied && hasOrder && (
                          <p className="text-[10px] font-semibold text-blue mt-1">{getTableItemCount(table.id)} items · ₹{getTableTotal(table.id)}</p>
                        )}
                        {!occupied && !hasOrder && (
                          <p className="text-[10px] text-green font-medium mt-1">Available</p>
                        )}
                        {isSelected && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></span>}
                      </button>
                      <div className="flex gap-1.5">
                        {canRelease && (
                          <button
                            onClick={(e) => { e.stopPropagation(); releaseTable(table.id) }}
                            className="flex-1 py-2 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 transition-all flex items-center justify-center gap-1 text-[11px] font-medium"
                          >
                            <X className="w-3 h-3" />
                            Release
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setQrTableName(table.name || `Table ${table.id}`); setQrTableNum(String(table.id)); setShowQrModal(true) }}
                          className={`${canRelease ? 'flex-1' : 'w-full'} py-2 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 text-[11px] font-medium`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          QR Code
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge/Split Modal */}
      {showMergeSplit && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-secondary">Merge / Split Tables</h3>
              <button onClick={() => { setShowMergeSplit(false); setSelectedTablesForMerge([]); setSplitItemTargets({}) }}><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            <div className="flex gap-2 mb-5">
              <button onClick={() => setMergeSplitTab('merge')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${mergeSplitTab === 'merge' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Merge Tables
              </button>
              <button onClick={() => setMergeSplitTab('split')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${mergeSplitTab === 'split' ? 'bg-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Split Bill
              </button>
              <button onClick={() => setMergeSplitTab('transfer')} className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${mergeSplitTab === 'transfer' ? 'bg-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Transfer Items
              </button>
            </div>

            {mergeSplitTab === 'merge' && (
              <>
                <p className="text-sm text-gray-500 mb-3">Select tables to merge their orders into one bill:</p>
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {tables.map((table) => {
                    const count = getTableItemCount(table.id)
                    return (
                      <button
                        key={table.id}
                        onClick={() => toggleMergeTable(table.id)}
                        className={`p-3 rounded-xl text-center border-2 transition-all ${
                          selectedTablesForMerge.includes(table.id)
                            ? 'border-primary bg-primary/10 text-primary'
                            : count > 0 ? 'border-orange-200 bg-orange-50 hover:border-primary/50' : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        <p className="font-bold text-sm">{table.name?.replace('Table ', '') || table.id}</p>
                        {count > 0 ? (
                          <p className="text-[10px] text-orange-600 font-medium">{count} items · ₹{getTableTotal(table.id)}</p>
                        ) : (
                          <p className="text-[10px] text-gray-400">Empty</p>
                        )}
                      </button>
                    )
                  })}
                </div>
                {selectedTablesForMerge.length >= 2 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-4 text-sm text-primary">
                    Merging {selectedTablesForMerge.length} tables — Total: ₹{selectedTablesForMerge.reduce((s, tId) => s + getTableTotal(tId), 0).toFixed(2)}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => { setShowMergeSplit(false); setSelectedTablesForMerge([]) }} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={executeMerge} disabled={selectedTablesForMerge.length < 2} className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${selectedTablesForMerge.length >= 2 ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    Merge ({selectedTablesForMerge.length})
                  </button>
                </div>
              </>
            )}

            {mergeSplitTab === 'split' && (
              <>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="font-medium">No items in current order</p>
                    <p className="text-sm mt-1">Add items to split the bill</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-3">Split the bill equally among guests:</p>
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-gray-600">Number of people</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100">-</button>
                          <span className="text-2xl font-bold text-primary w-10 text-center">{splitCount}</span>
                          <button onClick={() => setSplitCount(splitCount + 1)} className="w-8 h-8 rounded-lg bg-white border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-100">+</button>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Total Bill</span>
                          <span className="font-bold">₹{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <span className="text-secondary">Per Person</span>
                          <span className="text-primary">₹{(total / splitCount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowMergeSplit(false) }} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                      <button onClick={executeSplitEvenly} className="flex-1 py-3 bg-blue text-white rounded-xl font-semibold hover:bg-blue/90">
                        Show Split ({splitCount} ways)
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {mergeSplitTab === 'transfer' && (
              <>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="font-medium">No items in current order</p>
                    <p className="text-sm mt-1">Add items to transfer to another table</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-3">Select items to transfer to another table:</p>
                    <div className="max-h-[280px] overflow-y-auto space-y-2 mb-4">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${item.veg ? 'border-green' : 'border-red-500'}`}>
                            <div className={`w-1.5 h-1.5 mx-auto mt-0.5 ${item.veg ? 'bg-green rounded-full' : 'bg-red-500'}`} style={!item.veg ? { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' } : {}}></div>
                          </div>
                          <span className="flex-1 text-sm font-medium text-secondary">{item.name} x{item.qty}</span>
                          <span className="text-sm font-bold text-primary mr-2">₹{item.price * item.qty}</span>
                          <div className="relative">
                            <select
                              value={splitItemTargets[item.id] || ''}
                              onChange={(e) => setSplitItemTargets((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              className="appearance-none pr-8 px-2 py-1 border border-gray-300 rounded-lg text-xs outline-none bg-white focus:ring-2 focus:ring-primary/30 cursor-pointer"
                            >
                              <option value="">Keep here</option>
                              {tables.filter((t) => t.id !== selectedTable).map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowMergeSplit(false); setSplitItemTargets({}) }} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                      <button onClick={() => {
                        if (Object.values(splitItemTargets).filter(Boolean).length === 0) return
                        const stayItems = []
                        const transferMap = {}
                        orderItems.forEach((item) => {
                          const target = splitItemTargets[item.id]
                          if (target) {
                            if (!transferMap[target]) transferMap[target] = []
                            transferMap[target].push(item)
                          } else {
                            stayItems.push(item)
                          }
                        })
                        Object.entries(transferMap).forEach(([tId, items]) => {
                          setTableOrders((prev) => {
                            const existing = prev[tId]?.items || []
                            const combined = [...existing, ...items]
                            const merged = {}
                            combined.forEach((item) => {
                              if (merged[item.id]) merged[item.id] = { ...merged[item.id], qty: merged[item.id].qty + item.qty }
                              else merged[item.id] = { ...item }
                            })
                            return { ...prev, [tId]: { items: Object.values(merged), discount: { type: 'percent', value: 0 } } }
                          })
                        })
                        setOrderItems(stayItems)
                        setSplitItemTargets({})
                        setShowMergeSplit(false)
                      }} disabled={Object.values(splitItemTargets).filter(Boolean).length === 0} className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${Object.values(splitItemTargets).filter(Boolean).length > 0 ? 'bg-purple text-white hover:bg-purple/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                        Transfer
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-up text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${paymentMethod === 'cash' ? 'bg-green/10' : paymentMethod === 'upi' ? 'bg-blue/10' : 'bg-purple/10'}`}>
              {paymentMethod === 'cash' && <Banknote className="w-8 h-8 text-green" />}
              {paymentMethod === 'upi' && <QrCode className="w-8 h-8 text-blue" />}
              {paymentMethod === 'card' && <CreditCard className="w-8 h-8 text-purple" />}
            </div>
            <h3 className="text-xl font-bold text-secondary mb-2">
              {paymentMethod === 'cash' ? 'Cash Payment' : paymentMethod === 'upi' ? 'UPI Payment' : 'Card Payment'}
            </h3>
            <p className="text-gray-500 mb-2">Amount to collect:</p>
            <p className="text-3xl font-extrabold text-primary mb-6">₹{total.toFixed(2)}</p>
            {paymentMethod === 'upi' && (
              <div className="bg-gray-100 rounded-xl p-6 mb-6">
                {upiId ? (
                  <>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(userProfile?.restaurant || 'Restaurant')}&am=${total.toFixed(2)}&cu=INR`)}`}
                      alt="UPI QR Code"
                      className="w-48 h-48 mx-auto bg-white rounded-xl p-2 shadow-sm border border-gray-100"
                    />
                    <p className="text-xs text-gray-400 mt-2 font-mono">{upiId}</p>
                  </>
                ) : (
                  <div className="w-40 h-40 mx-auto bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer" onClick={() => { setShowPayment(false); setUpiInput(''); setShowUpiModal(true) }}>
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-gray-300 mx-auto" />
                      <p className="text-xs text-blue font-semibold mt-2">Set UPI ID first</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-3">{upiId ? 'Scan & pay using any UPI app' : 'Add your UPI ID in Settings to show QR'}</p>
              </div>
            )}
            {paymentMethod === 'card' && (
              <div className="bg-gray-100 rounded-xl p-6 mb-6">
                <div className="w-20 h-20 mx-auto bg-purple/10 rounded-full flex items-center justify-center mb-4">
                  <CreditCard className="w-10 h-10 text-purple" />
                </div>
                <div className="flex gap-2 justify-center mb-5">
                  {['Credit Card', 'Debit Card', 'Other'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setCardType(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                        cardType === type ? 'bg-purple text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-purple/40'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple">1</span>
                    </div>
                    <p className="text-sm text-secondary font-medium">Swipe / Insert / Tap card on machine</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple">2</span>
                    </div>
                    <p className="text-sm text-secondary font-medium">Enter amount: <span className="font-bold text-primary">₹{total.toFixed(2)}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple">3</span>
                    </div>
                    <p className="text-sm text-secondary font-medium">Collect slip & confirm below</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowPayment(false); setCardType('') }} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={completePayment} disabled={paymentMethod === 'card' && !cardType} className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${paymentMethod === 'card' && !cardType ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green text-white hover:bg-green/90'}`}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* UPI QR Overlay — lightweight, auto-confirmed */}
      {showUpiQr && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4" onClick={() => setShowUpiQr(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center animate-fade-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-secondary">UPI Payment</h3>
              <button onClick={() => setShowUpiQr(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-2xl font-extrabold text-primary mb-4">₹{total.toFixed(2)}</p>
            {upiId ? (
              <>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(userProfile?.restaurant || 'Restaurant')}&am=${total.toFixed(2)}&cu=INR`)}`}
                  alt="UPI QR Code"
                  className="w-52 h-52 mx-auto bg-white rounded-xl p-2 border border-gray-100 shadow-sm"
                />
                <p className="text-xs text-gray-400 mt-3 font-mono">{upiId}</p>
                <button onClick={() => { setShowUpiQr(false); setShowCustModal(true) }} className="mt-4 w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
                  Done
                </button>
              </>
            ) : (
              <div className="w-52 h-52 mx-auto bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer" onClick={() => { setShowUpiQr(false); setUpiInput(''); setShowUpiModal(true) }}>
                <div className="text-center">
                  <QrCode className="w-14 h-14 text-gray-300 mx-auto" />
                  <p className="text-xs text-blue font-semibold mt-2">Set UPI ID first</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Customer Capture Modal — shown on Generate Bill */}
      {showCustModal && (
        <div className="fixed inset-0 bg-black/50 z-[95] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden animate-fade-up">
            <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-center">
              <Receipt className="w-8 h-8 text-white mx-auto mb-2" />
              <h3 className="text-lg font-bold text-white">Customer Details</h3>
              <p className="text-white/70 text-xs mt-1">Link a customer to this order (optional)</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9]*"
                  placeholder="Phone number"
                  value={custModalPhone}
                  onChange={(e) => handleCustModalPhoneChange(e.target.value)}
                  maxLength={10}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {custModalSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
              </div>
              {custModalFound && !custModalSearching && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green/5 border border-green/20 rounded-lg">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span className="text-xs font-medium text-green">Existing customer found!</span>
                </div>
              )}
              {!custModalFound && custModalPhone.replace(/\D/g, '').length >= 10 && !custModalSearching && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue/5 border border-blue/20 rounded-lg">
                  <Plus className="w-4 h-4 text-blue flex-shrink-0" />
                  <span className="text-xs font-medium text-blue">New customer — will be saved</span>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Name</label>
                <input
                  type="text"
                  placeholder="Customer name"
                  value={custModalName}
                  onChange={(e) => setCustModalName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1 uppercase">Date of Birth (optional)</label>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={custModalDobDisplay}
                  onChange={(e) => {
                    let raw = e.target.value.replace(/\D/g, '')
                    if (raw.length > 8) raw = raw.slice(0, 8)
                    let formatted = raw
                    if (raw.length > 2) formatted = raw.slice(0, 2) + '/' + raw.slice(2)
                    if (raw.length > 4) formatted = raw.slice(0, 2) + '/' + raw.slice(2, 4) + '/' + raw.slice(4)
                    setCustModalDobDisplay(formatted)
                    if (raw.length === 8) {
                      const dd = raw.slice(0, 2), mm = raw.slice(2, 4), yyyy = raw.slice(4, 8)
                      const dobStr = `${yyyy}-${mm}-${dd}`
                      setCustModalDob(dobStr)
                      const bday = checkBday(dobStr)
                      setCustModalBday(bday)
                      setCustModalBdayDiscount(bday ? 10 : 0)
                    } else {
                      setCustModalDob('')
                      setCustModalBday(false)
                      setCustModalBdayDiscount(0)
                    }
                  }}
                  maxLength={10}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              {custModalBday && (
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎂</span>
                    <span className="text-sm font-bold text-pink-600">Happy Birthday, {custModalName || 'Customer'}!</span>
                  </div>
                  <p className="text-[11px] text-pink-500">Apply a birthday discount?</p>
                  <div className="flex gap-2">
                    {[0, 5, 10, 15].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setCustModalBdayDiscount(pct)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          custModalBdayDiscount === pct
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-pink-600 border-pink-200 hover:border-pink-400'
                        }`}
                      >
                        {pct === 0 ? 'None' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={skipCustAndBill} className="flex-1 py-3.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors border-r border-gray-100">
                Skip for now
              </button>
              <button onClick={confirmCustAndBill} className="flex-1 py-3.5 text-sm font-bold text-primary hover:bg-primary/5 transition-colors">
                Save & Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Bill for Print */}
      <div ref={billRef} className="hidden">
        <div className="p-8 font-mono text-sm">
          <h1 className="text-center font-bold text-lg mb-1">DaawatDesk</h1>
          <p className="text-center text-gray-500 text-xs mb-4">Restaurant POS</p>
          <p className="text-center text-xs mb-4">Table: {selectedTable ? `Table ${selectedTable}` : 'Parcel'}</p>
          {activeCustomer && checkBday(activeCustomer.dob) && (
            <p className="text-center font-bold text-base mb-2">Happy Birthday, {activeCustomer.name || 'Dear Customer'}!</p>
          )}
          <div className="border-t border-dashed border-gray-400 my-2"></div>
          {orderItems.map((item) => (
            <div key={item.id} className="flex justify-between py-1">
              <span>{item.name} x{item.qty}</span>
              <span>₹{item.price * item.qty}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-gray-400 my-2"></div>
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green"><span>Discount</span><span>-₹{discountAmount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between"><span>CGST (2.5%)</span><span>₹{cgst.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>SGST (2.5%)</span><span>₹{sgst.toFixed(2)}</span></div>
          <div className="border-t border-gray-400 my-2"></div>
          <div className="flex justify-between font-bold text-lg"><span>TOTAL</span><span>₹{total.toFixed(2)}</span></div>
          <div className="border-t border-dashed border-gray-400 my-2"></div>
          <p className="text-center text-xs text-gray-500">Thank you! Visit again.</p>
        </div>
      </div>

      {/* ═══════ RESTAURANT PROFILE MODAL ═══════ */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Restaurant Details
              </h3>
              <button onClick={() => setShowProfileModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="flex flex-col items-center">
                {(userProfile?.profilePic || currentUser.photoURL) ? (
                  <img src={userProfile?.profilePic || currentUser.photoURL} alt="Logo" className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 mb-3" />
                ) : (
                  <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-3">
                    <span className="text-white text-3xl font-bold">{(userProfile?.restaurant || currentUser.displayName || '?')[0].toUpperCase()}</span>
                  </div>
                )}
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleProfilePicUpload} className="hidden" />
                  <span className="text-xs font-semibold text-primary hover:underline">
                    {userProfile?.profilePic ? 'Change Logo' : 'Upload Logo'}
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase">Restaurant Name</label>
                <input
                  type="text"
                  value={userProfile?.restaurant || ''}
                  onChange={(e) => updateProfileField('restaurant', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Your restaurant name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Address
                </label>
                <textarea
                  value={userProfile?.address || ''}
                  onChange={(e) => updateProfileField('address', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="123 MG Road, Bhubaneswar, Odisha"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone Number
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={userProfile?.phone || ''}
                  onChange={(e) => updateProfileField('phone', e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase">Instagram</label>
                  <input
                    type="text"
                    value={userProfile?.instagram || ''}
                    onChange={(e) => updateProfileField('instagram', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="@restaurant"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase">Facebook</label>
                  <input
                    type="text"
                    value={userProfile?.facebook || ''}
                    onChange={(e) => updateProfileField('facebook', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="facebook.com/restaurant"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowProfileModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSaveProfile} disabled={profileSaving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {profileSaving ? 'Saving...' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ UPI SETTINGS MODAL ═══════ */}
      {showUpiModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue" />
                UPI Settings
              </h3>
              <button onClick={() => setShowUpiModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Enter your UPI ID to generate QR codes for customers.</p>
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-gray-400 mb-1.5 uppercase">UPI ID</label>
              <input
                type="text"
                placeholder="e.g. restaurant@upi"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 transition-colors"
                autoFocus
              />
            </div>
            {upiId && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green/5 border border-green/20 rounded-xl mb-4">
                <Check className="w-4 h-4 text-green flex-shrink-0" />
                <span className="text-xs font-medium text-green">Current: {upiId}</span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowUpiModal(false)} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSaveUpi} disabled={!upiInput.trim() || upiSaving} className="flex-1 py-3 bg-blue text-white rounded-xl font-semibold hover:bg-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {upiSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MANAGE MENU MODAL ═══════ */}
      {showMenuManager && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-secondary flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Manage Menu
              </h3>
              <div className="flex items-center gap-3">
                {menuSaving && <span className="text-xs text-gray-400 animate-pulse">Saving...</span>}
                <button onClick={() => setShowMenuManager(false)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
              </div>
            </div>

            <div className="px-6 pt-4">
              <label className="relative block overflow-hidden rounded-2xl cursor-pointer group">
                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" onChange={handleMenuCardUpload} disabled={menuCardUploading} />
                <div className={`relative bg-gradient-to-br from-orange/10 via-primary/5 to-orange/10 border-2 border-dashed rounded-2xl p-6 transition-all duration-300 ${menuCardUploading ? 'border-primary/40' : 'border-orange/30 group-hover:border-primary group-hover:from-primary/10 group-hover:via-orange/10 group-hover:to-primary/10'}`}>
                  {menuCardUploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Loader2 className="w-7 h-7 text-primary animate-spin" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange rounded-full flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-primary">AI is reading your menu...</p>
                        <p className="text-xs text-gray-400 mt-0.5">Uploading image & extracting items</p>
                      </div>
                      <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-orange rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange to-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300">
                          <Camera className="w-7 h-7 text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform">
                          <ScanLine className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-secondary">Upload Menu Card</p>
                        <p className="text-xs text-gray-400 mt-0.5">Snap a photo — AI extracts all items instantly</p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><Image className="w-3 h-3" /> Photo</span>
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> AI Power</span>
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Review</span>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="px-6 pb-3">
              <button
                onClick={() => setShowMenuCardDownload(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-secondary/5 border border-secondary/10 rounded-xl hover:bg-secondary/10 transition-colors group"
              >
                <Download className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                <span className="text-sm font-semibold text-secondary">Download Menu Card</span>
              </button>
            </div>

            <div className="flex border-b border-gray-200 px-6">
              {[
                { id: 'categories', label: 'Categories', icon: Tag },
                { id: 'items', label: 'Menu Items', icon: Package },
                { id: 'tables', label: 'Tables', icon: TableProperties },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMenuTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    menuTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Categories Tab */}
              {menuTab === 'categories' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <div className="relative">
                      <select
                        value={newCategoryIcon}
                        onChange={(e) => setNewCategoryIcon(e.target.value)}
                        className="appearance-none pr-8 px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                      >
                        {iconOptions.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <button onClick={addCategory} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {menuCategories.map((cat) => {
                      const IC = IconComp(cat.icon)
                      const subs = cat.subCategories || []
                      return (
                        <div key={cat.id} className="bg-gray-50 rounded-xl overflow-hidden">
                          <div className="flex items-center gap-3 p-3">
                            {editingCategory === cat.id ? (
                              <>
                                <input
                                  type="text"
                                  defaultValue={cat.name}
                                  id={`cat-name-${cat.id}`}
                                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <div className="relative">
                                  <select
                                    defaultValue={cat.icon}
                                    id={`cat-icon-${cat.id}`}
                                    className="appearance-none pr-8 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                                  >
                                    {iconOptions.map((icon) => (
                                      <option key={icon} value={icon}>{icon}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                                <button
                                  onClick={() => {
                                    const name = document.getElementById(`cat-name-${cat.id}`).value
                                    const icon = document.getElementById(`cat-icon-${cat.id}`).value
                                    updateCategory(cat.id, name, icon)
                                  }}
                                  className="p-2 text-green hover:bg-green/10 rounded-lg"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditingCategory(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <IC className="w-5 h-5 text-primary" />
                                <span className="flex-1 font-medium text-sm text-secondary">{cat.name}</span>
                                <span className="text-xs text-gray-400">{subs.length} subs</span>
                                <span className="text-xs text-gray-400">{menuItems.filter((i) => i.category === cat.id).length} items</span>
                                <button onClick={() => setEditingCategory(cat.id)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => { if (window.confirm(`Delete category "${cat.name}"? Items in this category will also be removed.`)) deleteCategory(cat.id) }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                          <div className="px-3 pb-3 pt-0 ml-8">
                            <div className="flex gap-1.5 mb-2">
                              <input
                                type="text"
                                placeholder="Add sub-category..."
                                value={newSubCatName}
                                onChange={(e) => setNewSubCatName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addSubCategory(cat.id)}
                                className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                              />
                              <button onClick={() => addSubCategory(cat.id)} className="bg-primary/10 text-primary px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            {subs.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {subs.map((sub) => (
                                  <div key={sub.id} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                                    {editingSubCat === sub.id ? (
                                      <>
                                        <input
                                          type="text"
                                          defaultValue={sub.name}
                                          id={`sub-name-${sub.id}`}
                                          className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-xs outline-none"
                                        />
                                        <button onClick={() => {
                                          const name = document.getElementById(`sub-name-${sub.id}`).value
                                          updateSubCategory(cat.id, sub.id, name)
                                        }} className="text-green hover:text-green/80"><Save className="w-3 h-3" /></button>
                                        <button onClick={() => setEditingSubCat(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-xs text-gray-600">{sub.name}</span>
                                        <button onClick={() => setEditingSubCat(sub.id)} className="text-gray-400 hover:text-primary"><Edit3 className="w-3 h-3" /></button>
                                        <button onClick={() => { if (window.confirm(`Delete sub-category "${sub.name}"?`)) deleteSubCategory(cat.id, sub.id) }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Items Tab */}
              {menuTab === 'items' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Item name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                      <input type="number" inputMode="decimal" placeholder="Price" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select value={newItemCategory} onChange={(e) => { setNewItemCategory(e.target.value); setNewItemSubCategory('') }} className="appearance-none pr-8 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
                          {menuCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {(() => {
                        const cat = menuCategories.find((c) => c.id === newItemCategory)
                        const subs = cat?.subCategories || []
                        if (subs.length === 0) return null
                        return (
                          <div className="relative flex-1">
                            <select value={newItemSubCategory} onChange={(e) => setNewItemSubCategory(e.target.value)} className="appearance-none pr-8 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
                              <option value="">No sub-category</option>
                              {subs.map((sub) => (
                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        )
                      })()}
                      <div className="relative">
                        <select value={newItemVeg ? 'true' : 'false'} onChange={(e) => setNewItemVeg(e.target.value === 'true')} className="appearance-none pr-8 px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer">
                          <option value="true">🟢 Veg</option>
                          <option value="false">🔴 Non-Veg</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      <button onClick={addItem_} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1">
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {menuCategories.map((cat) => {
                      const catItems = menuItems.filter((i) => i.category === cat.id)
                      if (catItems.length === 0) return null
                      return (
                        <div key={cat.id}>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-3">{cat.name}</p>
                          {(cat.subCategories || []).length > 0 && cat.subCategories.map((sub) => {
                            const subItems = catItems.filter((i) => i.subCategory === sub.id)
                            if (subItems.length === 0) return null
                            return (
                              <div key={sub.id}>
                                <p className="text-[10px] font-medium text-gray-300 uppercase tracking-wider mb-1 ml-2">{sub.name}</p>
                                {subItems.map((item) => renderItemRow(item))}
                              </div>
                            )
                          })}
                          {catItems.filter((i) => !i.subCategory || !(cat.subCategories || []).find((s) => s.id === i.subCategory)).map((item) => renderItemRow(item))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tables Tab */}
              {menuTab === 'tables' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Table name (e.g. Table 9)" value={newTableName} onChange={(e) => setNewTableName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTable()} className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    <input type="number" inputMode="numeric" placeholder="Seats" value={newTableSeats} onChange={(e) => setNewTableSeats(Number(e.target.value))} className="w-24 px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={addTable} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tables.map((table) => (
                      <div key={table.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        {editingTable === table.id ? (
                          <>
                            <input type="text" defaultValue={table.name} id={`table-name-${table.id}`} className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                            <input type="number" inputMode="numeric" defaultValue={table.seats} id={`table-seats-${table.id}`} className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                            <button
                              onClick={() => {
                                const name = document.getElementById(`table-name-${table.id}`).value
                                const seats = document.getElementById(`table-seats-${table.id}`).value
                                updateTable(table.id, name, seats)
                              }}
                              className="p-2 text-green hover:bg-green/10 rounded-lg"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingTable(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <TableProperties className="w-5 h-5 text-primary" />
                            <span className="flex-1 font-medium text-sm text-secondary">{table.name}</span>
                            <span className="text-xs text-gray-400">{table.seats} seats</span>
                            <button onClick={() => setEditingTable(table.id)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { if (window.confirm(`Delete "${table.name}"?`)) deleteTable(table.id) }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MENU CARD REVIEW MODAL ═══════ */}
      {showMenuCardReview && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange" />
                Menu Card Review
              </h3>
              <button onClick={() => { setShowMenuCardReview(false); setMenuCardExtracted([]); setMenuCardPreview('') }}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {menuCardPreview && (
              <div className="px-5 pt-4">
                <img src={menuCardPreview} alt="Menu card" className="w-full h-32 object-cover rounded-xl border border-gray-100" />
              </div>
            )}

            <div className="px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-secondary">{menuCardExtracted.length} items extracted</p>
              <button onClick={addExtractedItem} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add manually
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-2">
              {menuCardExtracted.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No items extracted. Try a clearer photo.</p>
              )}
              {menuCardExtracted.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-2 p-2.5 rounded-xl border transition-colors ${item._selected ? 'border-primary/30 bg-primary/5' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                  <input
                    type="checkbox"
                    checked={item._selected}
                    onChange={() => toggleExtractedItem(idx)}
                    className="w-4 h-4 accent-primary flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateExtractedItem(idx, 'name', e.target.value)}
                    placeholder="Item name"
                    className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={item.price || ''}
                      onChange={(e) => updateExtractedItem(idx, 'price', Number(e.target.value))}
                      placeholder="0"
                      className="w-20 pl-5 pr-1 py-1 text-sm border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                    />
                  </div>
                  <select
                    value={item.category}
                    onChange={(e) => updateExtractedItem(idx, 'category', e.target.value)}
                    className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none bg-white cursor-pointer"
                  >
                    {['Starters','Soups','Salads','Main Course','Rice & Biryani','Noodles & Fried Rice','Breads','Beverages','Desserts','Combos'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => updateExtractedItem(idx, 'veg', !item.veg)}
                    className={`text-sm px-1.5 py-0.5 rounded-lg border ${item.veg ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}
                  >
                    {item.veg ? '🟢' : '🔴'}
                  </button>
                  <button onClick={() => removeExtractedItem(idx)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => { setShowMenuCardReview(false); setMenuCardExtracted([]); setMenuCardPreview('') }} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleExtractedAdd} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                Add to Menu
              </button>
              <button onClick={handleExtractedReplace} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
                Replace Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ MENU CARD DOWNLOAD MODAL ═══════ */}
      {showMenuCardDownload && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Download Menu Card
              </h3>
              <button onClick={() => setShowMenuCardDownload(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 text-center">Choose a theme for your menu card</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMenuCardTheme('light')}
                  className={`p-4 rounded-xl border-2 transition-all ${menuCardTheme === 'light' ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="w-full h-20 bg-white rounded-lg border border-gray-100 mb-2 p-2">
                    <div className="h-2 bg-gray-800 rounded w-1/2 mx-auto mb-1"></div>
                    <div className="h-1 bg-gray-200 rounded w-3/4 mx-auto mb-1"></div>
                    <div className="flex gap-1 mt-2">
                      <div className="h-1 bg-orange/30 rounded flex-1"></div>
                      <div className="h-1 bg-gray-200 rounded flex-1"></div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-secondary">Light Theme</p>
                  <p className="text-[10px] text-gray-400">Clean & elegant</p>
                </button>
                <button
                  onClick={() => setMenuCardTheme('dark')}
                  className={`p-4 rounded-xl border-2 transition-all ${menuCardTheme === 'dark' ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="w-full h-20 bg-[#1A1A2E] rounded-lg mb-2 p-2">
                    <div className="h-2 bg-orange/60 rounded w-1/2 mx-auto mb-1"></div>
                    <div className="h-1 bg-white/20 rounded w-3/4 mx-auto mb-1"></div>
                    <div className="flex gap-1 mt-2">
                      <div className="h-1 bg-orange/30 rounded flex-1"></div>
                      <div className="h-1 bg-white/10 rounded flex-1"></div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-secondary">Dark Theme</p>
                  <p className="text-[10px] text-gray-400">Premium feel</p>
                </button>
              </div>
              <button
                onClick={async () => {
                  await downloadMenuCard(menuCardTheme)
                  setShowMenuCardDownload(false)
                }}
                disabled={menuCardPdfGenerating}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {menuCardPdfGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download as PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Menu Card Pages for html2canvas → PDF */}
      <div id="menu-card-pages" style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
        {(() => {
          const isDark = menuCardTheme === 'dark'
          const bg = isDark ? '#0F0F1A' : '#FFFBF5'
          const textColor = isDark ? '#FFFFFF' : '#1A1A2E'
          const subColor = isDark ? '#8B8BA3' : '#6B7280'
          const accent = '#FF6B00'
          const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'
          const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
          const catBg = isDark ? 'rgba(255,107,0,0.08)' : 'rgba(255,107,0,0.04)'
          const restName = userProfile?.restaurant || 'Restaurant'
          const restAddr = userProfile?.address || ''
          const restPhone = userProfile?.phone || ''
          const restInstagram = userProfile?.instagram || ''
          const restFacebook = userProfile?.facebook || ''
          const restLogo = userProfile?.profilePic || ''
          const pageW = 800, pageH = 1130

          const grouped = {}
          menuItems.forEach((item) => {
            const cat = menuCategories.find((c) => c.id === item.category)
            const catName = cat?.name || 'Other'
            if (!grouped[catName]) grouped[catName] = []
            grouped[catName].push(item)
          })

          const catIcons = {
            'Starters':'🍽️','Soups':'🥣','Salads':'🥗','Main Course':'🍛',
            'Rice & Biryani':'🍚','Noodles & Fried Rice':'🍜','Breads & Naan':'🫓',
            'Breads':'🫓','Beverages':'☕','Desserts':'🍰','Combos & Thali':'🍱','Combos':'🍱',
          }

          const VEG_MARK = <div style={{ width:'16px', height:'16px', border:'2px solid #16A34A', borderRadius:'3px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><div style={{ width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderBottom:'7px solid #16A34A' }}></div></div>
          const NONVEG_MARK = <div style={{ width:'16px', height:'16px', border:'2px solid #DC2626', borderRadius:'3px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><div style={{ width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderBottom:'8px solid #DC2626' }}></div></div>

          const Legend = () => (
            <div style={{ display:'flex', justifyContent:'center', gap:'24px', padding:'10px 0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                {VEG_MARK}
                <span style={{ fontSize:'11px', color:subColor, fontFamily:"'Inter',sans-serif", fontWeight:500 }}>VEG</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                {NONVEG_MARK}
                <span style={{ fontSize:'11px', color:subColor, fontFamily:"'Inter',sans-serif", fontWeight:500 }}>NON-VEG</span>
              </div>
            </div>
          )

          const renderItems = (items) => items.map((item) => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:cardBg, borderRadius:'10px', border:`1px solid ${cardBorder}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
                {item.veg ? VEG_MARK : NONVEG_MARK}
                <span style={{ fontSize:'15px', fontWeight:500, color:textColor, fontFamily:"'Inter',sans-serif", lineHeight:1.4 }}>{item.name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'baseline', gap:'4px', flexShrink:0, marginLeft:'8px' }}>
                <div style={{ width:'40px', borderBottom:`1px dotted ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}` }}></div>
                <span style={{ fontSize:'15px', fontWeight:700, color:accent, fontFamily:"'Inter',sans-serif", whiteSpace:'nowrap' }}>₹{item.price}</span>
              </div>
            </div>
          ))

          const renderCategoryHeader = (catName, count) => (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', padding:'10px 16px', background:catBg, borderRadius:'12px', borderLeft:`4px solid ${accent}` }}>
              <span style={{ fontSize:'18px' }}>{catIcons[catName] || '🍴'}</span>
              <h2 style={{ fontSize:'16px', fontWeight:700, color:accent, margin:0, letterSpacing:'1px', fontFamily:"'Inter',sans-serif", textTransform:'uppercase' }}>{catName}</h2>
              {count !== undefined && <span style={{ fontSize:'11px', color:subColor, fontFamily:"'Inter',sans-serif", marginLeft:'auto', fontWeight:500 }}>{count} items</span>}
            </div>
          )

          const headerStyle = {
            background: isDark ? 'linear-gradient(135deg, #1A1A2E 0%, #0F0F1A 100%)' : 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)',
            padding: '48px 40px 36px', textAlign: 'center', position: 'relative', overflow: 'hidden'
          }
          const patternStyle = {
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03,
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.5) 20px, rgba(255,255,255,0.5) 21px)', pointerEvents: 'none'
          }
          const compactHeaderStyle = {
            background: isDark ? 'linear-gradient(135deg, #1A1A2E 0%, #0F0F1A 100%)' : 'linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)',
            padding: '20px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden'
          }

          const fullHeader = (
            <div style={headerStyle}>
              <div style={patternStyle}></div>
              {restLogo ? (
                <img src={restLogo} alt="Logo" crossOrigin="anonymous" style={{ width:'90px', height:'90px', borderRadius:'20px', objectFit:'cover', margin:'0 auto 20px', display:'block', border:'3px solid rgba(255,107,0,0.5)', boxShadow:'0 8px 32px rgba(255,107,0,0.2)' }} />
              ) : (
                <div style={{ width:'90px', height:'90px', borderRadius:'20px', background:'linear-gradient(135deg, #FF6B00, #FF8C38)', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(255,107,0,0.3)' }}>
                  <span style={{ fontSize:'40px', color:'#fff', fontFamily:"'Georgia',serif", fontWeight:700 }}>{restName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <h1 style={{ fontSize:'36px', fontWeight:700, color:'#FFFFFF', margin:'0 0 4px', letterSpacing:'4px', fontFamily:"'Georgia','Times New Roman',serif", textTransform:'uppercase' }}>{restName}</h1>
              {restAddr && <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.6)', margin:'8px 0 2px', fontFamily:"'Inter',sans-serif", letterSpacing:'0.5px' }}>{restAddr}</p>}
              {restPhone && <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', margin:'2px 0 0', fontFamily:"'Inter',sans-serif" }}>📞 {restPhone}</p>}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', marginTop:'20px' }}>
                <div style={{ width:'40px', height:'1px', background:'linear-gradient(90deg, transparent, rgba(255,107,0,0.6))' }}></div>
                <span style={{ fontSize:'10px', color:accent, letterSpacing:'3px', fontFamily:"'Inter',sans-serif", textTransform:'uppercase', fontWeight:600 }}>MENU</span>
                <div style={{ width:'40px', height:'1px', background:'linear-gradient(90deg, rgba(255,107,0,0.6), transparent)' }}></div>
              </div>
              {(restInstagram || restFacebook) && (
                <div style={{ display:'flex', justifyContent:'center', gap:'20px', marginTop:'16px' }}>
                  {restInstagram && <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', fontFamily:"'Inter',sans-serif" }}>📷 {restInstagram}</span>}
                  {restFacebook && <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)', fontFamily:"'Inter',sans-serif" }}>📘 {restFacebook}</span>}
                </div>
              )}
            </div>
          )

          const compactHeader = (pageNum, totalPages) => (
            <div style={compactHeaderStyle}>
              <div style={patternStyle}></div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'16px' }}>
                {restLogo && <img src={restLogo} alt="" crossOrigin="anonymous" style={{ width:'36px', height:'36px', borderRadius:'8px', objectFit:'cover', border:'2px solid rgba(255,107,0,0.4)' }} />}
                <h1 style={{ fontSize:'22px', fontWeight:700, color:'#FFFFFF', margin:0, letterSpacing:'3px', fontFamily:"'Georgia','Times New Roman',serif", textTransform:'uppercase' }}>{restName}</h1>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.4)', fontFamily:"'Inter',sans-serif" }}>Page {pageNum} of {totalPages}</span>
              </div>
            </div>
          )

          const footer = (
            <div style={{ textAlign:'center', marginTop:'24px', paddingTop:'20px', borderTop:`2px solid ${cardBorder}` }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'8px' }}>
                <div style={{ width:'30px', height:'1px', background:accent }}></div>
                <span style={{ fontSize:'18px' }}>🔥</span>
                <div style={{ width:'30px', height:'1px', background:accent }}></div>
              </div>
              <p style={{ fontSize:'11px', color:subColor, fontFamily:"'Inter',sans-serif", letterSpacing:'1px', textTransform:'uppercase', margin:0, fontWeight:500 }}>Crafted with love at {restName}</p>
              <p style={{ fontSize:'10px', color:isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)', fontFamily:"'Inter',sans-serif", marginTop:'8px' }}>Powered by DaawatDesk</p>
            </div>
          )

          const ITEMS_PER_PAGE = 12

          const buildPages = []
          const catEntries = Object.entries(grouped)
          let currentPage = { cats: {}, itemCount: 0 }

          catEntries.forEach(([catName, items]) => {
            let remaining = [...items]
            while (remaining.length > 0) {
              const space = ITEMS_PER_PAGE - currentPage.itemCount
              if (space <= 0) {
                buildPages.push(currentPage)
                currentPage = { cats: {}, itemCount: 0 }
              }
              const take = remaining.splice(0, Math.max(1, ITEMS_PER_PAGE - currentPage.itemCount))
              if (!currentPage.cats[catName]) currentPage.cats[catName] = []
              currentPage.cats[catName].push(...take)
              currentPage.itemCount += take.length
            }
          })
          if (currentPage.itemCount > 0) buildPages.push(currentPage)
          const total = buildPages.length || 1

          return buildPages.map((page, idx) => (
            <div key={idx} className="menu-card-page" style={{ background: bg, fontFamily: "'Georgia','Times New Roman',serif", width: `${pageW}px`, height: `${pageH}px`, overflow: 'hidden', pageBreakAfter: idx < total - 1 ? 'always' : 'auto' }}>
              {idx === 0 ? fullHeader : compactHeader(idx + 1, total)}

              <div style={{ padding: '28px 40px 32px' }}>
                {idx === 0 && <Legend />}

                {Object.entries(page.cats).map(([catName, items]) => (
                  <div key={catName} style={{ marginBottom: '20px' }}>
                    {renderCategoryHeader(catName, items.length)}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: '4px' }}>
                      {renderItems(items)}
                    </div>
                  </div>
                ))}

                {idx === total - 1 && footer}
              </div>

              {idx > 0 && (
                <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, textAlign: 'center' }}>
                  <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', fontFamily: "'Inter',sans-serif" }}>Page {idx + 1} of {total}</span>
                </div>
              )}
            </div>
          ))
        })()}
      </div>

      {/* Table QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/50 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-sm text-center animate-fade-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-secondary">{qrTableName}</h3>
              <button onClick={() => setShowQrModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5">Customer scans to view menu & order</p>
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/menu?uid=${currentUser?.uid}&table=${qrTableNum}`)}`}
                alt={`QR Code for ${qrTableName}`}
                className="w-56 h-56"
              />
            </div>
            <p className="text-[10px] text-gray-300 mt-3 break-all leading-relaxed">{window.location.origin}/menu?uid={currentUser?.uid}&table={qrTableNum}</p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const url = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${window.location.origin}/menu?uid=${currentUser?.uid}&table=${qrTableNum}`)}`
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `QR-${qrTableName.replace(/\s+/g, '-')}.png`
                  a.click()
                }}
                className="flex-[2] py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}
      {/* QR UPI Payment Toast */}
      {qrPayments.length > 0 && (
        <div className="fixed top-4 right-4 z-[200] space-y-2 max-w-sm">
          {qrPayments.map((payment) => (
            <div key={payment.id} className="bg-green/95 text-white rounded-xl p-4 shadow-2xl animate-fade-up flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💰</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">Payment Received!</p>
                <p className="text-xs opacity-90">{payment.table} · ₹{payment.total} · {payment.customerName}</p>
                <p className="text-[10px] opacity-70">via UPI QR</p>
              </div>
              <button onClick={() => dismissQrPayment(payment.id)} className="p-1 hover:bg-white/20 rounded-lg flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showNewOrderModal && (() => {
        const occupiedIds = getOccupiedTableIds()
        const suggested = suggestTable(newOrderPax, tables, occupiedIds)

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { setShowNewOrderModal(false); resetNewOrder() }}>
            <div className="bg-white w-full sm:max-w-md sm:rounded-[2rem] rounded-t-3xl max-h-[90vh] overflow-hidden animate-slide-up flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-secondary">New Order</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Set up your order details</p>
                </div>
                <button onClick={() => { setShowNewOrderModal(false); resetNewOrder() }} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="px-5 pb-2">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => { setNewOrderType('dine-in'); setNewOrderTable(null) }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${newOrderType === 'dine-in' ? 'bg-white text-secondary shadow-sm' : 'text-gray-400'}`}
                  >
                    <Utensils className="w-4 h-4" />
                    Dine-in
                  </button>
                  <button
                    onClick={() => { setNewOrderType('parcel'); setNewOrderTable(null) }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${newOrderType === 'parcel' ? 'bg-white text-secondary shadow-sm' : 'text-gray-400'}`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Parcel
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-3 space-y-5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Customer Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      inputMode="tel"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={newOrderPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setNewOrderPhone(val)
                        setNewOrderCustomer(null)
                        setNewOrderName('')
                        setNewOrderDob('')
                        setNewOrderDobDisplay('')
                        if (val.length === 10) {
                          findCustomerByPhone(val).then((c) => {
                            if (c) {
                              setNewOrderCustomer(c)
                              setNewOrderName(c.name || '')
                            }
                          }).catch(() => {})
                        }
                      }}
                      placeholder="Enter 10-digit number"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    {newOrderPhone.length === 10 && !newOrderCustomer && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-blue-500">New customer</span>
                    )}
                  </div>
                </div>

                {newOrderPhone.length === 10 && !newOrderCustomer && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Customer Name</label>
                    <input
                      type="text"
                      value={newOrderName}
                      onChange={(e) => setNewOrderName(e.target.value)}
                      placeholder="Enter customer name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                )}

                {newOrderPhone.length === 10 && !newOrderCustomer && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Date of Birth <span className="text-gray-400 normal-case">(optional)</span></label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      value={newOrderDobDisplay}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
                        let display = raw
                        if (raw.length > 2) display = raw.slice(0, 2) + '/' + raw.slice(2)
                        if (raw.length > 4) display = raw.slice(0, 2) + '/' + raw.slice(2, 4) + '/' + raw.slice(4)
                        setNewOrderDobDisplay(display)
                        if (raw.length === 8) {
                          const dd = raw.slice(0, 2), mm = raw.slice(2, 4), yyyy = raw.slice(4, 8)
                          if (Number(dd) <= 31 && Number(mm) <= 12 && yyyy.length === 4) {
                            setNewOrderDob(`${yyyy}-${mm}-${dd}`)
                          } else {
                            setNewOrderDob('')
                          }
                        } else {
                          setNewOrderDob('')
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                )}

                {newOrderCustomer && (
                  <div className="bg-green/5 border border-green/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-secondary">{newOrderCustomer.name}</p>
                      <p className="text-xs text-gray-400">{newOrderCustomer.phone}</p>
                    </div>
                    <Check className="w-5 h-5 text-green flex-shrink-0" />
                  </div>
                )}

                {newOrderType === 'dine-in' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Number of Guests</label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setNewOrderPax(Math.max(1, newOrderPax - 1))}
                      className="w-11 h-11 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-12 text-center text-2xl font-bold text-secondary">{newOrderPax}</span>
                    <button
                      onClick={() => setNewOrderPax(Math.min(20, newOrderPax + 1))}
                      className="w-11 h-11 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                )}

                {newOrderType === 'dine-in' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Select Table</label>
                    <div className="grid grid-cols-3 gap-2">
                      {tables.map((t) => {
                        const isOccupied = occupiedIds.includes(t.id)
                        const isSuggested = suggested && suggested.id === t.id && !isOccupied
                        const isSelected = newOrderTable === t.id
                        const assignment = getTableAssignment(t.id)
                        const hasKot = hasKotForTable(t.id)
                        return (
                          <button
                            key={t.id}
                            disabled={isOccupied}
                            onClick={() => !isOccupied && setNewOrderTable(t.id)}
                            className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                              isOccupied
                                ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                                : isSelected
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : isSuggested
                                    ? 'border-green bg-green/5'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            {isSuggested && (
                              <span className="absolute -top-1.5 -right-1.5 bg-green text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                                <Sparkles className="w-3 h-3" />
                              </span>
                            )}
                            {isSelected && (
                              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                            <p className={`font-bold text-sm ${isSelected ? 'text-primary' : isSuggested ? 'text-green' : 'text-secondary'}`}>
                              {t.name.replace('Table ', 'T')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{t.seats} seats</p>
                            {isOccupied && assignment && hasKot && (
                              <p className="text-[9px] text-red-400 font-semibold mt-1">Busy — ordered</p>
                            )}
                            {isOccupied && assignment && !hasKot && (
                              <p className="text-[9px] text-orange-400 font-semibold mt-1">Seated — waiting</p>
                            )}
                            {isOccupied && !assignment && (
                              <p className="text-[9px] text-red-400 font-semibold mt-1">Busy</p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={startNewOrder}
                  disabled={newOrderType === 'dine-in' && !newOrderTable}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-orange text-white font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  Start Order
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )
      })()}
      <ItemDetailModal
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onAddToCart={(item) => addItem(item)}
      />
      </div>
    </div>
  )
}
