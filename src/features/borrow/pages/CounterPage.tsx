import { useState } from 'react'
import { toast } from 'sonner'
import {
  useActiveTerminal,
  useCreateBorrowerOtp,
  useVerifyBorrowerOtp,
  useBorrowItem,
  useReturnItem,
} from '../hooks/borrow.queries'
import type { CounterMode, Transaction } from '../types'
import { COUNTER_DUE_DAYS } from '@/constants'
import { TerminalClosed } from '../components/TerminalClosed'
import { EmailStep } from '../components/EmailStep'
import { OtpStep } from '../components/OtpStep'
import { ModeSelector } from '../components/ModeSelector'
import { ScannerInput } from '../components/ScannerInput'
import { TransactionReceipt } from '../components/TransactionReceipt'
import { SessionTimer } from '../components/SessionTimer'
import { Spinner } from '@/components/ui/spinner'

type FlowStep = 'email' | 'otp' | 'mode' | 'scanner' | 'receipt'

export function CounterPage() {
  const { data: terminalSession, isLoading: terminalLoading } = useActiveTerminal()

  const [step, setStep] = useState<FlowStep>('email')
  const [email, setEmail] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [mode, setMode] = useState<CounterMode>('borrow')
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null)

  const createOtpMutation = useCreateBorrowerOtp()
  const verifyOtpMutation = useVerifyBorrowerOtp()
  const borrowMutation = useBorrowItem()
  const returnMutation = useReturnItem()

  // Reset entire borrower flow
  function handleEndSession() {
    setStep('email')
    setEmail('')
    setSessionId(null)
    setSessionToken(null)
    setCompletedTransaction(null)
    toast.info('Borrower session ended')
  }

  // Handle email submit -> create OTP session
  async function handleEmailSubmit(userEmail: string) {
    if (!terminalSession) {
      toast.error('Terminal is not open')
      return
    }

    setEmail(userEmail)
    try {
      const id = await createOtpMutation.mutateAsync({
        email: userEmail,
        terminalId: terminalSession.id,
      })
      setSessionId(id)
      setStep('otp')
      toast.success('Verification OTP sent!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP')
    }
  }

  // Handle OTP verify -> activate session
  async function handleVerifyOtp(otp: string) {
    if (!sessionId) return

    try {
      const token = await verifyOtpMutation.mutateAsync({
        sessionId,
        otp,
      })
      setSessionToken(token)
      setStep('mode')
      toast.success('Session verified!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid OTP code')
      throw err
    }
  }

  // Handle OTP resend
  async function handleResendOtp() {
    if (!email || !terminalSession) return
    const id = await createOtpMutation.mutateAsync({
      email,
      terminalId: terminalSession.id,
    })
    setSessionId(id)
    toast.success('New OTP sent!')
  }

  // Select action mode (borrow or return)
  function handleSelectMode(selectedMode: CounterMode) {
    setMode(selectedMode)
    setStep('scanner')
  }

  // Handle confirmed scan action (borrow or return)
  async function handleConfirmAction(copyId: string) {
    if (!sessionToken) {
      toast.error('Session expired')
      handleEndSession()
      return
    }

    try {
      let tx: Transaction
      if (mode === 'borrow') {
        tx = await borrowMutation.mutateAsync({
          sessionToken,
          copyId,
          dueDays: COUNTER_DUE_DAYS,
        })
        toast.success('Item successfully borrowed!')
      } else {
        tx = await returnMutation.mutateAsync({
          sessionToken,
          copyId,
        })
        toast.success('Item successfully returned!')
      }

      setCompletedTransaction(tx)
      setStep('receipt')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transaction failed')
      throw err
    }
  }

  // If loading terminal status
  if (terminalLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner size="lg" />
      </div>
    )
  }

  // If terminal is closed by admin
  if (!terminalSession) {
    return <TerminalClosed />
  }

  const showTimer = ['mode', 'scanner', 'receipt'].includes(step)

  return (
    <div className="relative flex w-full justify-center">
      {/* Session Expiry Timer Header (visible during active session steps) */}
      {showTimer && <SessionTimer onExpire={handleEndSession} />}

      {step === 'email' && (
        <EmailStep
          onSubmit={handleEmailSubmit}
          loading={createOtpMutation.isPending}
        />
      )}

      {step === 'otp' && (
        <OtpStep
          email={email}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onBack={() => setStep('email')}
          loading={verifyOtpMutation.isPending}
        />
      )}

      {step === 'mode' && (
        <ModeSelector
          email={email}
          onSelectMode={handleSelectMode}
          onEndSession={handleEndSession}
        />
      )}

      {step === 'scanner' && (
        <ScannerInput
          mode={mode}
          onConfirmAction={handleConfirmAction}
          onBack={() => setStep('mode')}
          loading={borrowMutation.isPending || returnMutation.isPending}
        />
      )}

      {step === 'receipt' && completedTransaction && (
        <TransactionReceipt
          transaction={completedTransaction}
          onScanAnother={() => setStep('mode')}
          onEndSession={handleEndSession}
        />
      )}
    </div>
  )
}
