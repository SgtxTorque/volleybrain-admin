# CC-DEPLOY-LEGAL-PAGES.md
# LYNX — Deploy Privacy Policy & Terms of Service to thelynxapp.com
# Classification: EXECUTE — Follow exactly.
# REPO: volleybrain-admin (NOT Volleybrain-Mobile3)

---

## EXECUTIVE DIRECTIVE

This spec adds static Privacy Policy and Terms of Service pages to the web admin repo so they are publicly accessible at `thelynxapp.com/privacy-policy` and `thelynxapp.com/terms`. These URLs are required for Google Play Store submission.

**You will ONLY create/modify the files listed below. Nothing else.**

---

## RULES

1. **This runs in the `volleybrain-admin` repo, NOT the mobile repo.**
2. **Create ONLY the files listed below.**
3. **Modify ONLY `vercel.json` — nothing else existing.**
4. **Do NOT touch any React components, routes, or source files.**

---

## TASK 1: Create privacy policy page
**File to create:** `public/privacy-policy.html`

Create the file with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy | Lynx</title>
  <link rel="icon" type="image/png" href="/lynx-icon-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #10284C;
      --sky: #4BB9EC;
      --bg: #F6F8FB;
      --card: #FFFFFF;
      --text: #10284C;
      --text-secondary: rgba(16, 40, 76, 0.7);
      --text-muted: rgba(16, 40, 76, 0.45);
      --border: rgba(16, 40, 76, 0.08);
      --radius: 14px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg); color: var(--text); line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      background: var(--navy); padding: 32px 24px; text-align: center;
      position: relative; overflow: hidden;
    }
    .header::before {
      content: ''; position: absolute; top: -50%; right: -20%;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(75,185,236,0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    .header-inner { max-width: 720px; margin: 0 auto; position: relative; z-index: 1; }
    .logo-text { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: 2px; }
    .logo-accent { color: var(--sky); }
    .header h1 { font-size: 22px; font-weight: 600; color: rgba(255,255,255,0.9); margin-top: 12px; }
    .updated-badge {
      display: inline-block; margin-top: 12px; padding: 6px 14px;
      background: rgba(75,185,236,0.15); border: 1px solid rgba(75,185,236,0.25);
      border-radius: 20px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.7);
    }
    .container { max-width: 720px; margin: 0 auto; padding: 32px 24px 80px; }
    .section {
      background: var(--card); border-radius: var(--radius); border: 1px solid var(--border);
      padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(16,40,76,0.04);
    }
    .section h2 {
      font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 12px;
      padding-bottom: 10px; border-bottom: 2px solid var(--sky); display: inline-block;
    }
    .section p { font-size: 15px; color: var(--text-secondary); margin-bottom: 12px; }
    .section ul { list-style: none; padding: 0; }
    .section li {
      font-size: 15px; color: var(--text-secondary); padding: 6px 0 6px 20px;
      position: relative; line-height: 1.6;
    }
    .section li::before {
      content: ''; position: absolute; left: 0; top: 14px;
      width: 6px; height: 6px; background: var(--sky); border-radius: 50%;
    }
    .rights-note {
      font-size: 14px; color: var(--text-muted); font-style: italic;
      margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);
    }
    .footer { text-align: center; padding: 40px 24px; border-top: 1px solid var(--border); }
    .footer-brand { font-size: 16px; font-weight: 700; color: var(--navy); letter-spacing: 1.5px; margin-bottom: 8px; }
    .footer p { font-size: 13px; color: var(--text-muted); }
    .footer a { color: var(--sky); text-decoration: none; font-weight: 500; }
    .footer a:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .header { padding: 24px 16px; }
      .container { padding: 20px 16px 60px; }
      .section { padding: 20px 16px; }
      .logo-text { font-size: 24px; }
      .header h1 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-inner">
      <span class="logo-text">L<span class="logo-accent">Y</span>NX</span>
      <h1>Privacy Policy</h1>
      <span class="updated-badge">Last Updated: February 2026</span>
    </div>
  </div>
  <div class="container">
    <div class="section">
      <h2>1. Information We Collect</h2>
      <p>We collect the following information to manage youth sports league participation:</p>
      <ul>
        <li><strong>Player Information:</strong> names, dates of birth, school grade, jersey sizes, positions, photos</li>
        <li><strong>Parent/Guardian Information:</strong> names, email addresses, phone numbers, emergency contacts</li>
        <li><strong>Medical Information:</strong> allergies, medical conditions, medications (shared with coaches for player safety)</li>
        <li><strong>Financial Information:</strong> payment records, fee statuses, transaction history</li>
        <li><strong>Communication Data:</strong> chat messages between team members, coaches, and parents</li>
        <li><strong>Usage Data:</strong> app interactions, notification preferences</li>
        <li><strong>Game Data:</strong> statistics, attendance records, game results</li>
      </ul>
    </div>
    <div class="section">
      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>Managing league registrations and team rosters</li>
        <li>Facilitating communication between coaches, parents, and players</li>
        <li>Tracking player statistics and achievements</li>
        <li>Processing registration fees and payments</li>
        <li>Sending important notifications about schedules, games, and events</li>
        <li>Ensuring player safety through medical information access for coaches</li>
        <li>Generating reports for league administration</li>
      </ul>
    </div>
    <div class="section">
      <h2>3. Who Can See Your Data</h2>
      <ul>
        <li><strong>Coaches and team staff:</strong> Player names, positions, medical info, stats, attendance</li>
        <li><strong>Other parents on the same team:</strong> Player first name, jersey number only</li>
        <li><strong>Organization administrators:</strong> All data for their organization</li>
        <li><strong>Your child's data:</strong> Players see their own stats and achievements</li>
        <li>We do <strong>NOT</strong> share data with third-party advertisers or data brokers</li>
      </ul>
    </div>
    <div class="section">
      <h2>4. Children's Privacy</h2>
      <ul>
        <li>Lynx collects information about children under 13 only with verified parental consent</li>
        <li>Parents must provide consent during registration before any child data is collected</li>
        <li>Parents can review, modify, or request deletion of their child's data at any time</li>
        <li>Parents can revoke consent, which will remove their child from active rosters</li>
        <li>We use email verification as our parental consent method</li>
      </ul>
    </div>
    <div class="section">
      <h2>5. Data Storage &amp; Security</h2>
      <ul>
        <li>Data is stored securely using Supabase (cloud-hosted PostgreSQL database)</li>
        <li>All data transmission is encrypted using HTTPS/TLS</li>
        <li>Access to data is role-based and restricted to authorized users within your organization</li>
        <li>We do not store payment card numbers. Payment processing is handled by third-party providers</li>
      </ul>
    </div>
    <div class="section">
      <h2>6. Data Retention</h2>
      <ul>
        <li>Active player data is retained while the player is enrolled in any season</li>
        <li>Historical statistics and achievements are retained for the player's career history</li>
        <li>Upon request, we will delete all personal data within 30 days</li>
        <li>Chat messages are retained for the duration of the season</li>
      </ul>
    </div>
    <div class="section">
      <h2>7. Your Rights</h2>
      <ul>
        <li><strong>Access:</strong> Request a copy of all data we store about you or your child</li>
        <li><strong>Correction:</strong> Update inaccurate information through your profile settings</li>
        <li><strong>Deletion:</strong> Request complete deletion of your account and associated data</li>
        <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
        <li><strong>Consent Withdrawal:</strong> Revoke consent for data collection at any time</li>
      </ul>
      <p class="rights-note">To exercise these rights, use the Data Rights section in your profile or contact your organization administrator.</p>
    </div>
    <div class="section">
      <h2>8. Contact Us</h2>
      <p>For privacy-related questions or requests:</p>
      <ul>
        <li>Email: <a href="mailto:privacy@thelynxapp.com" style="color:var(--sky);text-decoration:none;font-weight:500;">privacy@thelynxapp.com</a></li>
        <li>Through the app: Settings &rarr; Help &amp; Support</li>
        <li>Your organization administrator can also assist with data requests</li>
      </ul>
    </div>
  </div>
  <div class="footer">
    <div class="footer-brand">LYNX</div>
    <p>&copy; 2026 Lynx Sports Technology. All rights reserved.</p>
    <p style="margin-top:8px;">
      <a href="/terms">Terms of Service</a> &nbsp;&middot;&nbsp;
      <a href="/privacy-policy">Privacy Policy</a>
    </p>
  </div>
