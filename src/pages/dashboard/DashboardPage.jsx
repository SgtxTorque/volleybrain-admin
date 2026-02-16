import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useJourney } from '../../contexts/JourneyContext'
import { JourneyTimeline, JourneyWidget } from '../../components/journey'
import { supabase } from '../../lib/supabase'
import { 
  Users, ClipboardList, DollarSign, Settings, Bell, Calendar,
  ChevronRight, MoreHorizontal, TrendingUp, CreditCard, Play,
  CheckCircle, Clock, AlertCircle, Star, MapPin
} from 'lucide-react'
import { VolleyballIcon } from '../../constants/icons'

// ============================================
// SHARED CARD COMPONENT - iOS Style
// ============================================
function DashCard({ children, className = '', onClick, headerColor, isDark }) {
  return (
    <div 
      onClick={onClick}
      className={`
        rounded-2xl overflow-hidden transition-all duration-300
        ${isDark 
          ? 'bg-slate-800/60 backdrop-blur-xl border border-white/[0.06] shadow-glass-dark' 
          : 'bg-white/80 backdrop-blur-xl border border-white/40 shadow-glass'
        }
        ${onClick ? 'cursor-pointer hover:shadow-soft-lg hover:-translate-y-0.5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Card Header with colored accent bar
function CardHeader({ title, action, onAction, children, color = 'blue', icon: Icon, isDark }) {
  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
    teal: 'bg-gradient-to-r from-teal-500 to-teal-600',
    indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
    slate: 'bg-gradient-to-r from-slate-500 to-slate-600',
  }
  
  return (
    <div className={`border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
      {/* Colored accent bar */}
      <div className={`h-1 ${colorClasses[color] || colorClasses.blue}`} />
      
      {/* Header content */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />}
          <h3 className={`font-semibold text-[15px] ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {children}
          {action && (
            <button 
              onClick={onAction}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1
                ${colorClasses[color] || colorClasses.blue} text-white hover:brightness-110`}
            >
              {action}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button className={`p-1 rounded-xl transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}>
            <MoreHorizontal className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DONUT CHART COMPONENT
// ============================================
function DonutChart({ data, total, centerLabel, size = 140 }) {
  const { isDark } = useTheme()
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  let currentOffset = 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((segment, i) => {
          const segmentLength = (segment.value / total) * circumference
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
              strokeWidth="20"
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>${centerLabel}</span>
      </div>
    </div>
  )
}

// ============================================
// REGISTRATION DONUT CHART
// ============================================
function RegistrationDonut({ data, total, size = 120 }) {
  const { isDark } = useTheme()
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  let currentOffset = 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((segment, i) => {
          const segmentLength = (segment.value / total) * circumference
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
        <span className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{total.toLocaleString()}</span>
        <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total</span>
      </div>
    </div>
  )
}

// ============================================
// MINI LINE CHART
// ============================================
function MiniLineChart({ data, width = 300, height = 120 }) {
  const { isDark } = useTheme()
  if (!data || data.length === 0) return null
  
  const maxValue = Math.max(...data.map(d => d.value || 0), 1) * 1.2 // Ensure min of 1 to avoid division by zero
  const minValue = 0
  const range = maxValue - minValue || 1 // Ensure range is at least 1
  
  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width
    const y = height - ((d.value - minValue) / range) * height
    return `${x},${isNaN(y) ? height : y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Grid lines */}
      {[0, 1, 2, 3].map(i => (
        <line 
          key={i}
          x1="0" 
          y1={height - (i / 3) * height} 
          x2={width} 
          y2={height - (i / 3) * height}
          stroke={isDark ? "#334155" : "#E2E8F0"}
          strokeWidth="1"
        />
      ))}
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="#10B981"
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
            <circle cx={x} cy={y} r="4" fill="#10B981" />
            {i === data.length - 1 && (
              <g>
                <rect 
                  x={x - 30} 
                  y={y - 30} 
                  width="60" 
                  height="22" 
                  rx="4" 
                  fill="#10B981"
                />
                <text 
                  x={x} 
                  y={y - 15} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="11" 
                  fontWeight="600"
                >
                  ${(d.value || 0).toLocaleString()}
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
          <text 
            key={i}
            x={x} 
            y={height + 16} 
            textAnchor="middle" 
            fill={isDark ? "#64748B" : "#94A3B8"} 
            fontSize="10"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

// ============================================
// SEASON CARD WIDGET
// ============================================
function SeasonCard({ season, stats, onNavigate }) {
  const { isDark, accent } = useTheme()
  
  // Get next game
  const nextGame = stats.nextGame
  
  return (
    <DashCard isDark={isDark} className="overflow-hidden">
      {/* Header with gradient mountain background */}
      <div 
        className="relative px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2C3E50 50%, #34495E 100%)',
        }}
      >
        {/* Mountain silhouette overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 100'%3E%3Cpath fill='%23ffffff' d='M0,100 L100,30 L150,60 L200,20 L280,70 L350,25 L400,80 L400,100 Z'/%3E%3C/svg%3E")`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom',
          }}
        />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">
              {season?.name || 'Spring 2026'}
            </h2>
            <span className="text-white/80 font-medium">
              {season?.sports?.name || 'Volleyball'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <VolleyballIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-white">{stats.teams}</span>
              <p className="text-white/70 text-sm">Active Teams</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className={`px-5 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <div className="flex items-center gap-2 text-slate-600">
          <Users className="w-4 h-4 text-slate-400" />
          <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{stats.rosteredPlayers}</span>
          <span className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>/ {stats.totalCapacity} rostered players</span>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          {nextGame ? (
            <>
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>Next Game:</span>
              <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{nextGame}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className={`${isDark ? "text-amber-400" : "text-amber-600"}`}>No upcoming games scheduled</span>
            </>
          )}
        </div>
        
        <button 
          onClick={() => onNavigate('seasons')}
          className={`mt-3 px-4 py-2 font-medium text-sm rounded-xl transition ${isDark ? "bg-white/[0.06] hover:bg-white/[0.1] text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
        >
          Manage Season
        </button>
      </div>
      
      {/* Action Button */}
      <button 
        onClick={() => onNavigate('seasons')}
        className="w-full px-5 py-3 text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition"
        style={{ backgroundColor: accent.primary }}
      >
        Manage Season
        <ChevronRight className="w-4 h-4" />
      </button>
    </DashCard>
  )
}

// ============================================
// FINANCIAL SUMMARY WIDGET
// ============================================
function FinancialSummary({ stats, onNavigate }) {
  const { isDark } = useTheme()
  const chartData = [
    { value: stats.paidOnline || 0, color: '#3B82F6' },
    { value: stats.paidManual || 0, color: '#F59E0B' },
    { value: stats.pastDue || 0, color: '#94A3B8' },
  ]
  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <DashCard isDark={isDark}>
      <CardHeader isDark={isDark} title="Financial Summary" color="green" icon={DollarSign}>
        <button className={`p-1 rounded-xl transition ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-slate-100"}`}>
          <Users className="w-4 h-4 text-slate-400" />
        </button>
      </CardHeader>
      
      <div className="p-5">
        {/* Main Total */}
        <div className="mb-6">
          <span className={`text-3xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
            ${stats.totalCollected?.toLocaleString() || '0'}
          </span>
          <span className={`text-lg ml-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Collected YTD</span>
        </div>
        
        {/* Chart and Breakdown */}
        <div className="flex items-center gap-6">
          <DonutChart 
            data={chartData}
            total={total}
            centerLabel={(stats.paidManual || 0).toLocaleString()}
          />
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}>
                <Clock className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <span className={`font-bold ${isDark ? "text-orange-400" : "text-orange-500"}`}>${stats.pastDue?.toLocaleString() || '0'}</span>
                <span className="text-slate-500 ml-2">Past Due</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-white/[0.06]" : "bg-slate-100"}`}>
                <CreditCard className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <span className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>${stats.paidOnline?.toLocaleString() || '0'}</span>
                <span className="text-slate-500 ml-2">via Stripe</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-amber-500/20" : "bg-amber-100"}`}>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className={`font-bold ${isDark ? "text-white" : "text-slate-800"}`}>${stats.paidManual?.toLocaleString() || '0'}</span>
                <span className="text-slate-500 ml-2">Manual Payments</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <button 
          onClick={() => onNavigate('payments')}
          className="mt-5 w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-xl hover:brightness-110 transition flex items-center justify-center gap-2"
        >
          View Payments
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </DashCard>
  )
}

// ============================================
// FINANCIAL OVERVIEW (LINE CHART)
// ============================================
function FinancialOverview({ monthlyData, totalCollected }) {
  const { isDark } = useTheme()
  return (
    <DashCard isDark={isDark}>
      <CardHeader isDark={isDark} title="Financial Overview" color="teal" icon={TrendingUp}>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? "text-slate-400 bg-white/[0.06]" : "text-slate-500 bg-slate-100"}`}>All Seasons</span>
      </CardHeader>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Registration Payments</span>
          <span className={`text-2xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>${totalCollected?.toLocaleString() || '0'}</span>
        </div>
        
        <div className="h-32">
          <MiniLineChart data={monthlyData} width={280} height={100} />
        </div>
        
        {/* Legend */}
        <div className={`flex items-center gap-4 mt-6 pt-4 border-t ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Manual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Refunds</span>
          </div>
        </div>
      </div>
    </DashCard>
  )
}

// ============================================
// REGISTRATION STATS WIDGET
// ============================================
function RegistrationStats({ stats, onNavigate }) {
  const { isDark } = useTheme()
  // Calculate unrostered first for chart
  const rostered = stats.rostered || 0
  const unrostered = stats.unrostered || Math.max(0, (stats.totalRegistrations || 0) - rostered - (stats.pending || 0) - (stats.waitlisted || 0) - (stats.denied || 0))
  
  const chartData = [
    { value: stats.pending || 0, color: '#F59E0B', label: 'Pending' },
    { value: unrostered, color: '#3B82F6', label: 'Unrostered' },
    { value: rostered, color: '#10B981', label: 'Rostered' },
    { value: stats.waitlisted || 0, color: '#8B5CF6', label: 'Waitlisted' },
    { value: stats.denied || 0, color: '#EF4444', label: 'Denied' },
  ]
  const total = chartData.reduce((sum, d) => sum + d.value, 0)
  
  return (
    <DashCard isDark={isDark}>
      <CardHeader isDark={isDark} title="Registration Stats" color="blue" icon={ClipboardList} />
      
      <div className="p-5">
        {/* Main Stats Row */}
        <div className="flex items-stretch gap-4 mb-5">
          {/* Total Registrations */}
          <div className={`flex-1 p-4 rounded-xl text-center ${isDark ? "bg-white/[0.05]" : "bg-slate-50"}`}>
            <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{stats.totalRegistrations || 0}</p>
            <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total Registrations</p>
          </div>
          
          {/* Rostered */}
          <div className={`flex-1 p-4 rounded-xl text-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
            <p className={`text-3xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
              {rostered}
              <span className={`text-lg ${isDark ? "text-emerald-500" : "text-emerald-400"}`}>/{stats.totalRegistrations || 0}</span>
            </p>
            <p className={`text-sm mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Rostered</p>
          </div>
        </div>
        
        {/* Capacity Bar */}
        {stats.capacity > 0 && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Capacity</span>
              <span>{stats.totalRegistrations || 0} / {stats.capacity}</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((stats.totalRegistrations || 0) / stats.capacity) * 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Chart and Breakdown */}
        <div className="flex items-start gap-6">
          <RegistrationDonut data={chartData} total={total} />
          
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Pending Review</span>
              </div>
              <span className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{stats.pending || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Approved (Unrostered)</span>
              </div>
              <span className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{unrostered}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>On Roster</span>
              </div>
              <span className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{rostered}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Waitlisted</span>
              </div>
              <span className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{stats.waitlisted || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>Denied/Withdrawn</span>
              </div>
              <span className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{stats.denied || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <button 
          onClick={() => onNavigate('registrations')}
          className="mt-5 w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-xl hover:brightness-110 transition flex items-center justify-center gap-2"
        >
          View Registrations
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </DashCard>
  )
}

// ============================================
// RECENT ACTIVITY / TASKS WIDGET
// ============================================
function RecentActivity({ tasks, onNavigate }) {
  const { isDark } = useTheme()
  return (
    <DashCard isDark={isDark}>
      <CardHeader isDark={isDark} title="Recent Activity" color="purple" icon={Clock} action="View All" onAction={() => onNavigate('registrations')} />
      
      <div className="p-5">
        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <span className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>Recent Tasks</span>
          <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
        </div>
        
        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <div 
              key={i}
              onClick={task.action}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-slate-50"}`}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: task.color + '20' }}
              >
                {task.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{task.title}</p>
              </div>
              {task.badge && (
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: task.color }}
                >
                  {task.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          ))}
        </div>
        
        {/* Manage Link */}
        <button 
          onClick={() => onNavigate('registrations')}
          className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:brightness-110 transition flex items-center justify-center gap-1"
        >
          Manage All Tasks
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </DashCard>
  )
}

// ============================================
// UPCOMING EVENTS WIDGET
// ============================================
function UpcomingEvents({ events, onNavigate }) {
  const { isDark } = useTheme()
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

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes}${ampm}`
  }

  return (
    <DashCard isDark={isDark}>
      <CardHeader isDark={isDark} title="Upcoming Events" color="orange" icon={Calendar} action="View All" onAction={() => onNavigate('schedule')} />
      
      <div className="p-5 space-y-4">
        {Object.entries(groupedEvents).slice(0, 2).map(([date, dateEvents]) => (
          <div key={date}>
            <p className={`text-sm font-semibold mb-3 ${isDark ? "text-white" : "text-slate-800"}`}>{formatDate(date)}</p>
            
            {dateEvents.map((event, i) => (
              <div 
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition mb-2 ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-slate-50"}`}
                onClick={() => onNavigate('schedule')}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: event.teams?.color || '#3B82F6' }}
                >
                  <VolleyballIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{event.teams?.name || event.title}</p>
                  <p className={`text-sm flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    <span>{formatTime(event.event_time)}</span>
                    {event.location && (
                      <>
                        <span>·</span>
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </>
                    )}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{formatTime(event.event_time)}</span>
              </div>
            ))}
          </div>
        ))}
        
        {Object.keys(groupedEvents).length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>No upcoming events</p>
          </div>
        )}
        
        {/* View All Link */}
        <button 
          onClick={() => onNavigate('schedule')}
          className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-lg hover:brightness-110 transition flex items-center justify-center gap-1"
        >
          View All Events
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </DashCard>
  )
}

// ============================================
// QUICK ACTIONS / ACTIVITY FEED
// ============================================
function QuickActionsWidget({ activities }) {
  const { isDark } = useTheme()
  return (
    <DashCard isDark={isDark}>
      <CardHeader isDark={isDark} title="Quick Actions" color="slate" icon={Star} />
      
      <div className="p-5 space-y-3">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
              {activity.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{activity.name}</span>
                {' '}{activity.action}
                {activity.highlight && (
                  <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}> {activity.highlight}</span>
                )}
                {activity.target && (
                  <span className={`${isDark ? "text-slate-300" : "text-slate-600"}`}> {activity.target}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </DashCard>
  )
}

// ============================================
// OVERDUE PAYMENTS WIDGET
// ============================================
function OverduePayments({ stats, onNavigate }) {
  const { isDark } = useTheme()
  const total = (stats.overdueFees || 0) + (stats.overdueStripe || 0)
  
  return (
    <DashCard isDark={isDark}>
      <CardHeader isDark={isDark} title="Payment Recovery" color="red" icon={AlertCircle} />
      
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>${stats.overdueFees?.toLocaleString() || '0'}</span>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Overdue Fees</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>${stats.overdueStripe?.toLocaleString() || '0'}</span>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Overdue Stripe</span>
            </div>
          </div>
          
          {/* Mini Donut */}
          <div className="relative w-24 h-24">
            <svg width="96" height="96" className="transform -rotate-90">
              <circle
                cx="48" cy="48" r="36"
                fill="none" stroke="#FEE2E2" strokeWidth="12"
              />
              <circle
                cx="48" cy="48" r="36"
                fill="none" stroke="#EF4444" strokeWidth="12"
                strokeDasharray={`${((stats.overdueFees || 0) / (total || 1)) * 226} 226`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-red-600">${total.toLocaleString()}</span>
              <span className={`text-[10px] uppercase ${isDark ? "text-slate-400" : "text-slate-500"}`}>Overdue</span>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <button 
          onClick={() => onNavigate('payments')}
          className="mt-5 w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Recover Payments
        </button>
      </div>
    </DashCard>
  )
}

// ============================================
// GETTING STARTED GUIDE (No Season)
// ============================================
export function GettingStartedGuide({ onNavigate }) {
  const { organization } = useAuth()
  const { isDark, accent } = useTheme()
  
  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div 
        className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{ backgroundColor: accent.primary + '20' }}
      >
        <span className="text-4xl">🎉</span>
      </div>
      <h1 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-800"}`}>
        Welcome to {organization?.name || 'VolleyBrain'}!
      </h1>
      <p className={`mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Let's get your organization set up. Start by creating your first season.
      </p>
      <button 
        onClick={() => onNavigate('seasons')}
        className="px-6 py-3 text-white font-semibold rounded-xl transition hover:brightness-110"
        style={{ backgroundColor: accent.primary }}
      >
        Create Your First Season
      </button>
    </div>
  )
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================
export function DashboardPage({ onNavigate }) {
  const { organization, profile } = useAuth()
  const { selectedSeason, loading: seasonLoading } = useSeason()
  const { isDark, accent } = useTheme()
  const [stats, setStats] = useState({
    // Season stats
    teams: 0,
    rosteredPlayers: 0,
    totalCapacity: 0,
    nextGame: null,
    
    // Financial stats
    totalCollected: 0,
    pastDue: 0,
    paidOnline: 0,
    paidManual: 0,
    overdueFees: 0,
    overdueStripe: 0,
    
    // Registration stats
    totalRegistrations: 0,
    approved: 0,
    pending: 0,
    waitlisted: 0,
    denied: 0,
    capacity: 0,
    passTypeName: 'Season Pass',
  })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [monthlyPayments, setMonthlyPayments] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedSeason?.id) {
      loadDashboardData()
    } else if (!seasonLoading) {
      setLoading(false)
    }
  }, [selectedSeason?.id, seasonLoading])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const seasonId = selectedSeason.id
      const orgId = selectedSeason.organization_id

      // Fetch teams for this season
      const { data: teams, count: teamCount } = await supabase
        .from('teams')
        .select('id, name', { count: 'exact' })
        .eq('season_id', seasonId)

      // Get ACTUAL rostered count from team_players (source of truth)
      const teamIds = teams?.map(t => t.id) || []
      let actualRosteredCount = 0
      if (teamIds.length > 0) {
        const { data: teamPlayers } = await supabase
          .from('team_players')
          .select('player_id')
          .in('team_id', teamIds)
        actualRosteredCount = new Set(teamPlayers?.map(tp => tp.player_id) || []).size
      }

      // Fetch ALL players with registrations for this season (matching RegistrationsPage query)
      const { data: players } = await supabase
        .from('players')
        .select('*, registrations(*)')
        .eq('season_id', seasonId)

      // Get registration status from the joined registrations
      const registrations = players?.map(p => ({
        id: p.registrations?.[0]?.id,
        status: p.registrations?.[0]?.status,
        first_name: p.first_name,
        last_name: p.last_name,
        created_at: p.registrations?.[0]?.created_at || p.created_at,
        player_id: p.id
      })) || []

      // Calculate registration stats correctly (include 'active' as rostered)
      const regStats = {
        total: registrations.length,
        pending: registrations.filter(r => ['pending', 'submitted', 'new'].includes(r.status)).length,
        approved: registrations.filter(r => r.status === 'approved').length,
        rostered: actualRosteredCount, // Use actual team_players count
        registrationRostered: registrations.filter(r => ['rostered', 'active'].includes(r.status)).length,
        waitlisted: registrations.filter(r => r.status === 'waitlisted').length,
        denied: registrations.filter(r => r.status === 'withdrawn').length,
        withdrawn: registrations.filter(r => r.status === 'withdrawn').length,
      }

      // Unrostered = approved/active but not on a team
      regStats.unrostered = regStats.total - regStats.rostered - regStats.pending - regStats.waitlisted - regStats.denied

      // Calculate capacity from season settings or default per team
      const seasonCapacity = selectedSeason.capacity || selectedSeason.registration_capacity || 0
      const totalCapacity = seasonCapacity || (teamCount || 0) * 12

      // Fetch payments for this season
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, paid, payment_method, fee_type, created_at, due_date')
        .eq('season_id', seasonId)

      const paidPayments = payments?.filter(p => p.paid) || []
      const unpaidPayments = payments?.filter(p => !p.paid) || []
      
      const totalCollected = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const totalExpected = payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
      const pastDue = unpaidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const paidOnline = paidPayments.filter(p => p.payment_method === 'stripe').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const paidManual = paidPayments.filter(p => p.payment_method !== 'stripe').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

      // Group payments by fee type for breakdown
      const paymentsByType = {
        registration: payments?.filter(p => p.fee_type === 'registration') || [],
        uniform: payments?.filter(p => p.fee_type === 'uniform') || [],
        monthly: payments?.filter(p => p.fee_type === 'monthly') || [],
        other: payments?.filter(p => !['registration', 'uniform', 'monthly'].includes(p.fee_type)) || [],
      }

      // Fetch upcoming events - include org-wide (null team_id) AND season-specific teams
      const today = new Date().toISOString().split('T')[0]
      // teamIds already declared above when fetching rostered count
      
      let eventsQuery = supabase
        .from('schedule_events')
        .select('*, teams(name, color)')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(10)

      // Filter by teams in this season OR org-wide events (team_id is null)
      if (teamIds.length > 0) {
        eventsQuery = eventsQuery.or(`team_id.in.(${teamIds.join(',')}),team_id.is.null`)
      } else {
        eventsQuery = eventsQuery.is('team_id', null)
      }

      const { data: events } = await eventsQuery

      // Get next game from schedule_events (not games table which doesn't exist)
      const nextGameEvent = events?.find(e => e.event_type === 'game')
      let nextGame = null
      if (nextGameEvent) {
        const gameDate = new Date(nextGameEvent.event_date)
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const time = nextGameEvent.event_time ? 
          new Date(`2000-01-01T${nextGameEvent.event_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
        nextGame = `${days[gameDate.getDay()]}, ${time}`
      }

      // Fetch recent activity (real data from multiple sources)
      const recentActivity = []
      
      // Recent registrations
      const recentRegs = registrations
        ?.filter(r => r.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3) || []
      
      recentRegs.forEach(r => {
        recentActivity.push({
          type: 'registration',
          name: `${r.first_name} ${r.last_name}`,
          initials: `${r.first_name?.[0] || ''}${r.last_name?.[0] || ''}`,
          action: r.status === 'pending' ? 'submitted registration' : `registration ${r.status}`,
          timestamp: r.created_at,
        })
      })

      // Recent payments
      const recentPays = paidPayments
        .filter(p => p.created_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 2)
      
      recentPays.forEach(p => {
        recentActivity.push({
          type: 'payment',
          name: 'Payment received',
          initials: '$',
          action: 'paid',
          highlight: `$${parseFloat(p.amount).toFixed(0)}`,
          timestamp: p.created_at,
        })
      })

      setUpcomingEvents(events || [])
      setRecentActivity(recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5))
      
      setStats({
        teams: teamCount || 0,
        rosteredPlayers: regStats.rostered,
        approvedPlayers: regStats.approved,
        pendingPlayers: regStats.pending,
        totalCapacity,
        nextGame,
        totalCollected,
        totalExpected,
        pastDue,
        paidOnline,
        paidManual,
        overdueFees: pastDue,
        overdueStripe: 0,
        totalRegistrations: regStats.total,
        ...regStats,
        capacity: totalCapacity,
        passTypeName: selectedSeason?.name || 'Season Pass',
        paymentsByType,
      })

      // Generate monthly payment data for chart (real data based on payments)
      const now = new Date()
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyData = []
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        
        const monthPayments = paidPayments.filter(p => {
          const payDate = new Date(p.created_at)
          return payDate >= monthDate && payDate <= monthEnd
        })
        
        monthlyData.push({
          label: monthNames[monthDate.getMonth()],
          value: monthPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        })
      }
      
      setMonthlyPayments(monthlyData)

    } catch (err) {
      console.error('Dashboard load error:', err)
    }
    setLoading(false)
  }

  // Task list for Recent Activity
  const tasks = [
    {
      title: `Review ${stats.pending} new registrants`,
      icon: <ClipboardList className="w-4 h-4 text-orange-500" />,
      color: '#F97316',
      badge: stats.pending > 0 ? stats.pending : null,
      action: () => onNavigate('registrations'),
    },
    {
      title: 'Past Due Payment',
      icon: <DollarSign className="w-4 h-4 text-orange-500" />,
      color: '#F97316',
      badge: stats.pastDue > 0 ? Math.ceil(stats.pastDue / 100) : null,
      action: () => onNavigate('payments'),
    },
    {
      title: 'Complete coach onboarding',
      icon: <Users className="w-4 h-4 text-slate-500" />,
      color: '#64748B',
      action: () => onNavigate('coaches'),
    },
  ]

  // Activity feed - use real data from recentActivity state
  const activities = recentActivity.length > 0 ? recentActivity : [
    { name: 'No recent activity', initials: '—', action: 'Start approving registrations to see activity here' },
  ]

  if (!seasonLoading && !selectedSeason) {
    return <GettingStartedGuide onNavigate={onNavigate} />
  }

  if (loading || seasonLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accent.primary, borderTopColor: 'transparent' }}></div>
          <span className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Journey Progress */}
      <JourneyTimeline onNavigate={onNavigate} />

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* ═══════════════════════════════════════════════════
            LEFT COLUMN
            ═══════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Season Card */}
          <SeasonCard 
            season={selectedSeason}
            stats={stats}
            onNavigate={onNavigate}
          />
          
          {/* Registration Stats */}
          <RegistrationStats 
            stats={stats}
            onNavigate={onNavigate}
          />
          
          {/* Quick Actions / Activity Feed */}
          <QuickActionsWidget activities={activities} />
        </div>

        {/* ═══════════════════════════════════════════════════
            MIDDLE COLUMN
            ═══════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Financial Summary */}
          <FinancialSummary 
            stats={stats}
            onNavigate={onNavigate}
          />
          
          {/* Recent Activity / Tasks */}
          <RecentActivity 
            tasks={tasks}
            onNavigate={onNavigate}
          />
        </div>

        {/* ═══════════════════════════════════════════════════
            RIGHT COLUMN
            ═══════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Financial Overview Chart */}
          <FinancialOverview 
            monthlyData={monthlyPayments}
            totalCollected={stats.totalCollected}
          />
          
          {/* Upcoming Events */}
          <UpcomingEvents 
            events={upcomingEvents}
            onNavigate={onNavigate}
          />
          
          {/* Overdue Payments */}
          <OverduePayments 
            stats={stats}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  )
}
