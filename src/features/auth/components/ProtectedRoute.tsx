/**
 * ProtectedRoute — Route guard for authenticated admin users.
 *
 * Wraps admin routes. Redirects to /login if:
 * - No active session
 * - User doesn't have an admin profile
 * - Account is not active
 *
 * Shows a loading state while the session is being checked.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '@/components/ui/spinner'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while session is initializing
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  // Render the protected route's children
  return <Outlet />
}
