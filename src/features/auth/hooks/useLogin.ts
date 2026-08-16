/**
 * useLogin hook — admin login state machine.
 *
 * Manages admin authentication:
 *   Submits email + password → verifies admin profile → records audit log → success.
 */

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import * as authService from '../services/auth.service'
import { loginSchema, type LoginFormValues } from '../validation/schemas'
import { AUDIT_ACTIONS } from '@/constants'
import type { LoginStep } from '../types'

export const OTP_RESEND_COOLDOWN_S = 60

interface UseLoginReturn {
  /** Current step of the login flow */
  step: LoginStep
  /** Email used in the current login attempt */
  email: string
  /** Whether a submission is in progress */
  isSubmitting: boolean
  /** react-hook-form instance for the credentials step */
  credentialsForm: ReturnType<typeof useForm<LoginFormValues>>
  /** Submit credentials */
  submitCredentials: (values: LoginFormValues) => Promise<void>
  /** Submit OTP code (if enabled) */
  submitOtp: (otp: string) => Promise<void>
  /** Resend the OTP code */
  resendOtp: () => Promise<void>
  /** Go back to the credentials step */
  goBack: () => void
  /** Error message, if any */
  error: string | null
}

export function useLogin(): UseLoginReturn {
  const [step, setStep] = useState<LoginStep>('credentials')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // React Hook Form for credentials step
  const credentialsForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  /**
   * Submit email + password for admin login.
   */
  const submitCredentials = useCallback(
    async (values: LoginFormValues) => {
      setError(null)
      setIsSubmitting(true)

      try {
        // Authenticate with password
        await authService.signInWithPassword(values.email, values.password)

        // Check if user has an admin profile
        const session = await authService.getSession()
        if (!session?.user) {
          throw new Error('Authentication failed. Please try again.')
        }

        const profile = await authService.getAdminProfile(session.user.id)
        if (!profile) {
          // Sign out — they authenticated but aren't an admin
          await authService.signOut()
          throw new Error(
            'Access denied. Your account does not have administrator privileges.',
          )
        }

        if (profile.status !== 'active') {
          await authService.signOut()
          throw new Error(
            'Your account has been suspended or deactivated. Contact your administrator.',
          )
        }

        // Update last_login timestamp and audit log
        await authService.updateLastLogin(session.user.id)
        try {
          await authService.recordAuditLog(AUDIT_ACTIONS.AUTH_LOGIN)
        } catch {
          // Non-critical
        }

        setEmail(values.email)
        setStep('success')

        toast.success('Welcome back', {
          description: `Signed in as ${[profile.first_name, profile.last_name].filter(Boolean).join(' ') || values.email}`,
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(message)

        // Record failed login attempt (best effort)
        try {
          await authService.recordAuditLog(
            AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
            undefined,
            undefined,
            { email: values.email, reason: message },
            'failure',
          )
        } catch {
          // Non-critical
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [],
  )

  /**
   * Fallback OTP submit (if needed)
   */
  const submitOtp = useCallback(
    async (otp: string) => {
      setError(null)
      setIsSubmitting(true)
      setStep('verifying')

      try {
        await authService.verifyOtp(email, otp)
        const session = await authService.getSession()
        if (session?.user) {
          await authService.updateLastLogin(session.user.id)
        }
        setStep('success')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Invalid verification code'
        setError(message)
        setStep('otp')
      } finally {
        setIsSubmitting(false)
      }
    },
    [email],
  )

  const resendOtp = useCallback(async () => {
    if (!email) return
    setError(null)
    try {
      await authService.sendOtp(email)
      toast.success('Code resent')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    }
  }, [email])

  const goBack = useCallback(() => {
    setError(null)
    setStep('credentials')
  }, [])

  return {
    step,
    email,
    isSubmitting,
    credentialsForm,
    submitCredentials,
    submitOtp,
    resendOtp,
    goBack,
    error,
  }
}
