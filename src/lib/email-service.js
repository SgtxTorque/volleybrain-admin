import { supabase } from './supabase'
import { buildLynxEmail, resolveOrgBranding, replaceTemplateVars } from './email-html-builder'

// ============================================
// EMAIL NOTIFICATION SERVICE
// ============================================
// Queues emails to Supabase for sending via Edge Functions
// Supports: registration confirmation, approval, waitlist, payment reminders, broadcasts

export const EmailService = {
  // Queue an email notification (extended with tracking columns)
  async queueEmail(type, recipientEmail, recipientName, data, organizationId, options = {}) {
    const {
      subject = null,
      category = 'transactional',
      sentBy = null,
      sentByRole = 'system',
      recipientUserId = null,
      templateType = null,
      broadcastBatchId = null,
      blastMessageId = null,
      audienceType = null,
      audienceTargetId = null,
      hasAttachments = false,
    } = options

    try {
      const { error } = await supabase.from('email_notifications').insert({
        type,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        data,
        organization_id: organizationId,
        status: 'pending',
        subject,
        category,
        sent_by: sentBy,
        sent_by_role: sentByRole,
        recipient_user_id: recipientUserId,
        template_type: templateType,
        broadcast_batch_id: broadcastBatchId,
        blast_message_id: blastMessageId,
        audience_type: audienceType,
        audience_target_id: audienceTargetId,
        has_attachments: hasAttachments,
        created_at: new Date().toISOString()
      })
      if (error) throw error
      console.log(`Email queued: ${type} to ${recipientEmail}`)
      return { success: true }
    } catch (err) {
      console.error('Failed to queue email:', err)
      return { success: false, error: err.message }
    }
  },

  // Send registration confirmation email (with optional magic link for account creation)
  async sendRegistrationConfirmation({ recipientEmail, recipientName, playerName, seasonName, teamName, startDate, organizationId, organizationName, inviteUrl }) {
    if (!recipientEmail) return { success: false, error: 'No recipient email' }

    const hasInvite = !!inviteUrl

    return this.queueEmail('registration_confirmation', recipientEmail, recipientName, {
      player_name: playerName,
      parent_name: recipientName,
      season_name: seasonName,
      team_name: teamName || 'TBD',
      start_date: startDate || 'TBD',
      org_name: organizationName,
      invite_url: inviteUrl || null,
      app_url: window.location.origin,
    }, organizationId, {
      subject: hasInvite
        ? `${playerName} is registered! Create your account`
        : `${playerName} is on the roster. Let's go.`,
      category: 'transactional',
      templateType: 'registration_confirmation',
    })
  },

  // Send approval notification (existing — kept for backward compat)
  async sendApprovalNotification(player, season, organization, fees = []) {
    const email = player.parent_email
    if (!email) return { success: false, error: 'No parent email' }

    const totalDue = fees.reduce((sum, f) => sum + (f.amount || 0), 0)

    return this.queueEmail('registration_approved', email, player.parent_name, {
      player_name: `${player.first_name} ${player.last_name}`,
      season_name: season.name,
      organization_name: organization.name,
      organization_email: organization.settings?.contact_email,
      total_due: totalDue,
      payment_methods: organization.settings?.payment_methods || {},
      fees: fees.map(f => ({ description: f.description, amount: f.amount }))
    }, organization.id)
  },

  // Send waitlist notification (spot available)
  async sendWaitlistSpotAvailable(player, season, organization) {
    const email = player.parent_email
    if (!email) return { success: false, error: 'No parent email' }

    const baseUrl = organization.settings?.registration_url || organization.settings?.app_url || ''
    const registrationUrl = baseUrl ? `${baseUrl}/register/${organization.slug}/${season.id}` : null

    return this.queueEmail('waitlist_spot_available', email, player.parent_name, {
      player_name: `${player.first_name} ${player.last_name}`,
      season_name: season.name,
      organization_name: organization.name,
      registration_url: registrationUrl,
      expires_in: '48 hours'
    }, organization.id)
  },

  // Send payment reminder
  async sendPaymentReminder(player, season, organization, amountDue, dueDate = null) {
    const email = player.parent_email
    if (!email) return { success: false, error: 'No parent email' }

    return this.queueEmail('payment_reminder', email, player.parent_name, {
      player_name: `${player.first_name} ${player.last_name}`,
      season_name: season.name,
      organization_name: organization.name,
      organization_email: organization.settings?.contact_email,
      amount_due: amountDue,
      due_date: dueDate,
      payment_methods: organization.settings?.payment_methods || {}
    }, organization.id)
  },

  // Send payment receipt email
  async sendPaymentReceipt({ recipientEmail, recipientName, amount, description, paymentDate, paymentMethod, transactionId, organizationId, organizationName }) {
    if (!recipientEmail) return { success: false, error: 'No recipient email' }

    return this.queueEmail('payment_receipt', recipientEmail, recipientName, {
      payer_name: recipientName,
      amount,
      description: description || 'Club Fee',
      payment_date: paymentDate || new Date().toLocaleDateString(),
      payment_method: paymentMethod || 'Card',
      transaction_id: transactionId || '',
      org_name: organizationName,
      app_url: window.location.origin,
    }, organizationId, {
      subject: "Payment received. You're all set.",
      category: 'transactional',
      templateType: 'payment_receipt',
    })
  },

  // Send team assignment notification
  async sendTeamAssignment(player, team, season, organization) {
    const email = player.parent_email
    if (!email) return { success: false, error: 'No parent email' }

    return this.queueEmail('team_assignment', email, player.parent_name, {
      player_name: `${player.first_name} ${player.last_name}`,
      team_name: team.name,
      season_name: season.name,
      organization_name: organization.name,
      coach_name: team.coach_name || null,
      practice_info: team.practice_schedule || null
    }, organization.id)
  },

  // Send broadcast/blast email
  async sendBlastEmail({ recipientEmail, recipientName, recipientUserId, subject, heading, body, ctaText, ctaUrl, organizationId, organizationName, sentBy, sentByRole, blastMessageId, broadcastBatchId, audienceType, audienceTargetId, hasAttachments }) {
    if (!recipientEmail) return { success: false, error: 'No recipient email' }

    return this.queueEmail('blast_announcement', recipientEmail, recipientName, {
      subject,
      heading,
      body,
      html_body: body,
      org_name: organizationName,
      app_url: window.location.origin,
    }, organizationId, {
      subject: subject || heading || 'Announcement',
      category: 'broadcast',
      sentBy,
      sentByRole: sentByRole || 'admin',
      recipientUserId,
      templateType: 'blast_announcement',
      broadcastBatchId,
      blastMessageId,
      audienceType,
      audienceTargetId,
      hasAttachments: hasAttachments || false,
    })
  },

  // Send coach invite email
  async sendCoachInvite({ recipientEmail, coachName, orgName, orgId, orgLogoUrl, senderName, teamName, seasonName, role, inviteLink }) {
    if (!recipientEmail) return { success: false, error: 'No recipient email' }

    const link = inviteLink || `${window.location.origin}/join/coach/${orgId}`

    return this.queueEmail('coach_invite', recipientEmail, coachName || null, {
      org_name: orgName,
      org_logo_url: orgLogoUrl || null,
      invite_link: link,
      sender_name: senderName || orgName,
      coach_name: coachName || null,
      team_name: teamName || null,
      season_name: seasonName || null,
      role: role || 'Coach',
      cta_text: 'Accept Invitation',
      cta_url: link,
      app_url: window.location.origin,
    }, orgId, {
      subject: `You're invited to coach at ${orgName}!`,
      category: 'transactional',
      templateType: 'coach_invite',
    })
  },

  // Send registration invite email to parents
  async sendRegistrationInvite({ recipientEmail, orgName, orgId, seasonName, registrationUrl, feeInfo }) {
    if (!recipientEmail) return { success: false, error: 'No recipient email' }

    return this.queueEmail('registration_invite', recipientEmail, null, {
      org_name: orgName,
      season_name: seasonName || '',
      registration_url: registrationUrl,
      fee_info: feeInfo || null,
      cta_text: 'Register Now',
      cta_url: registrationUrl,
      app_url: window.location.origin,
    }, orgId, {
      subject: seasonName
        ? `Register for ${orgName} — ${seasonName}!`
        : `Register for ${orgName}!`,
      category: 'transactional',
      templateType: 'registration_invite',
    })
  },

  // Send role elevation notification (existing user gets a new role — no magic link needed)
  async sendRoleElevationNotification({ to, recipientName, orgName, orgId, newRole, teamName }) {
    if (!to) return { success: false, error: 'No recipient email' }

    return this.queueEmail('role_elevation', to, recipientName, {
      recipient_name: recipientName,
      organization_name: orgName,
      new_role: newRole,
      team_name: teamName || null,
      app_url: window.location.origin,
    }, orgId, {
      subject: `You're now a ${newRole} at ${orgName}!`,
      category: 'transactional',
      templateType: 'role_elevation',
    })
  },

  // Build a branded email preview using org branding
  buildPreview(organization, { heading, body, ctaText, ctaUrl, isBroadcast }) {
    const branding = resolveOrgBranding(organization)
    return buildLynxEmail({
      ...branding,
      heading,
      body,
      ctaText: ctaText || null,
      ctaUrl: ctaUrl || null,
      showUnsubscribe: isBroadcast && branding.includeUnsubscribe,
      unsubscribeUrl: '#unsubscribe',
    })
  },

  // Get email template (legacy — still used for Edge Function fallback)
  getEmailTemplate(type, data) {
    const templates = {
      registration_confirmation: {
        subject: `Registration Received - ${data.organization_name}`,
        preview: `Thank you for registering ${data.player_name} for ${data.season_name}!`,
        body: `
          <h2>Registration Received!</h2>
          <p>Thank you for registering <strong>${data.player_name}</strong> for <strong>${data.season_name}</strong>.</p>
          <p>Your registration is being reviewed. You'll receive another email once it's approved.</p>
          <h3>Registration Details</h3>
          <ul>
            <li>Player: ${data.player_name}</li>
            <li>Season: ${data.season_name}</li>
            <li>Submitted: ${data.registration_date}</li>
          </ul>
          <p>If you have questions, please contact us at ${data.organization_email || 'the organization'}.</p>
          <p>Thank you,<br>${data.organization_name}</p>
        `
      },
      registration_approved: {
        subject: `Registration Approved - ${data.organization_name}`,
        preview: `Great news! ${data.player_name} is approved for ${data.season_name}!`,
        body: `
          <h2>Registration Approved!</h2>
          <p>Great news! <strong>${data.player_name}</strong> has been approved for <strong>${data.season_name}</strong>.</p>
          ${data.total_due > 0 ? `
            <h3>Payment Due: $${data.total_due.toFixed(2)}</h3>
            <p>Please submit payment to complete your registration.</p>
          ` : ''}
          <p>We look forward to seeing ${data.player_name} on the court!</p>
          <p>Thank you,<br>${data.organization_name}</p>
        `
      },
      waitlist_spot_available: {
        subject: `Spot Available! - ${data.organization_name}`,
        preview: `A spot has opened up for ${data.player_name}!`,
        body: `
          <h2>A Spot Has Opened Up!</h2>
          <p>Great news! A spot is now available for <strong>${data.player_name}</strong> in <strong>${data.season_name}</strong>.</p>
          <p><strong>This spot will expire in ${data.expires_in}.</strong></p>
          <p>If you no longer wish to join, simply ignore this email and the spot will go to the next person on the waitlist.</p>
          <p>Thank you,<br>${data.organization_name}</p>
        `
      },
      payment_reminder: {
        subject: `Payment Reminder - ${data.organization_name}`,
        preview: `Reminder: $${data.amount_due} due for ${data.player_name}`,
        body: `
          <h2>Payment Reminder</h2>
          <p>This is a friendly reminder that payment is due for <strong>${data.player_name}</strong>'s registration in <strong>${data.season_name}</strong>.</p>
          <h3>Amount Due: $${typeof data.amount_due === 'number' ? data.amount_due.toFixed(2) : data.amount_due}</h3>
          ${data.due_date ? `<p>Due Date: ${data.due_date}</p>` : ''}
          <p>If you have any questions, please contact us.</p>
          <p>Thank you,<br>${data.organization_name}</p>
        `
      },
      team_assignment: {
        subject: `Team Assignment - ${data.organization_name}`,
        preview: `${data.player_name} has been assigned to ${data.team_name}!`,
        body: `
          <h2>Team Assignment</h2>
          <p><strong>${data.player_name}</strong> has been assigned to <strong>${data.team_name}</strong> for ${data.season_name}!</p>
          ${data.coach_name ? `<p>Coach: ${data.coach_name}</p>` : ''}
          ${data.practice_info ? `<p>Practice Schedule: ${data.practice_info}</p>` : ''}
          <p>More details will be shared soon. We're excited to have ${data.player_name} on the team!</p>
          <p>Thank you,<br>${data.organization_name}</p>
        `
      }
    }
    return templates[type] || null
  }
}

// Helper to check if email notifications are enabled for an organization
export function isEmailEnabled(organization, notificationType = null) {
  // Check if email is globally enabled
  if (organization?.settings?.email_notifications_enabled === false) return false

  // If no specific type requested, return global status
  if (!notificationType) return true

  // Check specific notification type
  const typeSettings = {
    'registration_confirmation': organization?.settings?.email_on_registration,
    'registration_approved': organization?.settings?.email_on_approval,
    'waitlist_spot_available': organization?.settings?.email_on_waitlist,
    'team_assignment': organization?.settings?.email_on_team_assignment,
    'payment_reminder': organization?.settings?.email_on_payment_due,
    'payment_receipt': organization?.send_receipt_emails,
  }

  // Default to true if setting not explicitly set
  return typeSettings[notificationType] !== false
}
