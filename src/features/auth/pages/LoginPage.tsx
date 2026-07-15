/**
 * LoginPage — Multi-step admin authentication page.
 *
 * Two-step flow:
 *   Step 1: Email + Password (LoginForm)
 *   Step 2: OTP Verification (OtpForm)
 *
 * Uses Framer Motion for smooth transitions between steps.
 * Wrapped in AuthLayout for the premium centered card design.
 */

import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthLayout } from '@/components/layout/AuthLayout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoginForm } from '../components/LoginForm'
import { OtpForm } from '../components/OtpForm'
import { useLogin } from '../hooks/useLogin'
import { APP_VERSION } from '@/constants'

/** Framer Motion variants for step transitions */
const stepVariants = {
  initial: { opacity: 0, x: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, x: -20, filter: 'blur(4px)' },
}

const transition = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    step,
    email,
    isSubmitting,
    credentialsForm,
    submitCredentials,
    submitOtp,
    resendOtp,
    goBack,
    error,
  } = useLogin()

  // Redirect to intended page on successful login
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'

  useEffect(() => {
    if (step === 'success') {
      void navigate(from, { replace: true })
    }
  }, [step, navigate, from])

  return (
    <AuthLayout>
      <Card className="border-border/50 bg-card/80 shadow-xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <AnimatePresence mode="wait">
            {step === 'credentials' && (
              <motion.div
                key="credentials-header"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <CardTitle>Welcome back</CardTitle>
                <CardDescription className="mt-1.5">
                  Sign in to your administrator account
                </CardDescription>
              </motion.div>
            )}

            {(step === 'otp' || step === 'verifying') && (
              <motion.div
                key="otp-header"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <CardTitle>Verify your identity</CardTitle>
                <CardDescription className="mt-1.5">
                  Two-factor authentication
                </CardDescription>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            {step === 'credentials' && (
              <motion.div
                key="credentials-form"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <LoginForm
                  form={credentialsForm}
                  onSubmit={submitCredentials}
                  isSubmitting={isSubmitting}
                  error={error}
                />
              </motion.div>
            )}

            {(step === 'otp' || step === 'verifying') && (
              <motion.div
                key="otp-form"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <OtpForm
                  email={email}
                  onSubmit={submitOtp}
                  onResend={resendOtp}
                  onBack={goBack}
                  isSubmitting={isSubmitting || step === 'verifying'}
                  error={error}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Version tag */}
      <p className="mt-6 text-center text-xs text-muted-foreground/50">
        v{APP_VERSION}
      </p>
    </AuthLayout>
  )
}
