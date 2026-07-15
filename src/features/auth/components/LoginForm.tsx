/**
 * LoginForm — Email + Password credentials form (Step 1).
 *
 * Uses react-hook-form with Zod validation.
 * Displays validation errors inline below each field.
 */

import type { UseFormReturn } from 'react-hook-form'
import type { LoginFormValues } from '../validation/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock } from 'lucide-react'

interface LoginFormProps {
  /** react-hook-form instance from useLogin */
  form: UseFormReturn<LoginFormValues>
  /** Called when the form is submitted with valid values */
  onSubmit: (values: LoginFormValues) => Promise<void>
  /** Whether a submission is in progress */
  isSubmitting: boolean
  /** Global error message (e.g., from auth service) */
  error: string | null
}

export function LoginForm({ form, onSubmit, isSubmitting, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
      id="login-form"
    >
      {/* Global error */}
      {error && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          id="login-error"
        >
          {error}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder="admin@organization.com"
            autoComplete="email"
            autoFocus
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className="pl-10"
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p id="login-email-error" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? 'login-password-error' : undefined
            }
            className="pl-10"
            {...register('password')}
          />
        </div>
        {errors.password && (
          <p id="login-password-error" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
        id="login-submit"
      >
        Continue
      </Button>
    </form>
  )
}
