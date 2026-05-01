// ============================================
// SUPABASE EDGE FUNCTION: Resend Delivery Webhooks
// ============================================
// Receives delivery events from Resend, updates email_notifications status
// Configure webhook URL in Resend dashboard:
//   https://uqpjvbiuokwpldjvxiby.supabase.co/functions/v1/resend-webhooks
//
// Optional secrets:
//   supabase secrets set RESEND_WEBHOOK_SECRET=whsec_xxxxx
//   (Get from Resend dashboard → Webhooks → Signing secret)
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Verify Resend webhook signature headers
    const svixId = req.headers.get('svix-id')
    const svixTimestamp = req.headers.get('svix-timestamp')
    const svixSignature = req.headers.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response(JSON.stringify({ error: 'Missing webhook signature headers' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Reject stale webhooks (older than 5 minutes)
    const timestampSeconds = parseInt(svixTimestamp, 10)
    const now = Math.floor(Date.now() / 1000)
    if (isNaN(timestampSeconds) || Math.abs(now - timestampSeconds) > 300) {
      return new Response(JSON.stringify({ error: 'Webhook timestamp too old or invalid' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify HMAC signature — fail closed if secret is not configured
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured — rejecting webhook')
      return new Response(JSON.stringify({ error: 'Webhook verification not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    {
      // svix signs: "${svix-id}.${svix-timestamp}.${body}"
      // The secret is base64-encoded after the "whsec_" prefix
      const secretBytes = Uint8Array.from(
        atob(webhookSecret.replace(/^whsec_/, '')),
        c => c.charCodeAt(0)
      )
      const bodyText = await req.clone().text()
      const signedContent = `${svixId}.${svixTimestamp}.${bodyText}`
      const encoder = new TextEncoder()

      const key = await crypto.subtle.importKey(
        'raw',
        secretBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedContent))
      const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))

      // svix-signature may contain multiple signatures separated by spaces
      // Each is prefixed with "v1,"
      const signatures = svixSignature.split(' ')
      const isValid = signatures.some(sig => {
        const sigValue = sig.replace(/^v1,/, '')
        return sigValue === expectedSig
      })

      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { type, data } = await req.json()
    const messageId = data?.email_id
    if (!messageId) return new Response('OK', { status: 200 })

    const fieldMap: Record<string, { status: string; field: string }> = {
      'email.delivered':  { status: 'delivered',  field: 'delivered_at' },
      'email.opened':     { status: 'opened',     field: 'opened_at' },
      'email.clicked':    { status: 'clicked',    field: 'clicked_at' },
      'email.bounced':    { status: 'bounced',    field: 'bounced_at' },
      'email.complained': { status: 'bounced',    field: 'bounced_at' },
    }

    const mapping = fieldMap[type]
    if (!mapping) return new Response('OK', { status: 200 })

    // Priority: bounced/failed always win (terminal negative states)
    // Otherwise, only update forward in the positive progression
    const terminalStates = ['bounced', 'failed']
    const positivePriority = ['pending', 'sent', 'delivered', 'opened', 'clicked']

    const { data: existing } = await supabase
      .from('email_notifications')
      .select('status')
      .eq('external_id', messageId)
      .single()

    if (!existing) return new Response('OK', { status: 200 })

    // If the email is already in a terminal state, don't overwrite
    if (terminalStates.includes(existing.status)) {
      return new Response('OK', { status: 200 })
    }

    // Bounced/complained always win over positive states
    const isBounce = mapping.status === 'bounced'
    const shouldUpdate = isBounce ||
      positivePriority.indexOf(mapping.status) > positivePriority.indexOf(existing.status)

    if (shouldUpdate) {
      await supabase.from('email_notifications')
        .update({
          status: mapping.status,
          [mapping.field]: new Date().toISOString()
        })
        .eq('external_id', messageId)
    }

    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    // Always return 200 to prevent Resend from retrying
    return new Response('OK', { status: 200 })
  }
})
