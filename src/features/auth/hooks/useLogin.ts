/**
 * useLogin hook — multi-step login state machine.
 *
 * Manages the two-step admin login flow:
 *   Step 1: Email + Password → signInWithPassword
 *   Step 2: OTP Verification → verifyOtp
 *
 * States: credentials → otp → verifying → success / error
 *
 * @example
 * const { step, submitCredentials, submitOtp, error, isSubmitting } = useLogin()
 */

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import * as authService from '../services/auth.service'
import { loginSchema, type LoginFormValues } from '../validation/schemas'
import { AUDIT_ACTIONS } from '@/constants'
import type { LoginStep } from '../types'

interface UseLoginReturn {
  /** Current step of the login flow */
  step: LoginStep
  /** Email used in the current login attempt (for OTP step) */
  email: string
  /** Whether a submission is in progress */
  isSubmitting: boolean
  /** react-hook-form instance for the credentials step */
  credentialsForm: ReturnType<typeof useForm<LoginFormValues>>
  /** Submit credentials (step 1) */
  submitCredentials: (values: LoginFormValues) => Promise<void>
  /** Submit OTP code (step 2) */
  submitOtp: (otp: string) => Promise<void>
  /** Resend the OTP code */
  resendOtp: () => Promise<void>
  /** Go back to the credentials step */
  goBack: () => void
  /** Error message, if any */
  error: string | null
}

/**
 * Seconds to wait before allowing OTP resend.
 */
const OTP_RESEND_COOLDOWN_S = 60

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
   * Step 1: Submit email + password.
   *
   * On success, sends OTP and transitions to the OTP step.
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

        // Send OTP for step 2
        await authService.sendOtp(values.email)
        setEmail(values.email)
        setStep('otp')

        toast.success('Verification code sent', {
          description: `A 6-digit code has been sent to ${values.email}`,
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
   * Step 2: Submit OTP code.
   *
   * Verifies the OTP and completes authentication.
   */
  const submitOtp = useCallback(
    async (otp: string) => {
      setError(null)
      setIsSubmitting(true)
      setStep('verifying')

      try {
        await authService.verifyOtp(email, otp)

        // Update last_login timestamp
        const session = await authService.getSession()
        if (session?.user) {
          await authService.updateLastLogin(session.user.id)
          await authService.recordAuditLog(AUDIT_ACTIONS.AUTH_LOGIN)
        }

        setStep('success')

        toast.success('Welcome back', {
          description: 'You have been signed in successfully.',
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Invalid verification code'
        setError(message)
        setStep('otp') // Go back to OTP input to retry

        toast.error('Verification failed', {
          description: 'The code you entered is incorrect. Please try again.',
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [email],
  )

  /**
   * Resend OTP to the same email.
   */
  const resendOtp = useCallback(async () => {
    setError(null)

    try {
      await authService.sendOtp(email)
      toast.success('Code resent', {
        description: `A new verification code has been sent to ${email}`,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to resend code'
      toast.error('Resend failed', { description: message })
    }
  }, [email])

  /**
   * Go back to the credentials step.
   */
  const goBack = useCallback(() => {
    setStep('credentials')
    setError(null)
    setEmail('')
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

export { OTP_RESEND_COOLDOWN_S }
