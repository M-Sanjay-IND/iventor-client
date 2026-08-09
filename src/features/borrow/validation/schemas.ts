import { z } from 'zod'
import { COUNTER_EMAIL_DOMAIN } from '@/constants'

export const borrowerEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(
      (email) => {
        if (!COUNTER_EMAIL_DOMAIN) return true
        return email.toLowerCase().endsWith(`@${COUNTER_EMAIL_DOMAIN.toLowerCase()}`)
      },
      {
        message: COUNTER_EMAIL_DOMAIN
          ? `Only @${COUNTER_EMAIL_DOMAIN} emails are accepted`
          : 'Invalid email',
      },
    ),
})

export const borrowerOtpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
})

export type BorrowerEmailInput = z.infer<typeof borrowerEmailSchema>
export type BorrowerOtpInput = z.infer<typeof borrowerOtpSchema>
