/**
 * AuthLayout — Full-screen centered layout for authentication pages.
 *
 * Features:
 * - Centered card with glassmorphism styling
 * - Subtle animated gradient background
 * - Responsive for mobile and desktop
 * - Brand logo and tagline
 */

import { APP_NAME, APP_DESCRIPTION } from '@/constants'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Animated gradient background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, oklch(0.65 0.15 250) 0%, transparent 70%)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-15 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, oklch(0.65 0.15 310) 0%, transparent 70%)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full opacity-10 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, oklch(0.7 0.12 180) 0%, transparent 70%)',
            animation: 'float 12s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {APP_DESCRIPTION}
          </p>
        </div>

        {/* Auth card content */}
        {children}
      </div>

      {/* Float animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}
