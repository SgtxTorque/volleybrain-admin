// =============================================================================
// PlayerProfileHistoryTab - Season history tab for PlayerProfilePage
// =============================================================================

export default function PlayerProfileHistoryTab({ seasonHistory, isDark }) {
  const textCls = isDark ? 'text-white' : 'text-slate-900'
  const mutedCls = 'text-slate-400'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'

  return (
    <div className="space-y-4">
      <h3 className={`text-r-lg font-bold ${textCls}`}>Season History</h3>
      {seasonHistory.length > 0 ? (
        <div className="space-y-3">
          {seasonHistory.map((season, i) => (
            <div key={i} className={`${altBg} rounded-[14px] p-5 flex items-center gap-4`}>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-r-lg text-white font-bold shadow-md" style={{ backgroundColor: season.teamColor }}>
                {season.sportIcon}
              </div>
              <div className="flex-1">
                <div className={`font-semibold text-r-sm ${textCls}`}>{season.seasonName}</div>
                <div className={`text-r-sm ${mutedCls}`}>{season.teamName}{season.jerseyNumber ? ` / #${season.jerseyNumber}` : ''}</div>
              </div>
              <div className={`text-r-xs ${mutedCls} text-right`}>
                {season.startDate ? new Date(season.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                {season.endDate ? ` - ${new Date(season.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ' - Present'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${altBg} rounded-[14px] p-8 text-center`}>
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-r-2xl">📋</span>
          </div>
          <p className={`text-r-sm font-medium ${mutedCls}`}>No season history yet</p>
        </div>
      )}
    </div>
  )
}
