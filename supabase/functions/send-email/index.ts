// @ts-nocheck
// Supabase Edge Function: send-email (Deno runtime)
// Multi-provider support: Brevo (No domain required) & Resend

declare const Deno: {
  env: {
    get: (key: string) => string | undefined
  }
  serve: (handler: (req: Request) => Promise<Response> | Response) => void
}

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'inventory@system.local'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html } = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: to, subject, html' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // 1. Prioritize Brevo (Works with personal Gmail and sends to any recipient without domain)
    if (BREVO_API_KEY) {
      console.log(`[BREVO DISPATCH] from: ${FROM_EMAIL}, to: ${to}, subject: ${subject}`)

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'Inventor Library',
            email: FROM_EMAIL,
          },
          to: [
            {
              email: to,
            },
          ],
          subject,
          htmlContent: html,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[BREVO API ERROR]', data)
        const errorMsg = data.message || data.error || 'Brevo email delivery rejected'
        return new Response(JSON.stringify({ error: errorMsg, details: data }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('[BREVO SUCCESS]', data)
      return new Response(JSON.stringify({ success: true, provider: 'brevo', ...data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Secondary Provider: Resend
    if (RESEND_API_KEY) {
      console.log(`[RESEND DISPATCH] from: ${FROM_EMAIL}, to: ${to}, subject: ${subject}`)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('[RESEND API ERROR]', data)
        const errorMsg =
          data.message ||
          (typeof data.error === 'string' ? data.error : data.error?.message) ||
          'Resend email dispatch rejected'
        return new Response(JSON.stringify({ error: errorMsg, details: data }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('[RESEND SUCCESS]', data)
      return new Response(JSON.stringify({ success: true, provider: 'resend', ...data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Emulation fallback if no provider API key configured
    console.log('[LOCAL/STAGING EMAIL EMULATION]', { to, subject })
    return new Response(
      JSON.stringify({ success: true, message: 'Email logged in development/staging mode.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('[EDGE FUNCTION EXCEPTION]', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal edge function error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
