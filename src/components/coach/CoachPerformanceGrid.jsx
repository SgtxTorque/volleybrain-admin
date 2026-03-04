import {
  BarChart3, Trophy, TrendingUp, Star, Target, Activity, Flame
} from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * CoachPerformanceGrid — 3×3 grid of performance cards with charts
 * Cards 1-6: real data charts. Cards 7-9: placeholders.
 */
export default function CoachPerformanceGrid({
  scoringTrend,
  teamRecord,
  topPlayers,
  topPlayerTrend,
  statLeaders,
  developmentData,
  roster,
  onNavigate,
}) {
  const { isDark } = useTheme()

  return (
    <div>
      {/* Section divider */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-lynx-sky" />
          <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Performance</h2>
        </div>
        <button onClick={() => onNavigate?.('leaderboards')} className="text-xs font-semibold text-lynx-sky hover:text-lynx-deep">
          View Full Stats →
        </button>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ScoringTrendCard data={scoringTrend} isDark={isDark} />
        <WinLossCard teamRecord={teamRecord} isDark={isDark} />
        <SetAnalysisCard data={scoringTrend} isDark={isDark} />
        <TopPerformerCard topPlayers={topPlayers} topPlayerTrend={topPlayerTrend} roster={roster} isDark={isDark} />
        <StatLeadersCard leaders={statLeaders} isDark={isDark} />
        <DevelopmentCard data={developmentData} isDark={isDark} />

        {/* Placeholders */}
        {/* TODO: Implement streak detection, milestone tracking, career records from player_season_stats and schedule_events */}
        <PerfCard title="Season Highlights" icon={Flame} isDark={isDark}>
          <div className="flex flex-col items-center justify-center h-[160px] text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
              <Trophy className="w-6 h-6 text-lynx-sky" />
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>Season highlights</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>will appear as your team plays more games</p>
          </div>
        </PerfCard>

        {/* TODO: Group schedule_events by opponent_name, compute W/L per opponent, avg score differential */}
        <PerfCard title="Head-to-Head Records" icon={Target} isDark={isDark}>
          <div className="flex flex-col items-center justify-center h-[160px] text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
              <Target className="w-6 h-6 text-lynx-sky" />
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>Head-to-head records</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Compare performance against each opponent</p>
          </div>
        </PerfCard>

        {/* TODO: Compute standard deviation of per-game stats for each player, rank by consistency */}
        <PerfCard title="Player Consistency" icon={Activity} isDark={isDark}>
          <div className="flex flex-col items-center justify-center h-[160px] text-center">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-lynx-sky/10' : 'bg-lynx-ice'}`}>
              <Activity className="w-6 h-6 text-lynx-sky" />
            </div>
            <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-lynx-navy'}`}>Player consistency</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>Track game-to-game reliability and variance</p>
          </div>
        </PerfCard>
      </div>
    </div>
  )
}

// ── Shared Card Wrapper ──
function PerfCard({ title, icon: Icon, isDark, children }) {
  const cardBg = isDark ? 'bg-lynx-charcoal border border-lynx-border-dark' : 'bg-white border border-lynx-silver/50'
  return (
    <div className={`${cardBg} rounded-xl shadow-sm overflow-hidden min-h-[220px]`}>
      <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
        {Icon && <Icon className="w-4 h-4 text-lynx-sky" />}
        <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{title}</h3>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// CARD 1: Scoring Trend (Line Chart)
// ══════════════════════════════════════════════
function ScoringTrendCard({ data, isDark }) {
  const games = data || []

  return (
    <PerfCard title="Scoring Trend" icon={TrendingUp} isDark={isDark}>
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[160px] text-center">
          <TrendingUp className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Play games to see your scoring trend</p>
        </div>
      ) : (
        <div>
          <MiniLineChart
            data={games.map((g, i) => ({
              value: g.our_score || 0,
              label: g.opponent_name ? g.opponent_name.substring(0, 3).toUpperCase() : `G${i + 1}`
            }))}
            color="#4BB9EC"
            isDark={isDark}
          />
        </div>
      )}
    </PerfCard>
  )
}

// ══════════════════════════════════════════════
// CARD 2: Win/Loss Breakdown (Donut Chart)
// ══════════════════════════════════════════════
function WinLossCard({ teamRecord, isDark }) {
  const wins = teamRecord?.wins || 0
  const losses = teamRecord?.losses || 0
  const total = wins + losses

  // Compute current streak
  let streak = ''
  if (teamRecord?.recentForm?.length > 0) {
    const form = teamRecord.recentForm
    const lastResult = form[0]?.result
    let count = 0
    for (const g of form) {
      if (g.result === lastResult) count++
      else break
    }
    if (lastResult === 'win') streak = `${count}-game win streak`
    else if (lastResult === 'loss') streak = `${count}-game losing streak`
  }

  return (
    <PerfCard title="Win/Loss" icon={Trophy} isDark={isDark}>
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center h-[160px] text-center">
          <Trophy className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>No completed games yet</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <DonutChart wins={wins} losses={losses} isDark={isDark} />
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{wins} Wins</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{losses} Losses</span>
            </div>
          </div>
          {streak && (
            <p className={`text-xs mt-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              {streak.includes('win') ? '🔥' : ''} {streak}
            </p>
          )}
        </div>
      )}
    </PerfCard>
  )
}

// ══════════════════════════════════════════════
// CARD 3: Set Analysis (Stacked Bar Chart)
// ══════════════════════════════════════════════
function SetAnalysisCard({ data, isDark }) {
  const games = (data || []).filter(g => g.our_sets_won != null || g.opponent_sets_won != null)

  return (
    <PerfCard title="Set Analysis" icon={BarChart3} isDark={isDark}>
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[160px] text-center">
          <BarChart3 className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Enter set scores in Game Day</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>to see this analysis</p>
        </div>
      ) : (
        <div>
          <StackedBarChart games={games} isDark={isDark} />
          <div className="flex items-center gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Sets Won</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-300'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Sets Lost</span>
            </div>
          </div>
        </div>
      )}
    </PerfCard>
  )
}

// ══════════════════════════════════════════════
// CARD 4: Top Performer Spotlight
// ══════════════════════════════════════════════
function TopPerformerCard({ topPlayers, topPlayerTrend, roster, isDark }) {
  const topStat = topPlayers?.[0]
  const player = roster?.find(p => p.id === topStat?.player_id)

  if (!topStat || !player) {
    return (
      <PerfCard title="Top Performer" icon={Star} isDark={isDark}>
        <div className="flex flex-col items-center justify-center h-[160px] text-center">
          <Star className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Complete games and enter stats</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>to see your top performer</p>
        </div>
      </PerfCard>
    )
  }

  function TrendArrow({ value }) {
    if (!value || Math.abs(value) < 0.5) return <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>→</span>
    if (value > 0) return <span className="text-[10px] text-emerald-500">↑ {Math.round(value)}%</span>
    return <span className="text-[10px] text-red-500">↓ {Math.abs(Math.round(value))}%</span>
  }

  const kills = topStat.total_kills || 0
  const aces = topStat.total_aces || 0
  const pts = topStat.total_points || 0

  return (
    <PerfCard title="Top Performer" icon={Star} isDark={isDark}>
      <div className="flex items-start gap-3 mb-3">
        {player.photo_url ? (
          <img src={player.photo_url} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-sm font-bold bg-lynx-ice text-lynx-sky flex-shrink-0">
            {player.first_name?.[0]}{player.last_name?.[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
            {player.first_name} {player.last_name?.[0]}.
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            #{player.jersey_number || '—'} · {player.position || 'Player'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Kills', value: kills, trend: topPlayerTrend?.kills },
          { label: 'Aces', value: aces, trend: topPlayerTrend?.aces },
          { label: 'Points', value: pts, trend: topPlayerTrend?.points },
        ].map(s => (
          <div key={s.label} className={`text-center p-2 rounded-xl ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</p>
            <p className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{s.label}</p>
            <TrendArrow value={s.trend} />
          </div>
        ))}
      </div>
    </PerfCard>
  )
}

// ══════════════════════════════════════════════
// CARD 5: Stat Leaders — Power Bars
// ══════════════════════════════════════════════
function StatLeadersCard({ leaders, isDark }) {
  const categories = ['kills', 'aces', 'digs', 'blocks', 'assists']
  const hasData = leaders && Object.keys(leaders).length > 0

  if (!hasData) {
    return (
      <PerfCard title="Stat Leaders" icon={BarChart3} isDark={isDark}>
        <div className="flex flex-col items-center justify-center h-[160px] text-center">
          <BarChart3 className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Enter game stats</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>to see your stat leaders</p>
        </div>
      </PerfCard>
    )
  }

  // Find max value across all categories for normalization
  const maxVal = Math.max(...categories.map(cat => leaders[cat]?.value || 0), 1)

  return (
    <PerfCard title="Stat Leaders" icon={BarChart3} isDark={isDark}>
      <div className="space-y-2.5">
        {categories.map(cat => {
          const leader = leaders[cat]
          if (!leader) return null
          const pct = Math.round((leader.value / maxVal) * 100)
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase w-12 text-right ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                {cat}
              </span>
              <div className="flex-1 flex items-center gap-2">
                <div className={`flex-1 h-4 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
                  <div
                    className="h-full rounded-full bg-lynx-sky transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-8 text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{leader.value}</span>
              </div>
              <span className={`text-[10px] w-16 truncate ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{leader.name}</span>
            </div>
          )
        })}
      </div>
    </PerfCard>
  )
}

// ══════════════════════════════════════════════
// CARD 6: Player Development (Grouped Bar Chart)
// ══════════════════════════════════════════════
function DevelopmentCard({ data, isDark }) {
  if (!data) {
    return (
      <PerfCard title="Player Development" icon={TrendingUp} isDark={isDark}>
        <div className="flex flex-col items-center justify-center h-[160px] text-center">
          <TrendingUp className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Play at least 4 games</p>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>to see development trends</p>
        </div>
      </PerfCard>
    )
  }

  const stats = [
    { label: 'K/G', early: data.early.kills, recent: data.recent.kills },
    { label: 'A/G', early: data.early.aces, recent: data.recent.aces },
    { label: 'P/G', early: data.early.points, recent: data.recent.points },
  ]
  const maxVal = Math.max(...stats.map(s => Math.max(s.early, s.recent)), 1)
  const improving = stats.every(s => s.recent >= s.early)

  return (
    <PerfCard title="Player Development" icon={TrendingUp} isDark={isDark}>
      <div className="space-y-3">
        {stats.map(s => {
          const earlyPct = Math.round((s.early / maxVal) * 100)
          const recentPct = Math.round((s.recent / maxVal) * 100)
          return (
            <div key={s.label}>
              <p className={`text-[10px] font-bold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>{s.label}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] w-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Early</span>
                  <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
                    <div className={`h-full rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-300'}`} style={{ width: `${earlyPct}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold w-8 text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.early.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] w-10 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Recent</span>
                  <div className={`flex-1 h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-lynx-cloud'}`}>
                    <div className="h-full rounded-full bg-lynx-sky" style={{ width: `${recentPct}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold w-8 text-right ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.recent.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className={`text-xs mt-3 ${improving ? 'text-emerald-500' : isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
        {improving ? '↑ Team improving across all categories' : 'Mixed results — some areas improving'}
      </p>
    </PerfCard>
  )
}

// ══════════════════════════════════════════════
// SVG CHARTS (raw SVG, matching DashboardWidgets patterns)
// ══════════════════════════════════════════════

// Mini Line Chart — matches DashboardWidgets.jsx MiniLineChart pattern
function MiniLineChart({ data, color = '#4BB9EC', isDark }) {
  if (!data || data.length === 0) return null

  const width = 260
  const height = 100
  const maxValue = Math.max(...data.map(d => d.value || 0), 1) * 1.2
  const minValue = 0
  const range = maxValue - minValue || 1

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
    const y = height - ((d.value - minValue) / range) * height
    return `${x},${isNaN(y) ? height : y}`
  }).join(' ')

  return (
    <svg width={width} height={height + 20} className="overflow-visible w-full" viewBox={`0 0 ${width} ${height + 20}`}>
      {/* Grid lines */}
      {[0, 1, 2, 3].map(i => (
        <line
          key={i}
          x1="0"
          y1={height - (i / 3) * height}
          x2={width}
          y2={height - (i / 3) * height}
          stroke={isDark ? '#334155' : '#E2E8F0'}
          strokeWidth="1"
        />
      ))}

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {data.map((d, i) => {
        const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
        const rawY = height - ((d.value - minValue) / range) * height
        const y = isNaN(rawY) ? height : rawY
        return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
        return (
          <text key={`l${i}`} x={x} y={height + 14} textAnchor="middle" fill={isDark ? '#64748B' : '#94A3B8'} fontSize="9">
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

// Donut Chart — matches DashboardWidgets.jsx DonutChart pattern
function DonutChart({ wins, losses, isDark }) {
  const total = wins + losses
  const size = 120
  const radius = (size - 14) / 2
  const circumference = 2 * Math.PI * radius
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 0

  const winLength = total > 0 ? (wins / total) * circumference : 0
  const lossLength = total > 0 ? (losses / total) * circumference : 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={isDark ? '#1e293b' : '#f1f5f9'}
          strokeWidth="12"
        />
        {/* Win segment */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#10B981" strokeWidth="12"
          strokeDasharray={`${winLength} ${circumference - winLength}`}
          strokeDashoffset="0"
          className="transition-all duration-500"
        />
        {/* Loss segment */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#EF4444" strokeWidth="12"
          strokeDasharray={`${lossLength} ${circumference - lossLength}`}
          strokeDashoffset={-winLength}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{winPct}%</span>
        <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Win</span>
      </div>
    </div>
  )
}

// Stacked Bar Chart for set analysis
function StackedBarChart({ games, isDark }) {
  const maxSets = Math.max(...games.map(g => (g.our_sets_won || 0) + (g.opponent_sets_won || 0)), 1)
  const barWidth = Math.min(30, Math.floor(240 / Math.max(games.length, 1)) - 6)
  const height = 100

  return (
    <svg
      width="100%"
      height={height + 20}
      viewBox={`0 0 ${games.length * (barWidth + 6)} ${height + 20}`}
      className="overflow-visible w-full"
    >
      {games.map((g, i) => {
        const won = g.our_sets_won || 0
        const lost = g.opponent_sets_won || 0
        const total = won + lost
        const wonH = total > 0 ? (won / maxSets) * height : 0
        const lostH = total > 0 ? (lost / maxSets) * height : 0
        const x = i * (barWidth + 6)

        return (
          <g key={i}>
            {/* Won segment (bottom) */}
            <rect
              x={x} y={height - wonH} width={barWidth} height={wonH}
              rx="3" fill="#10B981"
            />
            {/* Lost segment (top of won) */}
            <rect
              x={x} y={height - wonH - lostH} width={barWidth} height={lostH}
              rx="3" fill={isDark ? '#475569' : '#CBD5E1'}
            />
            {/* Label */}
            <text
              x={x + barWidth / 2} y={height + 14}
              textAnchor="middle" fill={isDark ? '#64748B' : '#94A3B8'} fontSize="8"
            >
              {g.opponent_name ? g.opponent_name.substring(0, 3).toUpperCase() : `G${i + 1}`}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
