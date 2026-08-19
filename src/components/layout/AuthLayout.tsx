import { APP_NAME, APP_DESCRIPTION } from '@/constants'
import { ThemeToggle } from './ThemeToggle'
import { Boxes } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Monochromatic ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-96 w-96 rounded-full opacity-[0.03] dark:opacity-[0.06] blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--foreground) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-[0.03] dark:opacity-[0.06] blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--foreground) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground skeuo-button-primary shadow-lg">
            <Boxes className="size-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {APP_DESCRIPTION}
          </p>
        </div>

        {/* Auth card content */}
        {children}
      </div>
    </div>
  )
}
