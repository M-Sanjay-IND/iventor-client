import { supabase } from './supabase'
import { APP_NAME } from '@/constants'
import type { QrLookupResult } from '@/features/borrow/types'

export interface BorrowEmailParams {
  borrowerEmail: string
  items: QrLookupResult[]
  dueDate?: string | null
  transactionId?: string
}

export interface ReturnEmailParams {
  borrowerEmail: string
  items: QrLookupResult[]
  transactionId?: string
}

export interface DueReminderParams {
  borrowerEmail: string
  items: {
    item_name: string
    copy_number: number
    due_date: string
    days_overdue?: number
  }[]
}

export interface EmailDispatchResult {
  success: boolean
  error?: string
}

async function extractErrorMessage(error: any): Promise<string> {
  let detailedMsg = error?.message || 'Email dispatch failed'
  try {
    if (error && typeof error === 'object' && 'context' in error && error.context) {
      const body = await (error.context as Response).json()
      if (body?.error) {
        detailedMsg = typeof body.error === 'string' ? body.error : body.error.message || body.message
      } else if (body?.message) {
        detailedMsg = body.message
      }
    }
  } catch {
    // Ignore JSON parsing failure
  }
  return detailedMsg
}

/**
 * Sends borrower one-time password (OTP) verification email.
 */
export async function sendBorrowerOtpEmail(
  borrowerEmail: string,
  otp: string,
): Promise<EmailDispatchResult> {
  const subject = `[${APP_NAME}] Your Counter Terminal Verification Code: ${otp}`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; color: #1e293b; text-align: center;">
      <h2 style="color: #0f172a; margin-top: 0;">Counter Terminal Verification</h2>
      <p style="color: #64748b; font-size: 14px;">Use the verification code below to authorize your borrowing/return session at the counter:</p>
      
      <div style="margin: 28px 0; padding: 18px; background: #f1f5f9; border-radius: 10px; display: inline-block;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0284c7;">${otp}</span>
      </div>
      
      <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0 0;">
        This code expires in 10 minutes. If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  `

  console.log(`[EMAIL DISPATCH] Dispatching Borrower OTP to ${borrowerEmail}: ${otp}`)

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: { to: borrowerEmail, subject, html },
    })

    if (error) {
      const detailed = await extractErrorMessage(error)
      console.error('[EMAIL ERROR] Supabase Edge Function error:', detailed)
      return { success: false, error: detailed }
    }

    if (data?.error) {
      console.error('[EMAIL ERROR] Resend error payload:', data.error)
      return {
        success: false,
        error: typeof data.error === 'string' ? data.error : data.error.message || 'Email delivery failed',
      }
    }

    console.log('[EMAIL SUCCESS] Borrower OTP delivered:', data)
    return { success: true }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to invoke email edge function'
    console.error('[EMAIL EXCEPTION]', errMsg)
    return { success: false, error: errMsg }
  }
}

/**
 * Sends a digital borrow receipt to the borrower's email.
 */
export async function sendBorrowReceiptEmail({
  borrowerEmail,
  items,
  dueDate,
  transactionId,
}: BorrowEmailParams): Promise<EmailDispatchResult> {
  const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'No fixed due date'
  const subject = `[${APP_NAME}] Borrow Receipt - ${items.length} ${items.length === 1 ? 'Item' : 'Items'} Checked Out`

  const itemListHtml = items
    .map(
      (item) => `
      <li style="margin-bottom: 8px;">
        <strong>${item.item_name}</strong> (Copy #${item.copy_number})
        <br/><span style="color: #64748b; font-size: 12px; font-family: monospace;">QR UID: ${item.qr_uid}</span>
      </li>`,
    )
    .join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
      <h2 style="color: #0f172a; margin-top: 0;">Borrowing Receipt Confirmed</h2>
      <p>Hello,</p>
      <p>You have successfully checked out the following items from <strong>${APP_NAME}</strong>:</p>
      <ul style="background: #f8fafc; border-radius: 8px; padding: 16px 24px;">
        ${itemListHtml}
      </ul>
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <strong>Due Date:</strong> ${formattedDueDate}
        <br/><span style="font-size: 12px; color: #475569;">Please return these items on or before the due date at the counter terminal.</span>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Batch ID: ${transactionId ?? 'N/A'} • Timestamp: ${new Date().toLocaleString()}
      </p>
    </div>
  `

  console.log(`[EMAIL DISPATCH] Dispatching Borrow Receipt to ${borrowerEmail}`)

  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to: borrowerEmail, subject, html },
    })

    if (error) {
      const detailed = await extractErrorMessage(error)
      console.error('[EMAIL ERROR] Borrow receipt failed:', detailed)
      return { success: false, error: detailed }
    }

    return { success: true }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Email failed'
    console.warn('[EMAIL WARNING]', errMsg)
    return { success: false, error: errMsg }
  }
}

