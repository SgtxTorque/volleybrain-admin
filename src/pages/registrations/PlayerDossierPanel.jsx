// =============================================================================
// PlayerDossierPanel — War Room right-column player detail panel
// Stub — will be fleshed out in Phase 4
// =============================================================================

export default function PlayerDossierPanel({ player, registration, onClose, onApprove, onDeny, onEdit, onViewFull, isDark }) {
  if (!player) return null

  return (
    <div className={`sticky top-6 rounded-2xl border overflow-hidden ${isDark ? 'bg-[#132240] border-white/[0.06]' : 'bg-white border-[#E8ECF2]'} shadow-sm`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06] bg-[#10284C]' : 'border-[#E8ECF2] bg-[#10284C]'}`}>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/70">Player Dossier</span>
        <button onClick={onClose} className="text-white/50 hover:text-white text-lg leading-none">&times;</button>
      </div>
      <div className="p-4 text-center">
        <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-black ${isDark ? 'bg-white/[0.06] text-white' : 'bg-[#F5F6F8] text-[#10284C]'}`}>
          {(player.first_name || '?').charAt(0)}{(player.last_name || '').charAt(0)}
        </div>
        <h3 className={`text-lg font-extrabold mt-3 ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
          {player.first_name} {player.last_name}
        </h3>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{player.parent_name || 'No parent info'}</p>
      </div>
      <div className="px-4 pb-4 space-y-2">
        <button onClick={onViewFull}
          className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition ${isDark ? 'bg-white/[0.06] text-white hover:bg-white/[0.1]' : 'bg-[#F5F6F8] text-[#10284C] hover:bg-slate-200'}`}>
          View Full Profile
        </button>
      </div>
    </div>
  )
}
