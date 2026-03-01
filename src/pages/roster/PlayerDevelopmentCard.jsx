import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import SpiderChart from '../../components/charts/SpiderChart'
import {
  X, User, BarChart3, ClipboardList, Target, FileText,
  Plus, ChevronDown, ChevronUp, Save
} from 'lucide-react'

const SKILL_LABELS = {
  serving: 'Serving', passing: 'Passing', setting: 'Setting',
  attacking: 'Attacking', blocking: 'Blocking', defense: 'Defense',
  hustle: 'Hustle', coachability: 'Coachability', teamwork: 'Teamwork',
}
const CORE_SKILLS = ['serving', 'passing', 'setting', 'attacking', 'blocking', 'defense']
const NOTE_TYPES = ['general', 'injury', 'behavior', 'skill']

export default function PlayerDevelopmentCard({ player, teamId, seasonId, onClose, showToast }) {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')

  const [loading, setLoading] = useState(true)
  const [seasonStats, setSeasonStats] = useState(null)
  const [gameStats, setGameStats] = useState([])
  const [skillRating, setSkillRating] = useState(null)
  const [evaluations, setEvaluations] = useState([])
  const [goals, setGoals] = useState([])
  const [notes, setNotes] = useState([])
  const [badges, setBadges] = useState([])
  const [xpTotal, setXpTotal] = useState(0)
  const [attendance, setAttendance] = useState(null)
  const [prevEvalSkills, setPrevEvalSkills] = useState(null)

  // Notes form
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [savingNote, setSavingNote] = useState(false)

  // Goals form
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalCategory, setGoalCategory] = useState('Performance')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  // Eval comparison
  const [compareEvalIdx, setCompareEvalIdx] = useState(null)
  const [showCompletedGoals, setShowCompletedGoals] = useState(false)

  const p = player?.player || player
  const playerId = p?.id || player?.player_id
  const cardBg = isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver'
  const primaryText = isDark ? 'text-white' : 'text-lynx-navy'
  const secondaryText = isDark ? 'text-slate-400' : 'text-lynx-slate'
  const innerBg = isDark ? 'bg-white/[0.04]' : 'bg-lynx-cloud'

  useEffect(() => {
    if (playerId) loadAllData()
  }, [playerId])

  async function loadAllData() {
    setLoading(true)
    try {
      await Promise.all([
        loadSeasonStats(), loadGameStats(), loadSkillRating(),
        loadEvaluations(), loadGoals(), loadNotes(),
        loadBadges(), loadXp(), loadAttendance(),
      ])
    } catch (err) {
      console.error('PlayerDevelopmentCard loadAllData error:', err)
    }
    setLoading(false)
  }

  async function loadSeasonStats() {
    try {
      const { data } = await supabase.from('player_season_stats').select('*')
        .eq('player_id', playerId).eq('season_id', seasonId).single()
      setSeasonStats(data || null)
    } catch { setSeasonStats(null) }
  }

  async function loadGameStats() {
    try {
      const { data } = await supabase.from('game_player_stats')
        .select('*, schedule_events!event_id(event_date, opponent_name, our_score, their_score)')
        .eq('player_id', playerId).order('created_at', { ascending: false }).limit(20)
      setGameStats(data || [])
    } catch { setGameStats([]) }
  }

  async function loadSkillRating() {
    try {
      const { data } = await supabase.from('player_skill_ratings').select('*')
        .eq('player_id', playerId).eq('season_id', seasonId)
        .order('rated_at', { ascending: false }).limit(1).single()
      setSkillRating(data || null)
    } catch { setSkillRating(null) }
  }

  async function loadEvaluations() {
    try {
      const { data } = await supabase.from('player_evaluations').select('*')
        .eq('player_id', playerId).eq('season_id', seasonId)
        .order('evaluation_date', { ascending: false })
      setEvaluations(data || [])
      // Get previous eval skills for spider comparison
      if (data && data.length >= 2) {
        const oldest = data[data.length - 1]
        const skills = typeof oldest.skills === 'string' ? JSON.parse(oldest.skills) : oldest.skills
        setPrevEvalSkills(skills)
      }
    } catch { setEvaluations([]) }
  }

  async function loadGoals() {
    try {
      const { data } = await supabase.from('player_goals').select('*')
        .eq('player_id', playerId).eq('season_id', seasonId)
        .order('created_at', { ascending: false })
      setGoals(data || [])
    } catch { setGoals([]) }
  }

  async function loadNotes() {
    try {
      const { data } = await supabase.from('player_coach_notes').select('*')
        .eq('player_id', playerId).eq('season_id', seasonId)
        .order('created_at', { ascending: false })
      setNotes(data || [])
    } catch { setNotes([]) }
  }

  async function loadBadges() {
    try {
      const { data } = await supabase.from('player_badges').select('*')
        .eq('player_id', playerId).order('awarded_at', { ascending: false }).limit(6)
      setBadges(data || [])
    } catch { setBadges([]) }
  }

  async function loadXp() {
    try {
      const { data } = await supabase.from('xp_ledger').select('xp_amount')
        .eq('player_id', playerId)
      setXpTotal((data || []).reduce((s, r) => s + (r.xp_amount || 0), 0))
    } catch { setXpTotal(0) }
  }

  async function loadAttendance() {
    try {
      const { data: events } = await supabase.from('event_attendance').select('status')
        .eq('player_id', playerId)
      if (events && events.length > 0) {
        const present = events.filter(e => e.status === 'present' || e.status === 'late').length
        setAttendance(Math.round((present / events.length) * 100))
      } else {
        setAttendance(null)
      }
    } catch { setAttendance(null) }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      await supabase.from('player_coach_notes').insert({
        player_id: playerId,
        coach_id: user.id,
        season_id: seasonId,
        note_type: noteType,
        content: noteText.trim(),
        is_private: true,
      })
      setNoteText('')
      showToast?.('Note added', 'success')
      loadNotes()
    } catch (err) {
      console.error('addNote error:', err)
      showToast?.('Failed to add note', 'error')
    }
    setSavingNote(false)
  }

  async function handleCreateGoal() {
    if (!goalTitle.trim()) return
    setSavingGoal(true)
    try {
      await supabase.from('player_goals').insert({
        player_id: playerId,
        season_id: seasonId,
        created_by: user.id,
        title: goalTitle.trim(),
        category: goalCategory,
        target_value: goalTarget ? parseInt(goalTarget) : null,
        current_value: 0,
        target_date: goalTargetDate || null,
        status: 'active',
      })
      setGoalTitle('')
      setGoalTarget('')
      setGoalTargetDate('')
      setShowGoalForm(false)
      showToast?.('Goal created', 'success')
      loadGoals()
    } catch (err) {
      console.error('createGoal error:', err)
      showToast?.('Failed to create goal', 'error')
    }
    setSavingGoal(false)
  }

  // XP level calculation
  const xpLevel = Math.floor(xpTotal / 100) + 1

  // Spider chart data from skill rating
  const spiderData = skillRating ? CORE_SKILLS.map(k => ({
    label: SKILL_LABELS[k] || k,
    value: skillRating[`${k}_rating`] || 0,
  })) : []

  const compareSpiderData = prevEvalSkills ? CORE_SKILLS.map(k => ({
    label: SKILL_LABELS[k] || k,
    value: prevEvalSkills[k] || 0,
  })) : null

  // Quick stats
  const gamesPlayed = seasonStats?.games_played || gameStats.length
  const topStat = seasonStats?.total_kills || gameStats.reduce((s, g) => s + (g.kills || 0), 0)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'evaluations', label: 'Evals', icon: ClipboardList },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'notes', label: 'Notes', icon: FileText },
  ]

  if (!player) return null

  const jerseyNum = player.jersey_number ?? p?.jersey_number
  const position = p?.position || player.positions?.primary_position

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className={`w-[800px] max-w-full h-full overflow-y-auto shadow-2xl ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>

        {/* ═══ HEADER ═══ */}
        <div className={`${cardBg} border-b p-5`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {p?.photo_url ? (
                <img src={p.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold ${isDark ? 'bg-lynx-sky/20 text-lynx-sky' : 'bg-lynx-ice text-lynx-deep'}`}>
                  {p?.first_name?.[0]}{p?.last_name?.[0]}
                </div>
              )}
              <div>
                <h2 className={`text-xl font-bold ${primaryText}`}>{p?.first_name} {p?.last_name}</h2>
                <p className={`text-sm ${secondaryText}`}>
                  {jerseyNum ? `#${jerseyNum}` : ''}{jerseyNum && position ? ' · ' : ''}{position || ''}
                  {p?.grade ? ` · ${p.grade}` : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-lynx-cloud'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { label: 'GAMES', value: gamesPlayed },
              { label: 'KILLS', value: topStat },
              { label: 'RATING', value: skillRating?.overall_rating ? `${skillRating.overall_rating}/10` : '—' },
              { label: 'ATTEND', value: attendance != null ? `${attendance}%` : '—' },
              { label: 'XP', value: `Lv.${xpLevel}` },
            ].map(s => (
              <div key={s.label} className={`rounded-xl px-2 py-1.5 text-center ${innerBg}`}>
                <p className={`text-lg font-bold ${primaryText}`}>{s.value}</p>
                <p className={`text-[9px] uppercase tracking-wider font-semibold ${secondaryText}`}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-semibold transition ${activeTab === tab.id
                    ? 'bg-lynx-sky text-white'
                    : isDark ? 'text-slate-400 hover:bg-white/[0.06]' : 'text-lynx-slate hover:bg-lynx-cloud'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ═══ TAB CONTENT ═══ */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`${cardBg} border rounded-xl p-4`}>
                  <div className={`h-3 w-24 rounded mb-3 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  <div className={`h-40 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                </div>
                <div className={`${cardBg} border rounded-xl p-4 space-y-3`}>
                  <div className={`h-3 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                      <div className={`h-3 flex-1 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ═══ OVERVIEW TAB ═══ */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Left: Spider Chart + Season Stats */}
                  <div className="space-y-4">
                    <div className={`${cardBg} border rounded-xl p-4`}>
                      <h4 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${secondaryText}`}>Skill Ratings</h4>
                      {spiderData.some(d => d.value > 0) ? (
                        <SpiderChart data={spiderData} compareData={compareSpiderData}
                          maxValue={10} size={240} color="#4BB9EC" isDark={isDark} />
                      ) : (
                        <div className="flex flex-col items-center py-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
                            <Target className="w-6 h-6 text-lynx-sky" />
                          </div>
                          <p className={`text-xs ${secondaryText}`}>No evaluations yet</p>
                        </div>
                      )}
                    </div>

                    <div className={`${cardBg} border rounded-xl p-4`}>
                      <h4 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${secondaryText}`}>Season Stats</h4>
                      {gamesPlayed > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'Kills', value: seasonStats?.total_kills || 0, color: 'text-amber-500' },
                            { label: 'Aces', value: seasonStats?.total_aces || 0, color: 'text-pink-500' },
                            { label: 'Digs', value: seasonStats?.total_digs || 0, color: 'text-cyan-500' },
                            { label: 'Blocks', value: seasonStats?.total_blocks || 0, color: 'text-indigo-500' },
                            { label: 'Assists', value: seasonStats?.total_assists || 0, color: 'text-emerald-500' },
                            { label: 'Games', value: gamesPlayed, color: primaryText },
                          ].map(s => (
                            <div key={s.label} className="text-center">
                              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                              <p className={`text-[10px] uppercase ${secondaryText}`}>{s.label}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`text-xs text-center py-4 ${secondaryText}`}>No game stats yet</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Recent Games + Badges + Quick Note */}
                  <div className="space-y-4">
                    <div className={`${cardBg} border rounded-xl p-4`}>
                      <h4 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${secondaryText}`}>Recent Games</h4>
                      {gameStats.length > 0 ? gameStats.slice(0, 4).map((g, i) => {
                        const isWin = (g.schedule_events?.our_score || 0) > (g.schedule_events?.their_score || 0)
                        return (
                          <div key={i} className={`flex items-center gap-2 py-2 ${i < 3 ? `border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}` : ''}`}>
                            <span className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${isWin ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                              {isWin ? 'W' : 'L'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium truncate ${primaryText}`}>{g.schedule_events?.opponent_name || 'Unknown'}</p>
                              <p className={`text-[10px] ${secondaryText}`}>{g.schedule_events?.event_date || ''}</p>
                            </div>
                            <div className="flex gap-2 text-xs font-bold">
                              <span className="text-amber-500">{g.kills || 0}K</span>
                              <span className="text-cyan-500">{g.digs || 0}D</span>
                              <span className="text-pink-500">{g.aces || 0}A</span>
                            </div>
                          </div>
                        )
                      }) : <p className={`text-xs text-center py-4 ${secondaryText}`}>No games played yet</p>}
                    </div>

                    <div className={`${cardBg} border rounded-xl p-4`}>
                      <h4 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${secondaryText}`}>Badges</h4>
                      {badges.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {badges.slice(0, 4).map((b, i) => (
                            <div key={i} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-lynx-sky/10 text-lynx-sky' : 'bg-lynx-ice text-lynx-deep'}`}>
                              {b.badge_name || b.badge_type || 'Badge'}
                            </div>
                          ))}
                        </div>
                      ) : <p className={`text-xs text-center py-2 ${secondaryText}`}>No badges yet</p>}
                    </div>

                    <div className={`${cardBg} border rounded-xl p-4`}>
                      <h4 className={`text-xs uppercase tracking-wider font-semibold mb-2 ${secondaryText}`}>Quick Note</h4>
                      <div className="flex gap-2">
                        <input value={noteText} onChange={e => setNoteText(e.target.value)}
                          placeholder="Add a quick note..."
                          className={`flex-1 px-3 py-1.5 rounded-[10px] border text-sm ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-white border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'}`}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }}
                        />
                        <button onClick={handleAddNote} disabled={savingNote || !noteText.trim()}
                          className="px-3 py-1.5 rounded-[10px] bg-lynx-sky text-white text-sm font-semibold hover:bg-lynx-deep transition disabled:opacity-40">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STATS TAB ═══ */}
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  {/* Per-game table */}
                  <div className={`${cardBg} border rounded-xl overflow-hidden`}>
                    <div className="p-4">
                      <h4 className={`text-xs uppercase tracking-wider font-semibold ${secondaryText}`}>Game Log</h4>
                    </div>
                    {gameStats.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}`}>
                              {['Date', 'Opponent', 'Result', 'K', 'A', 'D', 'B', 'AST', 'PTS'].map(h => (
                                <th key={h} className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-left ${secondaryText}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {gameStats.map((g, i) => {
                              const isWin = (g.schedule_events?.our_score || 0) > (g.schedule_events?.their_score || 0)
                              return (
                                <tr key={i} className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-lynx-silver/50'}`}>
                                  <td className={`px-3 py-2 text-xs ${secondaryText}`}>{g.schedule_events?.event_date ? new Date(g.schedule_events.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                                  <td className={`px-3 py-2 text-xs font-medium ${primaryText}`}>{g.schedule_events?.opponent_name || '—'}</td>
                                  <td className="px-3 py-2">
                                    <span className={`text-xs font-bold ${isWin ? 'text-emerald-500' : 'text-red-400'}`}>{isWin ? 'W' : 'L'}</span>
                                  </td>
                                  <td className={`px-3 py-2 text-xs font-bold ${primaryText}`}>{g.kills || 0}</td>
                                  <td className={`px-3 py-2 text-xs font-bold ${primaryText}`}>{g.aces || 0}</td>
                                  <td className={`px-3 py-2 text-xs font-bold ${primaryText}`}>{g.digs || 0}</td>
                                  <td className={`px-3 py-2 text-xs font-bold ${primaryText}`}>{g.blocks || 0}</td>
                                  <td className={`px-3 py-2 text-xs font-bold ${primaryText}`}>{g.assists || 0}</td>
                                  <td className={`px-3 py-2 text-xs font-bold ${primaryText}`}>{g.points_scored || 0}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className={`text-xs ${secondaryText}`}>Play games and enter stats to see performance data.</p>
                      </div>
                    )}
                  </div>

                  {/* Best Game */}
                  {gameStats.length > 0 && (() => {
                    const best = [...gameStats].sort((a, b) => (b.kills || 0) - (a.kills || 0))[0]
                    if (!best || !best.kills) return null
                    return (
                      <div className={`${cardBg} border rounded-xl p-4`}>
                        <h4 className={`text-xs uppercase tracking-wider font-semibold mb-2 ${secondaryText}`}>Best Game</h4>
                        <p className={`text-sm font-semibold ${primaryText}`}>
                          {best.kills} kills vs {best.schedule_events?.opponent_name || 'Unknown'}
                          {best.schedule_events?.event_date ? ` on ${new Date(best.schedule_events.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ═══ EVALUATIONS TAB ═══ */}
              {activeTab === 'evaluations' && (
                <div className="space-y-4">
                  {/* Spider Chart Comparison */}
                  {evaluations.length >= 2 && (
                    <div className={`${cardBg} border rounded-xl p-4`}>
                      <h4 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${secondaryText}`}>Skill Growth</h4>
                      <SpiderChart
                        data={(() => {
                          const latest = evaluations[0]
                          const skills = typeof latest.skills === 'string' ? JSON.parse(latest.skills) : latest.skills
                          return CORE_SKILLS.map(k => ({ label: SKILL_LABELS[k], value: skills?.[k] || 0 }))
                        })()}
                        compareData={(() => {
                          const idx = compareEvalIdx ?? evaluations.length - 1
                          const ev = evaluations[idx]
                          const skills = typeof ev.skills === 'string' ? JSON.parse(ev.skills) : ev.skills
                          return CORE_SKILLS.map(k => ({ label: SKILL_LABELS[k], value: skills?.[k] || 0 }))
                        })()}
                        maxValue={10} size={240} color="#4BB9EC" compareColor="#94A3B8" isDark={isDark}
                      />
                      <p className={`text-[10px] text-center mt-2 ${secondaryText}`}>
                        <span className="text-lynx-sky font-semibold">Solid</span> = Latest · <span style={{ color: '#94A3B8' }} className="font-semibold">Dashed</span> = Earliest
                      </p>
                    </div>
                  )}

                  {/* Eval Timeline */}
                  <div className={`${cardBg} border rounded-xl p-4`}>
                    <h4 className={`text-xs uppercase tracking-wider font-semibold mb-3 ${secondaryText}`}>Evaluation History</h4>
                    {evaluations.length > 0 ? evaluations.map((ev, i) => {
                      const skills = typeof ev.skills === 'string' ? JSON.parse(ev.skills) : ev.skills
                      return (
                        <div key={ev.id || i} className={`py-3 ${i < evaluations.length - 1 ? `border-b ${isDark ? 'border-white/[0.06]' : 'border-lynx-silver'}` : ''}`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isDark ? 'bg-lynx-sky/10 text-lynx-sky' : 'bg-lynx-ice text-lynx-deep'}`}>
                                {ev.evaluation_type?.replace(/_/g, ' ')}
                              </span>
                              <span className={`text-xs ${secondaryText}`}>{ev.evaluation_date}</span>
                            </div>
                            <span className={`text-sm font-bold ${primaryText}`}>{ev.overall_score}/10</span>
                          </div>
                          {skills && (
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                              {Object.entries(skills).map(([k, v]) => (
                                <span key={k} className={`text-[10px] ${secondaryText}`}>
                                  {(SKILL_LABELS[k] || k).slice(0, 4)}: <strong className={primaryText}>{v}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                          {ev.notes && <p className={`text-xs mt-1 italic ${secondaryText}`}>"{ev.notes}"</p>}
                        </div>
                      )
                    }) : (
                      <div className="py-6 text-center">
                        <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-2 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
                          <ClipboardList className="w-6 h-6 text-lynx-sky" />
                        </div>
                        <p className={`text-sm font-semibold ${primaryText}`}>No evaluations yet</p>
                        <p className={`text-xs mt-1 ${secondaryText}`}>Start your first evaluation to track player growth.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ GOALS TAB ═══ */}
              {activeTab === 'goals' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs uppercase tracking-wider font-semibold ${secondaryText}`}>Active Goals</h4>
                    <button onClick={() => setShowGoalForm(!showGoalForm)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-lynx-sky text-white text-xs font-semibold hover:bg-lynx-deep transition">
                      <Plus className="w-3.5 h-3.5" /> Create Goal
                    </button>
                  </div>

                  {/* Goal Form */}
                  {showGoalForm && (
                    <div className={`${cardBg} border rounded-xl p-4 space-y-3`}>
                      <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="Goal title..."
                        className={`w-full px-3 py-2 rounded-[10px] border text-sm ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-white border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'}`} />
                      <div className="flex gap-2">
                        <select value={goalCategory} onChange={e => setGoalCategory(e.target.value)}
                          className={`px-3 py-2 rounded-[10px] border text-sm ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white' : 'bg-white border-lynx-silver text-lynx-navy'}`}>
                          {['Performance', 'Attendance', 'Skills', 'Personal'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="number" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="Target value"
                          className={`w-32 px-3 py-2 rounded-[10px] border text-sm ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-white border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'}`} />
                        <input type="date" value={goalTargetDate} onChange={e => setGoalTargetDate(e.target.value)}
                          className={`px-3 py-2 rounded-[10px] border text-sm ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white' : 'bg-white border-lynx-silver text-lynx-navy'}`} />
                      </div>
                      <button onClick={handleCreateGoal} disabled={savingGoal || !goalTitle.trim()}
                        className="px-4 py-2 rounded-[10px] bg-lynx-sky text-white text-sm font-semibold hover:bg-lynx-deep transition disabled:opacity-40 flex items-center gap-1">
                        <Save className="w-3.5 h-3.5" /> Save Goal
                      </button>
                    </div>
                  )}

                  {/* Active Goals List */}
                  {goals.filter(g => g.status === 'active').map(goal => (
                    <div key={goal.id} className={`${cardBg} border rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className={`text-sm font-semibold ${primaryText}`}>{goal.title}</h5>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isDark ? 'bg-lynx-sky/10 text-lynx-sky' : 'bg-lynx-ice text-lynx-deep'}`}>{goal.category}</span>
                      </div>
                      {goal.target_value && (
                        <div className="mb-2">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className={secondaryText}>{goal.current_value || 0} / {goal.target_value}</span>
                            <span className={secondaryText}>{Math.round(((goal.current_value || 0) / goal.target_value) * 100)}%</span>
                          </div>
                          <div className={`h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <div className="h-full rounded-full bg-lynx-sky transition-all" style={{ width: `${Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100)}%` }} />
                          </div>
                        </div>
                      )}
                      {goal.target_date && <p className={`text-[10px] ${secondaryText}`}>Due: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                    </div>
                  ))}

                  {goals.filter(g => g.status === 'active').length === 0 && !showGoalForm && (
                    <div className={`${cardBg} border rounded-xl p-8 text-center`}>
                      <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-2 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
                        <Target className="w-6 h-6 text-lynx-sky" />
                      </div>
                      <p className={`text-sm font-semibold ${primaryText}`}>No goals yet</p>
                      <p className={`text-xs mt-1 ${secondaryText}`}>Set goals for your players to track their progress.</p>
                    </div>
                  )}

                  {/* Completed Goals */}
                  {goals.filter(g => g.status === 'completed').length > 0 && (
                    <div>
                      <button onClick={() => setShowCompletedGoals(!showCompletedGoals)}
                        className={`flex items-center gap-1 text-xs font-semibold ${secondaryText}`}>
                        {showCompletedGoals ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Completed ({goals.filter(g => g.status === 'completed').length})
                      </button>
                      {showCompletedGoals && goals.filter(g => g.status === 'completed').map(goal => (
                        <div key={goal.id} className={`${cardBg} border rounded-xl p-3 mt-2 opacity-60`}>
                          <p className={`text-xs font-semibold ${primaryText}`}>{goal.title}</p>
                          {goal.completed_at && <p className={`text-[10px] ${secondaryText}`}>Completed {new Date(goal.completed_at).toLocaleDateString()}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══ NOTES TAB ═══ */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Quick Add */}
                  <div className={`${cardBg} border rounded-xl p-4`}>
                    <div className="flex gap-2 mb-2">
                      <select value={noteType} onChange={e => setNoteType(e.target.value)}
                        className={`px-2 py-1.5 rounded-[10px] border text-xs ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white' : 'bg-white border-lynx-silver text-lynx-navy'}`}>
                        {NOTE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                        rows={2} placeholder="Add a private note..."
                        className={`flex-1 px-3 py-2 rounded-[10px] border text-sm resize-none ${isDark ? 'bg-white/[0.06] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-white border-lynx-silver text-lynx-navy placeholder:text-lynx-slate'}`} />
                      <button onClick={handleAddNote} disabled={savingNote || !noteText.trim()}
                        className="px-4 py-2 rounded-[10px] bg-lynx-sky text-white text-sm font-semibold hover:bg-lynx-deep transition disabled:opacity-40 self-end">
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Notes Feed */}
                  {notes.length > 0 ? notes.map((note, i) => (
                    <div key={note.id || i} className={`${cardBg} border rounded-xl p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-lynx-cloud text-lynx-slate'}`}>
                          {note.note_type || 'general'}
                        </span>
                        <span className={`text-[10px] ${secondaryText}`}>
                          {note.created_at ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                        <span className={`text-[10px] ${secondaryText}`}>🔒 Private</span>
                      </div>
                      <p className={`text-sm ${primaryText}`}>{note.content}</p>
                    </div>
                  )) : (
                    <div className={`${cardBg} border rounded-xl p-8 text-center`}>
                      <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-2 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
                        <FileText className="w-6 h-6 text-lynx-sky" />
                      </div>
                      <p className={`text-sm font-semibold ${primaryText}`}>No notes yet</p>
                      <p className={`text-xs mt-1 ${secondaryText}`}>Add private notes to track player development.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
