import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { UserPlus, Copy, Check, Send, Mail, Phone, Share2, Globe, Gift, Trophy, Star, ExternalLink } from '../../constants/icons'
import PageShell from '../../components/pages/PageShell'
import InnerStatRow from '../../components/pages/InnerStatRow'

function InviteFriendsPage({ roleContext, showToast }) {
  const { organization, profile } = useAuth()
  const { isDark } = useTheme()

  const [registrationLink, setRegistrationLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteCount, setInviteCount] = useState(0)
  const [customMessage, setCustomMessage] = useState('')
  const [editingMessage, setEditingMessage] = useState(false)

  const cardCls = isDark
    ? 'bg-white/[0.03] border border-white/[0.06]'
    : 'bg-white border border-slate-200'
  const inputCls = isDark
    ? 'bg-white/[0.04] border-white/[0.06] text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'

  useEffect(() => {
    if (organization) {
      const baseUrl = window.location.origin
      setRegistrationLink(`${baseUrl}/register/${organization.id}`)
      setCustomMessage(`Join ${organization.name || 'our league'}! Register here:`)
      loadInviteCount()
    }
  }, [organization])

  async function loadInviteCount() {
    try {
      const { count } = await supabase
        .from('account_invites')
        .select('*', { count: 'exact', head: true })
        .eq('invited_by', profile?.id)
      setInviteCount(count || 0)
    } catch {
      // Table may not exist yet
      setInviteCount(0)
    }
  }

  function getReferralTier() {
    if (inviteCount >= 5) return { name: 'Gold', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: '🥇', progress: 100 }
    if (inviteCount >= 3) return { name: 'Silver', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: '🥈', progress: Math.round((inviteCount / 5) * 100) }
    if (inviteCount >= 1) return { name: 'Bronze', color: 'text-amber-700', bg: 'bg-amber-700/10', icon: '🥉', progress: Math.round((inviteCount / 3) * 100) }
    return { name: 'None', color: 'text-slate-400', bg: 'bg-slate-100', icon: '🎯', progress: 0 }
  }

  const tier = getReferralTier()
  const nextTierTarget = inviteCount < 1 ? 1 : inviteCount < 3 ? 3 : inviteCount < 5 ? 5 : null

  function copyLink() {
    navigator.clipboard.writeText(registrationLink)
    setCopied(true)
    showToast('Link copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  function getShareText() {
    return `${customMessage} ${registrationLink}`
  }

  function shareVia(platform) {
    const text = getShareText()
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(registrationLink)
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      email: `mailto:?subject=Join ${organization?.name || 'Our League'}!&body=${encodedText}`,
      sms: `sms:?body=${encodedText}`
    }
    if (urls[platform]) window.open(urls[platform], '_blank')
  }

  const SHARE_PLATFORMS = [
    { id: 'facebook', name: 'Facebook', desc: 'Share on your timeline', color: 'bg-[#1877F2]', icon: <Globe className="w-5 h-5" /> },
    { id: 'twitter', name: 'X (Twitter)', desc: 'Post to your followers', color: 'bg-[#0F1419]', icon: <Send className="w-5 h-5" /> },
    { id: 'whatsapp', name: 'WhatsApp', desc: 'Send to contacts or groups', color: 'bg-[#25D366]', icon: <Phone className="w-5 h-5" /> },
    { id: 'email', name: 'Email', desc: 'Send a personal invite', color: isDark ? 'bg-white/10' : 'bg-slate-600', icon: <Mail className="w-5 h-5" /> },
    { id: 'sms', name: 'Text / SMS', desc: 'Quick text message invite', color: isDark ? 'bg-white/10' : 'bg-slate-600', icon: <Phone className="w-5 h-5" /> },
  ]

  const TIERS = [
    { name: 'Bronze', target: 1, icon: '🥉', reward: 'Lynx Badge', rewardDetail: 'Show off your referral badge on your profile' },
    { name: 'Silver', target: 3, icon: '🥈', reward: 'Badge + Team Shoutout', rewardDetail: 'Get recognized in a team-wide shoutout' },
    { name: 'Gold', target: 5, icon: '🥇', reward: 'Badge + Free Practice Jersey', rewardDetail: 'Earn an exclusive Lynx practice jersey' },
  ]

  return (
    <PageShell
      breadcrumb="Invite Friends"
      title={
        <span className="flex items-center gap-3">
          <UserPlus className="w-7 h-7 text-[#4BB9EC]" />
          Invite Friends
        </span>
      }
      subtitle="Share the love -- grow the Lynx family"
    >
      <div className="space-y-6">
        {/* Stat Row */}
        <InnerStatRow stats={[
          { icon: <Send className="w-5 h-5 text-[#4BB9EC]" />, value: inviteCount, label: 'Invites Sent', color: 'text-[#4BB9EC]' },
          { icon: <UserPlus className="w-5 h-5 text-emerald-500" />, value: 'Coming Soon', label: 'Friends Joined', color: 'text-emerald-500' },
          { icon: <Trophy className="w-5 h-5 text-amber-500" />, value: `${tier.icon} ${tier.name}`, label: 'Referral Tier', color: 'text-amber-500' },
        ]} />

        {/* Registration Link Card */}
        <div className={`${cardCls} rounded-[14px] p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#4BB9EC]/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-[#4BB9EC]" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {organization?.name || 'Our League'}
              </h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Share this link with friends to register
              </p>
            </div>
          </div>

          <div className={`rounded-xl border p-3 flex items-center gap-3 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
            <input
              type="text"
              value={registrationLink}
              readOnly
              className={`flex-1 bg-transparent text-sm truncate outline-none ${isDark ? 'text-white' : 'text-slate-900'}`}
            />
            <button
              onClick={copyLink}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#10284C] text-white hover:brightness-110'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Personalized Message Preview */}
        <div className={`${cardCls} rounded-[14px] p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Message Preview</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Customize what friends will see</p>
              </div>
            </div>
            <button
              onClick={() => setEditingMessage(!editingMessage)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {editingMessage ? 'Done' : 'Edit'}
            </button>
          </div>

          {editingMessage ? (
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className={`w-full rounded-xl border p-4 text-sm resize-none focus:border-[#4BB9EC] focus:ring-1 focus:ring-[#4BB9EC]/20 outline-none transition ${inputCls}`}
              placeholder="Write your custom invite message..."
            />
          ) : (
            <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                "{customMessage} <span className="text-[#4BB9EC] font-medium">{registrationLink}</span>"
              </p>
              <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {profile?.full_name ? `From ${profile.full_name}` : 'From you'}
              </p>
            </div>
          )}
        </div>

        {/* Share Buttons */}
        <div className={`${cardCls} rounded-[14px] p-6`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Share Via</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Pick a platform to share your invite</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHARE_PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => shareVia(p.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition group ${
                  isDark
                    ? 'border-white/[0.06] hover:border-[#4BB9EC]/30 hover:bg-white/[0.04]'
                    : 'border-slate-200 hover:border-[#4BB9EC]/30 hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl ${p.color} text-white flex items-center justify-center flex-shrink-0`}>
                  {p.icon}
                </div>
                <div className="text-left">
                  <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{p.desc}</div>
                </div>
                <ExternalLink className={`w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Referral Rewards */}
        <div className={`${cardCls} rounded-[14px] p-6`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Referral Rewards</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {nextTierTarget
                  ? `${nextTierTarget - inviteCount} more invite${nextTierTarget - inviteCount !== 1 ? 's' : ''} to reach next tier`
                  : 'You reached the top tier!'
                }
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Progress
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {inviteCount} / {nextTierTarget || 5} invites
              </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4BB9EC] to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(tier.progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TIERS.map(t => {
              const achieved = inviteCount >= t.target
              const current = tier.name === t.name
              return (
                <div
                  key={t.name}
                  className={`rounded-xl p-5 text-center transition ${
                    current
                      ? isDark ? 'bg-[#4BB9EC]/10 border-2 border-[#4BB9EC]/30' : 'bg-[#4BB9EC]/5 border-2 border-[#4BB9EC]/20'
                      : achieved
                        ? isDark ? 'bg-white/[0.04] border border-white/[0.08]' : 'bg-slate-50 border border-slate-200'
                        : isDark ? 'bg-white/[0.02] border border-white/[0.04] opacity-60' : 'bg-slate-50/50 border border-slate-100 opacity-60'
                  }`}
                >
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <div className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.name}</div>
                  <div className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.target} friend{t.target !== 1 ? 's' : ''}</div>
                  <div className={`text-xs font-semibold ${achieved ? 'text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.reward}
                  </div>
                  <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{t.rewardDetail}</div>
                  {achieved && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                      <Check className="w-3 h-3" /> Unlocked
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export { InviteFriendsPage }
