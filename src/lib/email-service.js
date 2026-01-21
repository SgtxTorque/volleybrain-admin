import { supabase } from './supabase'

// ============================================
// EMAIL NOTIFICATION SERVICE
// ============================================
// Queues emails to Supabase for sending via Edge Functions
// Supports: registration confirmation, approval, waitlist, payment reminders

export const EmailService = {
  // Queue an email notification
  async queueEmail(type, recipientEmail, recipientName, data, organizationId) {
    try {
      const { error } = await supabase.from('email_notifications').insert({
        type,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        data,
        organization_id: organizationId,
        status: 'pending',
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

  // Send registration confirmation email
  async sendRegistrationConfirmation(player, season, organization) {
    const email = player.parent_email
    if (!email) return { success: false, error: 'No parent email' }
    
    return this.queueEmail('registration_confirmation', email, player.parent_name, {
      player_name: `${player.first_name} ${player.last_name}`,
      season_name: season.name,
      organization_name: organization.name,
      organization_email: organization.settings?.contact_email,
      registration_date: new Date().toLocaleDateString(),
      fees: {
        registration: season.fee_registration || 0,
        uniform: season.fee_uniform || 0,
        monthly: season.fee_monthly || 0,
      }
    }, organization.id)
  },

  // Send approval notification
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
    
    const registrationUrl = organization.settings?.registration_url 
      || `https://sgtxtorque.github.io/volleyball-registration?org=${organization.slug}&season=${season.id}`
    
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

  // Get email templates for preview/customization
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
          <h2>🎉 Registration Approved!</h2>
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
          <h2>⏰ A Spot Has Opened Up!</h2>
          <p>Great news! A spot is now available for <strong>${data.player_name}</strong> in <strong>${data.season_name}</strong>.</p>
          <p><strong>This spot will expire in ${data.expires_in}.</strong></p>
          <p><a href="${data.registration_url}" style="background-color: #FFD700; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 16px 0;">Confirm Your Spot →</a></p>
          <p>If you no longer wish to join, simply ignore this email and the spot will go to the next person on the waitlist.</p>
          <p>Thank you,<br>${data.organization_name}</p>
        `
      },
      payment_reminder: {
        subject: `Payment Reminder - ${data.organization_name}`,
        preview: `Reminder: $${data.amount_due} due for ${data.player_name}`,
        body: `
          <h2>💰 Payment Reminder</h2>
          <p>This is a friendly reminder that payment is due for <strong>${data.player_name}</strong>'s registration in <strong>${data.season_name}</strong>.</p>
          <h3>Amount Due: $${data.amount_due.toFixed(2)}</h3>
          ${data.due_date ? `<p>Due Date: ${data.due_date}</p>` : ''}
          <p>If you have any questions or need to set up a payment plan, please contact us.</p>
          <p>Thank you,<br>${data.organization_name}</p>
        `
      },
      team_assignment: {
        subject: `Team Assignment - ${data.organization_name}`,
        preview: `${data.player_name} has been assigned to ${data.team_name}!`,
        body: `
          <h2>🏐 Team Assignment</h2>
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
  }
  
  // Default to true if setting not explicitly set
  return typeSettings[notificationType] !== false
}
