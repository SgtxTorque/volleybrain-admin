import { useState } from 'react'
import {
  MoreVertical, Eye, Edit, Shield, Mail, X, Check, Trash2, Star, Plus
} from '../../constants/icons'

const bgCheckLabels = {
  not_started: { label: 'Not Started', dot: 'bg-slate-400' },
  pending: { label: 'Review Required', dot: 'bg-amber-400' },
  cleared: { label: 'Fully Compliant', dot: 'bg-emerald-400' },
  failed: { label: 'Failed', dot: 'bg-red-400' },
  expired: { label: 'Expired', dot: 'bg-orange-400' },
}

const ROLE_PILL_COLORS = {
  head_coach: { bg: 'bg-amber-500', text: 'text-white' },
  assistant: { bg: 'bg-sky-500', text: 'text-white' },
  staff: { bg: 'bg-purple-500', text: 'text-white' },
  volunteer: { bg: 'bg-emerald-500', text: 'text-white' },
}

export default function PersonCard({ person, isDark, isSelected, onClick, onEdit, onAssign, onToggleStatus, onDelete, onDetail }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const bgCheck = bgCheckLabels[person.backgroundCheck] || bgCheckLabels.not_started
  const pillColor = ROLE_PILL_COLORS[person.roleCategory] || ROLE_PILL_COLORS.staff
  const primaryTeam = person.teams[0]

  return (
    <div
      onClick={onClick}
      className={`rounded-[14px] overflow-hidden transition-all cursor-pointer border-2 ${
        isSelected
          ? 'bg-sky-50 border-[#10284C] shadow-lg dark:bg-[#4BB9EC]/10 dark:border-[#4BB9EC]/50'
          : isDark
            ? 'bg-white/[0.04] border-transparent hover:bg-white/[0.06] hover:shadow-md'
            : 'bg-white border-transparent hover:shadow-md'
      } ${person.status !== 'active' ? 'opacity-60' : ''}`}
      style={{
        boxShadow: isSelected ? undefined : isDark ? 'none' : '0 1px 3px rgba(16,40,76,0.04), 0 4px 12px rgba(16,40,76,0.03)',
      }}
    >
      {/* Photo area */}
      <div className={`relative h-[160px] ${isDark ? 'bg-white/[0.04]' : 'bg-gradient-to-br from-slate-100 to-slate-50'}`}>
        {person.photoUrl ? (
          <img src={person.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[#10284C] flex items-center justify-center text-2xl font-black text-white">
              {person.firstName?.[0]}{person.lastName?.[0]}
            </div>
          </div>
        )}
        {/* Role pill overlay */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${pillColor.bg} ${pillColor.text} shadow-sm`}>
            {person.role}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className={`text-base font-extrabold truncate ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
          {person.fullName}
        </h3>

        {/* Teams */}
        {person.teams.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {person.teams.map(t => (
              <span key={t.id} className="text-xs font-semibold flex items-center gap-1" style={{ color: t.color || '#888' }}>
                {person.roleCategory === 'head_coach' && <Star className="w-3 h-3" />}
                {t.name}
              </span>
            ))}
          </div>
        ) : (
          <p className={`text-xs mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No team assigned</p>
        )}

        {/* Compliance dot */}
        <div className="flex items-center gap-2 mt-3">
          <span className={`w-2 h-2 rounded-full ${bgCheck.dot}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{bgCheck.label}</span>
        </div>

        {/* Team color bar */}
        {primaryTeam?.color && (
          <div className="mt-3 h-1 rounded-full" style={{ backgroundColor: primaryTeam.color }} />
        )}
      </div>

      {/* 3-dot menu (top-left to not overlap role pill) */}
      <div className="absolute top-3 left-3">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/30 text-white hover:bg-black/50 transition backdrop-blur-sm"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setMenuOpen(false) }} />
            <div className={`absolute left-0 top-10 z-20 rounded-xl shadow-lg border py-1.5 min-w-[180px] ${
              isDark ? 'bg-[#1a2744] border-white/[0.06]' : 'bg-white border-slate-200'
            }`}>
              {person.source === 'coach' && (
                <button onClick={e => { e.stopPropagation(); onDetail?.(); setMenuOpen(false) }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Eye className="w-4 h-4 opacity-60" /> View Profile
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); onEdit?.(); setMenuOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                <Edit className="w-4 h-4 opacity-60" /> Edit
              </button>
              {person.source === 'coach' && (
                <button onClick={e => { e.stopPropagation(); onAssign?.(); setMenuOpen(false) }}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Shield className="w-4 h-4 opacity-60" /> Assign Teams
                </button>
              )}
              {person.email && (
                <a href={`mailto:${person.email}`} onClick={e => e.stopPropagation()}
                  className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-slate-300 hover:bg-white/[0.04]' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <Mail className="w-4 h-4 opacity-60" /> Send Email
                </a>
              )}
              <div className={`my-1 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`} />
              <button onClick={e => { e.stopPropagation(); onToggleStatus?.(); setMenuOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 ${isDark ? 'text-amber-400 hover:bg-white/[0.04]' : 'text-amber-600 hover:bg-amber-50'}`}>
                {person.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {person.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete?.(); setMenuOpen(false) }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2.5 text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
