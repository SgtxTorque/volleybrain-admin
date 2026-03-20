// =============================================================================
// TeamManagerDashboard — v2 layout, operational hub for Team Managers
// Preserves all data from useTeamManagerData hook
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTeamManagerData } from '../../hooks/useTeamManagerData'
import { supabase } from '../../lib/supabase'
import InviteCodeModal from '../../components/team-manager/InviteCodeModal'
import { CheckCircle2, Circle } from '../../constants/icons'
// V2 shared components
import {
  HeroCard, AttentionStrip, BodyTabs, FinancialSnapshot,
  WeeklyLoad, ThePlaybook, MilestoneCard, MascotNudge, V2DashboardLayout,
} from '../../components/v2'

function formatTime12(t) {
  if (!t) return 'TBD'
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Main Dashboard ──
export function TeamManagerDashboard({ roleContext, showToast, navigateToTeamWall, onNavigate }) {
  const { profile } = useAuth()
  const { selectedSeason } = useSeason()
  const [showInviteModal, setShowInviteModal] = useState(false)

  const teamInfo = roleContext?.teamManagerInfo?.[0]
  const teamId = teamInfo?.team_id
  const teamName = teamInfo?.teams?.name || 'My Team'
  const teamColor = teamInfo?.teams?.color || '#4BB9EC'

  const { paymentHealth, nextEventRsvp, registrationStatus, rosterCount, upcomingEvents, loading, refresh } = useTeamManagerData(teamId)

  // ── Getting Started checklist ──
  const [hasEvents, setHasEvents] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    if (!teamId) return false
    return localStorage.getItem(`tm_setup_dismissed_${teamId}`) === 'true'
  })

  const checkEvents = useCallback(async () => {
    if (!teamId) return
    const { count, error } = await supabase
      .from('schedule_events')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId)
    if (!error) setHasEvents((count || 0) > 0)
  }, [teamId])

  useEffect(() => { checkEvents() }, [checkEvents])

  const hasPlayers = rosterCount > 0
  const hasPayments = (paymentHealth?.totalPayments || 0) > 0
  const hasInvitedParents = rosterCount > 2

  const checklistItems = [
    { id: 'roster', label: 'Add players to roster', done: hasPlayers, time: '~2 min', page: 'roster' },
    { id: 'event', label: 'Create first event', done: hasEvents, time: '~3 min', page: 'schedule' },
    { id: 'invite', label: 'Invite parents', done: hasInvitedParents, time: '~1 min', action: () => setShowInviteModal(true) },
    { id: 'payments', label: 'Set up payments', done: hasPayments, time: '~5 min', page: 'payments' },
  ]
  const allDone = checklistItems.every(item => item.done)

  const handleDismiss = () => {
    setDismissed(true)
    if (teamId) localStorage.setItem(`tm_setup_dismissed_${teamId}`, 'true')
  }

  // ── Derived values for v2 ──
  const [activeTab, setActiveTab] = useState('roster')
  const firstName = profile?.full_name?.split(' ')[0] || 'Manager'

  const heroStats = [
    { label: 'Roster', value: rosterCount },
    { label: 'Capacity', value: registrationStatus?.capacity || '—' },
    { label: 'Overdue', value: paymentHealth?.overdueCount || 0 },
    { label: 'RSVPs', value: nextEventRsvp?.confirmed || 0 },
  ]

  const attentionItems = [
    ...(paymentHealth?.overdueCount > 0 ? [{
      icon: '💰', label: `${paymentHealth.overdueCount} overdue payments`, type: 'coral',
      onClick: () => onNavigate?.('payments'),
    }] : []),
    ...(registrationStatus?.pendingCount > 0 ? [{
      icon: '📋', label: `${registrationStatus.pendingCount} pending registrations`, type: 'amber',
      onClick: () => onNavigate?.('registrations'),
    }] : []),
  ]

  const playbookItems = [
    { icon: '✅', label: 'Attendance', onClick: () => onNavigate?.('attendance') },
    { icon: '📢', label: 'Send Blast', onClick: () => onNavigate?.('blasts') },
    { icon: '📅', label: 'Schedule', onClick: () => onNavigate?.('schedule') },
    { icon: '💬', label: 'Team Chat', onClick: () => onNavigate?.('chats') },
    { icon: '💳', label: 'Payments', onClick: () => onNavigate?.('payments') },
    { icon: '🔗', label: 'Invite Code', onClick: () => setShowInviteModal(true) },
  ]

  const tmTabs = [
    { key: 'roster', label: 'Roster' },
    { key: 'payments', label: 'Payments' },
    { key: 'schedule', label: 'Schedule' },
    { key: 'attendance', label: 'Attendance' },
  ]

  return (
    <>
      <V2DashboardLayout
        mainContent={
          <>
            {/* Hero Card */}
            <HeroCard
              orgLine={`${teamName} · ${selectedSeason?.name || 'Current Season'}`}
              greeting={`Your team is looking good, ${firstName}.`}
              subLine={`${rosterCount} players · ${upcomingEvents[0]?.title || 'No upcoming events'}`}
              stats={heroStats}
            />

            {/* Attention Strip */}
            {attentionItems.length > 0 && (
              <AttentionStrip items={attentionItems} />
            )}

            {/* Getting Started Checklist — restyled but preserved */}
            {!dismissed && !loading && (
              <div style={{
                background: '#FFFFFF', borderRadius: 16, padding: 20,
                fontFamily: 'var(--v2-font)',
                border: '1px solid var(--v2-border-subtle)',
              }}>
                {allDone ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 style={{ width: 20, height: 20, color: '#10B981' }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--v2-text-primary)' }}>Setup complete!</span>
                    </div>
                    <button onClick={handleDismiss} style={{ fontSize: 12, fontWeight: 600, color: 'var(--v2-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v2-text-muted)' }}>Getting Started</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--v2-text-muted)' }}>
                        {checklistItems.filter(i => i.done).length}/{checklistItems.length}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--v2-text-secondary)', marginBottom: 14 }}>Complete these steps to get your team running</p>
                    {checklistItems.map(item => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 0',
                        borderBottom: '1px solid var(--v2-border-subtle)',
                      }}>
                        {item.done
                          ? <CheckCircle2 style={{ width: 20, height: 20, color: '#10B981', flexShrink: 0 }} />
                          : <Circle style={{ width: 20, height: 20, color: 'var(--v2-text-muted)', flexShrink: 0 }} />
                        }
                        <span style={{
                          flex: 1, fontSize: 13, fontWeight: 500,
                          color: item.done ? 'var(--v2-text-muted)' : 'var(--v2-text-primary)',
                          textDecoration: item.done ? 'line-through' : 'none',
                        }}>{item.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>{item.time}</span>
                        {!item.done && (
                          <button
                            onClick={() => item.action ? item.action() : onNavigate?.(item.page)}
                            style={{ fontSize: 11, fontWeight: 700, color: 'var(--v2-sky)', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            {item.action ? 'Share Code' : item.id === 'roster' ? 'Add Players' : item.id === 'event' ? 'Create Event' : 'Set Up'}
                          </button>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Body Tabs */}
            <BodyTabs
              tabs={tmTabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === 'roster' && (
                <RosterStatusCard data={registrationStatus} rosterCount={rosterCount} loading={loading} onNavigate={onNavigate} />
              )}
              {activeTab === 'payments' && (
                <PaymentHealthCard data={paymentHealth} loading={loading} onNavigate={onNavigate} />
              )}
              {activeTab === 'schedule' && (
                <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
                  {upcomingEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--v2-text-muted)' }}>No upcoming events</div>
                  ) : (
                    upcomingEvents.slice(0, 5).map((event, i) => {
                      const evDate = new Date(event.event_date + 'T00:00:00')
                      return (
                        <div key={event.id} style={{
                          display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                          borderBottom: i < Math.min(upcomingEvents.length, 5) - 1 ? '1px solid var(--v2-border-subtle)' : 'none',
                        }}>
                          <div style={{ width: 48, textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>
                              {evDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--v2-navy)' }}>{evDate.getDate()}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--v2-text-primary)' }}>
                              {event.title || event.event_type}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>
                              {formatTime12(event.event_time)}{event.location ? ` · ${event.location}` : ''}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--v2-sky)',
                            background: 'rgba(75,185,236,0.08)', padding: '3px 8px', borderRadius: 6,
                          }}>
                            {event.event_type}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
              {activeTab === 'attendance' && (
                <RsvpSummaryCard data={nextEventRsvp} loading={loading} onNavigate={onNavigate} />
              )}
            </BodyTabs>

            {/* Mascot Nudge */}
            <MascotNudge
              message={
                paymentHealth?.overdueCount > 0
                  ? `${paymentHealth.overdueCount} overdue payment${paymentHealth.overdueCount > 1 ? 's' : ''} — send reminders to keep things on track.`
                  : rosterCount < 6
                    ? 'Your roster is light — invite more players to fill out the team.'
                    : 'Everything looks great! Your team is humming.'
              }
            />
          </>
        }
        sideContent={
          <>
            {/* Financial Snapshot */}
            <FinancialSnapshot
              title="Team Finances"
              collected={paymentHealth?.collectedAmount || 0}
              outstanding={(paymentHealth?.overdueAmount || 0) + (paymentHealth?.pendingAmount || 0)}
              breakdown={[
                { label: 'Collected', amount: paymentHealth?.collectedAmount || 0 },
                { label: 'Overdue', amount: paymentHealth?.overdueAmount || 0 },
                { label: 'Pending', amount: paymentHealth?.pendingAmount || 0 },
              ]}
            />

            {/* Upcoming Events */}
            <WeeklyLoad
              title="Upcoming"
              events={upcomingEvents.slice(0, 5).map(e => ({
                label: e.title || e.event_type,
                date: e.event_date,
                time: e.event_time,
                type: e.event_type,
              }))}
            />

            {/* The Playbook */}
            <ThePlaybook actions={playbookItems} />

            {/* Milestone Card */}
            <MilestoneCard
              variant="sky"
              title="Team Progress"
              xpCurrent={rosterCount * 50 + (paymentHealth?.collectedAmount || 0) / 10}
              xpGoal={1000}
              level={Math.floor((rosterCount * 50) / 1000) + 1}
            />
          </>
        }
      />

      {/* Invite Code Modal */}
      {showInviteModal && (
        <InviteCodeModal
          teamId={teamId}
          teamName={teamName}
          onClose={() => setShowInviteModal(false)}
          showToast={showToast}
        />
      )}
    </>
  )
}

// ── Payment Health Card (v2 styled) ──
function PaymentHealthCard({ data, loading, onNavigate }) {
  if (loading) return <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--v2-text-muted)', fontSize: 13 }}>Loading...</div>
  if (!data) return null

  const hasOverdue = data.overdueCount > 0

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{
          padding: 14, borderRadius: 10, textAlign: 'center',
          background: hasOverdue ? 'rgba(239,68,68,0.08)' : 'var(--v2-surface)',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: hasOverdue ? 'var(--v2-coral)' : 'var(--v2-text-primary)' }}>{data.overdueCount}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>Overdue</div>
          {hasOverdue && <div style={{ fontSize: 11, color: 'var(--v2-coral)', fontWeight: 600 }}>${data.overdueAmount.toLocaleString()}</div>}
        </div>
        <div style={{ padding: 14, borderRadius: 10, textAlign: 'center', background: 'var(--v2-surface)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-text-primary)' }}>{data.pendingCount}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>Pending</div>
        </div>
        <div style={{ padding: 14, borderRadius: 10, textAlign: 'center', background: 'rgba(16,185,129,0.08)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--v2-green)' }}>${data.collectedAmount.toLocaleString()}</div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'var(--v2-text-muted)' }}>Collected</div>
        </div>
      </div>

      {hasOverdue && (
        <button onClick={() => onNavigate?.('payments')} style={{
          width: '100%', padding: 10, borderRadius: 10,
          fontSize: 12, fontWeight: 700,
          background: 'var(--v2-coral)', color: '#FFFFFF',
          border: 'none', cursor: 'pointer',
        }}>
          Send Reminders
        </button>
      )}
    </div>
  )
}

// ── RSVP Summary Card (v2 styled) ──
function RsvpSummaryCard({ data, loading, onNavigate }) {
  if (loading) return <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--v2-text-muted)', fontSize: 13 }}>Loading...</div>

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      {!data ? (
        <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 13, color: 'var(--v2-text-muted)' }}>No upcoming events</div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              background: data.eventType === 'game' ? 'rgba(245,158,11,0.1)' : 'rgba(75,185,236,0.08)',
              color: data.eventType === 'game' ? 'var(--v2-amber)' : 'var(--v2-sky)',
              padding: '3px 8px', borderRadius: 6,
            }}>
              {data.eventType}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--v2-text-primary)' }}>{data.title}</span>
            <span style={{ fontSize: 12, color: 'var(--v2-text-muted)' }}>{formatEventDate(data.eventDate)}</span>
          </div>

          {/* RSVP bar */}
          <div style={{ height: 8, borderRadius: 4, background: 'var(--v2-surface)', overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
            {data.confirmed > 0 && <div style={{ height: '100%', background: '#10B981', width: `${(data.confirmed / data.totalRoster) * 100}%` }} />}
            {data.maybe > 0 && <div style={{ height: '100%', background: '#F59E0B', width: `${(data.maybe / data.totalRoster) * 100}%` }} />}
            {data.declined > 0 && <div style={{ height: '100%', background: '#EF4444', width: `${(data.declined / data.totalRoster) * 100}%` }} />}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Confirmed {data.confirmed}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} /> Maybe {data.maybe}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} /> Declined {data.declined}</span>
            {data.noResponse > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--v2-text-muted)' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--v2-surface)', display: 'inline-block' }} /> No Response {data.noResponse}</span>}
          </div>
        </>
      )}
    </div>
  )
}

