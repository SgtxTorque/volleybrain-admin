import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { useSeason } from '../../../contexts/SeasonContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { supabase } from '../../../lib/supabase'
import { getPathForPage } from '../../../lib/routes'
import {
  ClipboardList, DollarSign, Calendar, Users, AlertTriangle,
  Activity, ChevronRight, Clock, TrendingUp, MapPin, CheckCircle,
  MoreHorizontal, CreditCard, AlertCircle
} from 'lucide-react'
import { VolleyballIcon } from '../../../constants/icons'

// ============================================
// SHARED — iOS-style glassmorphism card
// ============================================
function WCard({ children, className = '' }) {
  const { isDark } = useTheme()
  return (
    <div className={`
      h-full rounded-xl overflow-hidden transition-all duration-300
      ${isDark
        ? 'bg-slate-800/90 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
        : 'bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
      } ${className}
    `}>
      {children}
    </div>
  )
}

// Gradient color map matching original CardHeader
const GRADIENT_MAP = {
  blue:   'bg-gradient-to-r from-blue-500 to-blue-600',
  green:  'bg-gradient-to-r from-emerald-500 to-emerald-600',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
  orange: 'bg-gradient-to-r from-lynx-sky to-lynx-deep',
  red:    'bg-gradient-to-r from-red-500 to-red-600',
  teal:   'bg-gradient-to-r from-teal-500 to-teal-600',
  indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
  slate:  'bg-gradient-to-r from-slate-500 to-slate-600',
  cyan:   'bg-gradient-to-r from-cyan-500 to-cyan-600',
}

