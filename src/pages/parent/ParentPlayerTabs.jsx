import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import SpiderChart from '../../components/charts/SpiderChart'
import { Target, TrendingUp } from 'lucide-react'
import { badgeDefinitions, rarityColors } from './ParentPlayerHero'

// ── Helper sub-components ──
function SkillBar({ label, value, maxValue = 100, isDark }) {
  const pct = Math.min((value / maxValue) * 100, 100)
  return (
    <div className="flex items-center gap-3">
      <span className={`text-r-sm uppercase w-20 font-semibold truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label.replace(/_/g, ' ')}</span>
      <div className={`flex-1 h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: '#4BB9EC' }} />
      </div>
      <span className={`text-r-lg font-bold w-8 text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{value || 0}</span>
    </div>
  )
}

function MiniBarChart({ data, color = '#F59E0B', label, isDark }) {
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'
  const maxValue = Math.max(...(data || []).map(d => d.value), 1)
  if (!data || data.length === 0) return (
    <div className={`rounded-xl p-4 ${altBg}`}>
      <span className="text-r-sm uppercase tracking-wider font-semibold text-slate-400">{label}</span>
      <div className="flex items-center justify-center h-16"><span className="text-r-lg text-slate-400">No data yet</span></div>
    </div>
  )
  return (
    <div className={`rounded-xl p-4 ${altBg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-r-sm uppercase tracking-wider font-semibold text-slate-400">{label}</span>
        <span className="text-r-sm text-slate-400">Last {data.length} games</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-t transition-all" style={{ height: `${(d.value / maxValue) * 100}%`, backgroundColor: color, minHeight: '4px' }} />
            <span className="text-r-xs text-slate-400">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BadgeIcon({ badgeId, size = 'md', showLabel = false, earnedDate, isDark }) {
  const badge = badgeDefinitions[badgeId] || { name: badgeId, icon: '\u{1F3C5}', color: '#6B7280', rarity: 'Common' }
  const rColor = rarityColors[badge.rarity] || '#6B7280'
  const sz = { sm: 'w-10 h-10 text-lg', md: 'w-14 h-14 text-2xl', lg: 'w-20 h-20 text-4xl' }
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sz[size]} rounded-xl flex items-center justify-center`} style={{ backgroundColor: `${badge.color}20`, border: `2px solid ${rColor}`, boxShadow: `0 0 20px ${rColor}40` }}>{badge.icon}</div>
      {showLabel && <>
        <span className={`text-r-sm font-semibold uppercase tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>{badge.name}</span>
        <span className="text-r-xs text-slate-400">{badge.rarity}</span>
        {earnedDate && <span className="text-r-xs text-slate-400">Earned {earnedDate}</span>}
      </>}
    </div>
  )
}

function formatStatValue(value, format) {
  if (value === null || value === undefined) return '-'
  if (format === 'pct3') return value ? `.${Math.round(value * 1000)}` : '-'
  if (format === 'pct') return typeof value === 'number' ? `${Math.round(value)}%` : '-'
  if (format === 'avg') return typeof value === 'number' ? value.toFixed(3).replace(/^0/, '') : '-'
  return value
}

const TABS = [
  { id: 'overview', label: 'Overview' }, { id: 'stats', label: 'Stats' },
  { id: 'development', label: 'Development' }, { id: 'badges', label: 'Badges' }, { id: 'games', label: 'Games' },
]

