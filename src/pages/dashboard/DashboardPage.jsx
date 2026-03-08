import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useJourney } from '../../contexts/JourneyContext'
import { useOrgBranding } from '../../contexts/OrgBrandingContext'
import { JourneyTimeline, JourneyWidget } from '../../components/journey'
import { supabase } from '../../lib/supabase'
import {
  Users, ClipboardList, DollarSign, Settings, Bell, Calendar,
  ChevronRight, MoreHorizontal, TrendingUp, CreditCard, Play,
  CheckCircle, Clock, AlertCircle, Star, MapPin, LayoutDashboard,
  Filter, ChevronDown, MessageSquare, UsersRound, Search, Megaphone, BarChart3
} from 'lucide-react'
import { VolleyballIcon } from '../../constants/icons'
import { SkeletonDashboard } from '../../components/ui'
import { DashboardGrid } from '../../components/widgets/dashboard/DashboardGrid'
// LynxSidebar now rendered by MainApp — no longer needed here
import WelcomeBanner from '../../components/shared/WelcomeBanner'
import OrgHealthHero from '../../components/dashboard/OrgHealthHero'
import SeasonJourneyRow from '../../components/dashboard/SeasonJourneyRow'
import SeasonJourneyList from '../../components/dashboard/SeasonJourneyList'
import OrgKpiRow from '../../components/dashboard/OrgKpiRow'
import AllTeamsTable from '../../components/dashboard/AllTeamsTable'
import OrgActionItems from '../../components/dashboard/OrgActionItems'
import OrgUpcomingEvents from '../../components/dashboard/OrgUpcomingEvents'
import PeopleComplianceRow from '../../components/dashboard/PeopleComplianceRow'
import OrgFinancials from '../../components/dashboard/OrgFinancials'
import OrgWallPreview from '../../components/dashboard/OrgWallPreview'
import AdminSetupTracker from '../../components/dashboard/AdminSetupTracker'
import AdminActionChecklist from '../../components/dashboard/AdminActionChecklist'
import AdminQuickActions from '../../components/dashboard/AdminQuickActions'
import AdminNotificationsCard from '../../components/dashboard/AdminNotificationsCard'
import CalendarStripCard from '../../components/coach/CalendarStripCard'
import DashboardContainer from '../../components/layout/DashboardContainer'
import DashboardGridLayout from '../../components/layout/DashboardGrid'
import EditLayoutButton from '../../components/layout/EditLayoutButton'
import { HeroGrid, TwoColGrid } from '../../components/layout/DashboardGrids'

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
          ? 'bg-slate-800/90 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)]' 
          : 'bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
        }
        ${onClick ? 'cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5' : ''}
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
    orange: 'bg-gradient-to-r from-lynx-sky to-lynx-deep',
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
          {Icon && <Icon className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`} />}
          <h3 className={`font-semibold text-r-3xl ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {children}
          {action && (
            <button 
              onClick={onAction}
              className={`text-r-xl px-3 py-1.5 rounded-2xl font-medium transition flex items-center gap-1
                ${colorClasses[color] || colorClasses.blue} text-white hover:brightness-110`}
            >
              {action}
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button className={`p-1 rounded-2xl transition ${isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-100'}`}>
            <MoreHorizontal className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// DONUT CHART COMPONENT
// ============================================
function DonutChart({ data, total, centerLabel, size = 160 }) {
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
        <span className={`text-r-4xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>${centerLabel}</span>
      </div>
    </div>
  )
}

// ============================================
// REGISTRATION DONUT CHART
// ============================================
function RegistrationDonut({ data, total, size = 138 }) {
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
        <span className={`text-r-4xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{total.toLocaleString()}</span>
        <span className={`text-r-xl ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Total</span>
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
          background: 'linear-gradient(135deg, #1E3A5F 0%, #10284C 50%, #183658 100%)',
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
            <h2 className="text-r-4xl font-bold text-white">
              {season?.name || 'Spring 2026'}
            </h2>
            <span className="text-white/80 font-medium">
              {season?.sports?.name || 'Volleyball'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <VolleyballIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <span className="text-r-4xl font-bold text-white">{stats.teams}</span>
              <p className="text-white/70 text-r-xl">Active Teams</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className={`px-5 py-4 border-b ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <div className={`flex items-center gap-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          <Users className={`w-4 h-4 ${isDark ? "text-slate-500" : "text-lynx-slate"}`} />
          <span className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{stats.rosteredPlayers}</span>
          <span className={`${isDark ? "text-slate-400" : "text-lynx-slate"}`}>/ {stats.totalCapacity} rostered players</span>
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
          className={`mt-3 px-4 py-2 font-medium text-r-xl rounded-2xl transition ${isDark ? "bg-white/[0.06] hover:bg-white/[0.1] text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
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
        <button className={`p-1 rounded-2xl transition ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-slate-100"}`}>
          <Users className="w-4 h-4 text-slate-400" />
        </button>
      </CardHeader>
      
      <div className="p-5">
        {/* Main Total */}
        <div className="mb-r-4">
          <span className={`text-r-4xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
            ${stats.totalCollected?.toLocaleString() || '0'}
          </span>
          <span className={`text-r-3xl ml-2 ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Collected YTD</span>
        </div>
        
        {/* Chart and Breakdown */}
        <div className="flex items-center gap-r-4">
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
          className="mt-5 w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium rounded-2xl hover:brightness-110 transition flex items-center justify-center gap-2"
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
        <span className={`text-r-lg px-2 py-1 rounded-full ${isDark ? "text-slate-400 bg-white/[0.06]" : "text-lynx-slate bg-slate-100"}`}>All Seasons</span>
      </CardHeader>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-r-xl ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Registration Payments</span>
          <span className={`text-r-4xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>${totalCollected?.toLocaleString() || '0'}</span>
        </div>
        
        <div className="h-32">
          <MiniLineChart data={monthlyData} width={320} height={100} />
        </div>
        
        {/* Legend */}
        <div className={`flex items-center gap-4 mt-6 pt-4 border-t ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className={`text-r-xl ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className={`text-r-xl ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Manual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className={`text-r-xl ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Refunds</span>
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
        <div className="flex items-stretch gap-4 mb-r-4">
          {/* Total Registrations */}
          <div className={`flex-1 p-4 rounded-2xl text-center ${isDark ? "bg-white/[0.05]" : "bg-lynx-cloud"}`}>
            <p className={`text-r-4xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{stats.totalRegistrations || 0}</p>
            <p className={`text-r-xl mt-1 ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Total Registrations</p>
          </div>
          
          {/* Rostered */}
          <div className={`flex-1 p-4 rounded-2xl text-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
            <p className={`text-r-4xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
              {rostered}
              <span className={`text-r-3xl ${isDark ? "text-emerald-500" : "text-emerald-400"}`}>/{stats.totalRegistrations || 0}</span>
            </p>
            <p className={`text-r-xl mt-1 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Rostered</p>
          </div>
        </div>
        
        {/* Capacity Bar */}
        {stats.capacity > 0 && (
          <div className="mb-r-4">
            <div className="flex justify-between text-r-lg text-slate-500 mb-1">
              <span>Capacity</span>
              <span>{stats.totalRegistrations || 0} / {stats.capacity}</span>
            </div>
            <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((stats.totalRegistrations || 0) / stats.capacity) * 100)}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Chart and Breakdown */}
        <div className="flex items-start gap-r-4">
          <RegistrationDonut data={chartData} total={total} />
          
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className={`text-r-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>Pending Review</span>
              </div>
              <span className={`text-r-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{stats.pending || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className={`text-r-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>Approved (Unrostered)</span>
              </div>
              <span className={`text-r-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{unrostered}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className={`text-r-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>On Roster</span>
              </div>
              <span className={`text-r-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{rostered}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className={`text-r-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>Waitlisted</span>
              </div>
              <span className={`text-r-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{stats.waitlisted || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className={`text-r-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>Denied/Withdrawn</span>
              </div>
              <span className={`text-r-xl font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{stats.denied || 0}</span>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <button 
          onClick={() => onNavigate('registrations')}
          className="mt-5 w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-2xl hover:brightness-110 transition flex items-center justify-center gap-2"
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
      <CardHeader isDark={isDark} title="Recent Activity" color="purple" icon={Clock} />
      
      <div className="p-5">
        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-slate-400" />
          <span className={`text-r-xl font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>Recent Tasks</span>
          <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
        </div>
        
        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <div 
              key={i}
              onClick={task.action}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-lynx-cloud"}`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: task.color + '20' }}
              >
                {task.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-r-xl ${isDark ? "text-slate-200" : "text-slate-700"}`}>{task.title}</p>
              </div>
              {task.badge && (
                <span 
                  className="px-2 py-0.5 rounded-full text-r-lg font-medium text-white"
                  style={{ backgroundColor: task.color }}
                >
                  {task.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
        
        {/* Manage Link */}
        <button
          onClick={() => onNavigate('registrations')}
          className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-lynx-sky to-lynx-deep text-white text-r-xl font-medium rounded-lg hover:brightness-110 transition flex items-center justify-center gap-1"
        >
          View Registrations
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
            <p className={`text-r-xl font-semibold mb-3 ${isDark ? "text-white" : "text-slate-800"}`}>{formatDate(date)}</p>
            
            {dateEvents.map((event, i) => (
              <div 
                key={i}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition mb-2 ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-lynx-cloud"}`}
                onClick={() => onNavigate('schedule')}
              >
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: event.teams?.color || '#3B82F6' }}
                >
                  <VolleyballIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{event.teams?.name || event.title}</p>
                  <p className={`text-r-xl flex items-center gap-1 ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>
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
                <span className={`text-r-xl font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>{formatTime(event.event_time)}</span>
              </div>
            ))}
          </div>
        ))}
        
        {Object.keys(groupedEvents).length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className={`${isDark ? "text-slate-400" : "text-lynx-slate"}`}>No upcoming events</p>
          </div>
        )}
        
        {/* View All Link */}
        <button 
          onClick={() => onNavigate('schedule')}
          className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-lynx-sky to-lynx-deep text-white text-r-xl font-medium rounded-lg hover:brightness-110 transition flex items-center justify-center gap-1"
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
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-r-xl font-bold shrink-0 ${isDark ? "bg-white/[0.08] text-slate-300" : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600"}`}>
              {activity.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-r-xl ${isDark ? "text-slate-300" : "text-slate-700"}`}>
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
              <span className={`text-r-4xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>${stats.overdueFees?.toLocaleString() || '0'}</span>
              <span className={`text-r-xl ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Overdue Fees</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className={`text-r-4xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>${stats.overdueStripe?.toLocaleString() || '0'}</span>
              <span className={`text-r-xl ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Overdue Stripe</span>
            </div>
          </div>
          
          {/* Mini Donut */}
          <div className="relative w-32 h-32">
            <svg width="128" height="128" className="transform -rotate-90">
              <circle
                cx="64" cy="64" r="48"
                fill="none" stroke="#FEE2E2" strokeWidth="12"
              />
              <circle
                cx="64" cy="64" r="48"
                fill="none" stroke="#EF4444" strokeWidth="12"
                strokeDasharray={`${((stats.overdueFees || 0) / (total || 1)) * 301} 301`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-r-xl font-bold text-red-600">${total.toLocaleString()}</span>
              <span className={`text-r-lg uppercase ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>Overdue</span>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <button 
          onClick={() => onNavigate('payments')}
          className="mt-5 w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-2xl transition flex items-center justify-center gap-2"
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
    <div className="py-12 text-center">
      <div 
        className="w-20 h-20 rounded-full mx-auto mb-r-4 flex items-center justify-center"
        style={{ backgroundColor: accent.primary + '20' }}
      >
        <span className="text-r-4xl">🎉</span>
      </div>
      <h1 className={`text-r-4xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-800"}`}>
        Welcome to {organization?.name || 'Lynx'}!
      </h1>
      <p className={`mb-8 ${isDark ? "text-slate-400" : "text-lynx-slate"}`}>
        Let's get your organization set up. Start by creating your first season.
      </p>
      <button 
        onClick={() => onNavigate('seasons')}
        className="px-6 py-3 text-white font-semibold rounded-2xl transition hover:brightness-110"
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
  const { seasons, allSeasons, selectedSeason, selectSeason, loading: seasonLoading } = useSeason()
  const { sports, selectedSport, selectSport } = useSport()
  const { isDark, accent } = useTheme()
  const { orgName, orgLogo } = useOrgBranding()
  const [filterTeam, setFilterTeam] = useState('all')
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
    coachCount: 0,
    unsignedWaivers: 0,
    totalExpected: 0,
  })
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [monthlyPayments, setMonthlyPayments] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [teamsData, setTeamsData] = useState([])
  const [teamStats, setTeamStats] = useState({})
  const [recentPaymentsNamed, setRecentPaymentsNamed] = useState([])
  const [topPlayers, setTopPlayers] = useState([])
  const [coachesData, setCoachesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [perSeasonTeamCounts, setPerSeasonTeamCounts] = useState({})
  const [perSeasonPlayerCounts, setPerSeasonPlayerCounts] = useState({})

  // Fetch per-season team & player counts for Season Journey (runs once per org)
  useEffect(() => {
    const seasonList = allSeasons || seasons || []
    if (seasonList.length === 0) return
    const seasonIds = seasonList.map(s => s.id)
    ;(async () => {
      try {
        const { data: allTeams } = await supabase
          .from('teams')
          .select('id, season_id')
          .in('season_id', seasonIds)
        const tMap = {}
        ;(allTeams || []).forEach(t => { tMap[t.season_id] = (tMap[t.season_id] || 0) + 1 })
        setPerSeasonTeamCounts(tMap)

        const { data: allPlayers } = await supabase
          .from('players')
          .select('id, season_id')
          .in('season_id', seasonIds)
        const pMap = {}
        ;(allPlayers || []).forEach(p => { pMap[p.season_id] = (pMap[p.season_id] || 0) + 1 })
        setPerSeasonPlayerCounts(pMap)
      } catch (err) {
        console.error('Per-season counts error:', err)
      }
    })()
  }, [allSeasons, seasons])

  // Reset team filter when season changes
  useEffect(() => {
    setFilterTeam('all')
  }, [selectedSeason?.id])

  useEffect(() => {
    if (selectedSeason?.id) {
      loadDashboardData()
    } else if (!seasonLoading) {
      setLoading(false)
    }
  }, [selectedSeason?.id, seasonLoading, filterTeam])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const seasonId = selectedSeason.id
      const orgId = selectedSeason.organization_id

      // Fetch teams for this season (include color + max_players for roster health)
      const { data: teams, count: teamCount } = await supabase
        .from('teams')
        .select('id, name, color, max_players', { count: 'exact' })
        .eq('season_id', seasonId)

      // Apply team filter — use all teams for teamsData display, but filter stats
      const allTeamIds = teams?.map(t => t.id) || []
      const teamIds = filterTeam !== 'all' ? [filterTeam] : allTeamIds
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

      // If filtering by team, get that team's player IDs to scope stats
      let teamPlayerIds = null
      if (filterTeam !== 'all' && teamIds.length > 0) {
        const { data: filteredTp } = await supabase
          .from('team_players')
          .select('player_id')
          .in('team_id', teamIds)
        teamPlayerIds = new Set(filteredTp?.map(tp => tp.player_id) || [])
      }

      // Filter players if team is selected
      const scopedPlayers = teamPlayerIds
        ? (players || []).filter(p => teamPlayerIds.has(p.id))
        : players || []

      // Get registration status from the joined registrations
      const registrations = scopedPlayers.map(p => ({
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
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount, paid, payment_method, fee_type, created_at, due_date, player_id')
        .eq('season_id', seasonId)

      // Scope payments to team's players if filtered
      const payments = teamPlayerIds
        ? (allPayments || []).filter(p => teamPlayerIds.has(p.player_id))
        : allPayments || []

      const paidPayments = payments.filter(p => p.paid)
      const unpaidPayments = payments.filter(p => !p.paid)
      
      const totalCollected = paidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const totalExpected = payments?.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0
      const pastDue = unpaidPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const paidOnline = paidPayments.filter(p => p.payment_method === 'stripe').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      const paidManual = paidPayments.filter(p => p.payment_method !== 'stripe').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

      // Per-source breakdowns
      const paidBySource = {
        stripe: paidOnline,
        zelle: paidPayments.filter(p => p.payment_method === 'zelle').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        cashapp: paidPayments.filter(p => p.payment_method === 'cashapp').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        venmo: paidPayments.filter(p => p.payment_method === 'venmo').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        cash_check: paidPayments.filter(p => ['cash', 'check', 'cash_check'].includes(p.payment_method)).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
      }

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
        .eq('season_id', seasonId)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(10)

      // Filter by specific team if selected, otherwise show all season events
      if (filterTeam !== 'all') {
        eventsQuery = eventsQuery.or(`team_id.eq.${filterTeam},team_id.is.null`)
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

      // Fetch top 10 players by total points for leaderboard
      const { data: leaderboardData } = await supabase
        .from('player_season_stats')
        .select('*, player:players(id, first_name, last_name, jersey_number, photo_url, position), team:teams(id, name, color)')
        .eq('season_id', seasonId)
        .gt('games_played', 0)
        .order('total_points', { ascending: false })
        .limit(10)
      setTopPlayers(leaderboardData || [])

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
          action: r.status === 'pending' ? 'Registration submitted' : `Registration ${r.status}`,
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
          name: '',
          initials: '$',
          action: 'Payment received',
          highlight: `$${parseFloat(p.amount).toFixed(0)}`,
          timestamp: p.created_at,
        })
      })

      // Fetch coach count for this season's teams + track which teams have a coach
      let coachCount = 0
      let teamsWithCoachCount = 0
      if (teamIds.length > 0) {
        const { data: teamCoaches } = await supabase
          .from('team_coaches')
          .select('coach_id, team_id')
          .in('team_id', teamIds)
        coachCount = new Set(teamCoaches?.map(tc => tc.coach_id) || []).size
        teamsWithCoachCount = new Set(teamCoaches?.map(tc => tc.team_id) || []).size

        // Load coach profiles for Coach Section
        const uniqueCoachIds = [...new Set(teamCoaches?.map(tc => tc.coach_id) || [])]
        if (uniqueCoachIds.length > 0) {
          try {
            const { data: coachProfiles } = await supabase
              .from('coaches')
              .select('id, profiles(first_name, last_name)')
              .in('id', uniqueCoachIds)
            setCoachesData((coachProfiles || []).map(c => ({
              id: c.id,
              name: c.profiles ? `${c.profiles.first_name} ${c.profiles.last_name}` : 'Unknown',
              teams: (teamCoaches || []).filter(tc => tc.coach_id === c.id).map(tc => {
                const team = teams?.find(t => t.id === tc.team_id)
                return team?.name || ''
              }).filter(Boolean)
            })))
          } catch { setCoachesData([]) }
        } else {
          setCoachesData([])
        }
      }

      // Fetch unsigned waivers count
      let unsignedWaivers = 0
      try {
        const { count: activeWaivers } = await supabase
          .from('waivers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('is_active', true)

        const { count: signedCount } = await supabase
          .from('waiver_signatures')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)

        // Approximate: unsigned = (active waivers * total players) - signed
        // Simplified: just show waivers that need attention
        const expectedSigs = (activeWaivers || 0) * (regStats.total || 0)
        unsignedWaivers = Math.max(0, expectedSigs - (signedCount || 0))
      } catch {
        // Waivers table may not have org_id column — gracefully degrade
      }

      // Build per-team stats for TeamSnapshot
      const perTeamStats = {}
      if (teamIds.length > 0) {
        const { data: allTeamPlayers } = await supabase
          .from('team_players')
          .select('team_id, player_id')
          .in('team_id', teamIds)

        teamIds.forEach(tid => {
          const count = allTeamPlayers?.filter(tp => tp.team_id === tid).length || 0
          perTeamStats[tid] = { playerCount: count, record: '0W-0L' }
        })

        // Try to get game records per team
        try {
          const { data: gameResults } = await supabase
            .from('games')
            .select('home_team_id, away_team_id, home_score, away_score, status')
            .or(`home_team_id.in.(${teamIds.join(',')}),away_team_id.in.(${teamIds.join(',')})`)
            .eq('status', 'completed')

          if (gameResults) {
            teamIds.forEach(tid => {
              let wins = 0, losses = 0
              gameResults.forEach(g => {
                if (g.home_team_id === tid && g.home_score > g.away_score) wins++
                else if (g.home_team_id === tid && g.home_score < g.away_score) losses++
                else if (g.away_team_id === tid && g.away_score > g.home_score) wins++
                else if (g.away_team_id === tid && g.away_score < g.home_score) losses++
              })
              perTeamStats[tid].record = `${wins}W-${losses}L`
            })
          }
        } catch {
          // games table may not exist — gracefully degrade
        }
      }
      // Count open spots (max_players - current players) across filtered teams
      let openSpots = 0
      if (teams?.length > 0) {
        teams.forEach(t => {
          if (!teamIds.includes(t.id)) return
          const maxP = t.max_players || 12
          const current = perTeamStats[t.id]?.playerCount || 0
          openSpots += Math.max(0, maxP - current)
        })
      }

      setTeamsData(teams || [])
      setTeamStats(perTeamStats)

      // Build recent payments with player names for PaymentSummaryCard
      try {
        let recentQuery = supabase
          .from('payments')
          .select('amount, created_at, fee_type, player_id, players(first_name, last_name)')
          .eq('season_id', seasonId)
          .eq('paid', true)
          .order('created_at', { ascending: false })
          .limit(teamPlayerIds ? 50 : 5)

        const { data: namedPayments } = await recentQuery

        // Filter by team players if needed, then take 5
        const scopedRecent = teamPlayerIds
          ? (namedPayments || []).filter(p => teamPlayerIds.has(p.player_id)).slice(0, 5)
          : (namedPayments || []).slice(0, 5)

        setRecentPaymentsNamed(
          scopedRecent.map(p => {
            const d = new Date(p.created_at)
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const dd = String(d.getDate()).padStart(2, '0')
            const yy = String(d.getFullYear()).slice(-2)
            return {
              name: p.players ? `${p.players.first_name} ${p.players.last_name}` : 'Unknown',
              date: `${mm}/${dd}/${yy}`,
              lineItem: p.fee_type ? p.fee_type.charAt(0).toUpperCase() + p.fee_type.slice(1) : '—',
              amount: `$${parseFloat(p.amount).toLocaleString()}`,
            }
          })
        )
      } catch {
        setRecentPaymentsNamed([])
      }

      setUpcomingEvents(events || [])
      setRecentActivity(recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5))

      setStats({
        teams: teamIds.length,
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
        paidBySource,
        coachCount,
        unsignedWaivers,
        teamsWithCoach: teamsWithCoachCount,
        openSpots,
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
      icon: <ClipboardList className="w-4 h-4 text-lynx-sky" />,
      color: '#4BB9EC',
      badge: stats.pending > 0 ? stats.pending : null,
      action: () => onNavigate('registrations'),
    },
    {
      title: 'Past Due Payment',
      icon: <DollarSign className="w-4 h-4 text-lynx-sky" />,
      color: '#4BB9EC',
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

  // Calculate season week
  const getSeasonWeek = () => {
    if (!selectedSeason?.start_date) return null
    const start = new Date(selectedSeason.start_date)
    const now = new Date()
    const diffMs = now - start
    const weekNum = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)))
    if (selectedSeason.end_date) {
      const end = new Date(selectedSeason.end_date)
      const totalWeeks = Math.ceil((end - start) / (7 * 24 * 60 * 60 * 1000))
      return { current: Math.min(weekNum, totalWeeks), total: totalWeeks }
    }
    return { current: weekNum, total: null }
  }
  const seasonWeek = getSeasonWeek()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const orgInitials = (orgName || organization?.name || '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

  // ── Pre-compute derived data for widgets ──
  const totalPlayers = stats.totalRegistrations || 0
  const totalTeams = stats.teams || 0
  const regPct = totalPlayers > 0 ? Math.min(100, Math.round(((totalPlayers - (stats.pending || 0)) / totalPlayers) * 100)) : 100
  const paymentPct = (stats.totalExpected || 0) > 0 ? Math.min(100, Math.round(((stats.totalCollected || 0) / stats.totalExpected) * 100)) : 100
  const waiverTotal = (stats.unsignedWaivers || 0) + totalPlayers
  const waiverPct = waiverTotal > 0 ? Math.round(((waiverTotal - (stats.unsignedWaivers || 0)) / waiverTotal) * 100) : 100
  const rosterPct = totalPlayers > 0 ? Math.min(100, Math.round(((stats.rosteredPlayers || 0) / totalPlayers) * 100)) : 100
  const teamsWithSchedule = upcomingEvents.length > 0 ? Math.min(totalTeams, new Set(upcomingEvents.map(e => e.team_id).filter(Boolean)).size) : 0
  const schedulePct = totalTeams > 0 ? Math.min(100, Math.round((teamsWithSchedule / totalTeams) * 100)) : 100
  const coachPct = totalTeams > 0 ? Math.round(((stats.teamsWithCoach || 0) / totalTeams) * 100) : 100
  const healthScore = Math.round(regPct * 0.15 + paymentPct * 0.20 + waiverPct * 0.15 + rosterPct * 0.10 + schedulePct * 0.10 + 100 * 0.10 + 100 * 0.05 + coachPct * 0.05 + 100 * 0.10)
  const nowDate = new Date()
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
  const monthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0)
  const eventsThisMonth = upcomingEvents.filter(e => { const d = new Date(e.event_date); return d >= monthStart && d <= monthEnd }).length
  const overdueCount = (stats.pastDue || 0) > 0 ? Math.ceil(stats.pastDue / 100) : 0
  const unrosteredCount = Math.max(0, totalPlayers - (stats.rosteredPlayers || 0))
  const teamsNoSchedule = Math.max(0, totalTeams - teamsWithSchedule)

  const urgentItems = []
  if ((stats.pending || 0) > 0) urgentItems.push({ label: 'Pending registrations', count: stats.pending, severity: 'critical', page: 'registrations' })
  if ((stats.pastDue || 0) > 0) urgentItems.push({ label: 'Overdue payments', count: overdueCount, severity: paymentPct < 50 ? 'critical' : 'warning', page: 'payments' })
  if ((stats.unsignedWaivers || 0) > 0) urgentItems.push({ label: 'Unsigned waivers', count: stats.unsignedWaivers, severity: waiverPct < 50 ? 'critical' : 'warning', page: 'waivers' })
  if (unrosteredCount > 0) urgentItems.push({ label: 'Unrostered players', count: unrosteredCount, severity: rosterPct < 50 ? 'critical' : 'warning', page: 'teams' })
  if (totalTeams > (stats.teamsWithCoach || 0)) urgentItems.push({ label: 'Teams need a coach', count: totalTeams - (stats.teamsWithCoach || 0), severity: 'info', page: 'coaches' })
  if (schedulePct < 80 && totalTeams > 0) urgentItems.push({ label: 'Teams without schedule', count: teamsNoSchedule, severity: schedulePct < 50 ? 'critical' : 'warning', page: 'schedule' })

  const actionItems = []
  if ((stats.pending || 0) > 0) actionItems.push({ id: 'pending-reg', label: `${stats.pending} pending registration${stats.pending !== 1 ? 's' : ''} awaiting approval`, detail: 'Review and approve to keep your roster moving', severity: 'critical', page: 'registrations' })
  if ((stats.pastDue || 0) > 0) actionItems.push({ id: 'overdue-pay', label: `${overdueCount} famil${overdueCount !== 1 ? 'ies' : 'y'} overdue on payments ($${(stats.pastDue || 0).toLocaleString()} total)`, detail: 'Send reminders to collect overdue fees', severity: paymentPct < 50 ? 'critical' : 'warning', page: 'payments' })
  if ((stats.unsignedWaivers || 0) > 0) actionItems.push({ id: 'unsigned-waiver', label: `${stats.unsignedWaivers} unsigned waiver${stats.unsignedWaivers !== 1 ? 's' : ''}`, detail: 'Follow up to get all waivers signed before play begins', severity: waiverPct < 50 ? 'critical' : 'warning', page: 'waivers' })
  if (unrosteredCount > 0) actionItems.push({ id: 'unrostered', label: `${unrosteredCount} player${unrosteredCount !== 1 ? 's' : ''} not assigned to a team`, detail: 'Assign players to teams to complete your rosters', severity: rosterPct < 50 ? 'critical' : 'warning', page: 'teams' })
  if (teamsNoSchedule > 0 && totalTeams > 0) actionItems.push({ id: 'no-schedule', label: `${teamsNoSchedule} team${teamsNoSchedule !== 1 ? 's' : ''} without a schedule`, detail: 'Create events so families know when to show up', severity: schedulePct < 50 ? 'critical' : 'warning', page: 'schedule' })
  if (totalTeams > (stats.teamsWithCoach || 0)) { const n = totalTeams - (stats.teamsWithCoach || 0); actionItems.push({ id: 'no-coach', label: `${n} team${n !== 1 ? 's' : ''} need a coach assigned`, detail: 'Assign coaches to keep teams on track', severity: 'info', page: 'coaches' }) }

  const quickActionCounts = { pendingRegistrations: stats.pending || 0, overduePayments: overdueCount, unrosteredPlayers: unrosteredCount, overdueFamilies: overdueCount, teamsNoSchedule }

  const teamCountsMap = perSeasonTeamCounts
  const playerCountsMap = perSeasonPlayerCounts

  // ── Build widget array — Carlos's exported layout (24-col grid, 20px row height) ──
  const adminWidgets = useMemo(() => [
    { id: 'welcome-banner', label: 'Welcome Banner', defaultLayout: { x: 0, y: 0, w: 8, h: 4 }, minW: 2, minH: 2, maxH: 8, component: <WelcomeBanner role="admin" userName={profile?.full_name} seasonName={selectedSeason?.name} isDark={isDark} /> },
    { id: 'notifications', label: 'Notifications', defaultLayout: { x: 12, y: 0, w: 10, h: 5 }, minW: 2, minH: 2, maxH: 12, component: <AdminNotificationsCard stats={stats} events={upcomingEvents} onNavigate={onNavigate} /> },
    { id: 'org-health-hero', label: 'Organization Health', defaultLayout: { x: 0, y: 4, w: 12, h: 12 }, minW: 2, minH: 2, maxH: 32, component: <OrgHealthHero orgName={orgName || organization?.name || 'My Organization'} healthScore={healthScore} kpis={{ teams: totalTeams, players: totalPlayers, revenueCollected: stats.totalCollected || 0, outstanding: Math.max(0, (stats.totalExpected || 0) - (stats.totalCollected || 0)), waiverPct, eventsMonth: eventsThisMonth, coaches: stats.coachCount || 0, overduePayments: overdueCount, openSpots: stats.openSpots || 0, pendingReg: stats.pending || 0 }} urgentItems={urgentItems} onNavigate={onNavigate} /> },
    { id: 'setup-tracker', label: 'Setup Tracker', defaultLayout: { x: 16, y: 5, w: 6, h: 4 }, minW: 2, minH: 2, maxH: 10, component: <AdminSetupTracker hasOrgProfile={!!organization?.name} hasSeason={!!selectedSeason} hasRegistration={selectedSeason?.status === 'open' || (stats.totalRegistrations || 0) > 0} hasTeam={(stats.teams || 0) > 0} hasCoach={(stats.coachCount || 0) > 0} hasEvent={upcomingEvents.length > 0} /> },
    { id: 'calendar-strip', label: 'Calendar', defaultLayout: { x: 12, y: 5, w: 4, h: 32 }, minW: 2, minH: 2, maxH: 40, component: <CalendarStripCard events={upcomingEvents} onNavigate={onNavigate} /> },
    { id: 'season-journey', label: 'Season Journey', defaultLayout: { x: 16, y: 9, w: 6, h: 20 }, minW: 2, minH: 2, maxH: 36, component: <SeasonJourneyList seasons={allSeasons || seasons || []} sports={sports} teamCounts={teamCountsMap} playerCounts={playerCountsMap} onNavigate={onNavigate} /> },
    { id: 'org-financials', label: 'Financials', defaultLayout: { x: 0, y: 16, w: 12, h: 10 }, minW: 2, minH: 2, maxH: 28, component: <OrgFinancials stats={stats} onNavigate={onNavigate} /> },
    { id: 'quick-actions-top', label: 'Quick Actions', defaultLayout: { x: 0, y: 26, w: 12, h: 5 }, minW: 2, minH: 2, maxH: 12, component: <AdminQuickActions counts={quickActionCounts} onNavigate={onNavigate} /> },
    { id: 'people-compliance', label: 'People & Compliance', defaultLayout: { x: 0, y: 31, w: 12, h: 6 }, minW: 2, minH: 2, maxH: 16, component: <PeopleComplianceRow stats={stats} onNavigate={onNavigate} /> },
    { id: 'kpi-row', label: 'KPI Stats', defaultLayout: { x: 16, y: 29, w: 6, h: 6 }, minW: 2, minH: 2, maxH: 12, component: <OrgKpiRow stats={stats} /> },
    { id: 'all-teams-table', label: 'All Teams', defaultLayout: { x: 16, y: 35, w: 6, h: 10 }, minW: 2, minH: 2, maxH: 32, component: <AllTeamsTable teams={teamsData} teamStats={teamStats} onNavigate={onNavigate} /> },
    { id: 'org-action-items', label: 'Action Items', defaultLayout: { x: 0, y: 37, w: 1, h: 1 }, minW: 2, minH: 2, maxH: 28, component: <OrgActionItems stats={stats} onNavigate={onNavigate} /> },
  ], [profile?.full_name, selectedSeason, isDark, organization, stats, healthScore, totalTeams, totalPlayers, waiverPct, eventsThisMonth, overdueCount, urgentItems, quickActionCounts, upcomingEvents, teamsData, teamStats, allSeasons, seasons, sports, teamCountsMap, playerCountsMap, orgName, onNavigate])

  if (!seasonLoading && !selectedSeason) {
    return <GettingStartedGuide onNavigate={onNavigate} />
  }

  if (seasonLoading) {
    return <SkeletonDashboard />
  }

  return (
    <div className={`h-[calc(100vh)] overflow-hidden ${isDark ? 'bg-lynx-midnight' : 'bg-brand-off-white'}`}>
      <div className="w-full h-full overflow-y-auto">
        <DashboardContainer className="space-y-5">

          {/* ─── Filters — not in grid, always at top ──── */}
          <div className={`flex items-center gap-3 rounded-[14px] px-4 py-2 shadow-sm mx-6 ${
            isDark ? 'bg-lynx-charcoal border border-white/[0.06]' : 'bg-white/90 backdrop-blur-sm border border-brand-border'
          }`}>
            <Filter className={`h-3.5 w-3.5 shrink-0 ${isDark ? 'text-slate-400' : 'text-[#0D1B3E]/30'}`} />
            <div className="relative">
              <select value={selectedSeason?.id || ''} onChange={(e) => { const season = (seasons || allSeasons || []).find(s => s.id === e.target.value); if (season) selectSeason(season) }}
                className={`appearance-none rounded-lg px-3 pr-8 py-1.5 text-r-lg font-medium cursor-pointer transition-colors ${isDark ? 'bg-white/[0.06] text-white border border-white/[0.06] hover:bg-white/[0.1]' : 'bg-brand-off-white border border-brand-border text-[#0D1B3E]/60 hover:bg-[#F0F3F7]'}`}>
                {(seasons || allSeasons || []).map(s => (<option key={s.id} value={s.id}>{s.name} · {s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Unknown'}</option>))}
              </select>
              <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 ${isDark ? 'text-slate-400' : 'text-[#0D1B3E]/30'}`} />
            </div>
            <div className="relative">
              <select value={selectedSport?.id || ''} onChange={(e) => { const sport = sports.find(s => s.id === e.target.value) || null; selectSport(sport) }}
                className={`appearance-none rounded-lg px-3 pr-8 py-1.5 text-r-lg font-medium cursor-pointer transition-colors ${isDark ? 'bg-white/[0.06] text-white border border-white/[0.06] hover:bg-white/[0.1]' : 'bg-brand-off-white border border-brand-border text-[#0D1B3E]/60 hover:bg-[#F0F3F7]'}`}>
                <option value="">All Sports</option>
                {sports.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
              <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 ${isDark ? 'text-slate-400' : 'text-[#0D1B3E]/30'}`} />
            </div>
            <div className="relative">
              <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}
                className={`appearance-none rounded-lg px-3 pr-8 py-1.5 text-r-lg font-medium cursor-pointer transition-colors ${isDark ? 'bg-white/[0.06] text-white border border-white/[0.06] hover:bg-white/[0.1]' : 'bg-brand-off-white border border-brand-border text-[#0D1B3E]/60 hover:bg-[#F0F3F7]'}`}>
                <option value="all">All Teams</option>
                {teamsData.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
              <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 ${isDark ? 'text-slate-400' : 'text-[#0D1B3E]/30'}`} />
            </div>
          </div>

          {/* ─── Widget Grid ──── */}
          <DashboardGridLayout
            widgets={adminWidgets}
            editMode={editMode}
            onLayoutChange={(layouts) => console.log('Admin layout changed:', layouts)}
            role="admin"
            sharedProps={{
              role: 'admin', isDark, onNavigate, profile, selectedSeason, organization, orgName,
              stats, healthScore, totalTeams, totalPlayers, waiverPct, eventsThisMonth, overdueCount,
              urgentItems, actionItems, quickActionCounts, upcomingEvents, events: upcomingEvents,
              teamsData, teams: teamsData, teamStats, allSeasons, seasons, sports,
              teamCountsMap, playerCountsMap,
            }}
          />

          {/* ─── Edit Layout FAB ──── */}
          <EditLayoutButton editMode={editMode} onToggle={() => setEditMode(!editMode)} />

        </DashboardContainer>
      </div>
    </div>
  )
}
