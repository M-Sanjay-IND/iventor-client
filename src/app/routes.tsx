import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, ProtectedRoute, PublicRoute } from '@/features/auth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DashboardPage } from '@/features/dashboard'
import { InventoryPage } from '@/features/inventory'
import { QrPage } from '@/features/qr'
import { ReportsPage } from '@/features/reports'
import { SettingsPage } from '@/features/settings'

/**
 * Application route definitions.
 *
 * Routes are organized by interface:
 * - /login       → Public login page (redirects to /admin if authenticated)
 * - /admin/*     → Admin Dashboard (protected, redirects to /login if not)
 * - /counter/*   → Counter Terminal (future milestone)
 *
 * Route guards:
 * - PublicRoute  → Wraps auth pages, redirects authenticated users away
 * - ProtectedRoute → Wraps admin pages, redirects unauthenticated to login
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Root → redirect to admin dashboard */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Public routes (login, etc.) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected admin routes — wrapped in AdminLayout */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="qr" element={<QrPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