// ── Main tabs component ──
export default function ParentPlayerTabs({ sc, skills, getSkillValue, seasonStats, gamesPlayed, transformedGames, perGameStats, trends, badges, badgesInProgress, evalHistory, coachFeedback, playerGoals }) {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const cardCls = isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white border border-slate-200'
  const altBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-50'
  const bdr = isDark ? 'border-white/[0.06]' : 'border-slate-200'

  return (
    <div className={`${cardCls} border-t-0 rounded-b-[14px] overflow-hidden`}>
      <div className={`flex border-b ${bdr}`}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3.5 text-r-lg font-semibold transition ${activeTab === tab.id ? 'bg-lynx-sky/20 text-lynx-sky border-b-2 border-lynx-sky' : 'text-slate-400'}`}>{tab.label}</button>
        ))}
      </div>
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab sc={sc} isDark={isDark} altBg={altBg} bdr={bdr} skills={skills} getSkillValue={getSkillValue} seasonStats={seasonStats} gamesPlayed={gamesPlayed} transformedGames={transformedGames} trends={trends} badges={badges} badgesInProgress={badgesInProgress} />}
        {activeTab === 'stats' && <StatsTab sc={sc} isDark={isDark} altBg={altBg} seasonStats={seasonStats} transformedGames={transformedGames} perGameStats={perGameStats} trends={trends} />}
        {activeTab === 'development' && <DevelopmentTab isDark={isDark} altBg={altBg} evalHistory={evalHistory} coachFeedback={coachFeedback} playerGoals={playerGoals} />}
        {activeTab === 'badges' && <BadgesTab isDark={isDark} altBg={altBg} badges={badges} badgesInProgress={badgesInProgress} />}
        {activeTab === 'games' && <GamesTab sc={sc} isDark={isDark} altBg={altBg} bdr={bdr} transformedGames={transformedGames} />}
      </div>
    </div>
  )
}

// ── Overview tab ──
function OverviewTab({ sc, isDark, altBg, bdr, skills, getSkillValue, seasonStats, gamesPlayed, transformedGames, trends, badges, badgesInProgress }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-4">
        <div className={`rounded-xl p-4 ${altBg}`}>
          <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Power Levels</h4>
          {skills && sc.skills.some(s => skills[s] != null) ? (
            <div className="space-y-4">
              <SpiderChart data={sc.skills.map(s => ({ label: sc.skillLabels?.[s] || s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' '), value: skills[s] || 0 }))} maxValue={10} size={240} color="#4BB9EC" isDark={isDark} />
              <div className="space-y-3">{sc.skills.map(s => <SkillBar key={s} label={sc.skillLabels?.[s] || s} value={getSkillValue(skills[s])} isDark={isDark} />)}</div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3"><Target className="w-8 h-8 text-lynx-sky" /></div>
              <p className={`text-r-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>Power Levels</p>
              <p className="text-r-xs mt-1 text-slate-400">Your coach hasn't rated skills yet</p>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-4 ${altBg}`}>
          <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Season Progress</h4>
          {(seasonStats || gamesPlayed > 0) ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center"><span className="text-r-xs">{'\u2705'}</span></div>
                <span className={`text-r-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{seasonStats?.games_played || gamesPlayed} Games Played</span>
              </div>
              {sc.primaryStats.slice(0, 2).map(stat => {
                const total = stat.calc ? (seasonStats ? stat.calc(seasonStats) : transformedGames.reduce((s, g) => s + (stat.calc(g.raw) || 0), 0)) : (seasonStats?.[stat.key] || transformedGames.reduce((s, g) => s + (g.raw[stat.key] || 0), 0))
                return (
                  <div key={stat.key} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}><span className="text-r-xs">{stat.icon}</span></div>
                    <span className={`text-r-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{total} Total {stat.label}</span>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-r-lg text-center py-4 text-slate-400">No season stats yet</p>}
        </div>
      </div>
      <div className="space-y-4">
        <div className={`rounded-xl p-4 ${altBg}`}>
          <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Recent Games</h4>
          {transformedGames.length > 0 ? transformedGames.slice(0, 3).map((game, i) => (
            <div key={i} className={`flex items-center gap-2 py-2.5 last:border-0 border-b ${bdr}`}>
              <span className="text-r-sm w-10 text-slate-400">{game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-r-sm font-bold ${game.result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{game.result}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-r-lg font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{game.opponent}</p>
                <p className="text-r-sm text-slate-400">{game.score}</p>
              </div>
              <div className="flex gap-2 text-r-sm font-bold">{game.statValues.slice(0, 3).map((val, si) => <span key={si} style={{ color: sc.primaryStats[si]?.color }}>{val}</span>)}</div>
            </div>
          )) : <p className="text-r-lg text-center py-4 text-slate-400">No games played yet</p>}
        </div>
        {trends[0] && <MiniBarChart data={trends[0].data} color={trends[0].color} label={trends[0].label} isDark={isDark} />}
      </div>
      <div className="space-y-4">
        <div className={`rounded-xl p-4 ${altBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-r-sm uppercase tracking-wider font-semibold text-slate-400">Badges</h4>
            <span className="text-r-sm text-slate-400">{badges.length} earned</span>
          </div>
          {badges.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {badges.slice(0, 6).map((b, i) => <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20`, border: `2px solid ${badgeDefinitions[b.badge_id]?.color || '#6B7280'}` }}>{badgeDefinitions[b.badge_id]?.icon || '\u{1F3C5}'}</div>)}
            </div>
          ) : <p className="text-r-lg text-center py-4 text-slate-400">No badges earned yet</p>}
          {badgesInProgress.length > 0 && <>
            <h5 className="text-r-sm uppercase mt-4 mb-2 font-semibold text-slate-400">In Progress</h5>
            {badgesInProgress.slice(0, 2).map((b, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20` }}>{badgeDefinitions[b.badge_id]?.icon || '\u{1F3C5}'}</div>
                <div className="flex-1">
                  <p className={`text-r-sm font-semibold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>{badgeDefinitions[b.badge_id]?.name || b.badge_id}</p>
                  <div className={`h-1.5 rounded-full mt-1 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}><div className="h-full rounded-full" style={{ width: `${(b.progress / b.target) * 100}%`, backgroundColor: badgeDefinitions[b.badge_id]?.color || '#6B7280' }} /></div>
                </div>
                <span className="text-r-sm text-slate-400">{b.progress}/{b.target}</span>
              </div>
            ))}
          </>}
        </div>
        {trends[1] && <MiniBarChart data={trends[1].data} color={trends[1].color} label={trends[1].label} isDark={isDark} />}
      </div>
    </div>
  )
}

// ── Stats tab ──
function StatsTab({ sc, isDark, altBg, seasonStats, transformedGames, perGameStats, trends }) {
  return (
    <div className="space-y-6">
      <div className={`rounded-xl p-5 ${altBg}`}>
        <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Season Totals</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(sc.primaryStats.length + 1, 6)}, 1fr)` }}>
          <div className="text-center">
            <p className="text-r-sm uppercase mb-1 flex items-center justify-center gap-1 text-slate-400">Games {sc.icon}</p>
            <p className={`text-r-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{seasonStats?.games_played || transformedGames.length}</p>
          </div>
          {sc.primaryStats.map(stat => {
            const val = stat.calc ? (seasonStats ? stat.calc(seasonStats) : transformedGames.reduce((s, g) => s + (stat.calc(g.raw) || 0), 0)) : (seasonStats?.[stat.key] || 0)
            return <div key={stat.key} className="text-center"><p className="text-r-sm uppercase mb-1 flex items-center justify-center gap-1 text-slate-400">{stat.label} <span>{stat.icon}</span></p><p className="text-r-3xl font-bold" style={{ color: stat.color }}>{val}</p></div>
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {sc.detailSections.map((section, si) => (
          <div key={si} className={`rounded-xl p-5 ${altBg}`}>
            <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">{section.title}</h4>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(section.stats.length, 3)}, 1fr)` }}>
              {section.stats.map(stat => {
                const val = stat.calc && seasonStats ? stat.calc(seasonStats) : (seasonStats?.[stat.key] ?? null)
                return <div key={stat.key}><p className="text-r-sm uppercase mb-1 text-slate-400">{stat.label}</p><p className={`text-r-2xl font-bold ${stat.color || (isDark ? 'text-white' : 'text-slate-900')}`}>{formatStatValue(val, stat.format)}</p></div>
              })}
            </div>
          </div>
        ))}
      </div>
      {perGameStats && (
        <div className={`rounded-xl p-5 ${altBg}`}>
          <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Per Game Averages</h4>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${sc.primaryStats.length}, 1fr)` }}>
            {perGameStats.map(stat => <div key={stat.key}><p className="text-r-sm uppercase mb-1 text-slate-400">{stat.label}</p><p className={`text-r-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p><p className="text-r-sm text-slate-400">per game</p></div>)}
          </div>
        </div>
      )}
      {transformedGames.length > 0 && <div className="grid grid-cols-2 gap-4">{trends.map(t => <MiniBarChart key={t.key} data={t.data} color={t.color} label={t.label} isDark={isDark} />)}</div>}
    </div>
  )
}

