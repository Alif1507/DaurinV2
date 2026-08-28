import { lazy, Suspense, useLayoutEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import About from './components/About/About'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import Camide from './components/Camide/Camide'
import EducationAccordion from './components/EducationAccordion/EducationAccordion'
import Flow from './components/Flow/Flow'
import Hero from './components/Hero/Hero'
import Navbar from './components/Navbar/Navbar'

const CamidePage = lazy(() => import('./pages/Camide/CamidePage'))
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'))
const ReportsDashboardPage = lazy(() => import('./pages/Dashboard/DashboardWorkspacePages').then((module) => ({ default: module.ReportsDashboardPage })))
const WasteDashboardPage = lazy(() => import('./pages/Dashboard/DashboardWorkspacePages').then((module) => ({ default: module.WasteDashboardPage })))
const CamideDashboardPage = lazy(() => import('./pages/Dashboard/DashboardWorkspacePages').then((module) => ({ default: module.CamideDashboardPage })))
const LocationsDashboardPage = lazy(() => import('./pages/Dashboard/DashboardWorkspacePages').then((module) => ({ default: module.LocationsDashboardPage })))
const UsersDashboardPage = lazy(() => import('./pages/Dashboard/DashboardWorkspacePages').then((module) => ({ default: module.UsersDashboardPage })))
const NewReportPage = lazy(() => import('./pages/Reporting/NewReportPage'))
const MyReportsPage = lazy(() => import('./pages/Reporting/MyReportsPage'))
const LoginPage = lazy(() => import('./pages/Login/LoginPage'))
const RegisterPage = lazy(() => import('./pages/Register/RegisterPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPassword/ResetPasswordPage'))

function RouteLoader() {
  return <div className="route-state"><span className="route-state__loader" />Memuat halaman...</div>
}

function LandingPage() {
  useLayoutEffect(() => {
    const targetId = window.location.hash.slice(1)
    if (!targetId) return undefined
    let loadedFrame = 0
    const scrollToTarget = () => {
      const root = document.documentElement
      const previous = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' })
      window.requestAnimationFrame(() => { root.style.scrollBehavior = previous })
    }
    const afterLoad = () => { loadedFrame = window.requestAnimationFrame(scrollToTarget) }
    scrollToTarget()
    if (document.readyState === 'complete') afterLoad()
    else window.addEventListener('load', afterLoad, { once: true })
    return () => {
      window.cancelAnimationFrame(loadedFrame)
      window.removeEventListener('load', afterLoad)
    }
  }, [])

  return <main><Navbar /><Hero /><About /><Flow /><EducationAccordion /><Camide /></main>
}

function DashboardAccess({ children, allowedRoles = ['staff', 'admin'] }) {
  return <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>
}

function ReportingAccess({ children }) {
  return <ProtectedRoute allowedRoles={['student', 'teacher', 'staff', 'admin']}>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/report" element={<ReportingAccess><NewReportPage /></ReportingAccess>} />
        <Route path="/my-reports" element={<ReportingAccess><MyReportsPage /></ReportingAccess>} />
        <Route path="/dashboard" element={<DashboardAccess><DashboardPage /></DashboardAccess>} />
        <Route path="/dashboard/reports" element={<DashboardAccess><ReportsDashboardPage /></DashboardAccess>} />
        <Route path="/dashboard/waste" element={<DashboardAccess><WasteDashboardPage /></DashboardAccess>} />
        <Route path="/dashboard/camide" element={<DashboardAccess><CamideDashboardPage /></DashboardAccess>} />
        <Route path="/dashboard/locations" element={<DashboardAccess><LocationsDashboardPage /></DashboardAccess>} />
        <Route path="/dashboard/users" element={<DashboardAccess allowedRoles={['admin']}><UsersDashboardPage /></DashboardAccess>} />
        <Route path="/camide" element={<ProtectedRoute allowedRoles={['student', 'teacher', 'staff', 'admin']}><CamidePage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
