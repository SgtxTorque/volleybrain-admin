// ============================================
// SUPABASE EDGE FUNCTION: Resend Delivery Webhooks
// ============================================
// Receives delivery events from Resend, updates email_notifications status
// Configure webhook URL in Resend dashboard:
//   https://uqpjvbiuokwpldjvxiby.supabase.co/functions/v1/resend-webhooks
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
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
