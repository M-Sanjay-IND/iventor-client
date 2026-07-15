import * as React from 'react'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6

export interface OtpInputProps {
  /** Number of OTP digits */
  length?: number
  /** Called when all digits are entered */
  onComplete: (otp: string) => void
  /** Called on every change with the current partial/full value */
  onChange?: (value: string) => void
  /** Disables all inputs */
  disabled?: boolean
  /** Shows error styling */
  hasError?: boolean
  /** Additional class name for the container */
  className?: string
  /** Auto-focus the first input on mount */
  autoFocus?: boolean
}

/**
 * Six-digit OTP input with auto-focus, paste support, and backspace navigation.
 *
 * Features:
 * - Auto-advances focus on digit entry
 * - Backspace navigates to previous input
 * - Supports paste of full OTP code
 * - Error state styling
 * - Accessible with aria labels
 *
 * @example
 * <OtpInput onComplete={(otp) => verifyOtp(otp)} />
 */
export function OtpInput({
  length = OTP_LENGTH,
  onComplete,
  onChange,
  disabled = false,
  hasError = false,
  className,
  autoFocus = true,
}: OtpInputProps) {
  const [values, setValues] = React.useState<string[]>(Array(length).fill(''))
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  /** Focus a specific input by index */
  const focusInput = React.useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, length - 1))
      inputRefs.current[clampedIndex]?.focus()
    },
    [length],
  )

  /** Auto-focus first input on mount */
  React.useEffect(() => {
    if (autoFocus && !disabled) {
      // Small delay to ensure DOM is ready after animation
      const timer = setTimeout(() => focusInput(0), 100)
      return () => clearTimeout(timer)
    }
  }, [autoFocus, disabled, focusInput])

  /** Update a digit and manage focus */
  const handleChange = React.useCallback(
    (index: number, digit: string) => {
      // Only allow single digits
      const sanitized = digit.replace(/\D/g, '').slice(0, 1)

      setValues((prev) => {
        const next = [...prev]
        next[index] = sanitized
        const combined = next.join('')

        onChange?.(combined)

        if (combined.length === length && !combined.includes('')) {
          onComplete(combined)
        }

        return next
      })

      // Auto-advance on valid digit
      if (sanitized && index < length - 1) {
        focusInput(index + 1)
      }
    },
    [length, onChange, onComplete, focusInput],
  )

  /** Handle keyboard navigation */
  const handleKeyDown = React.useCallback(
    (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'Backspace':
          event.preventDefault()
          if (values[index]) {
            // Clear current digit
            handleChange(index, '')
          } else if (index > 0) {
            // Move to and clear previous digit
            handleChange(index - 1, '')
            focusInput(index - 1)
          }
          break

        case 'ArrowLeft':
          event.preventDefault()
          if (index > 0) focusInput(index - 1)
          break

        case 'ArrowRight':
          event.preventDefault()
          if (index < length - 1) focusInput(index + 1)
          break

        case 'Delete':
          event.preventDefault()
          handleChange(index, '')
          break
      }
    },
    [values, length, handleChange, focusInput],
  )

  /** Handle paste — fill all inputs from clipboard */
  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault()
      const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)

      if (pasted.length === 0) return

      const newValues = Array(length).fill('')
      for (let i = 0; i < pasted.length; i++) {
        newValues[i] = pasted[i]
      }

      setValues(newValues)
      const combined = newValues.join('')
      onChange?.(combined)

      if (combined.length === length) {
        onComplete(combined)
        // Focus last input
        focusInput(length - 1)
      } else {
        // Focus next empty input
        focusInput(pasted.length)
      }
    },
    [length, onChange, onComplete, focusInput],
  )

  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      role="group"
      aria-label="One-time password input"
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          value={values[index]}
          disabled={disabled}
          aria-label={`Digit ${String(index + 1)} of ${String(length)}`}
          aria-invalid={hasError}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg border text-center text-lg font-semibold',
            'bg-background text-foreground',
            'ring-offset-background transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError
              ? 'border-destructive ring-destructive animate-shake'
              : 'border-input',
            values[index] && !hasError && 'border-primary',
          )}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}

