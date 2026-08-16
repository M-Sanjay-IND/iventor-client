import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, ProtectedRoute, PublicRoute } from '@/features/auth'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { DashboardPage } from '@/features/dashboard'
import { InventoryPage, ItemDetailPage, ItemFormPage } from '@/features/inventory'
import { TransactionsPage } from '@/features/transactions'
import { QrPage, QrDetailPage, PrintPage } from '@/features/qr'
import { ReportsPage } from '@/features/reports'
import { SettingsPage } from '@/features/settings'

import { CounterLayout } from '@/components/layout/CounterLayout'
import { CounterPage } from '@/features/borrow'

/**
 * Application route definitions.
 *
 * Routes are organized by interface:
 * - /login       → Public login page (redirects to /admin if authenticated)
 * - /admin/*     → Admin Dashboard (protected, redirects to /login if not)
 * - /counter     → Counter Terminal (public, admin-gated session)
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

      {/* Counter Terminal (Public layout, session-gated internally) */}
      <Route element={<CounterLayout />}>
        <Route path="/counter" element={<CounterPage />} />
      </Route>

      {/* Public routes (login, etc.) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected admin routes — wrapped in AdminLayout */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />

          {/* Inventory sub-routes */}
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/new" element={<ItemFormPage />} />
          <Route path="inventory/:id" element={<ItemDetailPage />} />
          <Route path="inventory/:id/edit" element={<ItemFormPage />} />

          {/* Transactions ledger */}
          <Route path="transactions" element={<TransactionsPage />} />

          {/* QR sub-routes */}
          <Route path="qr" element={<QrPage />} />
          <Route path="qr/print" element={<PrintPage />} />
          <Route path="qr/:uid" element={<QrDetailPage />} />

          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
