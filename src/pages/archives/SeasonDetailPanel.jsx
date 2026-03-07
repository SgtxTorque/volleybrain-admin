import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Trophy, Users, DollarSign, Target, UserCog, X, BarChart3, Check
} from '../../constants/icons'

function formatDateRange(start, end) {
  const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
  if (start && end) return `${fmt(start)} - ${fmt(end)}`
  if (start) return `Started ${fmt(start)}`
  return 'No dates'
}

export default function SeasonDetailPanel({ season, isOpen, onClose, isDark }) {
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const [payments, setPayments] = useState([])
  const [playerStats, setPlayerStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDetailTab, setActiveDetailTab] = useState('summary')

  useEffect(() => {
    if (isOpen && season?.id) {
      setActiveDetailTab('summary')
      loadSeasonDetail()
    }
  }, [isOpen, season?.id])

  async function loadSeasonDetail() {
    setLoading(true)
    try {
      // Load teams with rosters
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*, team_players(id, jersey_number, players(id, first_name, last_name, photo_url, position)), team_coaches(id, role, coaches(id, first_name, last_name))')
        .eq('season_id', season.id)
        .order('name')
      setTeams(teamsData || [])

      // Load completed games
      const teamIds = (teamsData || []).map(t => t.id)
      if (teamIds.length > 0) {
        const { data: gamesData } = await supabase
          .from('schedule_events')
          .select('*, teams!schedule_events_team_id_fkey(id, name, color)')
          .eq('season_id', season.id)
          .eq('event_type', 'game')
          .order('event_date', { ascending: false })
        setGames(gamesData || [])
      }

      // Load payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*, players(first_name, last_name)')
        .eq('season_id', season.id)
        .order('created_at', { ascending: false })
      setPayments(paymentsData || [])

      // Load player stats (if table exists)
      try {
        if (teamIds.length > 0) {
          const { data: statsData } = await supabase
            .from('game_player_stats')
            .select('*, players(first_name, last_name), schedule_events!event_id(event_date, opponent_name)')
            .in('player_id', (teamsData || []).flatMap(t => t.team_players?.map(tp => tp.players?.id) || []).filter(Boolean))
          setPlayerStats(statsData || [])
        }
      } catch { setPlayerStats([]) }
    } catch (err) { console.error('Error loading season detail:', err) }
    setLoading(false)
  }

  if (!isOpen || !season) return null

  const cardCls = `${isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'} rounded-[14px]`
  const textPrimary = isDark ? 'text-white' : 'text-slate-900'
  const textMuted = 'text-slate-400'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'

  const totalPlayers = teams.reduce((sum, t) => sum + (t.team_players?.length || 0), 0)
  const totalCoaches = teams.reduce((sum, t) => sum + (t.team_coaches?.length || 0), 0)
  const completedGames = games.filter(g => g.game_status === 'completed')
  const totalPaid = payments.filter(p => p.paid).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  const totalDue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

  // Compute per-team standings from games
  const teamStandings = teams.map(team => {
    const teamGames = completedGames.filter(g => g.team_id === team.id)
    const wins = teamGames.filter(g => g.game_result === 'win').length
    const losses = teamGames.filter(g => g.game_result === 'loss').length
    const ties = teamGames.filter(g => g.game_result === 'tie').length
    return { ...team, wins, losses, ties, gamesPlayed: teamGames.length }
  })

  const detailTabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'teams', label: `Teams (${teams.length})` },
    { id: 'games', label: `Games (${games.length})` },
    { id: 'stats', label: 'Stats' },
    { id: 'payments', label: 'Payments' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full max-w-2xl sa-ai ${isDark ? 'bg-lynx-midnight border-l border-white/[0.06]' : 'bg-white border-l border-slate-200'} shadow-2xl overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b ${isDark ? 'bg-slate-900/95 border-white/[0.06]' : 'bg-white/95 border-slate-200'} backdrop-blur-xl`}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <span className="text-r-2xl">{season.sports?.icon || '🏆'}</span>
                <div>
                  <h2 className={`text-r-xl font-bold ${textPrimary}`}>{season.name}</h2>
                  <p className={`text-r-sm ${textMuted}`}>{formatDateRange(season.start_date, season.end_date)}</p>
                </div>
              </div>
              <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'} transition`}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Detail Tabs */}
          <div className="px-5 pb-0 flex gap-1 overflow-x-auto">
            {detailTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id)}
                className={`px-3 py-2 text-r-sm font-medium rounded-t-lg whitespace-nowrap transition ${
                  activeDetailTab === tab.id
                    ? `${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'} border-b-2 border-lynx-sky`
                    : `${textMuted} ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-5">
            {/* === SUMMARY TAB === */}
            {activeDetailTab === 'summary' && (
              <div className="space-y-4 sa-au">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Teams', value: teams.length, icon: Users, color: '#3B82F6' },
                    { label: 'Players', value: totalPlayers, icon: Target, color: '#8B5CF6' },
                    { label: 'Coaches', value: totalCoaches, icon: UserCog, color: '#10B981' },
                    { label: 'Games', value: completedGames.length, icon: Trophy, color: '#F59E0B' },
                  ].map((s, i) => (
                    <div key={s.label} className={`${cardCls} p-4 text-center sa-au`} style={{ animationDelay: `${i * 50}ms` }}>
                      <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                      <p className={`text-r-2xl font-extrabold ${textPrimary}`}>{s.value}</p>
                      <p className={`text-r-xs uppercase font-bold tracking-wider ${textMuted}`}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue summary */}
                {payments.length > 0 && (
                  <div className={`${cardCls} p-4 sa-au`} style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-r-xs uppercase font-bold tracking-wider ${textMuted}`}>Season Revenue</p>
                        <p className={`text-r-2xl font-extrabold ${textPrimary}`}>${totalPaid.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-r-xs uppercase font-bold tracking-wider ${textMuted}`}>Total Billed</p>
                        <p className={`text-r-sm font-medium ${textMuted}`}>${totalDue.toLocaleString()}</p>
                      </div>
                    </div>
                    {totalDue > 0 && (
                      <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                        <div className="h-full rounded-full bg-lynx-navy transition-all" style={{ width: `${Math.min(100, (totalPaid / totalDue) * 100)}%` }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Standings snapshot */}
                {teamStandings.some(t => t.gamesPlayed > 0) && (
                  <div className={`${cardCls} p-4 sa-au`} style={{ animationDelay: '260ms' }}>
                    <h3 className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} mb-3`}>Final Standings</h3>
                    <div className="space-y-2">
                      {teamStandings.filter(t => t.gamesPlayed > 0).sort((a, b) => b.wins - a.wins).map((t, i) => (
                        <div key={t.id} className={`flex items-center gap-3 p-2 rounded-lg ${altBg}`}>
                          <span className={`text-r-lg w-6 text-center ${i === 0 ? 'text-amber-400 font-bold' : textMuted}`}>{i + 1}</span>
                          <div className="w-6 h-6 rounded-md bg-lynx-navy" style={{ background: t.color || undefined }} />
                          <span className={`text-r-sm font-medium flex-1 ${textPrimary}`}>{t.name}</span>
                          <span className={`text-r-sm font-mono ${textMuted}`}>{t.wins}W-{t.losses}L{t.ties > 0 ? `-${t.ties}T` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === TEAMS TAB === */}
            {activeDetailTab === 'teams' && (
              <div className="space-y-4 sa-au">
                {teams.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className={`text-r-sm ${textMuted}`}>No teams found for this season</p>
                  </div>
                ) : teams.map((team, i) => (
                  <div key={team.id} className={`${cardCls} overflow-hidden sa-au`} style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="p-4 flex items-center gap-3" style={{ borderLeft: `4px solid ${team.color || '#0F2B46'}` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-r-sm bg-lynx-navy" style={{ background: team.color || undefined }}>
                        {team.name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-r-sm ${textPrimary}`}>{team.name}</p>
                        <p className={`text-r-xs ${textMuted}`}>
                          {team.team_players?.length || 0} players &bull; {team.team_coaches?.length || 0} coaches
                        </p>
                      </div>
                    </div>
                    {/* Coaches */}
                    {team.team_coaches?.length > 0 && (
                      <div className={`px-4 py-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                        <p className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} mb-1`}>Coaches</p>
                        <div className="flex flex-wrap gap-2">
                          {team.team_coaches.map((tcItem, j) => (
                            <span key={j} className={`text-r-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                              {tcItem.coaches?.first_name} {tcItem.coaches?.last_name} {tcItem.role === 'head' ? '⭐' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Roster */}
                    {team.team_players?.length > 0 && (
                      <div className={`px-4 py-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                        <p className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} mb-1`}>Roster</p>
                        <div className="flex flex-wrap gap-1.5">
                          {team.team_players.map((tp, j) => (
                            <span key={j} className={`text-r-xs px-2 py-0.5 rounded-full ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ background: `${team.color || '#0F2B46'}15` }}>
                              {tp.jersey_number ? `#${tp.jersey_number} ` : ''}{tp.players?.first_name} {tp.players?.last_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* === GAMES TAB === */}
            {activeDetailTab === 'games' && (
              <div className="space-y-2 sa-au">
                {games.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className={`text-r-sm ${textMuted}`}>No games recorded for this season</p>
                  </div>
                ) : games.map((game, i) => {
                  const isWin = game.game_result === 'win'
                  const isLoss = game.game_result === 'loss'
                  return (
                    <div key={game.id} className={`${cardCls} p-4 sa-au`} style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-r-sm font-bold ${
                          isWin ? 'bg-emerald-500/20 text-emerald-400' :
                          isLoss ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {isWin ? 'W' : isLoss ? 'L' : game.game_status === 'completed' ? 'T' : '-'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-r-sm font-medium ${textPrimary} truncate`}>
                            {game.teams?.name || 'Team'} vs {game.opponent_name || 'Opponent'}
                          </p>
                          <p className={`text-r-xs ${textMuted}`}>
                            {game.event_date ? new Date(game.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD'}
                            {game.location && ` - ${game.location}`}
                          </p>
                        </div>
                        {(game.our_score != null || game.opponent_score != null) && (
                          <div className="text-right">
                            <p className={`font-mono font-bold text-r-sm ${textPrimary}`}>{game.our_score ?? '-'} - {game.opponent_score ?? '-'}</p>
                            {game.set_scores && (
                              <p className={`text-r-xs ${textMuted}`}>Sets: {game.our_sets_won}-{game.opponent_sets_won}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* === STATS TAB === */}
            {activeDetailTab === 'stats' && (
              <div className="sa-au">
                {playerStats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className={`text-r-sm ${textMuted}`}>No player stats recorded for this season</p>
                  </div>
                ) : (
                  <div className={`${cardCls} overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                            <th className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} text-left px-3 py-2`}>Player</th>
                            <th className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} text-center px-2 py-2`}>GP</th>
                            <th className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} text-center px-2 py-2`}>K</th>
                            <th className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} text-center px-2 py-2`}>A</th>
                            <th className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} text-center px-2 py-2`}>D</th>
                            <th className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} text-center px-2 py-2`}>B</th>
                            <th className={`text-r-xs uppercase font-bold tracking-wider ${textMuted} text-center px-2 py-2`}>Aces</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Aggregate per player
                            const byPlayer = {}
                            playerStats.forEach(s => {
                              const pid = s.player_id
                              if (!byPlayer[pid]) {
                                byPlayer[pid] = { name: `${s.players?.first_name || ''} ${s.players?.last_name || ''}`.trim() || 'Unknown', gp: 0, kills: 0, assists: 0, digs: 0, blocks: 0, aces: 0 }
                              }
                              byPlayer[pid].gp++
                              byPlayer[pid].kills += (s.kills || 0)
                              byPlayer[pid].assists += (s.assists || 0)
                              byPlayer[pid].digs += (s.digs || 0)
                              byPlayer[pid].blocks += (s.blocks || 0)
                              byPlayer[pid].aces += (s.aces || 0)
                            })
                            return Object.entries(byPlayer).sort((a, b) => b[1].kills - a[1].kills).map(([pid, p], i) => (
                              <tr key={pid} className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'} last:border-0 sa-au`} style={{ animationDelay: `${i * 25}ms` }}>
                                <td className={`px-3 py-2 text-r-sm font-medium ${textPrimary}`}>{p.name}</td>
                                <td className={`px-2 py-2 text-r-sm text-center ${textMuted}`}>{p.gp}</td>
                                <td className={`px-2 py-2 text-r-sm text-center ${textMuted}`}>{p.kills}</td>
                                <td className={`px-2 py-2 text-r-sm text-center ${textMuted}`}>{p.assists}</td>
                                <td className={`px-2 py-2 text-r-sm text-center ${textMuted}`}>{p.digs}</td>
                                <td className={`px-2 py-2 text-r-sm text-center ${textMuted}`}>{p.blocks}</td>
                                <td className={`px-2 py-2 text-r-sm text-center ${textMuted}`}>{p.aces}</td>
                              </tr>
                            ))
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === PAYMENTS TAB === */}
            {activeDetailTab === 'payments' && (
              <div className="sa-au">
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className={`text-r-sm ${textMuted}`}>No payment records for this season</p>
                  </div>
                ) : (
                  <>
                    {/* Payment summary */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className={`${cardCls} p-3 text-center`}>
                        <p className={`text-r-xl font-extrabold ${textPrimary}`}>${totalPaid.toLocaleString()}</p>
                        <p className={`text-r-xs uppercase font-bold tracking-wider ${textMuted}`}>Collected</p>
                      </div>
                      <div className={`${cardCls} p-3 text-center`}>
                        <p className={`text-r-xl font-extrabold ${textPrimary}`}>${(totalDue - totalPaid).toLocaleString()}</p>
                        <p className={`text-r-xs uppercase font-bold tracking-wider ${textMuted}`}>Outstanding</p>
                      </div>
                      <div className={`${cardCls} p-3 text-center`}>
                        <p className={`text-r-xl font-extrabold ${textPrimary}`}>{payments.length}</p>
                        <p className={`text-r-xs uppercase font-bold tracking-wider ${textMuted}`}>Records</p>
                      </div>
                    </div>
                    <div className={`${cardCls} divide-y ${isDark ? 'divide-white/[0.06]' : 'divide-slate-100'}`}>
                      {payments.slice(0, 50).map((p, i) => (
                        <div key={p.id} className="px-4 py-3 flex items-center justify-between sa-au" style={{ animationDelay: `${i * 20}ms` }}>
                          <div>
                            <p className={`text-r-sm font-medium ${textPrimary}`}>{p.players?.first_name} {p.players?.last_name}</p>
                            <p className={`text-r-xs ${textMuted}`}>{p.description || p.fee_category || 'Payment'}</p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className={`text-r-sm font-mono font-medium ${textPrimary}`}>${parseFloat(p.amount || 0).toFixed(2)}</span>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center ${p.paid ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                              {p.paid ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-red-400" />}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
