import { useState, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useSport } from '../../contexts/SportContext'
import { supabase } from '../../lib/supabase'
import { LineupBuilderV2 } from '../../components/games/lineup-v2'
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  Layers,
  Plus,
  Loader2,
  Zap,
  FileText,
  Trash2,
} from '../../constants/icons'

// ============================================
// LINEUPS PAGE — Direct access to lineup builder
// ============================================
export default function LineupsPage({ showToast }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()
  const { user, profile, isAdmin, organization } = useAuth()
  const { selectedSeason } = useSeason()
  const { selectedSport } = useSport()

  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [games, setGames] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [gamesLoading, setGamesLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Builder state
  const [showBuilder, setShowBuilder] = useState(false)
  const [builderEvent, setBuilderEvent] = useState(null) // null = quick builder, event = game lineup

  const sport = selectedTeam?.sport || selectedSeason?.sports?.name || 'volleyball'

  // ============================================
  // DATA LOADING
  // ============================================

  // Load ALL teams on mount (not filtered by season)
  useEffect(() => {
    if (user?.id) loadTeams()
  }, [user?.id])

  // Load games and templates when team changes
  useEffect(() => {
    if (selectedTeam?.id) {
      loadGames()
      loadTemplates()
    }
  }, [selectedTeam?.id])

  async function loadTeams() {
    setLoading(true)
    try {
      if (isAdmin) {
        // Admin sees all teams across all seasons
        const { data: allTeams } = await supabase
          .from('teams')
          .select('id, name, color, season_id, seasons(id, name, sport_id, sports(id, name))')
          .order('name')

        const enriched = (allTeams || []).map(t => ({
          ...t,
          sport: t.seasons?.sports?.name?.toLowerCase() || 'volleyball',
          seasonName: t.seasons?.name,
        }))

        setTeams(enriched)
        if (enriched.length > 0) {
          const stillValid = selectedTeam && enriched.find(t => t.id === selectedTeam.id)
          if (!stillValid) setSelectedTeam(enriched[0])
        } else {
          setSelectedTeam(null)
        }
      } else {
        // Coach sees only their assigned teams (via coaches → team_coaches → teams)
        const { data: coachRecord } = await supabase
          .from('coaches')
          .select('id')
          .eq('profile_id', user.id)
          .single()

        if (!coachRecord) {
          setTeams([])
          setSelectedTeam(null)
          setLoading(false)
          return
        }

        const { data: assignments } = await supabase
          .from('team_coaches')
          .select('team_id, role, teams(id, name, color, season_id, seasons(id, name, sport_id, sports(id, name)))')
          .eq('coach_id', coachRecord.id)

        const coachTeams = (assignments || [])
          .map(a => ({
            ...a.teams,
            coachRole: a.role,
            sport: a.teams?.seasons?.sports?.name?.toLowerCase() || 'volleyball',
            seasonName: a.teams?.seasons?.name,
          }))
          .filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name))

        setTeams(coachTeams)
        if (coachTeams.length > 0) {
          const stillValid = selectedTeam && coachTeams.find(t => t.id === selectedTeam.id)
          if (!stillValid) setSelectedTeam(coachTeams[0])
        } else {
          setSelectedTeam(null)
        }
      }
    } catch (err) {
      console.error('Error loading teams:', err)
      setTeams([])
      setSelectedTeam(null)
    }
    setLoading(false)
  }

  async function loadGames() {
    if (!selectedTeam?.id) return
    setGamesLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: upcomingGames } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .eq('event_type', 'game')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(10)

      setGames(upcomingGames || [])
    } catch (err) {
      console.error('Error loading games:', err)
      setGames([])
    }
    setGamesLoading(false)
  }

  async function loadTemplates() {
    if (!selectedTeam?.id) return
    setTemplatesLoading(true)
    try {
      const { data: templateData } = await supabase
        .from('lineup_templates')
        .select('*')
        .eq('team_id', selectedTeam.id)
        .order('created_at', { ascending: false })

      setTemplates(templateData || [])
    } catch (err) {
      // Table may not exist yet — gracefully handle
      console.warn('Could not load templates:', err?.message)
      setTemplates([])
    }
    setTemplatesLoading(false)
  }

  async function deleteTemplate(templateId) {
    try {
      await supabase.from('lineup_templates').delete().eq('id', templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      showToast?.('Template deleted', 'success')
    } catch (err) {
      console.error('Error deleting template:', err)
      showToast?.('Failed to delete template', 'error')
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function formatTime(timeStr) {
    if (!timeStr) return ''
    const [h, m] = timeStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${m} ${ampm}`
  }

  function openBuilder(event) {
    setBuilderEvent(event)
    setShowBuilder(true)
  }

  function closeBuilder() {
    setShowBuilder(false)
    setBuilderEvent(null)
    // Refresh games in case lineup was saved
    if (selectedTeam) loadGames()
  }

  // ============================================
  // STYLES
  // ============================================

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-lynx-border-dark'
    : 'bg-white border border-lynx-silver'
  const labelCls = `text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className={`min-h-screen ${isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud'}`}>
      <div className="w-full py-4 space-y-6 animate-page-in px-6">

        {/* Page Header */}
        <div>
          <p className={labelCls}>Build & Manage</p>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
            Lineups
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            Build lineups for upcoming games or practice with the quick builder
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--accent-primary)' }} />
          </div>
        )}

        {/* No teams */}
        {!loading && teams.length === 0 && (
          <div className={`${cardBg} rounded-2xl p-12 text-center`}>
            <span className="text-5xl">🏐</span>
            <h2 className={`text-xl font-bold mt-4 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
              No Teams Found
            </h2>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              No teams found for this season. Create teams first to build lineups.
            </p>
          </div>
        )}

        {/* Team Selector */}
        {!loading && teams.length > 0 && (
          <>
            <div className={`${cardBg} rounded-xl p-2`}>
              <div className="flex items-center gap-2 overflow-x-auto">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`px-5 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition font-semibold ${
                      selectedTeam?.id === team.id
                        ? 'text-white shadow-lg'
                        : isDark ? 'text-slate-300 hover:bg-white/5' : 'text-lynx-slate hover:bg-lynx-frost'
                    }`}
                    style={selectedTeam?.id === team.id ? {
                      backgroundColor: team.color || 'var(--accent-primary)',
                      boxShadow: `0 4px 20px ${team.color || 'var(--accent-primary)'}40`
                    } : {}}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: team.color || 'var(--accent-primary)' }}
                    />
                    {team.name}
                    <span className="text-xs opacity-60 ml-1">
                      {team.sport === 'basketball' ? '\u{1F3C0}' :
                       team.sport === 'baseball' ? '\u{26BE}' :
                       team.sport === 'softball' ? '\u{1F94E}' :
                       team.sport === 'soccer' ? '\u{26BD}' :
                       team.sport === 'football' ? '\u{1F3C8}' :
                       team.sport === 'flag_football' ? '\u{1F3F3}' :
                       team.sport === 'volleyball' ? '\u{1F3D0}' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* LEFT COLUMN (2/3) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Quick Lineup Builder — Most Prominent */}
                <div
                  className={`${cardBg} rounded-2xl p-6 relative overflow-hidden`}
                >
                  {/* Accent gradient background */}
                  <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      background: `linear-gradient(135deg, var(--accent-primary) 0%, transparent 60%)`
                    }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.15 }}
                          >
                            <Zap className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                          </div>
                          <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                              Quick Lineup Builder
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                              Open the lineup builder without a specific game
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                          Drag and drop players into positions, plan rotations, and save templates for later.
                          Perfect for practice planning or pre-season preparation.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openBuilder(null)}
                      disabled={!selectedTeam}
                      className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        boxShadow: '0 4px 20px rgba(75, 185, 236, 0.3)'
                      }}
                    >
                      <Layers className="w-5 h-5" />
                      Open Lineup Builder
                    </button>
                  </div>
                </div>

                {/* Upcoming Games Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                      Upcoming Games
                    </h2>
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                      ({games.length})
                    </span>
                  </div>

                  {gamesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                    </div>
                  ) : games.length === 0 ? (
                    <div className={`${cardBg} rounded-2xl p-10 text-center`}>
                      <span className="text-4xl">📅</span>
                      <h3 className={`text-base font-bold mt-3 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                        No Upcoming Games
                      </h3>
                      <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                        No upcoming games scheduled. Use the Quick Builder above to practice lineups.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {games.map(game => (
                        <div
                          key={game.id}
                          className={`${cardBg} rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition hover:shadow-md`}
                        >
                          {/* Game info */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-bold text-base truncate ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                              {game.title || game.opponent || 'Game'}
                            </h3>
                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(game.event_date)}
                              </span>
                              {game.event_time && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatTime(game.event_time)}
                                </span>
                              )}
                              {game.location && (
                                <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                  {game.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Set Lineup button */}
                          <button
                            onClick={() => openBuilder(game)}
                            className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              backgroundColor: 'var(--accent-primary)',
                            }}
                          >
                            <Layers className="w-4 h-4" />
                            Set Lineup
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN (1/3) — Templates */}
              <div className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                    Saved Templates
                  </h2>
                </div>

                {templatesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
                  </div>
                ) : templates.length === 0 ? (
                  <div className={`${cardBg} rounded-2xl p-8 text-center`}>
                    <span className="text-4xl">📋</span>
                    <h3 className={`text-base font-bold mt-3 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                      No Saved Templates
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
                      Save a lineup as a template from the builder to reuse it later.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map(template => (
                      <div
                        key={template.id}
                        className={`${cardBg} rounded-xl p-4 transition hover:shadow-md`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                              {template.name || 'Untitled Template'}
                            </h4>
                            {template.formation && (
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                                {template.formation}
                              </p>
                            )}
                            {template.created_at && (
                              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-lynx-slate'}`}>
                                {new Date(template.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openBuilder(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                              style={{ color: 'var(--accent-primary)' }}
                              title="Load this template in the builder"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className={`p-1.5 rounded-lg transition ${
                                isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title="Delete template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Lineup Builder V2 — Full-screen overlay */}
      {showBuilder && selectedTeam && (
        <LineupBuilderV2
          event={builderEvent}
          team={selectedTeam}
          sport={sport}
          onClose={closeBuilder}
          onSave={() => {
            loadGames()
            loadTemplates()
          }}
          showToast={showToast}
        />
      )}
    </div>
  )
}
