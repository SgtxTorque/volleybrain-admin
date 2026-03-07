import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Shield, ExternalLink, Loader2, Check } from '../../constants/icons'

// ============================================
// COPPA CONSENT MODAL
// Required for parent role before accessing chat.
// Cannot be dismissed without action (no X, no click-outside).
// ============================================

export default function CoppaConsentModal({ onConsented }) {
  const { user, profile } = useAuth()
  const { isDark } = useTheme()
  const [consenting, setConsenting] = useState(false)

  async function handleConsent() {
    setConsenting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          coppa_consent_given: true,
          coppa_consent_date: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      onConsented?.()
    } catch (err) {
      console.error('COPPA consent error:', err)
      setConsenting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-lg mx-4 rounded-2xl shadow-2xl p-8 ${
        isDark ? 'bg-slate-800 border border-white/10' : 'bg-white'
      }`}>
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-lynx-sky/20' : 'bg-blue-50'
          }`}>
            <Shield className="w-8 h-8 text-lynx-sky" />
          </div>
        </div>

        {/* Heading */}
        <h2 className={`text-2xl font-bold text-center mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Parental Consent Required
        </h2>

        {/* Body */}
        <div className={`text-sm leading-relaxed space-y-3 mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <p>
            Lynx complies with the Children's Online Privacy Protection Act (COPPA).
            Because children under 13 may participate in team features including chat,
            we need your consent as a parent or guardian to continue.
          </p>
          <p>
            By consenting, you acknowledge that:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your child may send and receive messages in team chat channels</li>
            <li>Chat messages are visible to coaches and other team members</li>
            <li>We never sell or share children's personal data with third parties</li>
            <li>You can revoke consent at any time by contacting your organization admin</li>
          </ul>
        </div>

        {/* Consent Button */}
        <button
          onClick={handleConsent}
          disabled={consenting}
          className="w-full py-3.5 bg-lynx-sky hover:bg-lynx-sky/90 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {consenting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : (
            <><Check className="w-4 h-4" /> I Consent</>
          )}
        </button>

        {/* Learn More */}
        <div className="text-center mt-4">
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-lynx-sky hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Learn more about our privacy policy
          </a>
        </div>
      </div>
    </div>
  )
}
