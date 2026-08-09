import { ShieldOff } from 'lucide-react'
import { APP_NAME } from '@/constants'

export function TerminalClosed() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center text-center">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <ShieldOff className="size-12 text-muted-foreground" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Terminal Closed
      </h2>
      <p className="mt-3 text-lg text-muted-foreground">
        The {APP_NAME} counter terminal is currently closed.
      </p>
      <p className="mt-2 text-sm text-muted-foreground/70">
        Please contact an administrator to open the terminal.
      </p>
    </div>
  )
}