// Card header with colored gradient accent bar
function WHeader({ title, icon: Icon, color = 'blue', action, onAction, children }) {
  const { isDark } = useTheme()
  const gradient = GRADIENT_MAP[color] || GRADIENT_MAP.blue

  return (
    <div className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
      {/* Colored accent bar */}
      <div className={`h-1 ${gradient}`} />

      {/* Header content */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`} />}
          <h3 className={`font-semibold text-[15px] ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {children}
          {action && (
            <button
              onClick={onAction}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1 ${gradient} text-white hover:brightness-110`}
            >
              {action}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button className={`p-1 rounded-xl transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}>
            <MoreHorizontal className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

function WLoading() {
  const { isDark } = useTheme()
  return (
    <div className="p-5 space-y-3 animate-pulse">
      <div className={`h-4 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-8 w-16 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
      <div className={`h-3 w-32 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} />
    </div>
  )
}

// ============================================
// DONUT CHART — matches original RegistrationDonut
// ============================================
function DonutChart({ data, total, size = 138 }) {
  const { isDark } = useTheme()
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  let currentOffset = 0

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((segment, i) => {
          const segmentLength = total > 0 ? (segment.value / total) * circumference : 0
          const offset = currentOffset
          currentOffset += segmentLength
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="14"
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{total.toLocaleString()}</span>
        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Total</span>
      </div>
    </div>
  )
}

// ============================================
// MINI LINE CHART — matches original MiniLineChart
// ============================================
function MiniLineChart({ data, width = 260, height = 100, color = '#8B5CF6' }) {
  const { isDark } = useTheme()
  if (!data || data.length === 0) return null

  const maxValue = Math.max(...data.map(d => d.value || 0), 1) * 1.2
  const minValue = 0
  const range = maxValue - minValue || 1

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
    const y = height - ((d.value - minValue) / range) * height
    return `${x},${isNaN(y) ? height : y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible w-full">
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
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill={color} />
            {i === data.length - 1 && (
              <g>
                <rect x={x - 30} y={y - 30} width="60" height="22" rx="4" fill={color} />
                <text x={x} y={y - 15} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
                  {d.value || 0}%
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* X-axis labels */}
      {data.map((d, i) => {
        const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
        return (
          <text key={`l${i}`} x={x} y={height + 16} textAnchor="middle" fill={isDark ? '#64748B' : '#94A3B8'} fontSize="10">
            {d.label}
          </text>
        )
      })}
    </svg>
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
      const waitlisted = players?.filter(p => p.status === 'waitlisted').length || 0
      const unrostered = Math.max(0, total - rostered - pending - waitlisted - denied)

      setData({ total, pending, approved, rostered, denied, waitlisted, unrostered })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <WCard>
      <WHeader title="Registration Stats" icon={ClipboardList} color="blue" action="View All" onAction={() => navigate(getPathForPage('registrations'))} />
      {loading || !data ? <WLoading /> : (
        <div className="p-5">
          {/* Main Stats Row */}
          <div className="flex items-stretch gap-4 mb-5">
            <div className={`flex-1 p-4 rounded-xl text-center ${isDark ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.total}</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Total Registrations</p>
            </div>
            <div className={`flex-1 p-4 rounded-xl text-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <p className={`text-3xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {data.rostered}
                <span className={`text-lg ${isDark ? 'text-emerald-500' : 'text-emerald-400'}`}>/{data.total}</span>
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Rostered</p>
            </div>
          </div>

          {/* Chart and Breakdown */}
          <div className="flex items-start gap-6">
            <DonutChart
              data={[
                { value: data.pending, color: '#F59E0B' },
                { value: data.unrostered, color: '#3B82F6' },
                { value: data.rostered, color: '#10B981' },
                { value: data.waitlisted, color: '#8B5CF6' },
                { value: data.denied, color: '#EF4444' },
              ]}
              total={data.total}
            />

            <div className="flex-1 space-y-2.5">
              {[
                { label: 'Pending Review', value: data.pending, color: '#F59E0B' },
                { label: 'Approved (Unrostered)', value: data.unrostered, color: '#3B82F6' },
                { label: 'On Roster', value: data.rostered, color: '#10B981' },
                { label: 'Waitlisted', value: data.waitlisted, color: '#8B5CF6' },
                { label: 'Denied/Withdrawn', value: data.denied, color: '#EF4444' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{r.label}</span>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate(getPathForPage('registrations'))}
            className="mt-5 w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            View Registrations
            <ChevronRight className="w-4 h-4" />
          </button>
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
      const paidOnline = paid.filter(p => p.payment_method === 'stripe').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
      const paidManual = paid.filter(p => p.payment_method !== 'stripe').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)

      setData({ collected, expected, overdue, paidOnline, paidManual })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const chartData = data ? [
    { value: data.paidOnline || 0, color: '#3B82F6' },
    { value: data.paidManual || 0, color: '#F59E0B' },
    { value: data.overdue || 0, color: '#94A3B8' },
  ] : []
  const chartTotal = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <WCard>
      <WHeader title="Financial Summary" icon={DollarSign} color="green" action="View All" onAction={() => navigate(getPathForPage('payments'))}>
        <button className={`p-1 rounded-xl transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}>
          <Users className="w-4 h-4 text-slate-400" />
        </button>
      </WHeader>
      {loading || !data ? <WLoading /> : (
        <div className="p-5">
          {/* Main Total */}
          <div className="mb-6">
            <span className={`text-3xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              ${data.collected.toLocaleString()}
            </span>
            <span className={`text-lg ml-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Collected YTD</span>
          </div>

          {/* Chart and Breakdown */}
          <div className="flex items-center gap-6">
            <DonutChart data={chartData} total={chartTotal} size={160} />

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                  <Clock className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className={`font-bold ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>${data.overdue.toLocaleString()}</span>
                  <span className="text-slate-500 ml-2">Past Due</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                  <CreditCard className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>${data.paidOnline.toLocaleString()}</span>
                  <span className="text-slate-500 ml-2">via Stripe</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>${data.paidManual.toLocaleString()}</span>
                  <span className="text-slate-500 ml-2">Manual</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate(getPathForPage('payments'))}
            className="mt-5 w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:brightness-110 transition flex items-center justify-center gap-2"
          >
            View Payments
            <ChevronRight className="w-4 h-4" />
          </button>
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

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = event.event_date
    if (!groups[date]) groups[date] = []
    groups[date].push(event)
    return groups
  }, {})

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`
  }

  return (
    <WCard>
      <WHeader title="Upcoming Events" icon={Calendar} color="orange" action="View All" onAction={() => navigate(getPathForPage('schedule'))} />
      <div className="p-5 space-y-4">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-8">
            <Calendar className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
            <p className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>No upcoming events</p>
          </div>
        ) : (
          Object.entries(groupedEvents).slice(0, 3).map(([date, dateEvents]) => (
            <div key={date}>
              <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatDate(date)}</p>
              {dateEvents.map((event, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition mb-2 ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'}`}
                  onClick={() => navigate(getPathForPage('schedule'))}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: event.teams?.color || '#3B82F6' }}
                  >
                    <VolleyballIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{event.teams?.name || event.title}</p>
                    <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                      <span>{fmtTime(event.event_time)}</span>
                      {event.location && (
                        <>
                          <span>·</span>
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{fmtTime(event.event_time)}</span>
                </div>
              ))}
            </div>
          ))
        )}

        {/* View All Link */}
        <button
          onClick={() => navigate(getPathForPage('schedule'))}
          className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-lynx-sky to-lynx-deep text-white text-sm font-medium rounded-lg hover:brightness-110 transition flex items-center justify-center gap-1"
        >
          View All Events
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
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

      const { data: events } = await supabase.from('schedule_events')
        .select('id, event_date, title, event_type')
        .in('team_id', teamIds)
        .lte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: false })
        .limit(10)

      if (!events?.length) { setData([]); setLoading(false); return }

      const eventIds = events.map(e => e.id)
      const { data: rsvps } = await supabase.from('event_rsvps').select('event_id, status').in('event_id', eventIds)

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

  return (
    <WCard>
      <WHeader title="Attendance Trends" icon={TrendingUp} color="purple" action="View" onAction={() => navigate(getPathForPage('attendance'))}>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'text-slate-400 bg-white/[0.06]' : 'text-lynx-slate bg-slate-100'}`}>Last {data.length || 10}</span>
      </WHeader>
      {loading ? <WLoading /> : (
        <div className="p-5">
          {data.length === 0 ? (
            <div className="text-center py-6">
              <TrendingUp className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>No attendance data yet</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>RSVP % over last {data.length} events</span>
                <span className={`text-3xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{data[data.length - 1]?.value || 0}%</span>
              </div>
              <div className="h-32">
                <MiniLineChart data={data} width={260} height={100} color="#8B5CF6" />
              </div>
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
      <WHeader title="Team Health" icon={Users} color="cyan" action="Teams" onAction={() => navigate(getPathForPage('teams'))} />
      {loading ? <WLoading /> : (
        <div className="p-5 space-y-3">
          {teams.length === 0 ? (
            <div className="text-center py-6">
              <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>No teams this season</p>
            </div>
          ) : teams.map(t => (
            <div
              key={t.id}
              className={`p-3 rounded-xl cursor-pointer transition ${isDark ? 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]' : 'bg-slate-50 hover:bg-slate-100 border border-slate-100'}`}
              onClick={() => navigate(getPathForPage('teams'))}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: t.color || '#6B7280' }}>
                  <VolleyballIcon className="w-4 h-4 text-white" />
                </div>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{t.name}</span>
              </div>
              <div className="flex items-center gap-4 text-xs pl-11">
                <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>
                  <Users className="w-3 h-3 inline mr-1" />{t.roster}{t.max_players ? `/${t.max_players}` : ''}
                </span>
                <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>{t.wins}W-{t.losses}L</span>
                {t.nextEvent && (
                  <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(t.nextEvent.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

      const { count: pendingRegs } = await supabase.from('players')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', selectedSeason.id)
        .in('status', ['pending', 'submitted', 'new'])
      if (pendingRegs > 0) result.push({ label: 'Pending registrations', count: pendingRegs, color: '#F59E0B', icon: ClipboardList, page: 'registrations' })

      const { data: unpaid } = await supabase.from('payments')
        .select('amount')
        .eq('season_id', selectedSeason.id)
        .eq('paid', false)
      const overdueTotal = unpaid?.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) || 0
      if (overdueTotal > 0) result.push({ label: 'Overdue payments', count: `$${overdueTotal.toLocaleString()}`, color: '#EF4444', icon: DollarSign, page: 'payments' })

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
      <WHeader title="Needs Attention" icon={AlertCircle} color="red" />
      {loading ? <WLoading /> : (
        <div className="p-5">
          {items.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-emerald-500' : 'text-emerald-400'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>All caught up!</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>No action items at this time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'}`}
                  onClick={() => navigate(getPathForPage(item.page))}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: item.color }}>{item.count}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
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
// 7. RECENT ACTIVITY WIDGET
// ============================================
export function RecentActivityWidget() {
  const { selectedSeason } = useSeason()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) load()
  }, [selectedSeason?.id])

  async function load() {
    setLoading(true)
    try {
      const result = []

      const { data: regs } = await supabase.from('players')
        .select('first_name, last_name, status, created_at')
        .eq('season_id', selectedSeason.id)
        .order('created_at', { ascending: false })
        .limit(4)

      regs?.forEach(r => {
        result.push({
          name: `${r.first_name} ${r.last_name}`,
          initials: `${r.first_name?.[0] || ''}${r.last_name?.[0] || ''}`,
          action: r.status === 'pending' ? 'submitted registration' : `registration ${r.status}`,
          time: r.created_at,
          color: '#3B82F6',
        })
      })

      const { data: pays } = await supabase.from('payments')
        .select('amount, created_at')
        .eq('season_id', selectedSeason.id)
        .eq('paid', true)
        .order('created_at', { ascending: false })
        .limit(3)

      pays?.forEach(p => {
        result.push({
          name: 'Payment received',
          initials: '$',
          action: 'paid',
          highlight: `$${parseFloat(p.amount).toFixed(0)}`,
          time: p.created_at,
          color: '#10B981',
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
      <WHeader title="Recent Activity" icon={Clock} color="purple" action="View All" onAction={() => navigate(getPathForPage('registrations'))} />
      {loading ? <WLoading /> : (
        <div className="p-5">
          {activities.length === 0 ? (
            <div className="text-center py-6">
              <Activity className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
              <p className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isDark ? 'bg-white/[0.08] text-slate-300' : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600'}`}>
                    {a.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{a.name}</span>
                      {' '}{a.action}
                      {a.highlight && (
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}> {a.highlight}</span>
                      )}
                    </p>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>{timeAgo(a.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View All */}
          <button
            onClick={() => navigate(getPathForPage('registrations'))}
            className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-lynx-sky to-lynx-deep text-white text-sm font-medium rounded-lg hover:brightness-110 transition flex items-center justify-center gap-1"
          >
            Manage All Tasks
            <ChevronRight className="w-4 h-4" />
          </button>
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

      // Monthly payment data for chart
      const now = new Date()
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyData = []
      const paidPayments = payments?.filter(p => p.paid) || []

      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthPayments = paidPayments.filter(p => {
          // payments may lack created_at, treat as 0
          if (!p.created_at) return false
          const payDate = new Date(p.created_at)
          return payDate >= monthDate && payDate <= monthEnd
        })
        monthlyData.push({
          label: monthNames[monthDate.getMonth()],
          value: monthPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        })
      }

      setData({ teams: teamCount || 0, players: playerCount || 0, collected, expected, monthlyData })
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const pct = data && data.expected > 0 ? Math.round((data.collected / data.expected) * 100) : 0

  return (
    <WCard>
      {/* Season header with gradient mountain background — matching original SeasonCard */}
      <div
        className="relative px-5 py-4"
        style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2C3E50 50%, #34495E 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 100'%3E%3Cpath fill='%23ffffff' d='M0,100 L100,30 L150,60 L200,20 L280,70 L350,25 L400,80 L400,100 Z'/%3E%3C/svg%3E")`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              {selectedSeason?.name || 'Current Season'}
            </h2>
            <p className="text-white/70 text-sm mt-0.5">
              {selectedSeason?.start_date && new Date(selectedSeason.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {selectedSeason?.end_date && ` — ${new Date(selectedSeason.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
            <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
              selectedSeason?.status === 'active' ? 'bg-emerald-400/30 text-emerald-300' :
              selectedSeason?.status === 'open' ? 'bg-blue-400/30 text-blue-300' :
              'bg-white/20 text-white/80'
            }`}>{selectedSeason?.status || 'draft'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <VolleyballIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {loading || !data ? <WLoading /> : (
        <div className="p-5 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.teams}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Teams</p>
            </div>
            <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/[0.05]' : 'bg-slate-50'}`}>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{data.players}</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Players</p>
            </div>
            <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <p className={`text-3xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{pct}%</p>
              <p className={`text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Collected</p>
            </div>
          </div>

          {/* Collection progress */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>Collections</span>
              <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>${data.collected.toLocaleString()} / ${data.expected.toLocaleString()}</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: accent.primary }} />
            </div>
          </div>

          {/* Mini chart */}
          {data.monthlyData?.some(d => d.value > 0) && (
            <div>
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Monthly Collections</p>
              <div className="h-28">
                <MiniLineChart data={data.monthlyData} width={260} height={80} color="#10B981" />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={() => navigate(getPathForPage('seasons'))}
            className="w-full px-4 py-2.5 text-white font-semibold rounded-xl transition hover:brightness-110 flex items-center justify-center gap-2"
            style={{ backgroundColor: accent.primary }}
          >
            Manage Season
            <ChevronRight className="w-4 h-4" />
          </button>
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
