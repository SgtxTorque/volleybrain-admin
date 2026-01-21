// ============================================
// SUPABASE EDGE FUNCTION: Send Email Notifications
// ============================================
// Deploy: supabase functions deploy send-payment-reminder
// 
// Required secrets:
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//   supabase secrets set FROM_EMAIL="Black Hornets <notifications@yourdomain.com>"
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Black Hornets <noreply@blackhornetsvolleyball.com>'

// Email templates
const templates: Record<string, (data: any) => { subject: string; html: string }> = {
  registration_confirmation: (data) => ({
    subject: `Registration Received - ${data.player_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${data.organization_name || 'Black Hornets Volleyball'}</h1>
          </div>
          <div class="content">
            <h2>Registration Received!</h2>
            <p>Thank you for registering <strong>${data.player_name}</strong> for ${data.season_name}.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Player:</strong> ${data.player_name}</p>
              <p style="margin: 8px 0 0 0;"><strong>Age Group:</strong> ${data.age_group || 'TBD'}</p>
              <p style="margin: 8px 0 0 0;"><strong>Status:</strong> Pending Review</p>
            </div>
            <p>We'll review your registration and get back to you soon with next steps.</p>
          </div>
          <div class="footer">
            <p>${data.organization_name || 'Black Hornets Volleyball'} • Powered by VolleyBrain</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  registration_approved: (data) => ({
    subject: `Registration Approved - ${data.player_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✓ Registration Approved!</h1>
          </div>
          <div class="content">
            <p>Great news! <strong>${data.player_name}</strong> has been approved for ${data.season_name}.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Player:</strong> ${data.player_name}</p>
              <p style="margin: 8px 0 0 0;"><strong>Age Group:</strong> ${data.age_group || 'TBD'}</p>
              ${data.team_name ? `<p style="margin: 8px 0 0 0;"><strong>Team:</strong> ${data.team_name}</p>` : ''}
            </div>
            ${data.payment_info ? `<p><strong>Payment Due:</strong> ${data.payment_info}</p>` : ''}
            <p>We're excited to have ${data.player_name} join us this season!</p>
          </div>
          <div class="footer">
            <p>${data.organization_name || 'Black Hornets Volleyball'} • Powered by VolleyBrain</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  payment_reminder: (data) => ({
    subject: `Payment Reminder - ${data.player_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .amount { font-size: 24px; font-weight: bold; color: #f59e0b; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Payment Reminder</h1>
          </div>
          <div class="content">
            <p>This is a friendly reminder about the outstanding balance for <strong>${data.player_name}</strong>.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
              <p style="margin: 0; color: #666;">Amount Due</p>
              <p class="amount" style="margin: 5px 0;">$${data.amount_due || '0.00'}</p>
            </div>
            ${data.custom_message ? `<p>${data.custom_message}</p>` : ''}
            <p><strong>Payment Options:</strong></p>
            <ul>
              <li>Venmo: @BlackHornetsVB</li>
              <li>Zelle: pay@blackhornets.com</li>
              <li>Cash App: $BlackHornetsVB</li>
            </ul>
            <p>Thank you for your prompt attention to this matter!</p>
          </div>
          <div class="footer">
            <p>${data.organization_name || 'Black Hornets Volleyball'} • Powered by VolleyBrain</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  team_assignment: (data) => ({
    subject: `Team Assignment - ${data.player_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .team-name { font-size: 28px; font-weight: bold; color: #6366f1; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Team Assignment</h1>
          </div>
          <div class="content">
            <p><strong>${data.player_name}</strong> has been assigned to a team!</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center;">
              <p class="team-name" style="margin: 0;">${data.team_name}</p>
              ${data.coach_name ? `<p style="margin: 12px 0 0 0;">Coach: ${data.coach_name}</p>` : ''}
            </div>
            ${data.practice_info ? `<p><strong>Practice Schedule:</strong> ${data.practice_info}</p>` : ''}
            <p>More details will be shared soon. We're excited to have ${data.player_name} on the team!</p>
          </div>
          <div class="footer">
            <p>${data.organization_name || 'Black Hornets Volleyball'} • Powered by VolleyBrain</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  waitlist: (data) => ({
    subject: `Waitlist Notification - ${data.player_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Waitlist Status</h1>
          </div>
          <div class="content">
            <p><strong>${data.player_name}</strong> has been added to the waitlist for ${data.season_name}.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Age Group:</strong> ${data.age_group || 'TBD'}</p>
              ${data.waitlist_position ? `<p style="margin: 8px 0 0 0;"><strong>Position:</strong> #${data.waitlist_position}</p>` : ''}
            </div>
            <p>We'll contact you as soon as a spot becomes available. Thank you for your patience!</p>
          </div>
          <div class="footer">
            <p>${data.organization_name || 'Black Hornets Volleyball'} • Powered by VolleyBrain</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
}

// Send email via Resend API
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set')
    return { success: false, error: 'API key not configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html
    })
  })

  const result = await response.json()
  
  if (!response.ok) {
    return { success: false, error: result.message || 'Failed to send' }
  }

  return { success: true, id: result.id }
}

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get pending emails (batch of 50)
    const { data: pendingEmails, error } = await supabase
      .rpc('get_pending_emails', { batch_size: 50 })

    if (error) {
      throw error
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending emails', processed: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let sent = 0
    let failed = 0

    for (const email of pendingEmails) {
      try {
        // Get template
        const template = templates[email.type]
        if (!template) {
          await supabase.rpc('mark_email_failed', { 
            email_id: email.id, 
            error_msg: `Unknown template: ${email.type}` 
          })
          failed++
          continue
        }

        // Generate email content
        const { subject, html } = template(email.data)

        // Send email
        const result = await sendEmail(email.recipient_email, subject, html)

        if (result.success) {
          await supabase.rpc('mark_email_sent', { 
            email_id: email.id, 
            ext_id: result.id 
          })
          sent++
        } else {
          await supabase.rpc('mark_email_failed', { 
            email_id: email.id, 
            error_msg: result.error 
          })
          failed++
        }
      } catch (err: any) {
        await supabase.rpc('mark_email_failed', { 
          email_id: email.id, 
          error_msg: err.message 
        })
        failed++
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Email batch processed',
      processed: pendingEmails.length,
      sent,
      failed
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
