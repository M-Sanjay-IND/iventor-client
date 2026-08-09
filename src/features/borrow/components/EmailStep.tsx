import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import { borrowerEmailSchema, type BorrowerEmailInput } from '../validation/schemas'
import { COUNTER_EMAIL_DOMAIN } from '@/constants'

interface EmailStepProps {
  onSubmit: (email: string) => Promise<void>
  loading: boolean
}

export function EmailStep({ onSubmit, loading }: EmailStepProps) {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BorrowerEmailInput>({
    resolver: zodResolver(borrowerEmailSchema),
  })

  async function handleFormSubmit(data: BorrowerEmailInput) {
    setSubmitted(true)
    await onSubmit(data.email)
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Mail className="size-10 text-primary" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Welcome
      </h2>
      <p className="mt-2 text-center text-muted-foreground">
        Enter your email to get started
      </p>

      {COUNTER_EMAIL_DOMAIN && (
        <p className="mt-1 text-sm text-muted-foreground/70">
          Only <span className="font-medium">@{COUNTER_EMAIL_DOMAIN}</span> emails are accepted
        </p>
      )}

      <form
        onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)}
        className="mt-8 w-full space-y-4"
      >
        <div>
          <input
            {...register('email')}
            type="email"
            autoFocus
            autoComplete="email"
            disabled={loading || submitted}
            placeholder={COUNTER_EMAIL_DOMAIN ? `you@${COUNTER_EMAIL_DOMAIN}` : 'your@email.com'}
            className="h-14 w-full rounded-xl border border-border bg-card px-5 text-lg text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || submitted}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              Send OTP
              <ArrowRight className="size-5" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}
