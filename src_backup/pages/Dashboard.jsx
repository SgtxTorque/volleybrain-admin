import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { 
  Users, UserCheck, Calendar, DollarSign, 
  TrendingUp, AlertCircle, CheckCircle2, Clock,
  ChevronRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

export default function DashboardPage() {
  const { organization } = useAuth()
  const [stats, setStats] = useState({
    totalPlayers: 0,
    activeTeams: 0,
    upcomingEvents: 0,
    outstandingPayments: 0,
    registrationsPending: 0,
    paymentsCollected: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    if (organization?.id) {
      loadDashboardData()
    }
  }, [organization?.id])

  async function loadDashboardData() {
    setLoading(true)
    try {
      // Get active season
      const { data: seasons } = await supabase
        .from('seasons')
        .select('id')
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .limit(1)

      const activeSeasonId = seasons?.[0]?.id

      if (activeSeasonId) {
        // Get player count
        const { count: playerCount } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('season_id', activeSeasonId)

        // Get team count
        const { count: teamCount } = await supabase
          .from('teams')
          .select('*', { count: 'exact', head: true })
          .eq('season_id', activeSeasonId)

        // Get upcoming events
        const { count: eventCount } = await supabase
          .from('schedule_events')
          .select('*', { count: 'exact', head: true })
          .eq('season_id', activeSeasonId)
          .gte('event_date', new Date().toISOString().split('T')[0])

        // Get pending registrations
        const { count: pendingCount } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('season_id', activeSeasonId)
          .eq('status', 'pending')

        // Get outstanding payments
        const { data: payments } = await supabase
          .from('payments')
          .select('amount, status')
          .eq('season_id', activeSeasonId)

        const outstanding = payments?.filter(p => p.status !== 'paid').reduce((sum, p) => sum + (p.amount || 0), 0) || 0
        const collected = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0) || 0

        setStats({
          totalPlayers: playerCount || 0,
          activeTeams: teamCount || 0,
          upcomingEvents: eventCount || 0,
          outstandingPayments: outstanding,
          registrationsPending: pendingCount || 0,
          paymentsCollected: collected
        })

        // Get recent registrations
        const { data: recentPlayers } = await supabase
          .from('players')
          .select('id, first_name, last_name, created_at')
          .eq('season_id', activeSeasonId)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentActivity(recentPlayers || [])
      }
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      label: 'Total Players', 
      value: stats.totalPlayers, 
      icon: Users, 
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    { 
      label: 'Active Teams', 
      value: stats.activeTeams, 
      icon: UserCheck, 
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    { 
      label: 'Upcoming Events', 
      value: stats.upcomingEvents, 
      icon: Calendar, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    { 
      label: 'Outstanding Payments', 
      value: `$${stats.outstandingPayments.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-gold',
      bgColor: 'bg-gold/10',
      borderColor: 'border-gold/30'
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with {organization?.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div 
              key={stat.label}
              className={`card ${stat.bgColor} ${stat.borderColor} animate-fade-in`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Alerts Section */}
      {(stats.registrationsPending > 0 || stats.outstandingPayments > 0) && (
        <div className="card bg-gold/5 border-gold/30">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-gold" />
            Needs Attention
          </h3>
          <div className="space-y-3">
            {stats.registrationsPending > 0 && (
              <div className="flex items-center justify-between p-3 bg-dark rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-gray-300">{stats.registrationsPending} pending registrations</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            )}
            {stats.outstandingPayments > 0 && (
              <div className="flex items-center justify-between p-3 bg-dark rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <span className="text-gray-300">${stats.outstandingPayments.toLocaleString()} in outstanding payments</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Recent Registrations</h3>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((player, idx) => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-dark rounded-xl animate-slide-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center font-bold text-gold">
                      {player.first_name?.charAt(0)}{player.last_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{player.first_name} {player.last_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(player.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                    New
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent registrations</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-dark rounded-xl text-left hover:bg-dark-hover transition-colors group">
              <Users className="w-6 h-6 text-blue-400 mb-2" />
              <p className="font-medium text-white">View Players</p>
              <p className="text-xs text-gray-500">Manage roster</p>
            </button>
            <button className="p-4 bg-dark rounded-xl text-left hover:bg-dark-hover transition-colors group">
              <Calendar className="w-6 h-6 text-purple-400 mb-2" />
              <p className="font-medium text-white">Schedule</p>
              <p className="text-xs text-gray-500">Games & practices</p>
            </button>
            <button className="p-4 bg-dark rounded-xl text-left hover:bg-dark-hover transition-colors group">
              <DollarSign className="w-6 h-6 text-green-400 mb-2" />
              <p className="font-medium text-white">Payments</p>
              <p className="text-xs text-gray-500">Track finances</p>
            </button>
            <button className="p-4 bg-dark rounded-xl text-left hover:bg-dark-hover transition-colors group">
              <TrendingUp className="w-6 h-6 text-gold mb-2" />
              <p className="font-medium text-white">Reports</p>
              <p className="text-xs text-gray-500">View analytics</p>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Financial Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-dark rounded-xl">
            <p className="text-gray-400 text-sm">Total Collected</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              ${stats.paymentsCollected.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-dark rounded-xl">
            <p className="text-gray-400 text-sm">Outstanding</p>
            <p className="text-2xl font-bold text-gold mt-1">
              ${stats.outstandingPayments.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-dark rounded-xl">
            <p className="text-gray-400 text-sm">Collection Rate</p>
            <p className="text-2xl font-bold text-white mt-1">
              {stats.paymentsCollected + stats.outstandingPayments > 0 
                ? Math.round((stats.paymentsCollected / (stats.paymentsCollected + stats.outstandingPayments)) * 100) 
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
