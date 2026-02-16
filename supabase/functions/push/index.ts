// =====================================================================
// SUPABASE EDGE FUNCTION: Push Notification Sender
// =====================================================================
// Deploy: supabase functions deploy push --no-verify-jwt
// 
// This function is triggered by a database webhook when a new row
// is inserted into the notifications table. It looks up the user's
// Expo push token and sends the notification via Expo's push API.
//
// Required secrets:
//   supabase secrets set EXPO_ACCESS_TOKEN=your_expo_access_token
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN')

interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: string
  data: Record<string, any>
  channel: string
  push_status: string
  scheduled_for: string | null
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: Notification
  schema: 'public'
  old_record: null | Notification
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    const notification = payload.record

    // Only process pending push notifications
    if (notification.push_status !== 'pending') {
      return new Response(JSON.stringify({ message: 'Skipped: not pending' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // If scheduled for the future, skip (cron will pick it up later)
    if (notification.scheduled_for) {
      const scheduledTime = new Date(notification.scheduled_for)
      if (scheduledTime > new Date()) {
        return new Response(JSON.stringify({ message: 'Skipped: scheduled for future' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Get user's active push tokens
    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('user_id', notification.user_id)
      .eq('is_active', true)

    if (tokenError || !tokens || tokens.length === 0) {
      // No tokens - mark as skipped (user hasn't registered device)
      await supabase
        .from('notifications')
        .update({
          push_status: 'skipped',
          push_error: 'No active push tokens found for user',
        })
        .eq('id', notification.id)

      return new Response(JSON.stringify({ message: 'No push tokens found' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build Expo push messages (one per token/device)
    const messages = tokens.map((t) => ({
      to: t.expo_push_token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: {
        ...notification.data,
        notification_id: notification.id,
        type: notification.type,
      },
      // Category for actionable notifications
      categoryId: notification.type,
      // Badge count (could query unread count, keeping simple for now)
      badge: 1,
      // Priority
      priority: notification.type === 'game_reminder' ? 'high' : 'default',
      // TTL - game reminders expire faster
      ttl: notification.type === 'game_reminder' ? 3600 : 86400,
    }))

    // Send via Expo push API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (EXPO_ACCESS_TOKEN) {
      headers['Authorization'] = `Bearer ${EXPO_ACCESS_TOKEN}`
    }

    const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    })

    const pushResult = await pushResponse.json()

    // Process tickets
    const tickets = Array.isArray(pushResult.data) ? pushResult.data : [pushResult.data]
    const ticketIds: string[] = []
    let hasError = false
    let errorMessage = ''

    for (const ticket of tickets) {
      if (ticket.status === 'ok') {
        if (ticket.id) ticketIds.push(ticket.id)
      } else {
        hasError = true
        errorMessage = ticket.message || ticket.details?.error || 'Unknown push error'

        // If token is invalid, deactivate it
        if (ticket.details?.error === 'DeviceNotRegistered') {
          const badToken = messages.find((_, i) => tickets[i] === ticket)
          if (badToken) {
            await supabase
              .from('push_tokens')
              .update({ is_active: false })
              .eq('expo_push_token', badToken.to)
          }
        }
      }
    }

    // Update notification status
    await supabase
      .from('notifications')
      .update({
        push_status: hasError ? 'failed' : 'sent',
        push_sent_at: new Date().toISOString(),
        push_error: hasError ? errorMessage : null,
        push_ticket_id: ticketIds.length > 0 ? ticketIds[0] : null,
      })
      .eq('id', notification.id)

    return new Response(
      JSON.stringify({
        success: !hasError,
        tickets: ticketIds.length,
        error: hasError ? errorMessage : null,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Push notification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
