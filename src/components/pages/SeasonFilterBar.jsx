export default function SeasonFilterBar({
  seasons, sports, teams,
  selectedSeason, selectedSport, selectedTeam,
  onSeasonChange, onSportChange, onTeamChange,
  role
}) {
  // Only render for admin and coach
  if (role !== 'admin' && role !== 'coach') return null;

  return (
    <div className="flex gap-3 items-center mb-5 flex-wrap">
      <select
        value={selectedSeason || ''}
        onChange={e => onSeasonChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20"
      >
        <option value="">All Seasons</option>
        {(seasons || []).map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {sports?.length > 1 && (
        <select
          value={selectedSport || ''}
          onChange={e => onSportChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20"
        >
          <option value="">All Sports</option>
          {sports.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      {teams?.length > 1 && (
        <select
          value={selectedTeam || ''}
          onChange={e => onTeamChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-r-sm font-medium bg-white text-slate-700 focus:outline-none focus:border-lynx-sky focus:ring-1 focus:ring-lynx-sky/20"
        >
          <option value="">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
