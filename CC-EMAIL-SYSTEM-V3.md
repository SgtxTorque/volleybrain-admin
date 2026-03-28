# CC-EMAIL-SYSTEM-V3: Lynx Email System (Final Spec)

> **Scope:** Transactional emails (registration confirmation, payment receipt) + broadcast emails (via existing Blasts system) with admin-managed templates, rich text composer, branded previews, and coach send capability.
> **Platform:** Web admin first. Shared Supabase backend (mobile reuses Edge Functions later).
> **Service:** Resend (ALREADY integrated -- `send-payment-reminder` Edge Function + `RESEND_API_KEY` secret)
> **Spec version:** 3.0 (codebase-verified via EMAIL_INVESTIGATION_REPORT.md)
> **Language:** JavaScript (.jsx/.js) -- NO TypeScript in this project.
> **Prerequisites:** Read LYNX-UX-PHILOSOPHY.md, LynxBrandBook.html, and EMAIL_INVESTIGATION_REPORT.md before executing.

---

## HOW THE EMAIL SYSTEM WORKS (Non-Technical Summary)

For anyone reading this spec who isn't a developer:

- **Lynx sends emails on behalf of the org** from `noreply@mail.thelynxapp.com`. The admin never connects their Gmail or Outlook. They compose in Lynx, hit send, and Resend (our email delivery service) delivers it to the recipient's real inbox.
- **Reply-to routing:** When a parent hits "reply" on a Lynx email, the reply goes to whatever reply-to address the admin configured (e.g., `info@blackhornets.com`). Lynx is not an inbox.
- **Email Log = Sent folder + analytics.** Admins see everything that was sent, whether it was delivered, opened, bounced, or failed. There is no inbox inside Lynx.
- **Templates auto-fill recipient info.** `{{player_name}}` becomes "Sarah M." and `{{parent_name}}` becomes "Maria" automatically at send time.
- **Org branding drives the look.** The org's logo, colors, and footer text are applied to every email. If they haven't set any, Lynx defaults (navy header, sky buttons) are used.

---

## INVESTIGATION FINDINGS THAT SHAPED THIS SPEC

These are the corrections from V1 and V2 based on the codebase investigation:

| What V2 Got Wrong | V3 Correction |
|---|---|
| Created new `send-email` Edge Function | **Extend** existing `send-payment-reminder` (already sends via Resend, processes all pending `email_notifications` rows) |
| Created new email service library | **Extend** existing `src/lib/email-service.js` (213 lines, has `queueEmail()`, `getEmailTemplate()`, `isEmailEnabled()`) |
| Integrated broadcasts with `announcements` table | **Extend** existing BlastsPage `ComposeBlastModal` which uses `messages` + `message_recipients` tables |
| Built separate `/email/settings` page | **Extend** existing `SetupSectionContent.jsx` which has an "Email Branding (Future)" placeholder |
| Used TypeScript (.tsx) | **JSX only** -- no TypeScript in this project |
| Used React Query / custom hooks | **useState + useEffect + supabase.from()** -- that's the codebase pattern |
| Assumed no existing email infra | `email-service.js`, `send-payment-reminder` Edge Function, `email_notifications` table, branding context, email toggles in org settings ALL already exist |
| Proposed separate Email nav section | **Add to existing Communication group** in sidebar (Chats, Announcements, Push Notifications, **+ Email**) |

### Blast System Bugs (MUST FIX FIRST -- Phase 0)

