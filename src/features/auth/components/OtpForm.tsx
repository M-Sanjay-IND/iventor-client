/**
 * OtpForm — 6-digit OTP verification form (Step 2).
 *
 * Features:
 * - OTP digit input with auto-advance and paste support
 * - Countdown timer for resend cooldown
 * - Resend OTP button
 * - Back to credentials button
 */

import { useCallback, useEffect, useState } from 'react'
import { OtpInput } from '@/components/ui/otp-input'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { OTP_RESEND_COOLDOWN_S } from '../hooks/useLogin'

interface OtpFormProps {
  /** Email the OTP was sent to */
  email: string
  /** Called when all 6 digits are entered */
  onSubmit: (otp: string) => Promise<void>
  /** Resend OTP to the same email */
  onResend: () => Promise<void>
  /** Go back to credentials step */
  onBack: () => void
  /** Whether verification is in progress */
  isSubmitting: boolean
  /** Error message */
  error: string | null
}

export function OtpForm({
  email,
  onSubmit,
  onResend,
  onBack,
  isSubmitting,
  error,
}: OtpFormProps) {
  const [countdown, setCountdown] = useState(OTP_RESEND_COOLDOWN_S)
  const [otpKey, setOtpKey] = useState(0)

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev: number) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [countdown])

  /** Handle OTP completion */
  const handleComplete = useCallback(
    (otp: string) => {
      if (!isSubmitting) {
        void onSubmit(otp)
      }
    },
    [isSubmitting, onSubmit],
  )

  /** Resend OTP and reset timer */
  const handleResend = useCallback(async () => {
    await onResend()
    setCountdown(OTP_RESEND_COOLDOWN_S)
    // Reset OTP input by changing the key
    setOtpKey((prev) => prev + 1)
  }, [onResend])

  /** Mask email for display: ad***@domain.com */
  const maskedEmail = email.replace(
    /^(.{2})(.*)(@.*)$/,
    (_match: string, start: string, middle: string, end: string) =>
      start + '*'.repeat(Math.min(middle.length, 5)) + end,
  )

  return (
    <div className="space-y-6" id="otp-form">
      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit verification code sent to
        </p>
        <p className="mt-1 font-medium text-foreground">{maskedEmail}</p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
          role="alert"
          id="otp-error"
        >
          {error}
        </div>
      )}

      {/* OTP Input */}
      <OtpInput
        key={otpKey}
        onComplete={handleComplete}
        disabled={isSubmitting}
        hasError={!!error}
        autoFocus
      />

      {/* Loading indicator */}
      {isSubmitting && (
        <p className="text-center text-sm text-muted-foreground">
          Verifying...
        </p>
      )}

      {/* Resend / Timer */}
      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-sm text-muted-foreground">
            Resend code in{' '}
            <span className="font-medium text-foreground">{countdown}s</span>
          </p>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={isSubmitting}
            id="otp-resend"
          >
            Resend verification code
          </Button>
        )}
      </div>

      {/* Back button */}
      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={isSubmitting}
          className="gap-1 text-muted-foreground"
          id="otp-back"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Button>
      </div>
    </div>
  )
}