// ── Development tab ──
function DevelopmentTab({ isDark, altBg, evalHistory, coachFeedback, playerGoals }) {
  const parseSkills = (ev) => {
    const s = typeof ev.skills === 'string' ? JSON.parse(ev.skills) : ev.skills
    if (!s) return []
    return Object.entries(s).filter(([, v]) => v != null).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), value: typeof v === 'number' ? (v <= 10 ? v : v / 10) : 0 }))
  }
  return (
    <div className="space-y-6">
      <div className={`rounded-xl p-5 ${altBg}`}>
        <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Skill Progression</h4>
        {evalHistory.length >= 2 ? (() => {
          const earliest = evalHistory[0], latest = evalHistory[evalHistory.length - 1]
          const latestData = parseSkills(latest), earliestData = parseSkills(earliest)
          return latestData.length >= 3 ? (
            <div className="flex flex-col items-center">
              <SpiderChart data={latestData} compareData={earliestData.length === latestData.length ? earliestData : undefined} maxValue={10} size={280} color="#4BB9EC" compareColor="#94A3B8" isDark={isDark} />
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-lynx-sky rounded" /><span className={`text-r-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Latest ({new Date(latest.evaluation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</span></div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-slate-400 rounded" style={{ borderBottom: '2px dashed #94A3B8' }} /><span className={`text-r-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>First ({new Date(earliest.evaluation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})</span></div>
              </div>
            </div>
          ) : <p className="text-center py-4 text-slate-400">Not enough skill data to chart</p>
        })() : evalHistory.length === 1 ? (
          <div className="flex flex-col items-center">
            {(() => { const chartData = parseSkills(evalHistory[0]); return chartData.length >= 3 ? <SpiderChart data={chartData} maxValue={10} size={260} color="#4BB9EC" isDark={isDark} /> : null })()}
            <p className="text-r-xs mt-2 text-slate-400">One evaluation so far. Comparison will show after the next evaluation.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3"><TrendingUp className="w-8 h-8 text-lynx-sky" /></div>
            <p className={`text-r-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>No evaluations yet</p>
            <p className="text-r-xs mt-1 text-slate-400">Skill progression will appear once your coach evaluates skills.</p>
          </div>
        )}
      </div>
      <div className={`rounded-xl p-5 ${altBg}`}>
        <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Coach Feedback</h4>
        {coachFeedback.length > 0 ? (
          <div className="space-y-3">
            {coachFeedback.map((note, i) => (
              <div key={i} className={`p-3 rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-r-xs px-1.5 py-0.5 rounded font-semibold uppercase ${note.note_type === 'skill' ? 'bg-lynx-sky/10 text-lynx-sky' : note.note_type === 'behavior' ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-500/10 text-slate-500'}`}>{note.note_type}</span>
                  <span className="text-r-xs text-slate-400">{note.created_at ? new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span>
                </div>
                <p className={`text-r-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{note.content}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-center py-4 text-slate-400">No coach feedback shared yet</p>}
      </div>
      <div className={`rounded-xl p-5 ${altBg}`}>
        <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Goals</h4>
        {playerGoals.length > 0 ? (
          <div className="space-y-3">
            {playerGoals.map((goal, i) => {
              const progress = goal.current_value && goal.target_value ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0
              return (
                <div key={i} className={`p-3 rounded-lg border ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-r-sm font-semibold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>{goal.title}</span>
                    {goal.status === 'completed' && <span className="text-r-xs bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">DONE</span>}
                  </div>
                  {goal.target_value && <div className="flex items-center gap-2 mt-1"><div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}><div className="h-full rounded-full bg-lynx-sky transition-all" style={{ width: `${progress}%` }} /></div><span className={`text-r-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{goal.current_value || 0}/{goal.target_value}</span></div>}
                  {goal.target_date && <p className="text-r-xs mt-1 text-slate-400">Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                </div>
              )
            })}
          </div>
        ) : <p className="text-center py-4 text-slate-400">No goals set yet</p>}
      </div>
      <div className={`rounded-xl p-5 ${altBg}`}>
        <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Season Journey</h4>
        {evalHistory.length > 0 ? (
          <div className="relative pl-6">
            <div className={`absolute left-2 top-1 bottom-1 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            {evalHistory.map((ev, i) => (
              <div key={i} className="relative mb-4 last:mb-0">
                <div className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 ${i === evalHistory.length - 1 ? 'bg-lynx-sky border-lynx-sky' : isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-200 border-slate-300'}`} />
                <div className="flex items-center gap-3">
                  <span className="text-r-xs text-slate-400">{new Date(ev.evaluation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className={`text-r-xs px-1.5 py-0.5 rounded font-semibold uppercase ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{(ev.evaluation_type || 'eval').replace(/_/g, ' ')}</span>
                  {ev.overall_score != null && <span className="text-r-sm font-bold text-lynx-sky">{typeof ev.overall_score === 'number' ? ev.overall_score.toFixed(1) : ev.overall_score}/10</span>}
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-center py-4 text-slate-400">No evaluations recorded yet</p>}
      </div>
    </div>
  )
}

// ── Badges tab ──
function BadgesTab({ isDark, altBg, badges, badgesInProgress }) {
  return (
    <div className="space-y-6">
      <div className={`rounded-xl p-5 ${altBg}`}>
        <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Earned ({badges.length})</h4>
        {badges.length > 0 ? (
          <div className="grid grid-cols-4 gap-6">{badges.map((b, i) => <BadgeIcon key={i} badgeId={b.badge_id} size="lg" showLabel isDark={isDark} earnedDate={b.awarded_at ? new Date(b.awarded_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : null} />)}</div>
        ) : <p className="text-center py-8 text-slate-400">No badges earned yet</p>}
      </div>
      {badgesInProgress.length > 0 && (
        <div className={`rounded-xl p-5 ${altBg}`}>
          <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">In Progress</h4>
          <div className="grid grid-cols-2 gap-4">
            {badgesInProgress.map((b, i) => (
              <div key={i} className={`flex items-center gap-4 rounded-xl p-4 ${isDark ? 'bg-slate-700/30' : 'bg-slate-100'}`}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${badgeDefinitions[b.badge_id]?.color || '#6B7280'}20` }}>{badgeDefinitions[b.badge_id]?.icon || '\u{1F3C5}'}</div>
                <div className="flex-1">
                  <p className={`font-medium uppercase text-r-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{badgeDefinitions[b.badge_id]?.name || b.badge_id}</p>
                  <div className="flex items-center gap-2 mt-1"><div className={`flex-1 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}><div className="h-full rounded-full" style={{ width: `${(b.progress / b.target) * 100}%`, backgroundColor: badgeDefinitions[b.badge_id]?.color || '#6B7280' }} /></div><span className="text-r-sm text-slate-400">{b.progress}/{b.target}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Games tab ──
function GamesTab({ sc, isDark, altBg, bdr, transformedGames }) {
  return (
    <div className={`rounded-xl p-5 ${altBg}`}>
      <h4 className="text-r-sm uppercase tracking-wider font-semibold mb-4 text-slate-400">Game Log</h4>
      {transformedGames.length > 0 ? <>
        <div className={`flex items-center gap-4 py-2 text-r-sm uppercase font-semibold border-b ${bdr} text-slate-400`}>
          <span className="w-12">Date</span><span className="w-8"></span><span className="flex-1">Opponent</span>
          <div className="flex gap-3 w-48 justify-end">{sc.primaryStats.map(stat => <span key={stat.key} className="w-8 text-center">{stat.short}</span>)}</div>
        </div>
        {transformedGames.map((game, i) => (
          <div key={i} className={`flex items-center gap-4 py-3 border-b last:border-0 ${bdr}`}>
            <span className="text-r-lg w-12 text-slate-400">{game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-r-lg font-bold ${game.result === 'W' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>{game.result}</span>
            <div className="flex-1 min-w-0"><p className={`text-r-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{game.opponent}</p><p className="text-r-sm text-slate-400">{game.score}</p></div>
            <div className="flex gap-3 w-48 justify-end text-r-lg font-bold">{game.statValues.map((val, si) => <span key={si} className="w-8 text-center" style={{ color: sc.primaryStats[si]?.color }}>{val}</span>)}</div>
          </div>
        ))}
      </> : <p className="text-center py-8 text-slate-400">No games played yet</p>}
    </div>
  )
}
