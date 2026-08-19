import { useState } from 'react'
import { ExternalLink, Monitor, Play, Square, Loader2, Clock, Settings } from 'lucide-react'
import { toast } from 'sonner'
import {
  useActiveTerminal,
  useOpenTerminal,
  useCloseTerminal,
  useTerminalHistory,
  type TerminalSession,
} from '@/features/borrow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function SettingsPage() {
  const [notes, setNotes] = useState('')

  const { data: activeTerminal, isLoading: loadingTerminal } = useActiveTerminal()
  const { data: history = [] } = useTerminalHistory()

  const openMutation = useOpenTerminal()
  const closeMutation = useCloseTerminal()

  async function handleOpen() {
    try {
      await openMutation.mutateAsync(notes)
      setNotes('')
      toast.success('Counter terminal is now OPEN!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open terminal')
    }
  }

  async function handleClose() {
    if (!activeTerminal) return
    try {
      await closeMutation.mutateAsync(activeTerminal.id)
      toast.info('Counter terminal has been CLOSED')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close terminal')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-border/80 pb-5">
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-foreground" />
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Settings & Controls
          </h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Manage system configuration, security policies, and counter terminal state.
        </p>
      </div>

      {/* Counter Terminal Controls Card */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground skeuo-button-primary">
              <Monitor className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Counter Terminal Gatekeeper
              </h2>
              <p className="text-xs text-muted-foreground">
                Authorize or lock borrower checkout and return sessions
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/counter', '_blank')}
            className="gap-1.5 text-xs"
          >
            <span>Launch Terminal</span>
            <ExternalLink className="size-3" />
          </Button>
        </div>

        {loadingTerminal ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Indicator */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4 skeuo-well">
              <div className="flex items-center gap-3">
                <span
                  className={`size-3 rounded-full ${
                    activeTerminal ? 'bg-emerald-500 skeuo-led' : 'bg-muted-foreground'
                  }`}
                />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Terminal Status:{' '}
                    <span className={activeTerminal ? 'font-mono text-emerald-500' : 'text-muted-foreground'}>
                      {activeTerminal ? 'OPEN & ACCEPTING SCANS' : 'CLOSED / LOCKED'}
                    </span>
                  </p>
                  {activeTerminal && (
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      Session initiated: {new Date(activeTerminal.opened_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {activeTerminal ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleClose()}
                  isLoading={closeMutation.isPending}
                  className="gap-2 text-xs"
                >
                  <Square className="size-3.5" />
                  Close Terminal
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <Input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Session notes (e.g. Morning Shift)..."
                    className="h-8 text-xs w-60"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => void handleOpen()}
                    isLoading={openMutation.isPending}
                    className="gap-2 text-xs"
                  >
                    <Play className="size-3.5" />
                    Open Terminal
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Terminal Sessions
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card skeuo-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider border-b border-border text-[11px]">
                <tr>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Opened At</th>
                  <th className="p-3 font-semibold">Closed At</th>
                  <th className="p-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-foreground">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground text-xs">
                      No terminal history recorded yet.
                    </td>
                  </tr>
                ) : (
                  history.slice(0, 5).map((session: TerminalSession) => (
                    <tr key={session.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                            !session.closed_at
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {!session.closed_at ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td className="p-3 font-mono">{new Date(session.opened_at).toLocaleString()}</td>
                      <td className="p-3 font-mono">
                        {session.closed_at
                          ? new Date(session.closed_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="p-3 text-muted-foreground">{session.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
