import { useState } from 'react'
import { ExternalLink, Monitor, Play, Square, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  useActiveTerminal,
  useOpenTerminal,
  useCloseTerminal,
  useTerminalHistory,
} from '@/features/borrow'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings & Controls
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system configuration and counter terminal state.
        </p>
      </div>

      {/* Counter Terminal Controls Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Monitor className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Counter Terminal Control
              </h2>
              <p className="text-xs text-muted-foreground">
                Open or close borrower checkout counter sessions
              </p>
            </div>
          </div>

          <a
            href="/counter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Launch Terminal <ExternalLink className="size-3.5" />
          </a>
        </div>

        {loadingTerminal ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Indicator */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <span
                  className={`relative flex h-3.5 w-3.5 rounded-full ${
                    activeTerminal ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                >
                  {activeTerminal && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Terminal Status:{' '}
                    <span className={activeTerminal ? 'text-emerald-500' : 'text-red-500'}>
                      {activeTerminal ? 'OPEN' : 'CLOSED'}
                    </span>
                  </p>
                  {activeTerminal && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Opened on {new Date(activeTerminal.opened_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Toggle Buttons */}
              {activeTerminal ? (
                <button
                  onClick={() => void handleClose()}
                  disabled={closeMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {closeMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Square className="size-4" />
                  )}
                  Close Terminal
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional session notes..."
                    className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={() => void handleOpen()}
                    disabled={openMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {openMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    Open Terminal
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Recent Terminal Sessions
            </h3>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Opened At</th>
                  <th className="p-3 font-semibold">Closed At</th>
                  <th className="p-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      No terminal history recorded yet.
                    </td>
                  </tr>
                ) : (
                  history.slice(0, 5).map((session) => (
                    <tr key={session.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            !session.closed_at
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {!session.closed_at ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td className="p-3">{new Date(session.opened_at).toLocaleString()}</td>
                      <td className="p-3">
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
      </div>
    </div>
  )
}
