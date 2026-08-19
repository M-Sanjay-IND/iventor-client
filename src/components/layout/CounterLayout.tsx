import { Outlet, useNavigate } from 'react-router-dom'
import { APP_NAME } from '@/constants'
import { Monitor, ArrowLeft, Boxes } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '@/components/ui/button'

export function CounterLayout() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Minimal Header */}
      <header className="flex h-16 items-center justify-between border-b border-border/80 bg-background/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground skeuo-button-primary">
            <Boxes className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-foreground">
                {APP_NAME}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/80 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
                <Monitor className="size-2.5" />
                TERMINAL NODE
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Public check-out & return station</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin')}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft className="size-3.5" />
            <span>Admin Console</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
