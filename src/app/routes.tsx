import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage, ProtectedRoute, PublicRoute } from '@/features/auth'

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

      {/* Protected admin routes */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route
          index
          element={
            <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                  Admin Dashboard
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Welcome — dashboard modules coming in the next milestone.
                </p>
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  )
}
