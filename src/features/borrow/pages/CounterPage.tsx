import { useState } from 'react'
import { toast } from 'sonner'
import {
  useActiveTerminal,
  useCreateBorrowerOtp,
  useVerifyBorrowerOtp,
  useBulkBorrowItems,
  useBulkReturnItems,
} from '../hooks/borrow.queries'
import type { CounterMode, Transaction, QrLookupResult } from '../types'
import { COUNTER_DUE_DAYS } from '@/constants'
import { TerminalClosed } from '../components/TerminalClosed'
import { EmailStep } from '../components/EmailStep'
import { OtpStep } from '../components/OtpStep'
import { ModeSelector } from '../components/ModeSelector'
import { ScannerInput } from '../components/ScannerInput'
import { TransactionReceipt } from '../components/TransactionReceipt'
import { SessionTimer } from '../components/SessionTimer'
import { Spinner } from '@/components/ui/spinner'
import { sendBorrowReceiptEmail, sendReturnReceiptEmail } from '@/services/email.service'

type FlowStep = 'email' | 'otp' | 'mode' | 'scanner' | 'receipt'

export function CounterPage() {
  const { data: terminalSession, isLoading: terminalLoading } = useActiveTerminal()

  const [step, setStep] = useState<FlowStep>('email')
  const [email, setEmail] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [mode, setMode] = useState<CounterMode>('borrow')
  const [completedTransactions, setCompletedTransactions] = useState<Transaction[]>([])
  const [completedItems, setCompletedItems] = useState<QrLookupResult[]>([])

  const createOtpMutation = useCreateBorrowerOtp()
  const verifyOtpMutation = useVerifyBorrowerOtp()
  const bulkBorrowMutation = useBulkBorrowItems()
  const bulkReturnMutation = useBulkReturnItems()

  // Reset entire borrower flow
  function handleEndSession() {
    setStep('email')
    setEmail('')
    setSessionId(null)
    setSessionToken(null)
    setCompletedTransactions([])
    setCompletedItems([])
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
      const res = await createOtpMutation.mutateAsync({
        email: userEmail,
        terminalId: terminalSession.id,
      })
      setSessionId(res.session_id)
      setStep('otp')
      console.log('[DEV MODE] Borrower OTP Code:', res.otp)
      toast.info(`[DEV MODE] Verification Code: ${res.otp}`, {
        duration: 10000,
      })
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
    const res = await createOtpMutation.mutateAsync({
      email,
      terminalId: terminalSession.id,
    })
    setSessionId(res.session_id)
    console.log('[DEV MODE] Resent Borrower OTP Code:', res.otp)
    toast.info(`[DEV MODE] New Verification Code: ${res.otp}`, {
      duration: 10000,
    })
  }

  // Select action mode (borrow or return)
  function handleSelectMode(selectedMode: CounterMode) {
    setMode(selectedMode)
    setStep('scanner')
  }

  // Handle confirmed bulk scan action (borrow or return)
  async function handleConfirmBulkAction(
    qrUids: string[],
    copyIds: string[],
    items: QrLookupResult[],
  ) {
    if (!sessionToken) {
      toast.error('Session expired')
      handleEndSession()
      return
    }

    try {
      let txs: Transaction[]
      if (mode === 'borrow') {
        txs = await bulkBorrowMutation.mutateAsync({
          sessionToken,
          copyIds: copyIds.length > 0 ? copyIds : undefined,
          qrUids: qrUids.length > 0 ? qrUids : undefined,
          dueDays: COUNTER_DUE_DAYS,
        })
        toast.success(`Successfully borrowed ${txs.length} ${txs.length === 1 ? 'unit' : 'units'}!`)

        // Trigger digital receipt email
        void sendBorrowReceiptEmail({
          borrowerEmail: email,
          items,
          dueDate: txs[0]?.due_date,
          transactionId: txs[0]?.id,
        })
      } else {
        txs = await bulkReturnMutation.mutateAsync({
          sessionToken,
          copyIds: copyIds.length > 0 ? copyIds : undefined,
          qrUids: qrUids.length > 0 ? qrUids : undefined,
        })
        toast.success(`Successfully returned ${txs.length} ${txs.length === 1 ? 'unit' : 'units'}!`)

        // Trigger digital return receipt email
        void sendReturnReceiptEmail({
          borrowerEmail: email,
          items,
          transactionId: txs[0]?.id,
        })
      }

      setCompletedTransactions(txs)
      setCompletedItems(items)
      setStep('receipt')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Batch transaction failed')
      throw err
    }
  }

  // If loading terminal status
  if (terminalLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Spinner className="size-8 text-primary" />
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
          sessionToken={sessionToken}
          onConfirmBulkAction={handleConfirmBulkAction}
          onBack={() => setStep('mode')}
          loading={bulkBorrowMutation.isPending || bulkReturnMutation.isPending}
        />
      )}

      {step === 'receipt' && completedTransactions.length > 0 && (
        <TransactionReceipt
          transactions={completedTransactions}
          items={completedItems}
          onScanAnother={() => setStep('mode')}
          onEndSession={handleEndSession}
        />
      )}
    </div>
  )
}
