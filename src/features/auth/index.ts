/**
 * Auth feature module.
 *
 * Public API for the auth feature.
 * Import from '@/features/auth' — never reach into subfolders directly.
 */

// Provider & Hook
export { AuthProvider, useAuth } from './hooks/useAuth'
export { useLogin } from './hooks/useLogin'

// Route Guards
export { ProtectedRoute } from './components/ProtectedRoute'
export { PublicRoute } from './components/PublicRoute'

// Pages
export { LoginPage } from './pages/LoginPage'

// Types
export type {
  AdminProfile,
  AdminProfileWithRole,
  AdminProfileStatus,
  AuthContextValue,
  AuthState,
  AuthUser,
  LoginCredentials,
  LoginStep,
  OtpVerification,
  Role,
  RoleName,
} from './types'