| Bug | Impact | Fix |
|---|---|---|
| `BlastsPage.jsx` INSERT into `messages` omits `organization_id` | New blasts may not appear in list (read query filters by org) | Add `organization_id: organization.id` to the insert payload |
| `message_recipients` INSERT omits `profile_id` | `BlastAlertChecker` queries by `profile_id` -- popup won't find new blasts | Add `profile_id` lookup during recipient resolution |

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Changes](#2-database-changes)
3. [Extend Edge Function](#3-extend-edge-function)
4. [Extend email-service.js](#4-extend-email-servicejs)
5. [Rich Text Composer](#5-rich-text-composer)
6. [Email Template System](#6-email-template-system)
7. [Brand Voice & Default Templates](#7-brand-voice--default-templates)
8. [Transactional Email Triggers](#8-transactional-email-triggers)
9. [Broadcast Email Integration](#9-broadcast-email-integration)
10. [Web Admin UI](#10-web-admin-ui)
11. [Role Permissions](#11-role-permissions)
12. [Mobile Considerations](#12-mobile-considerations)
13. [Phase Execution Plan](#13-phase-execution-plan)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       LYNX WEB ADMIN                            │
│                                                                 │
│  EXISTING (modified):                NEW (created):             │
│  ┌─────────────────────┐            ┌─────────────────────┐    │
│  │ SetupSectionContent │            │ EmailPage.jsx       │    │
│  │ (email branding     │            │ (log + templates +  │    │
│  │  settings)          │            │  compose)           │    │
│  └─────────┬───────────┘            └─────────┬───────────┘    │
│  ┌─────────────────────┐            ┌─────────────────────┐    │
│  │ BlastsPage.jsx      │            │ EmailTemplateEditor │    │
│  │ (+email toggle in   │            │ (live preview)      │    │
│  │  ComposeBlastModal) │            └─────────────────────┘    │
│  └─────────┬───────────┘                                       │
│            │                                                    │
│  ┌─────────────────────┐                                       │
│  │ email-service.js    │  ← EXTENDED (new templates, branding, │
│  │ (queue + templates) │     blast email method, rich HTML)    │
│  └─────────┬───────────┘                                       │
└────────────┼───────────────────────────────────────────────────┘
             │ INSERT into email_notifications (status: 'pending')
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE                                     │
│                                                                 │
│  ┌──────────────────┐  ┌─────────────────────┐                 │
│  │ email_            │  │ notification_       │                 │
│  │ notifications     │  │ templates           │                 │
│  │ (extended cols)   │  │ (extended for email)│                 │
│  └────────┬─────────┘  └─────────────────────┘                 │
│           │                                                     │
│  ┌────────▼─────────────────────────────────────────┐          │
│  │ send-payment-reminder Edge Function              │          │
│  │ (EXISTING -- extended with branded HTML builder,  │          │
│  │  attachment support, Resend webhook handling)     │          │
│  └────────┬─────────────────────────────┬───────────┘          │
└───────────┼─────────────────────────────┼──────────────────────┘
            │                             │
            ▼                             ▼
     ┌─────────────┐              ┌─────────────┐
     │   RESEND     │◄─webhooks──│  Resend      │
     │   API        │             │  Dashboard   │
     └──────┬──────┘              └─────────────┘
            │
            ▼
     ┌─────────────┐
     │  Recipient   │  (Gmail, Outlook, Yahoo, etc.)
     │  Inbox       │
     └─────────────┘
```

**Flow:**
1. Admin/Coach composes email (template edit, broadcast, or system trigger)
2. `email-service.js` calls `queueEmail()` which INSERTs into `email_notifications` with `status: 'pending'`
3. `send-payment-reminder` Edge Function (runs on cron or invoke) picks up pending rows
4. Edge Function builds branded HTML, calls Resend API, updates status to `sent` or `failed`
5. Resend webhooks update delivery status (`delivered`, `opened`, `clicked`, `bounced`)
6. Email Log page shows the full history with live status

---

## 2. Database Changes

### 2a. Extend `email_notifications` table

This table already exists and is used by `email-service.js` (INSERT) and `send-payment-reminder` (SELECT pending, UPDATE status). Add tracking columns:

```sql
-- Delivery tracking and metadata extensions
ALTER TABLE email_notifications
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'transactional',       -- 'transactional' or 'broadcast'
  ADD COLUMN IF NOT EXISTS sent_by UUID DEFAULT NULL,                   -- user who triggered the send
  ADD COLUMN IF NOT EXISTS sent_by_role TEXT DEFAULT 'system',          -- 'admin', 'coach', 'system'
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT NULL,             -- e.g. 'registration_confirmation'
  ADD COLUMN IF NOT EXISTS broadcast_batch_id UUID DEFAULT NULL,        -- groups recipients of one broadcast
  ADD COLUMN IF NOT EXISTS blast_message_id UUID DEFAULT NULL,          -- links to messages.id (blast system)
  ADD COLUMN IF NOT EXISTS audience_type TEXT DEFAULT NULL,             -- 'all', 'team', 'role'
  ADD COLUMN IF NOT EXISTS audience_target_id UUID DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_notif_external_id 
  ON email_notifications(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_notif_batch 
  ON email_notifications(broadcast_batch_id) WHERE broadcast_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_notif_org_date 
  ON email_notifications(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notif_status 
  ON email_notifications(status) WHERE status = 'pending';
```

### 2b. Extend `notification_templates` table for email content

This table exists and is used by `NotificationsPage.jsx` for push notification templates. Add email-specific fields WITHOUT breaking the push notification UI:

```sql
ALTER TABLE notification_templates
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'push',                 -- 'push', 'email', 'both'
  ADD COLUMN IF NOT EXISTS email_subject_template TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_heading TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_body_template TEXT DEFAULT NULL,       -- Rich HTML body content
  ADD COLUMN IF NOT EXISTS email_cta_text TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_cta_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_category TEXT DEFAULT 'transactional',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS variable_reference JSONB DEFAULT NULL;
```

> **CRITICAL:** The existing `NotificationsPage.jsx` queries this table for push templates. The new `channel` column defaults to `'push'`, so existing rows are unaffected. Email template queries MUST filter `WHERE channel IN ('email', 'both')`. Push template queries should add `WHERE channel IN ('push', 'both')` or leave as-is since the default handles it.

### 2c. Extend `organizations` table (only what's NOT already there)

The `organizations` table already has: `logo_url`, `primary_color`, `secondary_color`, `contact_email`, `website`, `send_receipt_emails`.

The `organizations.settings` JSON blob already has: `email_notifications_enabled`, per-type toggles, and `branding.email_header_color` / `branding.email_header_logo`.

Only add what's truly missing:

```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS email_sender_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_reply_to TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_footer_text TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_social_facebook TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_social_instagram TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_social_twitter TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_include_unsubscribe BOOLEAN DEFAULT TRUE;
```

### 2d. New table: `email_unsubscribes`

```sql
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID DEFAULT NULL,
  email TEXT NOT NULL,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own unsubscribe" ON email_unsubscribes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins view org unsubscribes" ON email_unsubscribes
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = TRUE
    )
  );
```

### 2e. New table: `email_attachments`

Stores metadata for files attached to emails.

```sql
CREATE TABLE IF NOT EXISTS email_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_notification_id UUID REFERENCES email_notifications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,               -- Supabase Storage public URL
  file_size INTEGER DEFAULT NULL,       -- bytes
  mime_type TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_attach_notif 
  ON email_attachments(email_notification_id);
```

### 2f. RLS Policy Check

**Before running any new policies, execute this in SQL Editor:**

```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('notification_templates', 'email_notifications', 'organizations', 'messages', 'message_recipients', 'email_unsubscribes')
ORDER BY tablename, policyname;
```

Only add policies that don't already exist. The investigation noted that `email_notifications` needs INSERT for authenticated users scoped to org, and `notification_templates` needs SELECT + UPDATE for admin.

---

## 3. Extend Edge Function

### 3a. Rename and Extend `send-payment-reminder`

The existing `send-payment-reminder/index.ts` Edge Function already:
- Queries `email_notifications` where `status = 'pending'`
- Sends via Resend REST API (`fetch('https://api.resend.com/emails', ...)`)
- Updates status to `sent` or `failed`

**Rename to `send-emails` (or keep the name and extend it).** Add:

1. **Branded HTML builder** -- uses org branding (logo, colors, footer) to wrap template content
2. **Attachment support** -- fetches from `email_attachments` table, includes in Resend API call
3. **Resend webhook endpoint** -- separate function `resend-webhooks` for delivery tracking
4. **Batch processing** -- handles broadcast batches efficiently

```typescript
// supabase/functions/send-payment-reminder/index.ts (extended)
// OR rename to supabase/functions/send-emails/index.ts

// Key additions to existing function:

// 1. After fetching pending email_notification row, also fetch org branding:
const { data: org } = await supabase
  .from('organizations')
  .select(`
    name, logo_url, primary_color, secondary_color, contact_email, website,
    email_sender_name, email_reply_to, email_footer_text,
    email_social_facebook, email_social_instagram, email_social_twitter,
    email_include_unsubscribe, settings
  `)
  .eq('id', notification.organization_id)
  .single()

// 2. Resolve branding (combine table columns + settings.branding)
const headerColor = org.settings?.branding?.email_header_color || org.primary_color || '#10284C'
const headerLogo = org.settings?.branding?.email_header_logo || org.logo_url || null
const accentColor = org.secondary_color || '#5BCBFA'
const senderName = org.email_sender_name || org.name || 'Lynx'
const replyTo = org.email_reply_to || org.contact_email || Deno.env.get('FROM_EMAIL')

// 3. Build branded HTML (see buildLynxEmail in Section 4)
const html = buildLynxEmail({
  headerColor, headerLogo, accentColor, senderName,
  heading: notification.data?.heading || '',
  body: notification.data?.body || notification.data?.html_body || '',
  ctaText: notification.data?.cta_text || null,
  ctaUrl: notification.data?.cta_url || null,
  footerText: org.email_footer_text,
  socialLinks: { facebook: org.email_social_facebook, instagram: org.email_social_instagram, twitter: org.email_social_twitter, website: org.website },
  showUnsubscribe: notification.category === 'broadcast' && org.email_include_unsubscribe,
  unsubscribeUrl: `https://thelynxapp.com/unsubscribe?org=${org.id}&email=${encodeURIComponent(notification.recipient_email)}`,
})

// 4. Fetch attachments if present
let attachments = []
if (notification.has_attachments) {
  const { data: files } = await supabase
    .from('email_attachments')
    .select('file_name, file_url, mime_type')
    .eq('email_notification_id', notification.id)
  
  // Download each file and convert to base64 for Resend
  attachments = await Promise.all(files.map(async f => {
    const res = await fetch(f.file_url)
    const buffer = await res.arrayBuffer()
    return {
      filename: f.file_name,
      content: btoa(String.fromCharCode(...new Uint8Array(buffer))),
    }
  }))
}

// 5. Send via Resend with attachments
const resendPayload = {
  from: `${senderName} <${Deno.env.get('FROM_EMAIL')}>`,
  reply_to: replyTo || undefined,
  to: [notification.recipient_email],
  subject: notification.subject || notification.data?.subject || 'Message from ' + senderName,
  html,
  ...(attachments.length > 0 && { attachments }),
}

const resendRes = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(resendPayload),
})

const resendData = await resendRes.json()

// 6. Update status + store Resend message ID for webhook tracking
await supabase.from('email_notifications').update({
  status: resendRes.ok ? 'sent' : 'failed',
  sent_at: resendRes.ok ? new Date().toISOString() : null,
  external_id: resendData.id || null,
  error_message: resendRes.ok ? null : JSON.stringify(resendData),
}).eq('id', notification.id)
```

### 3b. New Edge Function: `resend-webhooks`

```typescript
// supabase/functions/resend-webhooks/index.ts
// Receives delivery events from Resend, updates email_notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  const { type, data } = await req.json()
  const messageId = data?.email_id
  if (!messageId) return new Response('OK', { status: 200 })
  
  const fieldMap = {
    'email.delivered':  { status: 'delivered',  field: 'delivered_at' },
    'email.opened':     { status: 'opened',     field: 'opened_at' },
    'email.clicked':    { status: 'clicked',    field: 'clicked_at' },
    'email.bounced':    { status: 'bounced',    field: 'bounced_at' },
    'email.complained': { status: 'bounced',    field: 'bounced_at' },
  }
  
  const mapping = fieldMap[type]
  if (!mapping) return new Response('OK', { status: 200 })
  
  // Only update forward in priority
  const priority = ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed']
  const { data: existing } = await supabase
    .from('email_notifications')
    .select('status')
    .eq('external_id', messageId)
    .single()
  
  if (existing && priority.indexOf(mapping.status) > priority.indexOf(existing.status)) {
    await supabase.from('email_notifications')
      .update({ status: mapping.status, [mapping.field]: new Date().toISOString() })
      .eq('external_id', messageId)
  }
  
  return new Response('OK', { status: 200 })
})
```

**Resend webhook URL to configure:**
```
https://uqpjvbiuokwpldjvxiby.supabase.co/functions/v1/resend-webhooks
```

---

## 4. Extend `email-service.js`

### 4a. Current State (213 lines)

The file has: `queueEmail()`, `getEmailTemplate()`, `isEmailEnabled()`, and 5 email methods (3 dead code).

### 4b. Changes Needed

1. **Update `getEmailTemplate()`** to accept org branding and produce branded HTML
2. **Wire the 3 dead methods** (`sendRegistrationConfirmation`, `sendWaitlistSpotAvailable`, `sendPaymentReminder`)
3. **Add `sendBlastEmail()` method** for broadcast email sending
4. **Update `isEmailEnabled()`** to also check `organizations.send_receipt_emails` for payment receipts
5. **Update `queueEmail()`** to include new columns (subject, category, sent_by, etc.)
6. **Add `buildLynxEmail()` function** -- reusable branded HTML builder for live preview AND send

### 4c. Updated `queueEmail()` Signature

```js
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

  const { error } = await supabase.from('email_notifications').insert({
    type,
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    data,                               // JSON blob with template variables + rendered HTML body
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
    created_at: new Date().toISOString(),
  })

  if (error) console.error('Email queue error:', error)
  return { error }
}
```

### 4d. `buildLynxEmail()` -- Shared Branded HTML Builder

This function is used BOTH client-side (for live preview in template editor) AND server-side (in the Edge Function). Extract it as a pure function.

The HTML uses table-based layout for email client compatibility. Supports:
- Org logo in header (or text fallback)
- Org primary color as header background
- Rich HTML body content (from Tiptap editor output)
- CTA button with accent color
- Footer with custom text, social links, unsubscribe
- "Powered by Lynx" lockup

```js
// src/lib/email-html-builder.js

export function buildLynxEmail({
  headerColor = '#10284C',
  headerLogo = null,
  accentColor = '#5BCBFA',
  senderName = 'Lynx',
  heading = '',
  body = '',           // Rich HTML content from Tiptap
  ctaText = null,
  ctaUrl = null,
  footerText = null,
  socialLinks = {},    // { website, instagram, facebook, twitter }
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
          
          <!-- HEADER -->
          <tr>
            <td style="background-color:${headerColor};padding:36px 40px;text-align:center">
              ${headerLogo
                ? `<img src="${headerLogo}" alt="${senderName}" height="44" style="height:44px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto">`
                : `<div style="font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:16px">${senderName}</div>`
              }
              ${heading ? `<h1 style="color:#FFFFFF;font-size:24px;font-weight:800;margin:0;line-height:1.25;letter-spacing:-0.01em">${heading}</h1>` : ''}
            </td>
          </tr>
          
          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px 28px;color:#2D3748;font-size:15px;line-height:1.75">
              ${body}
            </td>
          </tr>
          
          <!-- CTA BUTTON -->
          ${ctaText && ctaUrl ? `
          <tr>
            <td style="padding:0 40px 40px;text-align:center">
              <a href="${ctaUrl}" style="display:inline-block;background-color:${accentColor};color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:100px;letter-spacing:0.02em">${ctaText}</a>
            </td>
          </tr>` : ''}
          
          <!-- FOOTER -->
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
```

---

## 5. Rich Text Composer

### 5a. Package: Tiptap

Install Tiptap for the email/broadcast composer. Lightweight, React-native, extensible.

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-placeholder
```

### 5b. Supported Formatting

| Feature | Toolbar Button | Notes |
|---------|---------------|-------|
| Bold | **B** | `Ctrl+B` |
| Italic | *I* | `Ctrl+I` |
| Underline | U | `Ctrl+U` |
| Heading 1 | H1 | For section headings in longer emails |
| Heading 2 | H2 | For sub-headings |
| Bullet list | • | Unordered list |
| Numbered list | 1. | Ordered list |
| Link | 🔗 | Insert/edit URL |
| Image | 🖼 | Upload to Supabase Storage, insert URL |
| Attachment | 📎 | Upload file, stored in `email_attachments`, sent via Resend |
| Paragraph spacing | Built-in | Tiptap handles this natively |
| Undo/Redo | ↩↪ | Standard |

### 5c. What We DON'T Include

No tables, no columns, no font selector, no font size selector (headings handle hierarchy), no text color (brand colors only), no drag-and-drop blocks. Clean and functional, not Mailchimp.

### 5d. Email Composer Component

```
src/components/email/EmailComposer.jsx
```

The composer wraps Tiptap with a toolbar and outputs clean HTML. Used in:
1. Template Editor body field
2. ComposeBlastModal body field (replacing the plain `<textarea>`)
3. Standalone email compose (from Email page)

The Tiptap output is stored as HTML in `email_notifications.data.html_body` (for broadcasts) or in `notification_templates.email_body_template` (for templates).

### 5e. Attachment Flow

1. User clicks 📎 in toolbar
2. File picker opens (accept: `.pdf, .jpg, .png, .doc, .docx, .xls, .xlsx`)
3. File uploads to Supabase Storage bucket `email-attachments` at path `{org_id}/{uuid}_{filename}`
4. File metadata stored in `email_attachments` table, linked to the `email_notification_id` (after the email_notification row is created)
5. The Edge Function reads `email_attachments` rows, downloads files, and sends as Resend attachments
6. Max file size: 10MB per attachment, 25MB total per email (Resend limit)

### 5f. Image Embedding Flow

1. User clicks 🖼 in toolbar
2. File picker opens (accept: `.jpg, .png, .gif, .webp`)
3. Image uploads to Supabase Storage bucket `email-attachments` at path `{org_id}/images/{uuid}_{filename}`
4. Public URL is inserted into the Tiptap editor as an `<img>` tag
5. Image renders inline in the email (not as an attachment)

---

## 6. Email Template System

### 6a. Template Types & Variables

Templates live in `notification_templates` with `channel = 'email'`.

| Template Type | Trigger | Available Variables |
|---|---|---|
| `registration_confirmation` | Registration status → approved/rostered | `{{player_name}}`, `{{parent_name}}`, `{{season_name}}`, `{{team_name}}`, `{{start_date}}`, `{{org_name}}`, `{{app_url}}` |
| `payment_receipt` | Payment marked paid | `{{payer_name}}`, `{{parent_name}}`, `{{amount}}`, `{{description}}`, `{{payment_date}}`, `{{payment_method}}`, `{{transaction_id}}`, `{{org_name}}`, `{{app_url}}` |
| `blast_announcement` | Admin/Coach sends blast with email toggle | `{{subject}}`, `{{heading}}`, `{{body}}`, `{{coach_name}}`, `{{org_name}}`, `{{app_url}}` |

Variable replacement happens at queue time in `email-service.js` (before inserting into `email_notifications`).

### 6b. Template Editor

Admin can edit each template's: subject line, heading, body content (via Tiptap rich text editor), CTA button text, CTA button URL, and active/inactive toggle.

**Live preview** on the right side renders the full branded email in an iframe, updating in real-time as the admin types. Uses `buildLynxEmail()` with the org's actual branding settings + current form values.

**Variable helper** panel above the body editor shows available `{{variables}}` for this template type. Click to insert at cursor position in the Tiptap editor.

**Desktop/mobile preview toggle** lets admin see the email at 600px (desktop) and 375px (mobile) widths.

---

## 7. Brand Voice & Default Templates

> **Lynx Brand Book, Chapter 8:** "Lynx writes with the authority of a coach and the energy of a teammate. We are never corporate."
> **The rule:** "Secure your spot on the roster" instead of "Please complete your registration."

### 7a. Registration Confirmation

**Tone:** Warm, celebratory, clear.

```
Subject: {{player_name}} is on the roster. Let's go.
Heading: Roster Locked In

Body:
Hey {{parent_name}},

It's official. {{player_name}} is registered for {{season_name}} and the season is about to get real.

Here's what you need to know:
• Team: {{team_name}}
• Season: {{season_name}}
• First day: {{start_date}}

You'll get practice schedules, game details, and updates right in the app. If anything comes up, just reply to this email.

Welcome to the team.

CTA: Open Lynx → {{app_url}}
```

### 7b. Payment Receipt

**Tone:** Efficient, warm, no-nonsense.

```
Subject: Payment received. You're all set.
Heading: Payment Confirmed

Body:
Hi {{payer_name}},

We got it. Here's your receipt:

• Amount: {{amount}}
• For: {{description}}
• Date: {{payment_date}}
• Method: {{payment_method}}
• Reference: {{transaction_id}}

No action needed. This is your confirmation. If anything looks off, reply to this email and we'll sort it out.

CTA: View Payment History → {{app_url}}/payments
```

### 7c. Announcement (Broadcast)

Subject, heading, and body are all provided by the admin/coach at compose time. The template just wraps it in org branding.

---

## 8. Transactional Email Triggers

### 8a. Registration Confirmation

**Trigger point:** `RegistrationsPage.jsx` already calls `EmailService.sendApprovalNotification()` when approving a registration. The dead `sendRegistrationConfirmation()` method should be wired here too.

**Join path for data:**
```
registrations.player_id → players (first_name, last_name, parent_name, parent_email)
registrations.season_id → seasons (name, start_date, organization_id)
players.id → team_players.player_id → teams (name)
```

**Wire in `RegistrationsPage.jsx`** wherever the approval action fires:
```js
// After status update to 'approved' or 'rostered'
if (isEmailEnabled(organization, 'registration_confirmation')) {
  await EmailService.sendRegistrationConfirmation({
    recipientEmail: player.parent_email,
    recipientName: player.parent_name,
    playerName: `${player.first_name} ${player.last_name.charAt(0)}.`,
    seasonName: season.name,
    teamName: teamName || 'TBD',
    startDate: formatDate(season.start_date),
    organizationId: organization.id,
    organizationName: organization.email_sender_name || organization.name,
  })
}
```

### 8b. Payment Receipt

**Trigger point:** Payment status changes to paid. This likely happens in the payments page or Stripe webhook handler. The `send_receipt_emails` column on `organizations` gates this.

**Data available on `payments` row:** `family_email`, `payer_name`, `amount`, `description`/`fee_name`, `payment_method`, `stripe_payment_intent_id`, `reference_number`.

**Wire in wherever payment is marked as paid:**
```js
if (organization.send_receipt_emails) {
  await EmailService.sendPaymentReceipt({
    recipientEmail: payment.family_email || player?.parent_email,
    recipientName: payment.payer_name || player?.parent_name,
    amount: formatCurrency(payment.amount),
    description: payment.description || payment.fee_name || 'Club Fee',
    paymentDate: formatDate(payment.paid_at || payment.paid_date),
    paymentMethod: payment.payment_method || 'Card',
    transactionId: payment.stripe_payment_intent_id || payment.reference_number || payment.id,
    organizationId: organization.id,
    organizationName: organization.email_sender_name || organization.name,
  })
}
```

---

## 9. Broadcast Email Integration

### 9a. Extend ComposeBlastModal in BlastsPage.jsx

Add an "Also send as email" toggle to the existing blast compose flow. When enabled, after the blast is created in `messages` + `message_recipients`, also queue emails for each recipient.

**UI addition to ComposeBlastModal:**

```
┌────────────────────────────────────────────┐
│  Compose Announcement                       │
│                                             │
│  Title: [________________________]          │
│  Body:  [Tiptap rich text editor  ]         │  ← Replace <textarea> with Tiptap
│         [                          ]         │
│  Type:  [General ▼]                         │
│  Priority: [Normal ▼]                       │
│  Target: [Everyone ▼]                       │
│                                             │
│  ┌─ Email Delivery ──────────────────────┐  │
│  │  ☐ Also send as email                 │  │  ← NEW TOGGLE
│  │                                       │  │
│  │  When enabled:                        │  │
│  │  Subject: [________________________]  │  │  ← NEW FIELD (defaults to title)
│  │  Include CTA button:                  │  │
│  │    Text: [Open Lynx    ]              │  │  ← OPTIONAL
│  │    URL:  [https://the..]              │  │  ← OPTIONAL
│  │  📎 Attach files                      │  │  ← OPTIONAL
│  │                                       │  │
│  │  ⓘ Email will be sent to X recipients │  │
│  │    (Y unsubscribed will be skipped)   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Preview Email]  [Cancel]  [Send]          │  ← Preview button NEW
└────────────────────────────────────────────┘
```

### 9b. Preview Modal

"Preview Email" opens a modal showing the full branded email rendered in an iframe. Desktop/mobile viewport toggle. Uses `buildLynxEmail()` with:
- Org's actual branding (from context)
- The subject, heading (title), and body from the compose form
- A sample recipient name ("Preview Recipient")

### 9c. Send Flow (when email toggle is ON)

```js
// After creating the blast in messages + message_recipients:

if (sendAsEmail) {
  const batchId = crypto.randomUUID()
  
  // Get unsubscribed emails for this org
  const { data: unsubs } = await supabase
    .from('email_unsubscribes')
    .select('email')
    .eq('organization_id', organization.id)
  const unsubSet = new Set((unsubs || []).map(u => u.email.toLowerCase()))
  
  // For each recipient that has an email and isn't unsubscribed
  for (const recipient of recipients) {
    if (!recipient.email || unsubSet.has(recipient.email.toLowerCase())) continue
    
    await EmailService.sendBlastEmail({
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      recipientUserId: recipient.profile_id || null,
      subject: emailSubject || blastTitle,
      heading: blastTitle,
      body: tiptapHtmlOutput,        // Rich HTML from Tiptap
      ctaText: ctaText || null,
      ctaUrl: ctaUrl || null,
      organizationId: organization.id,
      organizationName: organization.email_sender_name || organization.name,
      sentBy: user.id,
      sentByRole: activeView,        // 'admin' or 'coach'
      blastMessageId: newMessage.id,
      broadcastBatchId: batchId,
      audienceType: targetType,
      audienceTargetId: targetType === 'team' ? selectedTeamId : null,
      hasAttachments: attachments.length > 0,
    })
  }
  
  // Upload attachments and link to email_notification rows
  if (attachments.length > 0) {
    // ... attachment upload + email_attachments insert
  }
  
  showToast(`Blast sent! ${emailCount} emails queued.`, 'success')
}
```

---

## 10. Web Admin UI

### 10a. Navigation Changes

**File: `src/MainApp.jsx`**

Add to `adminNavGroups` inside the existing **Communication** group (~line 1042):

```js
{
  id: 'communication',
  label: 'Communication',
  type: 'group',
  icon: 'chats',
  items: [
    { id: 'chats',         label: 'Chats',              icon: 'message' },
    { id: 'blasts',        label: 'Announcements',       icon: 'megaphone' },
    { id: 'notifications', label: 'Push Notifications',  icon: 'bell' },
    { id: 'email',         label: 'Email',               icon: 'mail' },      // ← ADD
  ]
}
```

Add to `coachNavGroups` Communication group as well (coaches see Email Log for their sends).

**File: `src/components/layout/LynxSidebar.jsx`**
Add to `ICON_MAP` (~line 21):
```js
'mail': Mail,    // import { Mail } from 'lucide-react'
```

**File: `src/lib/routes.js`**
```js
// Add to ROUTES:
'email': '/email',
'email-templates': '/email/templates',

// Add to PAGE_TITLES:
'/email': 'Email',
'/email/templates': 'Email Templates',
```

### 10b. Email Page (`src/pages/email/EmailPage.jsx`)

**Who sees it:** Admin (full view) + Coach (own sends only)

**Layout:** Tabbed page using PageShell.

**Tab 1: Email Log** (default tab)

Filterable table showing all sent emails from `email_notifications`.

| Column | Source |
|--------|--------|
| Date | `created_at` |
| Subject | `subject` |
| Type | `type` (badge: Registration, Payment, Announcement) |
| Category | `category` (pill: Transactional / Broadcast) |
| Recipient | `recipient_name` + `recipient_email` |
| Status | `status` (pill with status colors from the existing pattern) |
| Sent By | `sent_by` → join profiles |

**Status pills use existing color pattern:**
```
delivered → bg-emerald-500/12 text-emerald-500
sent      → bg-[#4BB9EC]/15 text-[#4BB9EC]
pending   → bg-amber-500/12 text-amber-500
opened    → bg-emerald-500/12 text-emerald-500
bounced   → bg-red-500/12 text-red-500
failed    → bg-red-500/12 text-red-500
```

**Filters:** Date range, type, category, status, search by recipient.

**Broadcast batch grouping:** Rows with same `broadcast_batch_id` show a summary row: "Announcement: [subject] -- X sent, Y delivered, Z opened". Expandable to see individual recipients.

**Row click → detail panel:** Full subject, body preview, delivery timeline (Queued → Sent → Delivered → Opened), recipient info, Resend message ID.

**Tab 2: Compose Email**

Standalone email composer for one-off emails (not tied to a blast):
- Recipient picker: search profiles by name/email, multi-select
- Subject line
- Tiptap rich text body
- Optional CTA button
- Optional attachments
- Preview button (opens branded email preview modal)
- Send button

**Tab 3: Templates** (Admin only)

Card grid showing each email template from `notification_templates WHERE channel IN ('email', 'both')`.

Each card: template name, type badge, active pill, "Edit" button.

"Edit" opens the **Template Editor** (see 10c).

### 10c. Template Editor (`src/pages/email/EmailTemplateEditor.jsx`)

**Layout:** Split-screen. Edit on left, live preview on right.

**Left panel:**
- Subject line (text input with `{{variable}}` autocomplete)
- Heading (text input)
- Body (Tiptap rich text editor with variable helper panel)
- CTA button text (optional input)
- CTA button URL (optional input)
- Active toggle

**Variable helper:** Expandable panel showing available `{{variables}}` for this template type. Click to insert. Shows description of each variable.

**Right panel:**
- Full email rendered in sandboxed iframe
- Uses `buildLynxEmail()` with org's actual branding + current form values
- Updates in real-time as admin types
- Desktop (600px) / Mobile (375px) toggle buttons
- "Send Test Email" button -- sends preview to admin's own email

### 10d. Email Settings (in existing Setup section)

**File: `src/pages/settings/SetupSectionContent.jsx`**

The investigation found an **"Email Branding (Future)" placeholder section** already in this file. Build it out:

**Section: Email Branding** (replacing the placeholder)

- **Sender Name** (text) -- "Appears as the 'From' name. Defaults to your org name."
- **Reply-To Email** (email) -- "Where replies go. Defaults to your contact email."
- **Header Color** (color picker -- reuse existing team color input pattern, or native `<input type="color">`)
- **Header Logo** (image upload -- reuse existing Supabase Storage upload pattern to `media` bucket)
- **Button/Accent Color** (color picker)
- **Footer Text** (textarea)
- **Social Links** (inputs: Website, Instagram, Facebook, X)
- **Unsubscribe toggle** for broadcast emails
- **Live mini-preview** of email header with current settings

These save to the new columns on `organizations` + existing `settings.branding` fields.

### 10e. Blast Compose Changes

**File: `src/pages/blasts/BlastsPage.jsx`**

In `ComposeBlastModal`:
1. Replace `<textarea>` body input with Tiptap EmailComposer
2. Add "Also send as email" toggle section (see Section 9a wireframe)
3. Add "Preview Email" button that opens branded email preview
4. Wire email queue on send (see Section 9c)

---

## 11. Role Permissions

| Action | Admin | Coach | Parent | Player |
|--------|-------|-------|--------|--------|
| Edit email branding/settings | Yes | No | No | No |
| Edit email templates | Yes | No | No | No |
| View templates | Yes | Yes (read-only) | No | No |
| Send blast + email (all org) | Yes | No | No | No |
| Send blast + email (own teams) | Yes | Yes | No | No |
| Compose standalone email | Yes | No (future) | No | No |
| View email log (all org) | Yes | No | No | No |
| View email log (own sends) | Yes | Yes | No | No |
| Receive transactional emails | Yes | Yes | Yes | Yes* |
| Receive broadcast emails | Yes | Yes | Yes | Yes* |
| Unsubscribe from broadcasts | No | No | Yes | Yes |

*Players only if they have an email on file.

---

## 12. Mobile Considerations

The backend is 100% shared. Mobile calls the same `email-service.js` queue pattern (or directly inserts into `email_notifications`).

**Future mobile additions:**
- Coach: "Send as email" toggle on mobile blast compose
- Parent: notification preferences screen (includes email unsubscribe)
- Push notification when a blast email is sent (already handled by existing push system)

**Stays web-only:**
- Template editor
- Email branding settings
- Full email log with analytics

---

## 13. Phase Execution Plan

### Phase 0: Fix Blast System Bugs (PREREQUISITE)

These must be fixed BEFORE building email on top.

1. **`BlastsPage.jsx` ~line 393:** Add `organization_id: organization.id` to the `messages` INSERT
2. **`BlastsPage.jsx` recipient resolution:** Add `profile_id` to `message_recipients` INSERT so `BlastAlertChecker` can find new blasts
3. **Verify:** Create a blast, confirm it appears in the list and triggers the alert popup

### Phase 1: Database Migrations

1. Run ALTER TABLE on `email_notifications` (add tracking columns)
2. Run ALTER TABLE on `notification_templates` (add email columns)
3. Run ALTER TABLE on `organizations` (add email settings columns)
4. Create `email_unsubscribes` table
5. Create `email_attachments` table
6. Check existing RLS policies (run the query in Section 2f), add only non-conflicting new policies
7. **Verify:** Tables modified, no existing queries broken, NotificationsPage still works

### Phase 2: Email Service & Edge Function

1. Extend `email-service.js`: update `queueEmail()`, add `sendBlastEmail()`, add `sendPaymentReceipt()`, wire dead methods
2. Create `src/lib/email-html-builder.js` with `buildLynxEmail()`
3. Extend `send-payment-reminder` Edge Function with branded HTML builder and attachment support
4. Create `resend-webhooks` Edge Function
5. Configure Resend webhook URL in Resend dashboard
6. Seed default email templates into `notification_templates` for existing orgs
7. **Verify:** Manually insert a pending email_notification row, confirm Edge Function picks it up, sends branded email via Resend, webhook updates status

### Phase 3: Email Branding Settings UI

1. Build out "Email Branding" section in `SetupSectionContent.jsx` (replacing Future placeholder)
2. Wire persistence to `organizations` columns + `settings.branding`
3. Include live mini-preview of email header
4. Update `isEmailEnabled()` to respect `send_receipt_emails` column
5. **Verify:** Admin configures sender name, logo, colors, footer. Preview shows correct branding.

### Phase 4: Rich Text Composer

1. Install Tiptap packages
2. Build `src/components/email/EmailComposer.jsx` (toolbar + Tiptap editor)
3. Build image upload flow (to Supabase Storage, insert into editor)
4. Build attachment upload flow (to Supabase Storage, link to `email_attachments`)
5. **Verify:** Rich text composer produces clean HTML, images embed, attachments upload

### Phase 5: Broadcast Email Integration

1. Replace `<textarea>` in `ComposeBlastModal` with EmailComposer
2. Add "Also send as email" toggle section with email-specific fields
3. Add "Preview Email" button with branded preview modal (desktop/mobile toggle)
4. Wire email queue on send (Section 9c flow)
5. Handle unsubscribe filtering
6. **Verify:** Compose blast with email toggle ON, recipients get branded email, blast + email tracked together

### Phase 6: Email Page (Log + Templates + Compose)

1. Add routes, nav items, icon (Section 10a)
2. Build `EmailPage.jsx` with 3 tabs: Log, Compose, Templates
3. Build Email Log table with filters, status pills, batch grouping, detail panel
4. Build standalone Compose tab (recipient picker, composer, preview, send)
5. Build Templates tab with card grid + Template Editor (split-screen, live preview, variable helper)
6. **Verify:** Full email page functional. Log shows all sends. Templates editable with live preview. Compose sends standalone emails.

### Phase 7: Transactional Triggers

1. Wire `sendRegistrationConfirmation` in `RegistrationsPage.jsx` (on approval action)
2. Wire `sendPaymentReceipt` in payment confirmation flow (verify where payments are marked paid)
3. Test with real registration approval and payment confirmation
4. **Verify:** Approving a registration sends branded confirmation email. Marking payment as paid sends branded receipt.

### Phase 8: Polish

1. Unsubscribe endpoint/page for broadcast recipients
2. "Send Test Email" button on template editor
3. Empty states for email log (brand voice: "No emails sent yet. Once you start sending, you'll see everything here.")
4. Error handling: surface failed sends in admin dashboard
5. Rate limiting for coach broadcasts (suggest: max 5 per day per coach)
6. Email rendering QA across clients (Gmail, Outlook, Apple Mail, Yahoo, mobile)
7. Coach view of email log (their sends only)

---

## Appendix A: Files Modified (Existing)

| File | Changes |
|------|---------|
| `src/MainApp.jsx` | Add Email route, nav item in Communication group, import EmailPage |
| `src/lib/routes.js` | Add email routes to ROUTES and PAGE_TITLES |
| `src/components/layout/LynxSidebar.jsx` | Add 'mail' to ICON_MAP |
| `src/lib/email-service.js` | Extend queueEmail(), wire dead methods, add sendBlastEmail(), sendPaymentReceipt(), update templates |
| `src/pages/settings/SetupSectionContent.jsx` | Build out "Email Branding" section (replace Future placeholder) |
| `src/pages/settings/OrganizationPage.jsx` | Persist new email settings fields |
| `src/pages/blasts/BlastsPage.jsx` | Fix org_id bug, fix profile_id bug, replace textarea with Tiptap, add email toggle, add preview |
| `src/pages/registrations/RegistrationsPage.jsx` | Wire sendRegistrationConfirmation on approval |
| `supabase/functions/send-payment-reminder/index.ts` | Extend with branded HTML, attachments, subject line |

## Appendix B: Files Created (New)

| File | Purpose |
|------|---------|
| `src/pages/email/EmailPage.jsx` | Main email page (3 tabs: Log, Compose, Templates) |
| `src/pages/email/EmailLogTable.jsx` | Email log table component |
| `src/pages/email/EmailComposePage.jsx` | Standalone email compose tab |
| `src/pages/email/EmailTemplatesTab.jsx` | Template card grid |
| `src/pages/email/EmailTemplateEditor.jsx` | Split-screen template editor with live preview |
| `src/components/email/EmailComposer.jsx` | Tiptap-based rich text email composer |
| `src/components/email/EmailPreviewModal.jsx` | Branded email preview in iframe (desktop/mobile toggle) |
| `src/components/email/VariableHelper.jsx` | Click-to-insert {{variable}} panel |
| `src/components/email/EmailStatusBadge.jsx` | Delivery status pill component |
| `src/components/email/RecipientPicker.jsx` | Search + multi-select recipient picker |
| `src/components/email/AttachmentUploader.jsx` | File upload + attachment management |
| `src/lib/email-html-builder.js` | Shared buildLynxEmail() function (client + server) |
| `supabase/functions/resend-webhooks/index.ts` | Resend delivery event handler |

## Appendix C: Packages to Install

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-placeholder
```

No other packages needed. Color picker uses native `<input type="color">`. Forms use existing useState pattern. No email SDK needed client-side (Resend is called server-side only).

## Appendix D: Resend Cost Mapping

| Org Size | Monthly Emails (est.) | Resend Plan | Cost |
|----------|----------------------|-------------|------|
| 1 team (20 families) | ~100-200 | Free (3K/mo) | $0 |
| Small club (5 teams) | ~500-1K | Free | $0 |
| Medium club (15 teams) | ~1.5-3K | Free (tight) | $0 |
| Large club (30+ teams) | ~3-8K | Pro | $20/mo |
