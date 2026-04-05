// =============================================================================
// useTeamManagerData — Fetches operational data for Team Manager dashboard
// Ported from mobile hooks/useTeamManagerData.ts, adapted for web
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useSeason } from '../contexts/SeasonContext'
import { supabase } from '../lib/supabase'
import { parseLocalDate } from '../lib/date-helpers'

export function useTeamManagerData(teamId) {
  const { selectedSeason } = useSeason()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    paymentHealth: null,
    nextEventRsvp: null,
    registrationStatus: null,
    rosterCount: 0,
    upcomingEvents: [],
  })

  const fetchData = useCallback(async () => {
    if (!teamId || !selectedSeason?.id || selectedSeason.id === 'all') {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // ── Payment Health ──
      const { data: payments } = await supabase
        .from('payments')
        .select('id, amount, status, due_date, player_id')
        .eq('season_id', selectedSeason.id)
        .in('status', ['pending', 'overdue', 'paid'])

      // Get team player IDs to scope payments
      const { data: teamPlayers } = await supabase
        .from('team_players')
        .select('player_id')
        .eq('team_id', teamId)
        .eq('is_active', true)

      const teamPlayerIds = new Set((teamPlayers || []).map(tp => tp.player_id))
      const teamPayments = (payments || []).filter(p => teamPlayerIds.has(p.player_id))

      const now = new Date()
      const overdue = teamPayments.filter(p => p.status === 'overdue' || (p.status === 'pending' && p.due_date && parseLocalDate(p.due_date) < now))
      const pending = teamPayments.filter(p => p.status === 'pending' && (!p.due_date || parseLocalDate(p.due_date) >= now))
      const paid = teamPayments.filter(p => p.status === 'paid')

      const paymentHealth = {
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, p) => sum + (p.amount || 0), 0),
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum, p) => sum + (p.amount || 0), 0),
        collectedAmount: paid.reduce((sum, p) => sum + (p.amount || 0), 0),
        totalPayments: teamPayments.length,
      }

      // ── Next Event RSVP ──
      const today = new Date().toISOString().split('T')[0]
      const { data: upcomingEventsData } = await supabase
        .from('schedule_events')
        .select('id, title, event_type, event_date, event_time, location, venue_name, opponent_name')
        .eq('team_id', teamId)
        .eq('season_id', selectedSeason.id)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(5)

      let nextEventRsvp = null
      const nextEvent = upcomingEventsData?.[0]

      if (nextEvent) {
        const { data: rsvps } = await supabase
          .from('event_rsvps')
          .select('status')
          .eq('event_id', nextEvent.id)

        const confirmed = (rsvps || []).filter(r => r.status === 'yes' || r.status === 'going').length
        const maybe = (rsvps || []).filter(r => r.status === 'maybe').length
        const declined = (rsvps || []).filter(r => r.status === 'no' || r.status === 'not_going').length
        const totalRoster = teamPlayerIds.size
        const noResponse = Math.max(0, totalRoster - confirmed - maybe - declined)

        nextEventRsvp = {
          eventId: nextEvent.id,
          title: nextEvent.title || nextEvent.event_type,
          eventType: nextEvent.event_type,
          eventDate: nextEvent.event_date,
          eventTime: nextEvent.event_time,
          confirmed,
          maybe,
          declined,
          noResponse,
          totalRoster,
        }
      }

      // ── Registration Status ──
      const { data: team } = await supabase
        .from('teams')
        .select('id, name, color, max_players, season_id')
        .eq('id', teamId)
        .maybeSingle()

      const rosterCount = teamPlayerIds.size
      const capacity = team?.max_players || 0

      const { data: pendingPlayers } = await supabase
        .from('players')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', selectedSeason.id)
        .eq('status', 'pending')

      const registrationStatus = {
        filled: rosterCount,
        capacity: capacity,
        pendingCount: pendingPlayers?.length || 0,
        isOpen: capacity === 0 || rosterCount < capacity,
      }

      setData({
        paymentHealth,
        nextEventRsvp,
        registrationStatus,
        rosterCount,
        upcomingEvents: upcomingEventsData || [],
      })
    } catch (err) {
      console.error('useTeamManagerData error:', err)
    }
    setLoading(false)
  }, [teamId, selectedSeason?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { ...data, loading, refresh: fetchData }
}
