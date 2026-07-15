/**
 * Authentication type definitions.
 *
 * These types model the auth domain: admin profiles, roles,
 * sessions, and login flow state.
 */

import type { BaseEntity } from '@/types'

/** Predefined role names — matches the seeded `roles` table */
export type RoleName = 'super_admin' | 'admin' | 'viewer'

/** Role record from the database */
export interface Role {
  id: string
  name: RoleName
  description: string
  created_at: string
  updated_at: string
}

/** Admin profile record from the database */
export interface AdminProfile extends BaseEntity {
  user_id: string
  role_id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  status: AdminProfileStatus
  last_login: string | null
}

/** Admin account statuses */
export type AdminProfileStatus = 'active' | 'suspended' | 'deactivated'

/** Admin profile with the role object joined */
export interface AdminProfileWithRole extends AdminProfile {
  role: Role
}

/** Credentials for step 1 of admin login */
export interface LoginCredentials {
  email: string
  password: string
}

/** OTP verification payload for step 2 */
export interface OtpVerification {
  email: string
  token: string
}

/** Multi-step login flow states */
export type LoginStep = 'credentials' | 'otp' | 'verifying' | 'success' | 'error'

/** Auth session state exposed by AuthProvider */
export interface AuthState {
  /** Supabase user object (null if not authenticated) */
  user: AuthUser | null
  /** Admin profile with role (null if not loaded yet) */
  profile: AdminProfileWithRole | null
  /** True while checking session on initial load */
  isLoading: boolean
  /** True when user is authenticated AND has a valid admin profile */
  isAuthenticated: boolean
}

/** Minimal user shape from Supabase Auth */
export interface AuthUser {
  id: string
  email: string
  email_confirmed_at: string | null
}

/** Auth context actions */
export interface AuthActions {
  /** Sign out the current user */
  signOut: () => Promise<void>
  /** Refresh the admin profile from the database */
  refreshProfile: () => Promise<void>
}

/** Combined auth context value */
export type AuthContextValue = AuthState & AuthActions