// ── Roster Status Card (v2 styled) ──
function RosterStatusCard({ data, rosterCount, loading, onNavigate }) {
  if (loading) return <div style={{ padding: '20px 24px', textAlign: 'center', color: 'var(--v2-text-muted)', fontSize: 13 }}>Loading...</div>
  if (!data) return null

  const fillPercent = data.capacity > 0 ? Math.min(100, (data.filled / data.capacity) * 100) : 0

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'var(--v2-font)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--v2-text-primary)' }}>{rosterCount}</div>
          <div style={{ fontSize: 13, color: 'var(--v2-text-muted)' }}>
            {data.capacity > 0 ? `of ${data.capacity} spots filled` : 'players rostered'}
          </div>
        </div>
        {data.pendingCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            background: 'rgba(245,158,11,0.1)', color: 'var(--v2-amber)',
            padding: '4px 10px', borderRadius: 6,
          }}>
            {data.pendingCount} pending
          </span>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          background: data.isOpen ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          color: data.isOpen ? 'var(--v2-green)' : 'var(--v2-coral)',
          padding: '4px 10px', borderRadius: 6,
        }}>
          {data.isOpen ? 'Open' : 'Full'}
        </span>
      </div>

      {data.capacity > 0 && (
        <div style={{ height: 8, borderRadius: 4, background: 'var(--v2-surface)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: fillPercent >= 90 ? 'var(--v2-amber)' : 'var(--v2-sky)',
            width: `${fillPercent}%`, transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      <button onClick={() => onNavigate?.('roster')} style={{
        width: '100%', padding: 10, borderRadius: 10,
        fontSize: 12, fontWeight: 700, marginTop: 16,
        background: 'var(--v2-navy)', color: '#FFFFFF',
        border: 'none', cursor: 'pointer',
      }}>
        View Full Roster →
      </button>
    </div>
  )
}

export default TeamManagerDashboard
