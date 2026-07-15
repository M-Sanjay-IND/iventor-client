/**
 * PublicRoute — Route guard for unauthenticated pages.
 *
 * Wraps auth pages (login, etc.). Redirects to /admin
 * if the user is already authenticated.
 *
 * Prevents authenticated users from seeing the login page.
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '@/components/ui/spinner'

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()

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

  // Redirect to admin dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  // Render the public route's children
  return <Outlet />
}
