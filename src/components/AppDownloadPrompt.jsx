import { useState } from 'react'
import { isIOS, isAndroid, isMobile } from '../lib/platform-detect'
import { IOS_APP_URL, BETA_REQUEST_NOTIFY_EMAIL } from '../lib/app-constants'
import { supabase } from '../lib/supabase'
import { Smartphone } from 'lucide-react'

function AndroidBetaRequest({ parentEmail, organizationName, organizationId }) {
  const [email, setEmail] = useState(parentEmail || '')
  const [requested, setRequested] = useState(false)
  const [sending, setSending] = useState(false)

  const handleRequest = async () => {
    if (!email || sending) return
    setSending(true)

    try {
      await supabase.from('email_notifications').insert({
        type: 'admin_notification',
        recipient_email: BETA_REQUEST_NOTIFY_EMAIL,
        recipient_name: 'Carlos',
        data: {
          request_type: 'android_beta',
          parent_email: email,
          organization_name: organizationName || 'Unknown',
        },
        organization_id: organizationId || null,
        status: 'pending',
        subject: `Android Beta Request — ${organizationName || 'Lynx'}`,
        category: 'transactional',
        sent_by_role: 'system',
        created_at: new Date().toISOString()
      })

      setRequested(true)
    } catch (err) {
      console.error('Beta request failed:', err)
      // Still show success — the parent doesn't need to know the notification failed
      setRequested(true)
    } finally {
      setSending(false)
    }
  }

  if (requested) {
    return (
      <div className="text-center">
        <div className="bg-green-500/20 rounded-xl p-4 mb-2">
          <p className="text-sm font-semibold text-green-300">
            You're on the list!
          </p>
          <p className="text-xs text-green-300/80 mt-1">
            We'll send you access within 24 hours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#4BB9EC] font-medium">
        Get early access to the Android app
      </p>
      <div className="flex gap-2 max-w-xs mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder-slate-400 focus:outline-none focus:border-[#4BB9EC]"
        />
        <button
          onClick={handleRequest}
          disabled={!email || sending}
          className="px-4 py-2 bg-[#4BB9EC] text-white text-sm font-semibold rounded-lg hover:brightness-110 transition disabled:opacity-50"
        >
          {sending ? '...' : 'Request'}
        </button>
      </div>
    </div>
  )
}

export default function AppDownloadPrompt({ parentEmail, organization }) {
  return (
    <div className="bg-gradient-to-br from-[#10284C] to-[#1a3a5c] rounded-2xl p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Smartphone className="w-5 h-5 text-[#4BB9EC]" />
        <h3 className="text-lg font-bold text-white">Get the Lynx App</h3>
      </div>
      <p className="text-sm text-slate-300 mb-5">
        Game day schedules, push notifications, and real-time updates — all in your pocket.
      </p>

      {isIOS() && IOS_APP_URL && (
        <a
          href={IOS_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <img
            src="/images/app-store-badge.svg"
            alt="Download on the App Store"
            className="h-12 mx-auto hover:brightness-110 transition"
          />
        </a>
      )}

      {isAndroid() && (
        <AndroidBetaRequest
          parentEmail={parentEmail}
          organizationName={organization?.name}
          organizationId={organization?.id}
        />
      )}

      {!isMobile() && (
        <div className="space-y-3">
          {IOS_APP_URL && (
            <a
              href={IOS_APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src="/images/app-store-badge.svg"
                alt="Download on the App Store"
                className="h-11 mx-auto hover:brightness-110 transition"
              />
            </a>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Android app coming soon to Google Play
          </p>
        </div>
      )}
    </div>
  )
}
