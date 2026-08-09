import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { BORROWER_SESSION_TIMEOUT_MS } from '@/constants'

interface SessionTimerProps {
  expiresAt?: string
  onExpire: () => void
}

export function SessionTimer({ expiresAt, onExpire }: SessionTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    function calculateTimeLeft() {
      if (!expiresAt) {
        return Math.floor(BORROWER_SESSION_TIMEOUT_MS / 1000)
      }
      const diff = new Date(expiresAt).getTime() - Date.now()
      return Math.max(0, Math.floor(diff / 1000))
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        onExpire()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, onExpire])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isWarning = timeLeft > 0 && timeLeft <= 120 // < 2 minutes

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div
      className={`fixed top-4 right-6 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-mono font-medium transition-all shadow-sm ${
        isWarning
          ? 'bg-red-500/10 text-red-500 border border-red-500/30 animate-pulse'
          : 'bg-card border border-border text-muted-foreground'
      }`}
    >
      <Clock className="size-3.5" />
      <span>Session Expires: {formattedTime}</span>
    </div>
  )
}
