import { useState, useEffect } from 'react'
import { KeyRound, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'
import { OtpInput } from '@/components/ui/otp-input'
import { COUNTER_OTP_RESEND_COOLDOWN_MS } from '@/constants'

interface OtpStepProps {
  email: string
  onVerify: (otp: string) => Promise<void>
  onResend: () => Promise<void>
  onBack: () => void
  loading: boolean
}

export function OtpStep({ email, onVerify, onResend, onBack, loading }: OtpStepProps) {
  const [otp, setOtp] = useState('')
  const [cooldown, setCooldown] = useState(60) // 60s initial cooldown
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function handleVerify(code: string) {
    if (code.length !== 6 || loading) return
    setError(null)
    try {
      await onVerify(code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending || loading) return
    setResending(true)
    setError(null)
    try {
      await onResend()
      setCooldown(Math.floor(COUNTER_OTP_RESEND_COOLDOWN_MS / 1000))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <button
        onClick={onBack}
        disabled={loading}
        className="mb-6 flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        <ArrowLeft className="size-4" /> Change Email
      </button>

      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <KeyRound className="size-10 text-primary" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Enter Verification Code
      </h2>
      <p className="mt-2 text-center text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="mt-8 w-full space-y-6">
        <OtpInput
          length={6}
          onComplete={(code) => void handleVerify(code)}
          onChange={(val) => {
            setOtp(val)
            if (error) setError(null)
          }}
          disabled={loading}
          hasError={!!error}
          className="scale-110"
        />

        {error && (
          <p className="text-center text-sm font-medium text-red-500">{error}</p>
        )}

        <button
          type="button"
          onClick={() => void handleVerify(otp)}
          disabled={otp.length !== 6 || loading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : 'Verify & Continue'}
        </button>

        <div className="flex items-center justify-center text-sm">
          {cooldown > 0 ? (
            <span className="text-muted-foreground">
              Resend code in <span className="font-mono font-medium text-foreground">{cooldown}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={resending || loading}
              className="flex items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
