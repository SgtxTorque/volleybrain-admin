// ============================================
// SUPABASE EDGE FUNCTION: Send Email Notifications
// ============================================
// Deploy: supabase functions deploy send-payment-reminder
//
// Required secrets:
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx
//   supabase secrets set FROM_EMAIL="noreply@mail.thelynxapp.com"
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@mail.thelynxapp.com'

// ── Branded HTML email builder (mirrors src/lib/email-html-builder.js) ──────
function buildLynxEmail({
  headerColor = '#10284C',
  headerLogo = null as string | null,
  headerImage = null as string | null,
  accentColor = '#5BCBFA',
  senderName = 'Lynx',
  heading = '',
  body = '',
  ctaText = null as string | null,
  ctaUrl = null as string | null,
  footerText = null as string | null,
  socialLinks = {} as Record<string, string | null>,
  showUnsubscribe = false,
  unsubscribeUrl = '',
}) {
  const socials = [
    socialLinks.website && `<a href="${socialLinks.website}" style="color:${accentColor};text-decoration:none;font-size:12px;margin:0 8px">Website</a>`,
    socialLinks.instagram && `<a href="${socialLinks.instagram}" style="color:${accentColor};text-decoration:none;font-size:12px;margin:0 8px">Instagram</a>`,
    socialLinks.facebook && `<a href="${socialLinks.facebook}" style="color:${accentColor};text-decoration:none;font-size:12px;margin:0 8px">Facebook</a>`,
    socialLinks.twitter && `<a href="${socialLinks.twitter}" style="color:${accentColor};text-decoration:none;font-size:12px;margin:0 8px">X</a>`,
  ].filter(Boolean).join(' &middot; ')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#F2F4F7;font-family:-apple-system,BlinkMacSystemFont,'Plus Jakarta Sans','Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4F7">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
          ${headerImage
            ? `<tr>
            <td style="padding:0;line-height:0">
              <img src="${headerImage}" alt="${senderName}" width="600" style="width:100%;max-width:600px;height:auto;display:block" />
            </td>
          </tr>
          ${heading ? `<tr><td style="background-color:${headerColor};padding:24px 40px;text-align:center"><h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0;line-height:1.25;letter-spacing:-0.01em">${heading}</h1></td></tr>` : ''}`
            : `<tr>
            <td style="background-color:${headerColor};padding:36px 40px;text-align:center">
              ${headerLogo
                ? `<img src="${headerLogo}" alt="${senderName}" height="44" style="height:44px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto">`
                : `<div style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:16px">${senderName}</div>`
              }
              ${heading ? `<h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0;line-height:1.25;letter-spacing:-0.01em">${heading}</h1>` : ''}
            </td>
          </tr>`
          }
          <tr>
            <td style="padding:36px 40px 28px;color:#2D3748;font-size:15px;line-height:1.75">
              ${body}
            </td>
          </tr>
          ${ctaText && ctaUrl ? `
          <tr>
            <td style="padding:0 40px 40px;text-align:center">
              <a href="${ctaUrl}" style="display:inline-block;background-color:${accentColor};color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.02em">${ctaText}</a>
            </td>
          </tr>` : ''}
          <tr>
            <td style="background-color:#F8F9FB;padding:28px 40px;border-top:1px solid #EDF0F4">
              ${footerText ? `<p style="color:#8896A6;font-size:13px;line-height:1.5;margin:0 0 12px;text-align:center">${footerText}</p>` : ''}
              ${socials ? `<p style="text-align:center;margin:0 0 12px">${socials}</p>` : ''}
              ${showUnsubscribe ? `<p style="text-align:center;margin:0 0 12px"><a href="${unsubscribeUrl}" style="color:#A0AEC0;font-size:11px;text-decoration:underline">Unsubscribe from announcements</a></p>` : ''}
              <p style="color:#CBD5E0;font-size:10px;text-align:center;margin:0">Powered by <a href="https://thelynxapp.com" style="color:#CBD5E0;text-decoration:none;font-weight:600">Lynx</a> &middot; Youth sports, organized.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Legacy fallback templates (for emails without branded template data) ─────
const legacyTemplates: Record<string, (data: any) => { subject: string; heading: string; body: string; cta_text?: string; cta_url?: string }> = {
  registration_confirmation: (data) => ({
    subject: data.invite_url
      ? `${data.player_name} is registered! Create your account`
      : `Registration Received - ${data.player_name}`,
    heading: data.invite_url ? `${data.player_name} Is Registered!` : 'Registration Received',
    body: data.invite_url
      ? `
        <p style="font-size:16px;line-height:1.6">Hey ${data.parent_name || 'there'}! 👋</p>
        <p style="font-size:16px;line-height:1.6">
          Great news — <strong>${data.player_name}</strong> is officially registered for
          <strong>${data.season_name}</strong>${data.org_name ? ` with ${data.org_name}` : ''}.
        </p>
        <p style="font-size:16px;line-height:1.6">
          Create your parent account to track schedules, payments, and everything else
          for ${data.player_name}'s season. It takes less than a minute.
        </p>
      `
      : `<p>Thank you for registering <strong>${data.player_name}</strong> for <strong>${data.season_name}</strong>.</p><p>Your registration is being reviewed. You'll receive another email once it's approved.</p>`,
    cta_text: data.invite_url ? 'Create Your Account' : undefined,
    cta_url: data.invite_url || undefined,
  }),
  registration_approved: (data) => ({
    subject: `Registration Approved - ${data.player_name}`,
    heading: 'Registration Approved!',
    body: `<p>Great news! <strong>${data.player_name}</strong> has been approved for <strong>${data.season_name}</strong>.</p>${data.total_due > 0 ? `<p><strong>Payment Due: $${data.total_due.toFixed(2)}</strong></p>` : ''}<p>We look forward to seeing ${data.player_name} on the court!</p>`,
  }),
  payment_reminder: (data) => ({
    subject: `Payment Reminder - ${data.player_name}`,
    heading: 'Payment Reminder',
    body: `<p>This is a friendly reminder about the outstanding balance for <strong>${data.player_name}</strong>.</p><p style="font-size:24px;font-weight:bold;color:#f59e0b">$${data.amount_due || '0.00'}</p>`,
  }),
  payment_receipt: (data) => ({
    subject: "Payment received. You're all set.",
    heading: 'Payment Confirmed',
    body: `<p>Hi ${data.payer_name},</p><p>We got it. Here's your receipt:</p><ul><li>Amount: ${data.amount}</li><li>For: ${data.description}</li><li>Date: ${data.payment_date}</li></ul>`,
  }),
  team_assignment: (data) => ({
    subject: `Team Assignment - ${data.player_name}`,
    heading: 'Team Assignment',
    body: `<p><strong>${data.player_name}</strong> has been assigned to <strong>${data.team_name}</strong> for ${data.season_name}!</p>${data.coach_name ? `<p>Coach: ${data.coach_name}</p>` : ''}`,
  }),
  waitlist_spot_available: (data) => ({
    subject: `Spot Available! - ${data.player_name}`,
    heading: 'A Spot Has Opened Up!',
    body: `<p>Great news! A spot is now available for <strong>${data.player_name}</strong> in <strong>${data.season_name}</strong>.</p><p><strong>This spot will expire in ${data.expires_in || '48 hours'}.</strong></p><p>If you no longer wish to join, simply ignore this email and the spot will go to the next person on the waitlist.</p>`,
    cta_text: data.registration_url ? 'Claim Your Spot' : undefined,
    cta_url: data.registration_url || undefined,
  }),
  blast_announcement: (data) => ({
    subject: data.subject || 'Announcement',
    heading: data.heading || data.subject || '',
    body: data.html_body || data.body || '',
  }),
  coach_invite: (data) => ({
    subject: data.subject || `You're invited to coach at ${data.org_name}!`,
    heading: `\u{1F3D0} You're In! Let's Go!`,
    body: `
      <p style="font-size:16px;line-height:1.6">Hey ${data.coach_name || 'Coach'}! \u{1F44B}</p>
      <p style="font-size:16px;line-height:1.6">
        Big news — <strong>${data.org_name}</strong> wants you on the coaching staff!
        ${data.team_name ? `You've been tapped to help lead <strong>${data.team_name}</strong>.` : 'Your experience and energy are exactly what our athletes need.'}
      </p>
      ${data.season_name ? `<p style="font-size:16px;line-height:1.6">Season: <strong>${data.season_name}</strong></p>` : ''}
      <p style="font-size:16px;line-height:1.6">
        Click below to accept your invite and set up your coach profile. It only takes a couple minutes — then you'll have full access to your roster, schedule, and lineup tools.
      </p>
      <p style="font-size:16px;line-height:1.6">Let's build something great together. \u{1F4AA}</p>
    `,
    cta_text: 'Accept Invitation',
    cta_url: data.invite_link || data.app_url || 'https://www.thelynxapp.com',
  }),
  registration_invite: (data) => ({
    subject: data.subject || (data.season_name
      ? `Register for ${data.org_name} — ${data.season_name}!`
      : `Register for ${data.org_name}!`),
    heading: `\u{1F389} Spots Are Open — Let's Play!`,
    body: `
      <p style="font-size:16px;line-height:1.6">Hey there! \u{1F44B}</p>
      <p style="font-size:16px;line-height:1.6">
        Great news — registration is officially open for <strong>${data.org_name}</strong>${data.season_name ? ` <strong>${data.season_name}</strong>` : ''}!
      </p>
      ${data.fee_info ? `<p style="font-size:16px;line-height:1.6">\u{1F4B0} <strong>Fee:</strong> ${data.fee_info}</p>` : ''}
      <p style="font-size:16px;line-height:1.6">
        Tap the button below to register your player. You'll fill out a quick form, sign waivers, and you're all set. It takes about 5 minutes.
      </p>
      <p style="font-size:16px;line-height:1.6">We can't wait to see your athlete on the court! \u{1F3D0}</p>
    `,
    cta_text: 'Register Now',
    cta_url: data.registration_url || data.app_url || 'https://www.thelynxapp.com',
  }),
  role_elevation: (data) => ({
    subject: `You're now a ${data.new_role || 'Coach'} at ${data.organization_name}!`,
    heading: `🎉 Welcome to the Coaching Staff!`,
    body: `
      <p style="font-size:16px;line-height:1.6">Hey ${data.recipient_name || 'there'}! 👋</p>
      <p style="font-size:16px;line-height:1.6">
        Great news — you've been added as a <strong>${data.new_role || 'Coach'}</strong> at <strong>${data.organization_name}</strong>!
        ${data.team_name ? `You'll be working with <strong>${data.team_name}</strong>.` : ''}
      </p>
      <p style="font-size:16px;line-height:1.6">
        Log in to access your coach dashboard — you'll have full access to your roster, schedule, attendance, and lineup tools.
      </p>
      <p style="font-size:16px;line-height:1.6">Let's build something great together. 💪</p>
    `,
    cta_text: 'Open Dashboard',
    cta_url: data.app_url || 'https://www.thelynxapp.com',
  }),
}

// ── Send email via Resend API ───────────────────────────────────────────────
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  senderName: string,
  replyTo?: string,
  attachments?: Array<{ filename: string; content: string }>
) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set')
    return { success: false, error: 'API key not configured', id: null }
  }

  const payload: any = {
    from: `${senderName} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    html,
  }
  if (replyTo) payload.reply_to = replyTo
  if (attachments && attachments.length > 0) payload.attachments = attachments

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const result = await response.json()

  if (!response.ok) {
    return { success: false, error: result.message || 'Failed to send', id: null }
  }

  return { success: true, id: result.id }
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get pending emails (batch of 50)
    const { data: pendingEmails, error } = await supabase
      .rpc('get_pending_emails', { batch_size: 50 })

    if (error) throw error

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending emails', processed: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    let sent = 0
    let failed = 0

    for (const email of pendingEmails) {
      try {
        // 1. Fetch org branding
        let orgBranding: any = {}
        if (email.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select(`
              name, logo_url, primary_color, secondary_color, contact_email, website,
              email_sender_name, email_reply_to, email_footer_text,
              email_social_facebook, email_social_instagram, email_social_twitter,
              email_include_unsubscribe, email_header_image, settings
            `)
            .eq('id', email.organization_id)
            .single()
          if (org) orgBranding = org
        }

        // 2. Resolve branding
        const headerColor = orgBranding.settings?.branding?.email_header_color || orgBranding.primary_color || '#10284C'
        const headerLogo = orgBranding.settings?.branding?.email_header_logo || orgBranding.logo_url || null
        const headerImage = orgBranding.email_header_image || orgBranding.settings?.branding?.email_header_image || null
        const accentColor = orgBranding.secondary_color || '#5BCBFA'
        const senderName = orgBranding.email_sender_name || orgBranding.name || 'Lynx'
        const replyTo = orgBranding.email_reply_to || orgBranding.contact_email || undefined

        // 3. Resolve content — use data.html_body if present (rich text from composer),
        //    otherwise fall back to legacy template
        let subject: string
        let heading: string
        let body: string

        if (email.data?.html_body || email.data?.body) {
          // Modern path: content provided by client
          subject = email.subject || email.data?.subject || `Message from ${senderName}`
          heading = email.data?.heading || ''
          body = email.data?.html_body || email.data?.body || ''
        } else {
          // Legacy path: use built-in template
          const template = legacyTemplates[email.type]
          if (!template) {
            await supabase.rpc('mark_email_failed', {
              email_id: email.id,
              error_msg: `Unknown template: ${email.type}`
            })
            failed++
            continue
          }
          const rendered = template(email.data)
          subject = email.subject || rendered.subject
          heading = rendered.heading
          body = rendered.body
          // Carry CTA from template if data payload doesn't have them
          if (!email.data.cta_text && rendered.cta_text) email.data.cta_text = rendered.cta_text
          if (!email.data.cta_url && rendered.cta_url) email.data.cta_url = rendered.cta_url
        }

        // 4. Build branded HTML
        const isBroadcast = email.category === 'broadcast'
        const html = buildLynxEmail({
          headerColor,
          headerLogo,
          headerImage,
          accentColor,
          senderName,
          heading,
          body,
          ctaText: email.data?.cta_text || null,
          ctaUrl: email.data?.cta_url || null,
          footerText: orgBranding.email_footer_text || null,
          socialLinks: {
            website: orgBranding.website || null,
            instagram: orgBranding.email_social_instagram || null,
            facebook: orgBranding.email_social_facebook || null,
            twitter: orgBranding.email_social_twitter || null,
          },
          showUnsubscribe: isBroadcast && orgBranding.email_include_unsubscribe !== false,
          unsubscribeUrl: isBroadcast
            ? `https://thelynxapp.com/unsubscribe?org=${email.organization_id}&email=${encodeURIComponent(email.recipient_email)}`
            : '',
        })

        // 5. Fetch attachments if present
        let attachments: Array<{ filename: string; content: string }> = []
        if (email.has_attachments) {
          const { data: files } = await supabase
            .from('email_attachments')
            .select('file_name, file_url, mime_type')
            .eq('email_notification_id', email.id)

          if (files && files.length > 0) {
            attachments = await Promise.all(files.map(async (f: any) => {
              try {
                const res = await fetch(f.file_url)
                const buffer = await res.arrayBuffer()
                return {
                  filename: f.file_name,
                  content: btoa(String.fromCharCode(...new Uint8Array(buffer))),
                }
              } catch {
                return null
              }
            })).then(results => results.filter(Boolean) as Array<{ filename: string; content: string }>)
          }
        }

        // 6. Send
        const result = await sendEmail(
          email.recipient_email,
          subject,
          html,
          senderName,
          replyTo,
          attachments.length > 0 ? attachments : undefined
        )

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