/**
 * Sends a digital return receipt to the borrower's email.
 */
export async function sendReturnReceiptEmail({
  borrowerEmail,
  items,
  transactionId,
}: ReturnEmailParams): Promise<EmailDispatchResult> {
  const subject = `[${APP_NAME}] Return Confirmation - ${items.length} ${items.length === 1 ? 'Item' : 'Items'} Returned`

  const itemListHtml = items
    .map(
      (item) => `
      <li style="margin-bottom: 8px;">
        <strong>${item.item_name}</strong> (Copy #${item.copy_number})
        <br/><span style="color: #64748b; font-size: 12px; font-family: monospace;">QR UID: ${item.qr_uid}</span>
      </li>`,
    )
    .join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
      <h2 style="color: #059669; margin-top: 0;">Items Successfully Returned</h2>
      <p>Hello,</p>
      <p>This email confirms that you have safely returned the following items to <strong>${APP_NAME}</strong>:</p>
      <ul style="background: #f8fafc; border-radius: 8px; padding: 16px 24px;">
        ${itemListHtml}
      </ul>
      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
        <strong>Status:</strong> Returned & Verified ✓
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Batch ID: ${transactionId ?? 'N/A'} • Timestamp: ${new Date().toLocaleString()}
      </p>
    </div>
  `

  console.log(`[EMAIL DISPATCH] Dispatching Return Receipt to ${borrowerEmail}`)

  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to: borrowerEmail, subject, html },
    })

    if (error) {
      const detailed = await extractErrorMessage(error)
      console.error('[EMAIL ERROR] Return receipt failed:', detailed)
      return { success: false, error: detailed }
    }

    return { success: true }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Email failed'
    console.warn('[EMAIL WARNING]', errMsg)
    return { success: false, error: errMsg }
  }
}

/**
 * Sends a reminder email for items due today or overdue.
 */
export async function sendDueReminderEmail({
  borrowerEmail,
  items,
}: DueReminderParams): Promise<EmailDispatchResult> {
  const isOverdue = items.some((i) => (i.days_overdue ?? 0) > 0)
  const subject = isOverdue
    ? `[URGENT: ${APP_NAME}] Overdue Items Reminder`
    : `[${APP_NAME}] Due Date Reminder - Items Due Today`

  const itemListHtml = items
    .map(
      (item) => `
      <li style="margin-bottom: 8px;">
        <strong>${item.item_name}</strong> (Copy #${item.copy_number})
        <br/><span style="color: ${item.days_overdue && item.days_overdue > 0 ? '#dc2626' : '#2563eb'}; font-size: 12px;">
          Due Date: ${new Date(item.due_date).toLocaleDateString()} ${item.days_overdue && item.days_overdue > 0 ? `(${item.days_overdue} days overdue)` : '(Due Today)'}
        </span>
      </li>`,
    )
    .join('')

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
      <h2 style="color: ${isOverdue ? '#dc2626' : '#d97706'}; margin-top: 0;">${isOverdue ? 'Action Required: Overdue Items' : 'Reminder: Items Due Today'}</h2>
      <p>Hello,</p>
      <p>This is an automated reminder regarding your borrowed equipment from <strong>${APP_NAME}</strong>:</p>
      <ul style="background: #f8fafc; border-radius: 8px; padding: 16px 24px;">
        ${itemListHtml}
      </ul>
      <p>Please visit the Counter Terminal to return or renew these items.</p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Automated Notice • ${new Date().toLocaleString()}
      </p>
    </div>
  `

  console.log(`[EMAIL DISPATCH] Dispatching Due Reminder to ${borrowerEmail}`)

  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to: borrowerEmail, subject, html },
    })

    if (error) {
      const detailed = await extractErrorMessage(error)
      console.error('[EMAIL ERROR] Due reminder failed:', detailed)
      return { success: false, error: detailed }
    }

    return { success: true }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Email failed'
    console.warn('[EMAIL WARNING]', errMsg)
    return { success: false, error: errMsg }
  }
}
