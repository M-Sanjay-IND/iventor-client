/**
 * Authentication service layer.
 *
 * Encapsulates all Supabase Auth interactions.
 * Components and hooks should NEVER call Supabase directly —
 * they must go through this service.
 *
 * Flow:
 *   1. signInWithPassword(email, password) → returns session (step 1 done)
 *   2. sendOtp(email) → sends email OTP via Supabase
 *   3. verifyOtp(email, token) → verifies OTP, completes auth
 *   4. getAdminProfile(userId) → fetches profile with role
 */

import { supabase } from '@/services/supabase'
import type { AdminProfileWithRole } from '../types'
import { AUDIT_ACTIONS } from '@/constants'

// ============================================================================
// Authentication
// ============================================================================

/**
 * Step 1: Sign in with email and password.
 *
 * This authenticates the user but the login is not considered complete
 * until OTP verification succeeds (step 2).
 *
 * @throws Error if credentials are invalid or account is locked.
 */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new AuthServiceError(error.message, 'SIGN_IN_FAILED')
  }

  return data
}

/**
 * Step 2a: Send OTP to the admin's email.
 *
 * Uses Supabase's built-in email OTP (magic link / OTP).
 * The OTP is sent as a 6-digit code.
 */
export async function sendOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Never auto-create accounts
    },
  })

  if (error) {
    throw new AuthServiceError(error.message, 'OTP_SEND_FAILED')
  }
}

/**
 * Step 2b: Verify the OTP code.
 *
 * Completes the authentication flow if the token is valid.
 */
export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    throw new AuthServiceError(error.message, 'OTP_VERIFY_FAILED')
  }

  return data
}

/**
 * Sign out the current user.
 *
 * Clears the session from Supabase and local storage.
 */
export async function signOut() {
  // Record audit log before signing out (best effort)
  try {
    await recordAuditLog(AUDIT_ACTIONS.AUTH_LOGOUT)
  } catch {
    // Non-critical — don't block sign out
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new AuthServiceError(error.message, 'SIGN_OUT_FAILED')
  }
}

/**
 * Get the current session, if one exists.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new AuthServiceError(error.message, 'SESSION_FETCH_FAILED')
  }

  return data.session
}

/**
 * Subscribe to auth state changes.
 *
 * Returns an unsubscribe function for cleanup.
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void,
) {
  const { data } = supabase.auth.onAuthStateChange(callback)
  return data.subscription.unsubscribe
}

// ============================================================================
// Admin Profile
// ============================================================================

/**
 * Fetch the admin profile with role for a given user ID.
 *
 * Uses a Supabase join to fetch the role in a single query.
 * Returns null if no admin profile exists (user is not an admin).
 */
export async function getAdminProfile(
  userId: string,
): Promise<AdminProfileWithRole | null> {
  const response = await supabase
    .from('admin_profiles')
    .select(`
      *,
      role:roles(*)
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()
    
  const { data, error } = response as {
    data: unknown
    error: { message: string; code: string } | null
  }

  if (error) {
    // PGRST116 = "No rows found" — not an error, just no admin profile
    if (error.code === 'PGRST116') {
      return null
    }
    throw new AuthServiceError(error.message, 'PROFILE_FETCH_FAILED')
  }

  return data as AdminProfileWithRole
}

/**
 * Update the admin's last_login timestamp.
 */
export async function updateLastLogin(userId: string) {
  const { error } = await supabase
    .from('admin_profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) {
    // Non-critical — log but don't throw
    console.error('[auth.service] Failed to update last_login:', error.message)
  }
}

// ============================================================================
// Audit Logging
// ============================================================================

/**
 * Record an audit log entry via the Supabase RPC function.
 */
export async function recordAuditLog(
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  result: 'success' | 'failure' | 'error' = 'success',
) {
  const { error } = await supabase.rpc('record_audit_log', {
    p_action: action,
    p_resource_type: resourceType ?? null,
    p_resource_id: resourceId ?? null,
    p_details: details ?? {},
    p_result: result,
  })

  if (error) {
    // Audit log failures should not break the app
    console.error('[auth.service] Audit log failed:', error.message)
  }
}

// ============================================================================
// Error Class
// ============================================================================

/**
 * Custom error class for auth service errors.
 *
 * Provides a machine-readable error code alongside the human-readable message.
 */
export class AuthServiceError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'AuthServiceError'
    this.code = code
  }
}
