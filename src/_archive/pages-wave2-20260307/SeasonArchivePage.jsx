import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Trophy, Building2, Users, Calendar, ChevronRight, ChevronDown,
  Star, DollarSign, Target, Shield, UserCog, Clock, X, BarChart3,
  Award, MapPin, Check
} from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// SEASON ARCHIVE PAGE — Historical Season Browser
// Glassmorphism Design — "Yearbook / Trophy Case" feel
// ═══════════════════════════════════════════════════════════

const SA_STYLES = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  .sa-au{animation:fadeUp .4s ease-out both}
  .sa-ai{animation:fadeIn .3s ease-out both}
  .sa-as{animation:scaleIn .25s ease-out both}
  .sa-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .sa-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .sa-light .sa-glass{background:rgba(255,255,255,.65);border-color:rgba(0,0,0,.06);box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .sa-light .sa-glass-solid{background:rgba(255,255,255,.72);border-color:rgba(0,0,0,.06)}
`

const ARCHIVE_STATUSES = ['completed', 'closed', 'inactive', 'archived']

function formatDateRange(start, end) {
  const fmt = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
  if (start && end) return `${fmt(start)} — ${fmt(end)}`
  if (start) return `Started ${fmt(start)}`
  return 'No dates'
}

// ═══════ SEASON DETAIL SLIDE-OVER ═══════
function SeasonDetailPanel({ season, isOpen, onClose, isDark, tc, accent }) {
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
      <div className={`relative w-full max-w-2xl sa-ai ${isDark ? 'bg-lynx-midnight border-l border-white/[0.08]' : 'bg-white border-l border-lynx-silver'} shadow-2xl overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b ${isDark ? 'bg-slate-900/95 border-white/[0.08]' : 'bg-white/95 border-lynx-silver'} backdrop-blur-xl`}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{season.sports?.icon || '🏆'}</span>
                <div>
                  <h2 className={`text-xl font-bold ${tc.text}`}>{season.name}</h2>
                  <p className={`text-sm ${tc.textMuted}`}>{formatDateRange(season.start_date, season.end_date)}</p>
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
                className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition ${
                  activeDetailTab === tab.id
                    ? `${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-900'} border-b-2`
                    : `${tc.textMuted} ${isDark ? 'hover:bg-white/5' : 'hover:bg-lynx-cloud'}`
                }`}
                style={activeDetailTab === tab.id ? { borderBottomColor: accent.primary } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="p-5">
            {/* ═══ SUMMARY TAB ═══ */}
            {activeDetailTab === 'summary' && (
              <div className="space-y-4 sa-au">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Teams', value: teams.length, icon: Users, color: '#3B82F6' },
                    { label: 'Players', value: totalPlayers, icon: Target, color: '#8B5CF6' },
                    { label: 'Coaches', value: totalCoaches, icon: UserCog, color: '#10B981' },
                    { label: 'Games', value: completedGames.length, icon: Trophy, color: '#F59E0B' },
                  ].map((s, i) => (
                    <div key={s.label} className={`sa-glass rounded-xl p-4 text-center sa-au`} style={{ animationDelay: `${i * 50}ms` }}>
                      <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
                      <p className={`text-2xl ${tc.text}`}>{s.value}</p>
                      <p className={`text-xs uppercase ${tc.textMuted}`}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Revenue summary */}
                {payments.length > 0 && (
                  <div className="sa-glass rounded-xl p-4 sa-au" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs uppercase ${tc.textMuted}`}>Season Revenue</p>
                        <p className={`text-2xl ${tc.text}`}>${totalPaid.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs uppercase ${tc.textMuted}`}>Total Billed</p>
                        <p className={`text-sm font-medium ${tc.textSecondary}`}>${totalDue.toLocaleString()}</p>
                      </div>
                    </div>
                    {totalDue > 0 && (
                      <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (totalPaid / totalDue) * 100)}%`, background: accent.primary }} />
                      </div>
                    )}
                  </div>
                )}

                {/* Standings snapshot */}
                {teamStandings.some(t => t.gamesPlayed > 0) && (
                  <div className="sa-glass rounded-xl p-4 sa-au" style={{ animationDelay: '260ms' }}>
                    <h3 className={`text-sm uppercase ${tc.textMuted} mb-3`}>Final Standings</h3>
                    <div className="space-y-2">
                      {teamStandings.filter(t => t.gamesPlayed > 0).sort((a, b) => b.wins - a.wins).map((t, i) => (
                        <div key={t.id} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                          <span className={`text-lg w-6 text-center ${i === 0 ? 'text-amber-400' : tc.textMuted}`}>{i + 1}</span>
                          <div className="w-6 h-6 rounded-md" style={{ background: t.color || accent.primary }} />
                          <span className={`text-sm font-medium flex-1 ${tc.text}`}>{t.name}</span>
                          <span className={`text-sm font-mono ${tc.textSecondary}`}>{t.wins}W-{t.losses}L{t.ties > 0 ? `-${t.ties}T` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ TEAMS TAB ═══ */}
            {activeDetailTab === 'teams' && (
              <div className="space-y-4 sa-au">
                {teams.length === 0 ? (
                  <p className={`text-sm ${tc.textMuted} text-center py-8`}>No teams found for this season</p>
                ) : teams.map((team, i) => (
                  <div key={team.id} className="sa-glass rounded-xl overflow-hidden sa-au" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="p-4 flex items-center gap-3" style={{ borderLeft: `4px solid ${team.color || accent.primary}` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: team.color || accent.primary }}>
                        {team.name?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${tc.text}`}>{team.name}</p>
                        <p className={`text-xs ${tc.textMuted}`}>
                          {team.team_players?.length || 0} players &bull; {team.team_coaches?.length || 0} coaches
                        </p>
                      </div>
                    </div>
                    {/* Coaches */}
                    {team.team_coaches?.length > 0 && (
                      <div className={`px-4 py-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                        <p className={`text-xs uppercase ${tc.textMuted} mb-1`}>Coaches</p>
                        <div className="flex flex-wrap gap-2">
                          {team.team_coaches.map((tc_item, j) => (
                            <span key={j} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'} ${tc.textSecondary}`}>
                              {tc_item.coaches?.first_name} {tc_item.coaches?.last_name} {tc_item.role === 'head' ? '⭐' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Roster */}
                    {team.team_players?.length > 0 && (
                      <div className={`px-4 py-2 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                        <p className={`text-xs uppercase ${tc.textMuted} mb-1`}>Roster</p>
                        <div className="flex flex-wrap gap-1.5">
                          {team.team_players.map((tp, j) => (
                            <span key={j} className={`text-xs px-2 py-0.5 rounded-full ${tc.textSecondary}`} style={{ background: `${team.color || accent.primary}15` }}>
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

            {/* ═══ GAMES TAB ═══ */}
            {activeDetailTab === 'games' && (
              <div className="space-y-2 sa-au">
                {games.length === 0 ? (
                  <p className={`text-sm ${tc.textMuted} text-center py-8`}>No games recorded for this season</p>
                ) : games.map((game, i) => {
                  const isWin = game.game_result === 'win'
                  const isLoss = game.game_result === 'loss'
                  return (
                    <div key={game.id} className={`sa-glass rounded-xl p-4 sa-au`} style={{ animationDelay: `${i * 30}ms` }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                          isWin ? 'bg-emerald-500/20 text-emerald-400' :
                          isLoss ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {isWin ? 'W' : isLoss ? 'L' : game.game_status === 'completed' ? 'T' : '—'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${tc.text} truncate`}>
                            {game.teams?.name || 'Team'} vs {game.opponent_name || 'Opponent'}
                          </p>
                          <p className={`text-xs ${tc.textMuted}`}>
                            {game.event_date ? new Date(game.event_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date TBD'}
                            {game.location && ` — ${game.location}`}
                          </p>
                        </div>
                        {(game.our_score != null || game.opponent_score != null) && (
                          <div className="text-right">
                            <p className={`font-mono font-bold ${tc.text}`}>{game.our_score ?? '—'} - {game.opponent_score ?? '—'}</p>
                            {game.set_scores && (
                              <p className={`text-xs ${tc.textMuted}`}>Sets: {game.our_sets_won}-{game.opponent_sets_won}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ═══ STATS TAB ═══ */}
            {activeDetailTab === 'stats' && (
              <div className="sa-au">
                {playerStats.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
                    <p className={`text-sm ${tc.textMuted}`}>No player stats recorded for this season</p>
                  </div>
                ) : (
                  <div className="sa-glass rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${tc.border}`}>
                            <th className={`text-xs uppercase ${tc.textMuted} text-left px-3 py-2`}>Player</th>
                            <th className={`text-xs uppercase ${tc.textMuted} text-center px-2 py-2`}>GP</th>
                            <th className={`text-xs uppercase ${tc.textMuted} text-center px-2 py-2`}>K</th>
                            <th className={`text-xs uppercase ${tc.textMuted} text-center px-2 py-2`}>A</th>
                            <th className={`text-xs uppercase ${tc.textMuted} text-center px-2 py-2`}>D</th>
                            <th className={`text-xs uppercase ${tc.textMuted} text-center px-2 py-2`}>B</th>
                            <th className={`text-xs uppercase ${tc.textMuted} text-center px-2 py-2`}>Aces</th>
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
                              <tr key={pid} className={`border-b ${tc.border} last:border-0 sa-au`} style={{ animationDelay: `${i * 25}ms` }}>
                                <td className={`px-3 py-2 text-sm font-medium ${tc.text}`}>{p.name}</td>
                                <td className={`px-2 py-2 text-sm text-center ${tc.textSecondary}`}>{p.gp}</td>
                                <td className={`px-2 py-2 text-sm text-center ${tc.textSecondary}`}>{p.kills}</td>
                                <td className={`px-2 py-2 text-sm text-center ${tc.textSecondary}`}>{p.assists}</td>
                                <td className={`px-2 py-2 text-sm text-center ${tc.textSecondary}`}>{p.digs}</td>
                                <td className={`px-2 py-2 text-sm text-center ${tc.textSecondary}`}>{p.blocks}</td>
                                <td className={`px-2 py-2 text-sm text-center ${tc.textSecondary}`}>{p.aces}</td>
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

            {/* ═══ PAYMENTS TAB ═══ */}
            {activeDetailTab === 'payments' && (
              <div className="sa-au">
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className={`w-12 h-12 mx-auto ${tc.textMuted} mb-3`} />
                    <p className={`text-sm ${tc.textMuted}`}>No payment records for this season</p>
                  </div>
                ) : (
                  <>
                    {/* Payment summary */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="sa-glass rounded-xl p-3 text-center">
                        <p className={`text-xl ${tc.text}`}>${totalPaid.toLocaleString()}</p>
                        <p className={`text-xs uppercase ${tc.textMuted}`}>Collected</p>
                      </div>
                      <div className="sa-glass rounded-xl p-3 text-center">
                        <p className={`text-xl ${tc.text}`}>${(totalDue - totalPaid).toLocaleString()}</p>
                        <p className={`text-xs uppercase ${tc.textMuted}`}>Outstanding</p>
                      </div>
                      <div className="sa-glass rounded-xl p-3 text-center">
                        <p className={`text-xl ${tc.text}`}>{payments.length}</p>
                        <p className={`text-xs uppercase ${tc.textMuted}`}>Records</p>
                      </div>
                    </div>
                    <div className="sa-glass rounded-xl divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)' }}>
                      {payments.slice(0, 50).map((p, i) => (
                        <div key={p.id} className="px-4 py-3 flex items-center justify-between sa-au" style={{ animationDelay: `${i * 20}ms` }}>
                          <div>
                            <p className={`text-sm font-medium ${tc.text}`}>{p.players?.first_name} {p.players?.last_name}</p>
                            <p className={`text-xs ${tc.textMuted}`}>{p.description || p.fee_category || 'Payment'}</p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className={`text-sm font-mono font-medium ${tc.text}`}>${parseFloat(p.amount || 0).toFixed(2)}</span>
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

// ═══════ SEASON CARD ═══════
function SeasonCard({ season, onClick, isDark, tc, accent, delay }) {
  const completedGames = (season._games || []).filter(g => g.game_result === 'win' || g.game_result === 'loss' || g.game_result === 'tie')
  const wins = (season._games || []).filter(g => g.game_result === 'win').length

  return (
    <button
      onClick={onClick}
      className={`sa-glass rounded-xl p-5 text-left w-full transition-all hover:scale-[1.01] sa-au group`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${accent.primary}15` }}>
          {season.sports?.icon || '🏆'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold ${tc.text} truncate`}>{season.name}</h3>
            <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${
              season.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' :
              season.status === 'archived' ? 'bg-purple-500/15 text-purple-400' :
              'bg-slate-500/15 text-slate-400'
            }`}>
              {season.status}
            </span>
          </div>
          <p className={`text-sm ${tc.textMuted} mb-2`}>{formatDateRange(season.start_date, season.end_date)}</p>
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
              <Users className="w-3 h-3" /> {season._teamCount || 0} teams
            </span>
            <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
              <Target className="w-3 h-3" /> {season._playerCount || 0} players
            </span>
            {completedGames.length > 0 && (
              <span className={`text-xs ${tc.textMuted} flex items-center gap-1`}>
                <Trophy className="w-3 h-3" /> {wins}W-{completedGames.length - wins}L
              </span>
            )}
          </div>
        </div>
        <ChevronRight className={`w-5 h-5 ${tc.textMuted} group-hover:translate-x-1 transition-transform shrink-0 mt-1`} />
      </div>
    </button>
  )
}

// ═══════ MAIN PAGE ═══════
function SeasonArchivePage({ showToast, onNavigate }) {
  const { user, profile, organization } = useAuth()
  const tc = useThemeClasses()
  const { isDark, accent } = useTheme()

  const [orgs, setOrgs] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState(null)

  useEffect(() => { loadUserOrgs() }, [profile?.id])

  async function loadUserOrgs() {
    if (!profile?.id) return
    setLoading(true)
    try {
      // Get all orgs this user has ever been part of
      const { data: roles } = await supabase
        .from('user_roles')
        .select('organization_id, role, organizations(id, name, slug)')
        .eq('user_id', profile.id)

      // Dedupe orgs
      const orgMap = {}
      ;(roles || []).forEach(r => {
        if (r.organizations?.id && !orgMap[r.organizations.id]) {
          orgMap[r.organizations.id] = { ...r.organizations, roles: [] }
        }
        if (r.organizations?.id) {
          orgMap[r.organizations.id].roles.push(r.role)
        }
      })

      const orgList = Object.values(orgMap)
      setOrgs(orgList)

      // Default to current org or first
      const defaultOrg = organization?.id && orgMap[organization.id] ? organization.id : orgList[0]?.id
      if (defaultOrg) {
        setSelectedOrgId(defaultOrg)
        await loadSeasons(defaultOrg)
      }
    } catch (err) { console.error('Error loading orgs:', err) }
    setLoading(false)
  }

  async function loadSeasons(orgId) {
    try {
      // Fetch past seasons (not active/upcoming)
      const { data: seasonsData } = await supabase
        .from('seasons')
        .select('*, sports(id, name, icon)')
        .eq('organization_id', orgId)
        .not('status', 'in', '("active","upcoming")')
        .order('end_date', { ascending: false })

      // For each season, get counts
      const enriched = await Promise.all((seasonsData || []).map(async (s) => {
        const [teamsRes, gamesRes] = await Promise.all([
          supabase.from('teams').select('id, team_players(id)').eq('season_id', s.id),
          supabase.from('schedule_events').select('id, game_result').eq('season_id', s.id).eq('event_type', 'game'),
        ])
        const teamData = teamsRes.data || []
        return {
          ...s,
          _teamCount: teamData.length,
          _playerCount: teamData.reduce((sum, t) => sum + (t.team_players?.length || 0), 0),
          _games: gamesRes.data || [],
        }
      }))

      setSeasons(enriched)
    } catch (err) { console.error('Error loading seasons:', err) }
  }

  async function handleOrgChange(orgId) {
    setSelectedOrgId(orgId)
    setSeasons([])
    setLoading(true)
    await loadSeasons(orgId)
    setLoading(false)
  }

  const selectedOrg = orgs.find(o => o.id === selectedOrgId)

  return (
    <div className={`${isDark ? '' : 'sa-light'}`}>
      <style>{SA_STYLES}</style>

      {/* Header */}
      <div className="sa-au mb-6">
        <h1 className={`text-4xl ${tc.text} flex items-center gap-3`}>
          <Trophy className="w-8 h-8" style={{ color: accent.primary }} />
          Season Archives
        </h1>
        <p className={`text-sm uppercase ${tc.textMuted} mt-1`}>Browse past seasons, rosters, and results</p>
      </div>

      {/* Org Tabs (only if user has multiple orgs) */}
      {orgs.length > 1 && (
        <div className="sa-glass rounded-xl p-1.5 mb-6 inline-flex gap-1 sa-au" style={{ animationDelay: '60ms' }}>
          {orgs.map(org => (
            <button
              key={org.id}
              onClick={() => handleOrgChange(org.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedOrgId === org.id
                  ? 'text-white shadow-lg'
                  : `${tc.textSecondary} ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`
              }`}
              style={selectedOrgId === org.id ? { background: accent.primary } : {}}
            >
              <Building2 className="w-4 h-4" />
              {org.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }} />
        </div>
      ) : seasons.length === 0 ? (
        <div className="sa-glass rounded-xl p-12 text-center sa-au">
          <Trophy className={`w-16 h-16 mx-auto ${tc.textMuted} mb-4 opacity-40`} />
          <h2 className={`text-2xl ${tc.text} mb-2`}>No Archived Seasons</h2>
          <p className={`text-sm ${tc.textMuted} max-w-sm mx-auto`}>
            {selectedOrg?.name ? `${selectedOrg.name} doesn't have any completed seasons yet.` : 'No past seasons found.'} Completed seasons will appear here as a historical record.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season, i) => (
            <SeasonCard
              key={season.id}
              season={season}
              onClick={() => setSelectedSeason(season)}
              isDark={isDark}
              tc={tc}
              accent={accent}
              delay={i * 50}
            />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      <SeasonDetailPanel
        season={selectedSeason}
        isOpen={!!selectedSeason}
        onClose={() => setSelectedSeason(null)}
        isDark={isDark}
        tc={tc}
        accent={accent}
      />
    </div>
  )
}

export { SeasonArchivePage }
