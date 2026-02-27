import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { VolleyballIcon } from '../../constants/icons'

function InviteFriendsPage({ roleContext, showToast }) {
  const { organization } = useAuth()
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const [registrationLink, setRegistrationLink] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (organization) {
      const baseUrl = window.location.origin
      setRegistrationLink(`${baseUrl}/register/${organization.id}`)
    }
  }, [organization])

  function copyLink() {
    navigator.clipboard.writeText(registrationLink)
    setCopied(true)
    showToast('Link copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  function shareVia(platform) {
    const text = `Join our youth volleyball league! Register here: ${registrationLink}`
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(registrationLink)
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      email: `mailto:?subject=Join Our League!&body=${encodedText}`,
      sms: `sms:?body=${encodedText}`
    }
    if (urls[platform]) window.open(urls[platform], '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className={`text-3xl font-bold ${tc.text}`}>Invite Friends 🎉</h1><p className={tc.textSecondary}>Share the fun! Invite friends to join the league.</p></div>

      <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6`}>
        <div className="text-center mb-6">
          <span className="text-6xl"><VolleyballIcon className="w-16 h-16" /></span>
          <h2 className={`text-xl font-bold ${tc.text} mt-4`}>{organization?.name || 'Our League'}</h2>
          <p className={tc.textMuted}>Share this link with friends to register</p>
        </div>

        <div className={`${tc.cardBgAlt} rounded-xl p-4 flex items-center gap-3`}>
          <input type="text" value={registrationLink} readOnly className={`flex-1 bg-transparent ${tc.text} text-sm truncate outline-none`} />
          <button onClick={copyLink} className={`px-4 py-2 rounded-lg font-medium transition ${copied ? 'bg-emerald-500 text-white' : 'bg-[var(--accent-primary)] text-white hover:brightness-110'}`}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <div className="mt-6">
          <p className={`text-sm ${tc.textMuted} mb-3 text-center`}>Or share via</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={() => shareVia('facebook')} className="w-12 h-12 rounded-xl bg-[#1877F2] text-white flex items-center justify-center text-2xl hover:scale-105 transition" title="Facebook">f</button>
            <button onClick={() => shareVia('twitter')} className="w-12 h-12 rounded-xl bg-[#1DA1F2] text-white flex items-center justify-center text-2xl hover:scale-105 transition" title="Twitter">𝕏</button>
            <button onClick={() => shareVia('whatsapp')} className="w-12 h-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center text-2xl hover:scale-105 transition" title="WhatsApp">💬</button>
            <button onClick={() => shareVia('email')} className={`w-12 h-12 rounded-xl ${tc.cardBgAlt} ${tc.text} flex items-center justify-center text-2xl hover:scale-105 transition`} title="Email">📧</button>
            <button onClick={() => shareVia('sms')} className={`w-12 h-12 rounded-xl ${tc.cardBgAlt} ${tc.text} flex items-center justify-center text-2xl hover:scale-105 transition`} title="Text">📱</button>
          </div>
        </div>
      </div>

      <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-6`}>
        <h3 className={`font-semibold ${tc.text} mb-4`}>🎁 Referral Rewards</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}><p className="text-2xl">🥉</p><p className={`font-bold ${tc.text} mt-1`}>1 Friend</p><p className={`text-xs ${tc.textMuted}`}>Bronze Badge</p></div>
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}><p className="text-2xl">🥈</p><p className={`font-bold ${tc.text} mt-1`}>3 Friends</p><p className={`text-xs ${tc.textMuted}`}>Silver Badge</p></div>
          <div className={`${tc.cardBgAlt} rounded-xl p-4`}><p className="text-2xl">🥇</p><p className={`font-bold ${tc.text} mt-1`}>5+ Friends</p><p className={`text-xs ${tc.textMuted}`}>Gold Badge + Swag!</p></div>
        </div>
      </div>
    </div>
  )
}

export { InviteFriendsPage }
