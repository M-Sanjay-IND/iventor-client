/**
 * Auth validation schemas (Zod).
 *
 * Used by react-hook-form for client-side validation
 * of login credentials and OTP input.
 */

import { z } from 'zod'

/**
 * Login credentials schema.
 *
 * Validates email format and password presence.
 * Password strength is NOT enforced here — that's handled
 * during account creation, not login.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

/** Inferred type from the login schema */
export type LoginFormValues = z.infer<typeof loginSchema>

/**
 * OTP verification schema.
 *
 * Validates that the OTP is exactly 6 numeric digits.
 */
export const otpSchema = z.object({
  email: z
    .string()
    .email(),
  token: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
})

/** Inferred type from the OTP schema */
export type OtpFormValues = z.infer<typeof otpSchema>
