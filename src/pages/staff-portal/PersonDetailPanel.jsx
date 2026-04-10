import { useState } from 'react'
import {
  X, Mail, Phone, Edit, Trash2, Shield, Check, Star, Users, Copy, Share2, RefreshCw
} from '../../constants/icons'
import { supabase } from '../../lib/supabase'
import { generateInviteCode } from '../../lib/invite-utils'
import { formatPhone } from '../../lib/formatters'

const bgCheckLabels = {
  not_started: { label: 'Not Started', icon: '⏳', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  pending: { label: 'Pending', icon: '🔄', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  cleared: { label: 'Cleared', icon: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  failed: { label: 'Failed', icon: '❌', color: 'text-red-400', bg: 'bg-red-500/20' },
  expired: { label: 'Expired', icon: '⚠️', color: 'text-orange-400', bg: 'bg-orange-500/20' },
}

export default function PersonDetailPanel({ person, isDark, onClose, onEdit, onAssign, onToggleStatus, onDelete, onDetail, onEmail, showToast, orgName, onRefresh }) {
  const [inviteCode, setInviteCode] = useState(person?._raw?.invite_code || null)
  const [regenerating, setRegenerating] = useState(false)

  if (!person) return null
  const bgCheck = bgCheckLabels[person.backgroundCheck] || bgCheckLabels.not_started
  const raw = person._raw || {}

  function handleCopyCode() {
    if (!inviteCode) return
    navigator.clipboard.writeText(inviteCode)
    showToast?.('Invite code copied!', 'success')
  }

  function handleShareCode() {
    if (!inviteCode) return
    const message = `Hey ${person.firstName}! You've been added to ${orgName || 'our club'} as a coach on Lynx. Download the app and enter this code to join:\n\nInvite Code: ${inviteCode}\n\nDownload Lynx: https://thelynxapp.com`
    if (navigator.share) {
      navigator.share({ title: 'Lynx Coach Invite', text: message })
    } else {
      navigator.clipboard.writeText(message)
      showToast?.('Invite message copied to clipboard!', 'success')
    }
  }

  async function handleRegenerateCode() {
    setRegenerating(true)
    const newCode = generateInviteCode()
    const { error } = await supabase.from('coaches').update({ invite_code: newCode }).eq('id', raw.id)
    if (error) {
      showToast?.('Error generating new code', 'error')
    } else {
      setInviteCode(newCode)
      showToast?.('New invite code generated!', 'success')
      onRefresh?.()
    }
    setRegenerating(false)
  }

  async function handleGenerateCode() {
    setRegenerating(true)
    const newCode = generateInviteCode()
    const { error } = await supabase.from('coaches').update({ invite_code: newCode }).eq('id', raw.id)
    if (error) {
      showToast?.('Error generating code', 'error')
    } else {
      setInviteCode(newCode)
      showToast?.('Invite code generated!', 'success')
      onRefresh?.()
    }
    setRegenerating(false)
  }

  // Credential items for coaches
  const credentials = []
  if (person.source === 'coach') {
    credentials.push({
      label: 'Background Check',
      status: bgCheck.label,
      icon: bgCheck.icon,
      color: bgCheck.color,
      bg: bgCheck.bg,
    })
    credentials.push({
      label: 'Waiver',
      status: raw.waiver_signed ? 'Signed' : 'Not Signed',
      icon: raw.waiver_signed ? '✅' : '⏳',
      color: raw.waiver_signed ? 'text-emerald-400' : 'text-amber-400',
      bg: raw.waiver_signed ? 'bg-emerald-500/20' : 'bg-amber-500/20',
    })
    credentials.push({
      label: 'Code of Conduct',
      status: raw.code_of_conduct_signed ? 'Signed' : 'Not Signed',
      icon: raw.code_of_conduct_signed ? '✅' : '⏳',
      color: raw.code_of_conduct_signed ? 'text-emerald-400' : 'text-amber-400',
      bg: raw.code_of_conduct_signed ? 'bg-emerald-500/20' : 'bg-amber-500/20',
    })
  } else {
    credentials.push({
      label: 'Background Check',
      status: bgCheck.label,
      icon: bgCheck.icon,
      color: bgCheck.color,
      bg: bgCheck.bg,
    })
  }

  const cardBg = isDark ? 'bg-white/[0.04]' : 'bg-white'
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-slate-200'

  return (
    <div className={`w-[340px] shrink-0 ${cardBg} border ${borderColor} rounded-[14px] overflow-hidden self-start sticky top-4 hidden lg:block`}>
      {/* Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-[#10284C] to-[#1a3a6b]" />
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition"
        >
          <X className="w-4 h-4" />
        </button>
        {/* Avatar */}
        <div className="absolute -bottom-8 left-5">
          {person.photoUrl ? (
            <img src={person.photoUrl} alt="" className="w-16 h-16 rounded-xl object-cover border-3 border-white shadow-lg" style={{ borderWidth: 3, borderColor: isDark ? '#1a2744' : '#fff' }} />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-[#10284C] flex items-center justify-center text-xl font-black text-white shadow-lg" style={{ borderWidth: 3, borderColor: isDark ? '#1a2744' : '#fff' }}>
              {person.firstName?.[0]}{person.lastName?.[0]}
            </div>
          )}
        </div>
      </div>

      {/* Name + role */}
      <div className="pt-11 px-5 pb-4">
        <h3 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{person.fullName}</h3>
        <p className={`text-xs font-semibold uppercase tracking-wider mt-0.5 ${isDark ? 'text-[#4BB9EC]' : 'text-sky-600'}`}>
          {person.role} {person.source === 'coach' ? '· Coach' : '· Staff'}
        </p>
      </div>

      {/* Alert banner for expiring BG check */}
      {person.backgroundCheck === 'expired' && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/20">
          <p className="text-xs font-semibold text-amber-500">⚠️ Background check has expired</p>
        </div>
      )}
      {person.backgroundCheck === 'pending' && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/15">
          <p className="text-xs font-semibold text-amber-400">🔄 Background check pending review</p>
        </div>
      )}

      {/* Credentials */}
      <div className="px-5 mb-4">
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Credentials
        </h4>
        <div className="space-y-1.5">
          {credentials.map(cred => (
            <div key={cred.label} className={`flex items-center justify-between p-2 rounded-lg ${cred.bg}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{cred.icon}</span>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{cred.label}</span>
              </div>
              <span className={`text-xs font-bold ${cred.color}`}>{cred.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team Assignments */}
      <div className="px-5 mb-4">
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Team Assignments
        </h4>
        {person.teams.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {person.teams.map(t => (
              <span key={t.id} className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                style={{
                  backgroundColor: isDark ? `${t.color || '#888'}20` : `${t.color || '#888'}15`,
                  color: t.color || '#888'
                }}>
                {person.roleCategory === 'head_coach' && <Star className="w-3 h-3" />}
                {t.name}
              </span>
            ))}
          </div>
        ) : (
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No teams assigned</p>
        )}
        {person.source === 'coach' && (
          <button
            onClick={onAssign}
            className={`mt-2 text-xs font-medium flex items-center gap-1.5 transition ${isDark ? 'text-[#4BB9EC] hover:text-white' : 'text-sky-600 hover:text-[#10284C]'}`}
          >
            <Shield className="w-3 h-3" /> Assign to Team
          </button>
        )}
      </div>

      {/* Contact Info */}
      <div className="px-5 mb-4">
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Contact
        </h4>
        <div className="space-y-1.5">
          {person.email && (
            <a href={`mailto:${person.email}`} className={`flex items-center gap-2 text-xs transition ${isDark ? 'text-slate-400 hover:text-[#4BB9EC]' : 'text-slate-500 hover:text-sky-600'}`}>
              <Mail className="w-3.5 h-3.5 shrink-0" /> {person.email}
            </a>
          )}
          {person.phone && (
            <a href={`tel:${person.phone}`} className={`flex items-center gap-2 text-xs transition ${isDark ? 'text-slate-400 hover:text-[#4BB9EC]' : 'text-slate-500 hover:text-sky-600'}`}>
              <Phone className="w-3.5 h-3.5 shrink-0" /> {formatPhone(person.phone)}
            </a>
          )}
          {!person.email && !person.phone && (
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No contact info</p>
          )}
        </div>
      </div>

      {/* Invite Code — coaches only */}
      {person.source === 'coach' && (
        <div className="px-5 mb-4">
          <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Mobile Invite Code
          </h4>
          {inviteCode ? (
            <div className={`p-3 rounded-xl border ${borderColor}`}>
              <div className={`border-2 border-dashed rounded-lg p-3 text-center mb-2.5 ${borderColor}`}>
                <span className={`text-xl font-mono font-bold tracking-[0.25em] ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                  {inviteCode}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button onClick={handleCopyCode}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                    isDark ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}>
                  <Copy className="w-3 h-3" /> Copy
                </button>
                <button onClick={handleShareCode}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-[#4BB9EC] text-white hover:brightness-110 transition">
                  <Share2 className="w-3 h-3" /> Share
                </button>
                <button onClick={handleRegenerateCode} disabled={regenerating}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                    isDark ? 'bg-white/[0.06] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  } ${regenerating ? 'opacity-50' : ''}`}>
                  <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleGenerateCode} disabled={regenerating}
              className={`w-full py-2.5 rounded-lg text-xs font-semibold border-2 border-dashed transition ${
                isDark
                  ? `${borderColor} text-slate-400 hover:text-white hover:border-white/[0.15]`
                  : 'border-slate-200 text-slate-400 hover:text-[#10284C] hover:border-slate-300'
              } ${regenerating ? 'opacity-50' : ''}`}>
              {regenerating ? 'Generating...' : 'Generate Invite Code'}
            </button>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className={`px-5 pb-5 pt-3 border-t ${borderColor}`}>
        <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Quick Actions
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onEdit}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              isDark
                ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          {person.source === 'coach' && (
            <button
              onClick={onAssign}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isDark
                  ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Teams
            </button>
          )}
          {onEmail && (
            <button
              onClick={onEmail}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                isDark
                  ? 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1]'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Email
            </button>
          )}
          <button
            onClick={onToggleStatus}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              isDark
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
            }`}
          >
            {person.status === 'active' ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {person.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={onDelete}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition col-span-2 ${
              isDark
                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                : 'bg-red-50 text-red-500 hover:bg-red-100'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </button>
        </div>
      </div>
    </div>
  )
}
