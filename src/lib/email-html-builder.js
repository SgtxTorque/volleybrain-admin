// =============================================================================
// Shared branded email HTML builder
// Used client-side (template preview) AND server-side (Edge Function)
// =============================================================================

export function buildLynxEmail({
  headerColor = '#10284C',
  headerLogo = null,
  accentColor = '#5BCBFA',
  senderName = 'Lynx',
  heading = '',
  body = '',
  ctaText = null,
  ctaUrl = null,
  footerText = null,
  socialLinks = {},
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

// Resolve org branding from organization record
export function resolveOrgBranding(org) {
  return {
    headerColor: org?.settings?.branding?.email_header_color || org?.primary_color || '#10284C',
    headerLogo: org?.settings?.branding?.email_header_logo || org?.logo_url || null,
    accentColor: org?.secondary_color || '#5BCBFA',
    senderName: org?.email_sender_name || org?.name || 'Lynx',
    replyTo: org?.email_reply_to || org?.contact_email || null,
    footerText: org?.email_footer_text || null,
    socialLinks: {
      website: org?.website || null,
      instagram: org?.email_social_instagram || null,
      facebook: org?.email_social_facebook || null,
      twitter: org?.email_social_twitter || null,
    },
    includeUnsubscribe: org?.email_include_unsubscribe !== false,
  }
}

// Replace {{variables}} in a template string
export function replaceTemplateVars(template, vars = {}) {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : match
  })
}
