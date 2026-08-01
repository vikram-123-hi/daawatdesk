import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { KOTProvider } from './context/KOTContext'
import { InventoryProvider } from './context/InventoryContext'
import { CodeAccessProvider } from './context/CodeAccessContext'
import { CustomerProvider } from './context/CustomerContext'
import { ExpenseProvider } from './context/ExpenseContext'
import { SupplierProvider } from './context/SupplierContext'
import { ReservationProvider } from './context/ReservationContext'
import { FeedbackProvider } from './context/FeedbackContext'
import { isLicenseValid } from './utils/license'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TrustedBy from './components/TrustedBy'
import Features from './components/Features'
import Marketplace from './components/Marketplace'
import Integrations from './components/Integrations'
import OutletTypes from './components/OutletTypes'
import Testimonials from './components/Testimonials'
import Stats from './components/Stats'
import Ratings from './components/Ratings'
import DemoForm from './components/DemoForm'
import Footer from './components/Footer'
import SmartAssistant from './components/SmartAssistant'
import CodeAccessRoute from './components/CodeAccessRoute'

const Billing = lazy(() => import('./components/Billing'))
const Dashboard = lazy(() => import('./components/Dashboard'))
const Login = lazy(() => import('./components/Login'))
const Register = lazy(() => import('./components/Register'))
const Kitchen = lazy(() => import('./components/Kitchen'))
const KitchenStaff = lazy(() => import('./components/KitchenStaff'))
const Inventory = lazy(() => import('./components/Inventory'))
const Reports = lazy(() => import('./components/Reports'))
const CRM = lazy(() => import('./components/CRM'))
const Admin = lazy(() => import('./components/Admin'))
const LicenseExpired = lazy(() => import('./components/LicenseExpired'))
const Renew = lazy(() => import('./components/Renew'))
const CustomerMenu = lazy(() => import('./components/CustomerMenu'))
const Expenses = lazy(() => import('./components/Expenses'))
const Suppliers = lazy(() => import('./components/Suppliers'))
const Reservations = lazy(() => import('./components/Reservations'))
const FeedbackPage = lazy(() => import('./components/Feedback'))

function ProtectedRoute({ children }) {
  const { currentUser, userProfile, profileFetched, loading } = useAuth()
  const [freshValid, setFreshValid] = useState(null)

  useEffect(() => {
    if (!currentUser) return
    let cancelled = false
    async function verify() {
      try {
        const docSnap = await getDoc(doc(db, 'users', currentUser.uid))
        if (cancelled) return
        if (!docSnap.exists()) {
          setFreshValid(false)
          return
        }
        const data = docSnap.data()
        setFreshValid(data.licenseExpiry ? isLicenseValid(data.licenseExpiry) : false)
      } catch {
        if (!cancelled) setFreshValid(true)
      }
    }
    verify()
    return () => { cancelled = true }
  }, [currentUser, window.location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (profileFetched && !userProfile) {
    return <Navigate to="/login" />
  }

  if (freshValid === false) {
    return <Navigate to="/license-expired" />
  }

  if (freshValid === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Verifying license...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      <SmartAssistant />
    </>
  )
}

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <Marketplace />
      <Stats />
      <Integrations />
      <OutletTypes />
      <Testimonials />
      <Ratings />
      <DemoForm />
      <Footer />
    </>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CodeAccessProvider>
        <CustomerProvider>
        <KOTProvider>
          <InventoryProvider>
          <ExpenseProvider>
          <SupplierProvider>
          <ReservationProvider>
          <FeedbackProvider>
          <Suspense fallback={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500 font-medium text-sm">Loading...</p>
              </div>
            </div>
          }>
          <Routes>
            <Route path="/menu" element={<CustomerMenu />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <CodeAccessRoute pagePath="/inventory">
                  <Inventory />
                </CodeAccessRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <CodeAccessRoute pagePath="/reports">
                  <Reports />
                </CodeAccessRoute>
              }
            />
            <Route
              path="/crm"
              element={
                <ProtectedRoute>
                  <CRM />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute>
                  <Kitchen />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kitchen-staff"
              element={<KitchenStaff />}
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route path="/admin" element={<Admin />} />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <Reservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              }
            />
            <Route path="/license-expired" element={<LicenseExpired />} />
            <Route path="/renew" element={<Renew />} />
          </Routes>
          </Suspense>
          </FeedbackProvider>
          </ReservationProvider>
          </SupplierProvider>
          </ExpenseProvider>
          </InventoryProvider>
        </KOTProvider>
        </CustomerProvider>
        </CodeAccessProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