</body>
</html>
```

---

## TASK 2: Create terms of service page
**File to create:** `public/terms.html`

Create the file with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Service | Lynx</title>
  <link rel="icon" type="image/png" href="/lynx-icon-logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --navy: #10284C;
      --sky: #4BB9EC;
      --bg: #F6F8FB;
      --card: #FFFFFF;
      --text: #10284C;
      --text-secondary: rgba(16, 40, 76, 0.7);
      --text-muted: rgba(16, 40, 76, 0.45);
      --border: rgba(16, 40, 76, 0.08);
      --radius: 14px;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg); color: var(--text); line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      background: var(--navy); padding: 32px 24px; text-align: center;
      position: relative; overflow: hidden;
    }
    .header::before {
      content: ''; position: absolute; top: -50%; right: -20%;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(75,185,236,0.15) 0%, transparent 70%);
      border-radius: 50%;
    }
    .header-inner { max-width: 720px; margin: 0 auto; position: relative; z-index: 1; }
    .logo-text { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: 2px; }
    .logo-accent { color: var(--sky); }
    .header h1 { font-size: 22px; font-weight: 600; color: rgba(255,255,255,0.9); margin-top: 12px; }
    .updated-badge {
      display: inline-block; margin-top: 12px; padding: 6px 14px;
      background: rgba(75,185,236,0.15); border: 1px solid rgba(75,185,236,0.25);
      border-radius: 20px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.7);
    }
    .container { max-width: 720px; margin: 0 auto; padding: 32px 24px 80px; }
    .section {
      background: var(--card); border-radius: var(--radius); border: 1px solid var(--border);
      padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(16,40,76,0.04);
    }
    .section h2 {
      font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 12px;
      padding-bottom: 10px; border-bottom: 2px solid var(--sky); display: inline-block;
    }
    .section p { font-size: 15px; color: var(--text-secondary); margin-bottom: 12px; }
    .section ul { list-style: none; padding: 0; }
    .section li {
      font-size: 15px; color: var(--text-secondary); padding: 6px 0 6px 20px;
      position: relative; line-height: 1.6;
    }
    .section li::before {
      content: ''; position: absolute; left: 0; top: 14px;
      width: 6px; height: 6px; background: var(--sky); border-radius: 50%;
    }
    .footer { text-align: center; padding: 40px 24px; border-top: 1px solid var(--border); }
    .footer-brand { font-size: 16px; font-weight: 700; color: var(--navy); letter-spacing: 1.5px; margin-bottom: 8px; }
    .footer p { font-size: 13px; color: var(--text-muted); }
    .footer a { color: var(--sky); text-decoration: none; font-weight: 500; }
    .footer a:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .header { padding: 24px 16px; }
      .container { padding: 20px 16px 60px; }
      .section { padding: 20px 16px; }
      .logo-text { font-size: 24px; }
      .header h1 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-inner">
      <span class="logo-text">L<span class="logo-accent">Y</span>NX</span>
      <h1>Terms of Service</h1>
      <span class="updated-badge">Last Updated: February 2026</span>
    </div>
  </div>
  <div class="container">
    <div class="section">
      <h2>1. Acceptance of Terms</h2>
      <p>By creating an account or using Lynx, you agree to these terms. If you do not agree, do not use the service. Parents/guardians accepting on behalf of minor children are bound by these terms.</p>
    </div>
    <div class="section">
      <h2>2. Account Responsibilities</h2>
      <ul>
        <li>You are responsible for maintaining the security of your account credentials</li>
        <li>You must provide accurate information during registration</li>
        <li>Parents are responsible for the accuracy of their child's medical information</li>
        <li>You must be at least 18 years old to create a parent or coach account</li>
        <li>One account per person. Do not share account access</li>
      </ul>
    </div>
    <div class="section">
      <h2>3. Acceptable Use</h2>
      <ul>
        <li>Communicate respectfully with coaches, parents, players, and administrators</li>
        <li>Do not share inappropriate content in team chats or team walls</li>
        <li>Do not harass, bully, or discriminate against any user</li>
        <li>Coaches must maintain appropriate boundaries in communications with minor players</li>
        <li>Do not attempt to access data outside your organization or role permissions</li>
      </ul>
    </div>
    <div class="section">
      <h2>4. User Content</h2>
      <ul>
        <li>You retain ownership of content you upload (photos, messages, etc.)</li>
        <li>You grant Lynx a license to display and store your content for app functionality</li>
        <li>Organization administrators may moderate or remove inappropriate content</li>
        <li>Chat messages may be visible to team members, coaches, and administrators</li>
      </ul>
    </div>
    <div class="section">
      <h2>5. Payment Terms</h2>
      <ul>
        <li>Registration fees and payments are set by your organization, not Lynx</li>
        <li>Payment processing is handled through the organization's chosen method</li>
        <li>Refund policies are determined by your organization</li>
        <li>Lynx is not responsible for disputes between users and organizations</li>
      </ul>
    </div>
    <div class="section">
      <h2>6. Coach Responsibilities</h2>
      <ul>
        <li>Coaches agree to follow their organization's code of conduct</li>
        <li>Coaches acknowledge that communications with minor players may be monitored</li>
        <li>Coaches are responsible for appropriate use of player medical information</li>
        <li>Coaching credentials and certifications must be accurate and current</li>
      </ul>
    </div>
    <div class="section">
      <h2>7. Disclaimers</h2>
      <ul>
        <li>Lynx is provided "as is" without warranty of any kind</li>
        <li>We do not guarantee uninterrupted service availability</li>
        <li>We are not responsible for the actions of organizations, coaches, or users</li>
        <li>Medical information in the app does not constitute medical advice</li>
      </ul>
    </div>
    <div class="section">
      <h2>8. Limitation of Liability</h2>
      <ul>
        <li>Lynx's liability is limited to the amount paid for the service</li>
        <li>We are not liable for injuries, losses, or damages arising from sports participation</li>
        <li>We are not liable for data loss beyond our reasonable control</li>
      </ul>
    </div>
    <div class="section">
      <h2>9. Termination</h2>
      <ul>
        <li>You may delete your account at any time through profile settings</li>
        <li>Organizations may remove users who violate their policies</li>
        <li>Lynx may suspend accounts that violate these terms</li>
        <li>Upon termination, your data will be handled per our <a href="/privacy-policy" style="color:var(--sky);text-decoration:none;font-weight:500;">Privacy Policy</a></li>
      </ul>
    </div>
    <div class="section">
      <h2>10. Changes to Terms</h2>
      <ul>
        <li>We may update these terms from time to time</li>
        <li>Material changes will be communicated through the app</li>
        <li>Continued use after changes constitutes acceptance</li>
      </ul>
    </div>
  </div>
  <div class="footer">
    <div class="footer-brand">LYNX</div>
    <p>&copy; 2026 Lynx Sports Technology. All rights reserved.</p>
    <p style="margin-top:8px;">
      <a href="/terms">Terms of Service</a> &nbsp;&middot;&nbsp;
      <a href="/privacy-policy">Privacy Policy</a>
    </p>
  </div>
</body>
</html>
```

---

## TASK 3: Update vercel.json for clean URLs
**File to modify:** `vercel.json`

Replace the current content:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

With:
```json
{
  "rewrites": [
    { "source": "/privacy-policy", "destination": "/privacy-policy.html" },
    { "source": "/terms", "destination": "/terms.html" },
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

**Why:** The privacy-policy and terms rewrites MUST come BEFORE the catch-all SPA rewrite. Vercel processes rewrites in order. Without this, `/privacy-policy` would be caught by `/(.*) -> /` and show the React app instead of the static page.

---

## TASK 4: Commit and push

```bash
git add public/privacy-policy.html public/terms.html vercel.json
git commit -m "feat: add privacy policy and terms of service pages for Play Store"
git push origin main
```

Vercel will auto-deploy on push to main. The pages should be live within 1-2 minutes at:
- `https://thelynxapp.com/privacy-policy`
- `https://thelynxapp.com/terms`

---

## VERIFICATION

After Vercel deploys:
1. Visit `https://thelynxapp.com/privacy-policy` — should show the privacy policy page
2. Visit `https://thelynxapp.com/terms` — should show the terms page
3. Visit `https://thelynxapp.com/dashboard` — should still load the React admin app normally
4. Check that the footer links on each page cross-link correctly
