/**
 * AuthProvider and useAuth hook.
 *
 * Manages the global authentication state:
 * - Initializes session on mount
 * - Subscribes to auth state changes
 * - Fetches admin profile with role
 * - Provides signOut and refreshProfile actions
 *
 * Usage:
 *   Wrap <App> with <AuthProvider>
 *   Access state via useAuth() in any component
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { AuthContextValue, AdminProfileWithRole, AuthUser } from '../types'
import * as authService from '../services/auth.service'

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<AdminProfileWithRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Fetch admin profile for a given user ID.
   * If no profile exists, user is authenticated but not an admin.
   */
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const adminProfile = await authService.getAdminProfile(userId)
      setProfile(adminProfile)
    } catch (error) {
      console.error('[AuthProvider] Failed to fetch profile:', error)
      setProfile(null)
    }
  }, [])

  /**
   * Initialize session on mount.
   * Checks if user is already authenticated (e.g., persisted session).
   */
  useEffect(() => {
    let isMounted = true

    async function initSession() {
      try {
        const session = await authService.getSession()

        if (session?.user && isMounted) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email ?? '',
            email_confirmed_at: session.user.email_confirmed_at ?? null,
          }
          setUser(authUser)
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('[AuthProvider] Session init failed:', error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void initSession()

    return () => {
      isMounted = false
    }
  }, [fetchProfile])

  /**
   * Subscribe to Supabase auth state changes.
   * Handles sign-in, sign-out, and token refresh events.
   */
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(
      (event, session) => {
        const typedSession = session as {
          user?: { id: string; email?: string; email_confirmed_at?: string }
        } | null

        if (
          event === 'SIGNED_IN' &&
          typedSession?.user
        ) {
          const authUser: AuthUser = {
            id: typedSession.user.id,
            email: typedSession.user.email ?? '',
            email_confirmed_at: typedSession.user.email_confirmed_at ?? null,
          }
          setUser(authUser)
          void fetchProfile(typedSession.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        } else if (
          event === 'TOKEN_REFRESHED' &&
          typedSession?.user
        ) {
          const authUser: AuthUser = {
            id: typedSession.user.id,
            email: typedSession.user.email ?? '',
            email_confirmed_at: typedSession.user.email_confirmed_at ?? null,
          }
          setUser(authUser)
        }
      },
    )

    return unsubscribe
  }, [fetchProfile])

  /**
   * Sign out and clear all state.
   */
  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  /**
   * Refresh the admin profile from the database.
   * Useful after role changes or profile updates.
   */
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  // ============================================================================
  // Memoized context value
  // ============================================================================

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: !!user && !!profile && profile.status === 'active',
      signOut,
      refreshProfile,
    }),
    [user, profile, isLoading, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Access the auth context.
 *
 * Must be used within an <AuthProvider>.
 *
 * @example
 * const { user, profile, isAuthenticated, signOut } = useAuth()
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
        'Wrap your app with <AuthProvider> in App.tsx.',
    )
  }

  return context
}
