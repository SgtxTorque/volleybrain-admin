// =====================================================================
// SUPABASE EDGE FUNCTION: Notification Cron
// =====================================================================
// This function runs on a schedule (via cron-job.org or Supabase cron)
// and triggers the scheduled notification checks:
//   - Game reminders (24hr and 2hr)
//   - RSVP reminders (48hr)
//   - Payment reminders (weekly)
//   - Scheduled notifications that are now due
//
// Deploy: supabase functions deploy notification-cron --no-verify-jwt
// Cron: Set up external cron to call every 15 minutes
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  try {
    const results: Record<string, any> = {}

    // 1. Check game reminders (24hr)
    const { data: game24, error: game24Err } = await supabase.rpc('check_game_reminders')
    results.game_reminders_24hr = game24Err ? { error: game24Err.message } : { queued: game24 }

    // 2. Check game reminders (2hr)
    const { data: game2, error: game2Err } = await supabase.rpc('check_game_reminders_2hr')
    results.game_reminders_2hr = game2Err ? { error: game2Err.message } : { queued: game2 }

    // 3. Check RSVP reminders
    const { data: rsvp, error: rsvpErr } = await supabase.rpc('check_rsvp_reminders')
    results.rsvp_reminders = rsvpErr ? { error: rsvpErr.message } : { queued: rsvp }

    // 4. Check payment reminders (only run once per day to avoid spam)
    const currentHour = new Date().getUTCHours()
    if (currentHour >= 14 && currentHour < 15) {
      // Run payment check around 9-10 AM Central (UTC-6)
      const { data: payments, error: payErr } = await supabase.rpc('check_payment_reminders')
      results.payment_reminders = payErr ? { error: payErr.message } : { queued: payments }
    } else {
      results.payment_reminders = { skipped: 'Not in payment reminder window' }
    }

    // 5. Process any scheduled notifications that are now due
    const { data: scheduled, error: schedErr } = await supabase
      .from('notifications')
      .select('id')
      .eq('push_status', 'pending')
      .not('scheduled_for', 'is', null)
      .lte('scheduled_for', new Date().toISOString())

    if (scheduled && scheduled.length > 0) {
      // Update them to trigger the webhook
      for (const notif of scheduled) {
        await supabase
          .from('notifications')
          .update({ scheduled_for: null }) // Clear schedule so webhook processes it
          .eq('id', notif.id)
      }
      results.scheduled_processed = scheduled.length
    } else {
      results.scheduled_processed = 0
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Notification cron error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
