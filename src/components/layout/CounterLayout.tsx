import { Outlet } from 'react-router-dom'
import { APP_NAME } from '@/constants'
import { Monitor } from 'lucide-react'

export function CounterLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Minimal header */}
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Monitor className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {APP_NAME}
            </h1>
            <p className="text-xs text-muted-foreground">Counter Terminal</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center p-6">
        <Outlet />
      </main>

      {/* Subtle background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-[0.07] blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.15 250) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full opacity-[0.05] blur-3xl"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.15 310) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  )
}
