import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useSeason } from '../../../contexts/SeasonContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'
import { getPathForPage } from '../../../lib/routes'
import {
  ClipboardList, DollarSign, Calendar, Users, AlertTriangle,
  Activity, ChevronRight, Clock, TrendingUp, MapPin, CheckCircle
} from 'lucide-react'
import { VolleyballIcon } from '../../../constants/icons'

// ============================================
// SHARED WIDGET CARD
// ============================================
function WCard({ children, className = '' }) {
  const { isDark } = useTheme()
  return (
    <div className={`h-full rounded-2xl overflow-hidden ${isDark
      ? 'bg-slate-800/90 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
      : 'bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
    } ${className}`}>
      {children}
    </div>
  )
}

function WHeader({ title, icon: Icon, color = '#3B82F6', action, onAction }) {
  const { isDark } = useTheme()
  return (
    <div className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
      <div className="h-1" style={{ background: color }} />
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color }} />}
          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
        </div>
        {action && (
          <button onClick={onAction} className="text-xs px-2.5 py-1 rounded-lg font-medium text-white hover:brightness-110 transition" style={{ background: color }}>
            {action} <ChevronRight className="w-3 h-3 inline" />
          </button>
        )}
      </div>
    </div>
  )
}

function WLoading() {
  const { isDark } = useTheme()
  return (
    <div className={`p-4 space-y-3 animate-pulse`}>
      <div className={`h-4 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-8 w-16 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-3 w-32 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
  )
}

// ============================================
// 1. REGISTRATION STATS WIDGET
// ============================================
export function RegistrationStatsWidget() {
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const { data: players } = await supabase
        .from('players')
        .select('id, status')
        .eq('season_id', selectedSeason.id)

      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('season_id', selectedSeason.id)

      const teamIds = teams?.map(t => t.id) || []
      let rostered = 0
      if (teamIds.length > 0) {
        const { data: tp } = await supabase
          .from('team_players')
          .select('player_id')
          .in('team_id', teamIds)
        rostered = new Set(tp?.map(t => t.player_id) || []).size
      }

      const total = players?.length || 0
      const pending = players?.filter(p => ['pending', 'submitted', 'new'].includes(p.status)).length || 0
      const approved = players?.filter(p => p.status === 'approved').length || 0
      const denied = players?.filter(p => p.status === 'withdrawn').length || 0

      setData({ total, pending, approved, rostered, denied })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const chartSize = 100
  const radius = 38
  const circ = 2 * Math.PI * radius

  return (
    <WCard>
      <WHeader title="Registration Stats" icon={ClipboardList} color="#3B82F6" action="View All" onAction={() => navigate(getPathForPage('registrations'))} />
      {loading || !data ? <WLoading /> : (
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Mini donut */}
            <div className="relative shrink-0" style={{ width: chartSize, height: chartSize }}>
              <svg width={chartSize} height={chartSize} className="transform -rotate-90">
                {[
                  { value: data.pending, color: '#F59E0B' },
                  { value: data.approved, color: '#3B82F6' },
                  { value: data.rostered, color: '#10B981' },
                  { value: data.denied, color: '#EF4444' },
                ].reduce((acc, seg) => {
                  const len = data.total > 0 ? (seg.value / data.total) * circ : 0
                  acc.elements.push(
                    <circle key={seg.color} cx={chartSize/2} cy={chartSize/2} r={radius} fill="none"
                      stroke={seg.color} strokeWidth="12"
                      strokeDasharray={`${len} ${circ - len}`}
                      strokeDashoffset={-acc.offset} />
                  )
                  acc.offset += len
                  return acc
                }, { elements: [], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.total}</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total</span>
              </div>
            </div>
            {/* Breakdown */}
            <div className="flex-1 space-y-1.5 text-sm">
              {[
                { label: 'Pending', value: data.pending, color: '#F59E0B' },
                { label: 'Approved', value: data.approved, color: '#3B82F6' },
                { label: 'Rostered', value: data.rostered, color: '#10B981' },
                { label: 'Denied', value: data.denied, color: '#EF4444' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{r.label}</span>
                  </div>
                  <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </WCard>
  )
}

// ============================================
// 2. PAYMENT SUMMARY WIDGET
// ============================================
export function PaymentSummaryWidget() {
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, paid, payment_method, created_at')
        .eq('season_id', selectedSeason.id)

      const paid = payments?.filter(p => p.paid) || []
      const unpaid = payments?.filter(p => !p.paid) || []
      const collected = paid.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
      const expected = payments?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0
      const overdue = unpaid.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)

      // Recent 5
      const recent = paid.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)

      setData({ collected, expected, overdue, recent })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const pct = data && data.expected > 0 ? Math.round((data.collected / data.expected) * 100) : 0

  return (
    <WCard>
      <WHeader title="Payment Summary" icon={DollarSign} color="#10B981" action="View All" onAction={() => navigate(getPathForPage('payments'))} />
      {loading || !data ? <WLoading /> : (
        <div className="p-4 space-y-3">
          <div>
            <span className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>${data.collected.toLocaleString()}</span>
            <span className={`text-sm ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>/ ${data.expected.toLocaleString()}</span>
          </div>
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{pct}% collected</span>
              <span className={`font-medium ${data.overdue > 0 ? 'text-red-400' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                {data.overdue > 0 ? `$${data.overdue.toLocaleString()} overdue` : 'All paid'}
              </span>
            </div>
            <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {/* Recent payments */}
          {data.recent.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Recent</p>
              {data.recent.map((p, i) => (
                <div key={i} className={`flex justify-between text-xs py-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  <span className="font-semibold">${parseFloat(p.amount).toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </WCard>
  )
}

// ============================================
// 3. UPCOMING EVENTS WIDGET
// ============================================
export function UpcomingEventsWidget() {
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const { data: teams } = await supabase.from('teams').select('id').eq('season_id', selectedSeason.id)
      const teamIds = teams?.map(t => t.id) || []
      const today = new Date().toISOString().split('T')[0]

      let q = supabase.from('schedule_events').select('*, teams(name, color)')
        .gte('event_date', today).order('event_date').order('event_time').limit(5)

      if (teamIds.length > 0) {
        q = q.or(`team_id.in.(${teamIds.join(',')}),team_id.is.null`)
      } else {
        q = q.is('team_id', null)
      }

      const { data } = await q
      setEvents(data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const fmtTime = (t) => {
    if (!t) return ''
    const [h, m] = t.split(':')
    const hr = parseInt(h)
    return `${hr % 12 || 12}:${m}${hr >= 12 ? 'PM' : 'AM'}`
  }

  const typeColors = { practice: '#10B981', game: '#F59E0B', tournament: '#8B5CF6', team_event: '#3B82F6' }

  return (
    <WCard>
      <WHeader title="Upcoming Events" icon={Calendar} color="#F59E0B" action="View All" onAction={() => navigate(getPathForPage('schedule'))} />
      {loading ? <WLoading /> : (
        <div className="p-3 space-y-1.5">
          {events.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No upcoming events</p>
            </div>
          ) : events.map(e => (
            <div key={e.id} className={`flex items-center gap-3 p-2.5 rounded-xl transition cursor-pointer ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'}`}
              onClick={() => navigate(getPathForPage('schedule'))}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: e.teams?.color || typeColors[e.event_type] || '#6B7280' }}>
                <VolleyballIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {e.title || e.event_type}
                </p>
                <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {new Date(e.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {e.event_time && ` · ${fmtTime(e.event_time)}`}
                  {e.teams?.name && ` · ${e.teams.name}`}
                </p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize"
                style={{ backgroundColor: (typeColors[e.event_type] || '#6B7280') + '20', color: typeColors[e.event_type] || '#6B7280' }}>
                {e.event_type}
              </span>
            </div>
          ))}
        </div>
      )}
    </WCard>
  )
}

// ============================================
// 4. ATTENDANCE TRENDS WIDGET
// ============================================
export function AttendanceTrendsWidget() {
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const { data: teams } = await supabase.from('teams').select('id').eq('season_id', selectedSeason.id)
      const teamIds = teams?.map(t => t.id) || []
      if (teamIds.length === 0) { setData([]); setLoading(false); return }

      // Get last 10 completed events
      const { data: events } = await supabase.from('schedule_events')
        .select('id, event_date, title, event_type')
        .in('team_id', teamIds)
        .lte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: false })
        .limit(10)

      if (!events?.length) { setData([]); setLoading(false); return }

      const eventIds = events.map(e => e.id)
      const { data: rsvps } = await supabase.from('event_rsvps').select('event_id, status').in('event_id', eventIds)

      // Get roster size
      const { data: tp } = await supabase.from('team_players').select('player_id').in('team_id', teamIds)
      const rosterSize = new Set(tp?.map(t => t.player_id) || []).size || 1

      const points = events.reverse().map(e => {
        const eventRsvps = rsvps?.filter(r => r.event_id === e.id) || []
        const going = eventRsvps.filter(r => ['going', 'yes'].includes(r.status?.toLowerCase())).length
        return { label: new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: Math.round((going / rosterSize) * 100) }
      })

      setData(points)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const w = 260, h = 80
  const maxVal = Math.max(...data.map(d => d.value), 1) * 1.2

  return (
    <WCard>
      <WHeader title="Attendance Trends" icon={TrendingUp} color="#8B5CF6" action="View" onAction={() => navigate(getPathForPage('attendance'))} />
      {loading ? <WLoading /> : (
        <div className="p-4">
          {data.length === 0 ? (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No attendance data yet</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>RSVP % over last {data.length} events</span>
                <span className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{data[data.length - 1]?.value || 0}%</span>
              </div>
              <svg width={w} height={h} className="overflow-visible w-full">
                {[0, 1, 2].map(i => (
                  <line key={i} x1="0" y1={h - (i / 2) * h} x2={w} y2={h - (i / 2) * h}
                    stroke={isDark ? '#334155' : '#E2E8F0'} strokeWidth="1" />
                ))}
                <polyline
                  points={data.map((d, i) => `${data.length === 1 ? w / 2 : (i / (data.length - 1)) * w},${h - (d.value / maxVal) * h}`).join(' ')}
                  fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                />
                {data.map((d, i) => {
                  const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w
                  const y = h - (d.value / maxVal) * h
                  return <circle key={i} cx={x} cy={y} r="3" fill="#8B5CF6" />
                })}
              </svg>
            </>
          )}
        </div>
      )}
    </WCard>
  )
}

// ============================================
// 5. TEAM HEALTH WIDGET
// ============================================
export function TeamHealthWidget() {
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const { data: teamsData } = await supabase.from('teams')
        .select('id, name, color, max_players')
        .eq('season_id', selectedSeason.id)

      if (!teamsData?.length) { setTeams([]); setLoading(false); return }

      const teamIds = teamsData.map(t => t.id)
      const { data: tp } = await supabase.from('team_players').select('team_id, player_id').in('team_id', teamIds)
      const { data: standings } = await supabase.from('team_standings').select('team_id, wins, losses').in('team_id', teamIds)

      const today = new Date().toISOString().split('T')[0]
      const { data: nextEvents } = await supabase.from('schedule_events')
        .select('team_id, event_date, event_type')
        .in('team_id', teamIds)
        .gte('event_date', today)
        .order('event_date')
        .limit(50)

      const result = teamsData.map(t => {
        const roster = tp?.filter(p => p.team_id === t.id).length || 0
        const record = standings?.find(s => s.team_id === t.id)
        const nextEvent = nextEvents?.find(e => e.team_id === t.id)
        return { ...t, roster, wins: record?.wins || 0, losses: record?.losses || 0, nextEvent }
      })

      setTeams(result)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <WCard>
      <WHeader title="Team Health" icon={Users} color="#06B6D4" action="Teams" onAction={() => navigate(getPathForPage('teams'))} />
      {loading ? <WLoading /> : (
        <div className="p-3 space-y-2">
          {teams.length === 0 ? (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No teams this season</p>
          ) : teams.map(t => (
            <div key={t.id} className={`p-3 rounded-xl border ${isDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color || '#6B7280' }} />
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  <Users className="w-3 h-3 inline mr-1" />{t.roster}{t.max_players ? `/${t.max_players}` : ''}
                </span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t.wins}W-{t.losses}L</span>
                {t.nextEvent && (
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    Next: {new Date(t.nextEvent.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </WCard>
  )
}

// ============================================
// 6. NEEDS ATTENTION WIDGET
// ============================================
export function NeedsAttentionWidget() {
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const result = []

      // Pending registrations
      const { count: pendingRegs } = await supabase.from('players')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', selectedSeason.id)
        .in('status', ['pending', 'submitted', 'new'])
      if (pendingRegs > 0) result.push({ label: 'Pending registrations', count: pendingRegs, color: '#F59E0B', icon: ClipboardList, page: 'registrations' })

      // Overdue payments
      const { data: unpaid } = await supabase.from('payments')
        .select('amount')
        .eq('season_id', selectedSeason.id)
        .eq('paid', false)
      const overdueTotal = unpaid?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0
      if (overdueTotal > 0) result.push({ label: 'Overdue payments', count: `$${overdueTotal.toLocaleString()}`, color: '#EF4444', icon: DollarSign, page: 'payments' })

      // Unsigned waivers
      const { data: waivers } = await supabase.from('waivers')
        .select('id')
        .eq('organization_id', selectedSeason.organization_id)
        .eq('is_required', true)
        .eq('is_active', true)
      if (waivers?.length) {
        const { count: playerCount } = await supabase.from('players')
          .select('id', { count: 'exact', head: true })
          .eq('season_id', selectedSeason.id)
          .in('status', ['approved', 'active', 'rostered'])
        const { count: signedCount } = await supabase.from('waiver_signatures')
          .select('id', { count: 'exact', head: true })
          .in('waiver_id', waivers.map(w => w.id))
        const unsigned = Math.max(0, (playerCount || 0) * waivers.length - (signedCount || 0))
        if (unsigned > 0) result.push({ label: 'Unsigned waivers', count: unsigned, color: '#8B5CF6', icon: AlertTriangle, page: 'waivers' })
      }

      setItems(result)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <WCard>
      <WHeader title="Needs Attention" icon={AlertTriangle} color="#EF4444" />
      {loading ? <WLoading /> : (
        <div className="p-3">
          {items.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-emerald-500' : 'text-emerald-400'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>All caught up!</p>
            </div>
          ) : items.map((item, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition mb-1.5 ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'}`}
              onClick={() => navigate(getPathForPage(item.page))}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <span className={`flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.label}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: item.color }}>{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </WCard>
  )
}

// ============================================
// 7. RECENT ACTIVITY WIDGET
// ============================================
export function RecentActivityWidget() {
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const result = []

      // Recent registrations
      const { data: regs } = await supabase.from('players')
        .select('first_name, last_name, status, created_at')
        .eq('season_id', selectedSeason.id)
        .order('created_at', { ascending: false })
        .limit(4)

      regs?.forEach(r => {
        result.push({
          text: `${r.first_name} ${r.last_name} — registration ${r.status}`,
          time: r.created_at,
          color: '#3B82F6',
          icon: '📋'
        })
      })

      // Recent payments
      const { data: pays } = await supabase.from('payments')
        .select('amount, created_at')
        .eq('season_id', selectedSeason.id)
        .eq('paid', true)
        .order('created_at', { ascending: false })
        .limit(3)

      pays?.forEach(p => {
        result.push({
          text: `Payment received — $${parseFloat(p.amount).toFixed(0)}`,
          time: p.created_at,
          color: '#10B981',
          icon: '💰'
        })
      })

      result.sort((a, b) => new Date(b.time) - new Date(a.time))
      setActivities(result.slice(0, 6))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const timeAgo = (d) => {
    const mins = Math.floor((Date.now() - new Date(d)) / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <WCard>
      <WHeader title="Recent Activity" icon={Activity} color="#6366F1" />
      {loading ? <WLoading /> : (
        <div className="p-3 space-y-1">
          {activities.length === 0 ? (
            <p className={`text-sm text-center py-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No recent activity</p>
          ) : activities.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 py-2 ${i < activities.length - 1 ? `border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}` : ''}`}>
              <span className="text-base mt-0.5">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{a.text}</p>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(a.time)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </WCard>
  )
}

// ============================================
// 8. SEASON OVERVIEW WIDGET
// ============================================
export function SeasonOverviewWidget() {
  const { selectedSeason } = useSeason()
  const { isDark, accent } = useTheme()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const { count: teamCount } = await supabase.from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', selectedSeason.id)

      const { count: playerCount } = await supabase.from('players')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', selectedSeason.id)

      const { data: payments } = await supabase.from('payments')
        .select('amount, paid')
        .eq('season_id', selectedSeason.id)

      const collected = payments?.filter(p => p.paid).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0
      const expected = payments?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0

      setData({ teams: teamCount || 0, players: playerCount || 0, collected, expected })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const pct = data && data.expected > 0 ? Math.round((data.collected / data.expected) * 100) : 0

  return (
    <WCard>
      <WHeader title="Season Overview" icon={Calendar} color={accent.primary} action="Manage" onAction={() => navigate(getPathForPage('seasons'))} />
      {loading || !data ? <WLoading /> : (
        <div className="p-4 space-y-3">
          <div>
            <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {selectedSeason?.name || 'Current Season'}
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedSeason?.start_date && new Date(selectedSeason.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {selectedSeason?.end_date && ` — ${new Date(selectedSeason.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
            <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
              selectedSeason?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
              selectedSeason?.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>{selectedSeason?.status || 'draft'}</span>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.teams}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Teams</p>
            </div>
            <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.players}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Players</p>
            </div>
          </div>
          {/* Collection progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Collections</span>
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>${data.collected.toLocaleString()} / ${data.expected.toLocaleString()}</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: accent.primary }} />
            </div>
          </div>
        </div>
      )}
    </WCard>
  )
}

// ============================================
// WIDGET REGISTRY
// ============================================
export const WIDGET_REGISTRY = {
  'registration-stats': {
    id: 'registration-stats',
    name: 'Registration Stats',
    description: 'Total registered, approved, pending, denied with donut chart',
    icon: ClipboardList,
    component: RegistrationStatsWidget,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    roles: ['admin'],
  },
  'payment-summary': {
    id: 'payment-summary',
    name: 'Payment Summary',
    description: 'Collected vs expected, progress bar, recent payments',
    icon: DollarSign,
    component: PaymentSummaryWidget,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    roles: ['admin'],
  },
  'upcoming-events': {
    id: 'upcoming-events',
    name: 'Upcoming Events',
    description: 'Next 5 events with date, type, team',
    icon: Calendar,
    component: UpcomingEventsWidget,
    defaultSize: { w: 4, h: 5, minW: 3, minH: 3 },
    roles: ['admin', 'coach', 'parent', 'player'],
  },
  'attendance-trends': {
    id: 'attendance-trends',
    name: 'Attendance Trends',
    description: 'Attendance % over last 10 events',
    icon: TrendingUp,
    component: AttendanceTrendsWidget,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    roles: ['admin', 'coach'],
  },
  'team-health': {
    id: 'team-health',
    name: 'Team Health',
    description: 'Per-team roster count, record, next event',
    icon: Users,
    component: TeamHealthWidget,
    defaultSize: { w: 4, h: 5, minW: 3, minH: 3 },
    roles: ['admin', 'coach', 'player'],
  },
  'needs-attention': {
    id: 'needs-attention',
    name: 'Needs Attention',
    description: 'Pending registrations, overdue payments, unsigned waivers',
    icon: AlertTriangle,
    component: NeedsAttentionWidget,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 2 },
    roles: ['admin', 'parent'],
  },
  'recent-activity': {
    id: 'recent-activity',
    name: 'Recent Activity',
    description: 'Latest registrations, payments, RSVP updates',
    icon: Activity,
    component: RecentActivityWidget,
    defaultSize: { w: 4, h: 5, minW: 3, minH: 3 },
    roles: ['admin'],
  },
  'season-overview': {
    id: 'season-overview',
    name: 'Season Overview',
    description: 'Season name, dates, status, collection progress',
    icon: Calendar,
    component: SeasonOverviewWidget,
    defaultSize: { w: 4, h: 4, minW: 3, minH: 3 },
    roles: ['admin'],
  },
}

// Default layouts per role
export const DEFAULT_LAYOUTS = {
  admin: {
    widgets: ['registration-stats', 'payment-summary', 'upcoming-events', 'needs-attention', 'recent-activity', 'season-overview'],
    layout: [
      { i: 'registration-stats', x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'payment-summary', x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'upcoming-events', x: 8, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
      { i: 'needs-attention', x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 2 },
      { i: 'recent-activity', x: 4, y: 4, w: 4, h: 5, minW: 3, minH: 3 },
      { i: 'season-overview', x: 8, y: 5, w: 4, h: 4, minW: 3, minH: 3 },
    ]
  },
  coach: {
    widgets: ['team-health', 'upcoming-events', 'attendance-trends'],
    layout: [
      { i: 'team-health', x: 0, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
      { i: 'upcoming-events', x: 4, y: 0, w: 4, h: 5, minW: 3, minH: 3 },
      { i: 'attendance-trends', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    ]
  },
  parent: {
    widgets: ['upcoming-events', 'needs-attention'],
    layout: [
      { i: 'upcoming-events', x: 0, y: 0, w: 6, h: 5, minW: 3, minH: 3 },
      { i: 'needs-attention', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
    ]
  },
  player: {
    widgets: ['upcoming-events', 'team-health'],
    layout: [
      { i: 'upcoming-events', x: 0, y: 0, w: 6, h: 5, minW: 3, minH: 3 },
      { i: 'team-health', x: 6, y: 0, w: 6, h: 5, minW: 3, minH: 3 },
    ]
  },
}
