import { useState, useEffect, useMemo } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import {
  Search, MapPin, Globe, Mail, Phone, Users, Calendar, ChevronRight,
  ChevronDown, X, Building2, Trophy, Star, SortAsc, ExternalLink,
  Filter
} from '../../constants/icons'
import { VolleyballIcon } from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// ORG DIRECTORY PAGE — Public Organization Discovery
// Glassmorphism Design — Modern Marketplace Feel
// ═══════════════════════════════════════════════════════════

const OD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Rajdhani:wght@400;500;600;700&display=swap');
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes float{0%,100%{transform:translateY(0px)}50%{transform:translateY(-6px)}}
  .od-au{animation:fadeUp .4s ease-out both}
  .od-ai{animation:fadeIn .3s ease-out both}
  .od-as{animation:scaleIn .25s ease-out both}
  .od-float{animation:float 3s ease-in-out infinite}
  .od-display{font-family:'Bebas Neue',sans-serif;letter-spacing:.05em}
  .od-heading{font-family:'Rajdhani',sans-serif;font-weight:700;letter-spacing:.04em}
  .od-label{font-family:'Rajdhani',sans-serif;font-weight:600;letter-spacing:.03em}
  .od-glass{background:rgba(255,255,255,.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.08)}
  .od-glass-solid{background:rgba(255,255,255,.05);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.08)}
  .od-glass-hover:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.14);transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.3)}
  .od-light .od-glass{background:rgba(255,255,255,.65);border-color:rgba(0,0,0,.06);box-shadow:0 4px 24px rgba(0,0,0,.06)}
  .od-light .od-glass-solid{background:rgba(255,255,255,.72);border-color:rgba(0,0,0,.06)}
  .od-light .od-glass-hover:hover{background:rgba(255,255,255,.85);border-color:rgba(0,0,0,.1);box-shadow:0 12px 40px rgba(0,0,0,.1)}
  .od-skeleton{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
  .od-light .od-skeleton{background:linear-gradient(90deg,rgba(0,0,0,.04) 25%,rgba(0,0,0,.08) 50%,rgba(0,0,0,.04) 75%);background-size:200% 100%}
`

const ACCENT = '#EAB308' // VolleyBrain yellow

const SPORT_ICONS = {
  volleyball: '🏐',
  basketball: '🏀',
  soccer: '⚽',
  baseball: '⚾',
  softball: '🥎',
  football: '🏈',
  tennis: '🎾',
  swimming: '🏊',
  track: '🏃',
  lacrosse: '🥍',
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
]

function getSportsFromOrg(org) {
  const s = org.settings || {}
  const sports = s.sports || s.enabled_sports || []
  return Array.isArray(sports) ? sports : []
}

function getLocationFromOrg(org) {
  const s = org.settings || {}
  const city = s.city || ''
  const state = s.state || ''
  if (city && state) return `${city}, ${state}`
  if (city) return city
  if (state) return state
  return ''
}

// ═══════ SKELETON CARDS ═══════
function SkeletonCard() {
  return (
    <div className="od-glass rounded-xl p-6 od-au">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl od-skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded-lg od-skeleton" />
          <div className="h-3 w-1/2 rounded-lg od-skeleton" />
        </div>
      </div>
      <div className="h-3 w-full rounded-lg od-skeleton mb-2" />
      <div className="h-3 w-2/3 rounded-lg od-skeleton mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 rounded-full od-skeleton" />
        <div className="h-6 w-20 rounded-full od-skeleton" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 w-24 rounded-lg od-skeleton" />
        <div className="h-8 w-24 rounded-lg od-skeleton" />
      </div>
    </div>
  )
}

// ═══════ ORG CARD ═══════
function OrgCard({ org, onSelect, isDark, index }) {
  const sports = getSportsFromOrg(org)
  const location = getLocationFromOrg(org)
  const s = org.settings || {}
  const description = s.mission || s.tagline || ''

  return (
    <button
      onClick={() => onSelect(org)}
      className={`od-glass od-glass-hover rounded-xl p-6 text-left w-full transition-all duration-300 cursor-pointer od-au`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-4 mb-4">
        {/* Logo / Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold overflow-hidden shrink-0 shadow-lg"
          style={{
            background: org.logo_url ? 'transparent' : (s.primary_color || ACCENT),
            color: '#000',
          }}
        >
          {org.logo_url ? (
            <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            org.name?.charAt(0)?.toUpperCase() || '?'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>
            {org.name}
          </h3>
          {location && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className={`w-3 h-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4 line-clamp-2`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {description}
        </p>
      )}

      {/* Sport Tags */}
      {sports.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sports.map(sport => (
            <span
              key={sport}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-700'}`}
            >
              <span>{SPORT_ICONS[sport?.toLowerCase()] || '🏆'}</span>
              {sport?.charAt(0).toUpperCase() + sport?.slice(1)}
            </span>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
        <div className="flex items-center gap-4">
          {org._teamCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Users className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {org._teamCount} team{org._teamCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {org._seasonCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {org._seasonCount} season{org._seasonCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <div
          className="flex items-center gap-1 text-xs font-bold"
          style={{ color: ACCENT }}
        >
          View Details
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </button>
  )
}

// ═══════ ORG DETAIL SLIDE-OVER ═══════
function OrgDetailPanel({ org, isOpen, onClose, isDark, onJoin }) {
  const [seasons, setSeasons] = useState([])
  const [loadingSeasons, setLoadingSeasons] = useState(false)

  const s = org?.settings || {}
  const sports = getSportsFromOrg(org || {})
  const location = getLocationFromOrg(org || {})

  useEffect(() => {
    if (org?.id && isOpen) loadSeasons()
  }, [org?.id, isOpen])

  async function loadSeasons() {
    setLoadingSeasons(true)
    try {
      const { data } = await supabase
        .from('seasons')
        .select('id, name, sport, start_date, end_date, status')
        .eq('organization_id', org.id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
      setSeasons(data || [])
    } catch (err) {
      console.error('Error loading seasons:', err)
    }
    setLoadingSeasons(false)
  }

  if (!org) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] od-ai" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full max-w-lg z-[9999] transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: isDark ? '#0f172a' : '#f8fafc' }}
      >
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between" style={{ background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(248,250,252,0.95)', backdropFilter: 'blur(12px)' }}>
            <h2 className={`od-heading text-sm uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Organization Details</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/[0.05] text-slate-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pb-8 space-y-6">
            {/* Org Hero */}
            <div className="od-as flex flex-col items-center text-center pt-4">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold overflow-hidden shadow-xl mb-4"
                style={{
                  background: org.logo_url ? 'transparent' : (s.primary_color || ACCENT),
                  color: '#000',
                }}
              >
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  org.name?.charAt(0)?.toUpperCase() || '?'
                )}
              </div>
              <h2 className={`od-display text-3xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{org.name}</h2>
              {location && (
                <div className="flex items-center gap-1.5 mt-2">
                  <MapPin className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{location}</span>
                </div>
              )}
              {s.founded_year && (
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-1`}>Est. {s.founded_year}</p>
              )}
            </div>

            {/* Sport Tags */}
            {sports.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 od-au" style={{ animationDelay: '80ms' }}>
                {sports.map(sport => (
                  <span
                    key={sport}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-700'}`}
                  >
                    <span>{SPORT_ICONS[sport?.toLowerCase()] || '🏆'}</span>
                    {sport?.charAt(0).toUpperCase() + sport?.slice(1)}
                  </span>
                ))}
              </div>
            )}

            {/* Description / Mission */}
            {(s.mission || s.tagline) && (
              <div className="od-glass rounded-xl p-5 od-au" style={{ animationDelay: '120ms' }}>
                <h3 className={`od-heading text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2`}>About</h3>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} leading-relaxed`}>
                  {s.mission || s.tagline}
                </p>
              </div>
            )}

            {/* Contact Info */}
            <div className="od-glass rounded-xl p-5 od-au" style={{ animationDelay: '160ms' }}>
              <h3 className={`od-heading text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3`}>Contact</h3>
              <div className="space-y-3">
                {(s.contact_email || s.secondary_email) && (
                  <div className="flex items-center gap-3">
                    <Mail className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <a
                      href={`mailto:${s.contact_email || s.secondary_email}`}
                      className="text-sm hover:underline"
                      style={{ color: ACCENT }}
                    >
                      {s.contact_email || s.secondary_email}
                    </a>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <a href={`tel:${s.phone}`} className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{s.phone}</a>
                  </div>
                )}
                {s.website && (
                  <div className="flex items-center gap-3">
                    <Globe className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <a
                      href={s.website.startsWith('http') ? s.website : `https://${s.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline flex items-center gap-1"
                      style={{ color: ACCENT }}
                    >
                      {s.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {(s.city || s.address) && (
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-4 h-4 mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {[s.address, s.city, s.state, s.zip].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Media */}
            {(s.facebook || s.instagram || s.twitter) && (
              <div className="od-glass rounded-xl p-5 od-au" style={{ animationDelay: '200ms' }}>
                <h3 className={`od-heading text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3`}>Follow Us</h3>
                <div className="flex gap-3">
                  {s.facebook && (
                    <a href={s.facebook.startsWith('http') ? s.facebook : `https://facebook.com/${s.facebook}`} target="_blank" rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition ${isDark ? 'bg-white/[0.06] hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                      Facebook
                    </a>
                  )}
                  {s.instagram && (
                    <a href={s.instagram.startsWith('http') ? s.instagram : `https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition ${isDark ? 'bg-white/[0.06] hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                      Instagram
                    </a>
                  )}
                  {s.twitter && (
                    <a href={s.twitter.startsWith('http') ? s.twitter : `https://x.com/${s.twitter}`} target="_blank" rel="noopener noreferrer"
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition ${isDark ? 'bg-white/[0.06] hover:bg-white/10 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                      X / Twitter
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Active Seasons */}
            <div className="od-glass rounded-xl p-5 od-au" style={{ animationDelay: '240ms' }}>
              <h3 className={`od-heading text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-3`}>
                Active Seasons
              </h3>
              {loadingSeasons ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
                </div>
              ) : seasons.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No active seasons right now</p>
              ) : (
                <div className="space-y-2">
                  {seasons.map(season => (
                    <div key={season.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm" style={{ background: `${ACCENT}15` }}>
                        {SPORT_ICONS[season.sport?.toLowerCase()] || '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'} truncate`}>{season.name}</p>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {season.start_date ? new Date(season.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'TBD'}
                          {season.end_date && ` — ${new Date(season.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                        </p>
                      </div>
                      {org.slug && (
                        <a
                          href={`/register/${org.slug}/${season.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-black transition hover:opacity-90"
                          style={{ background: ACCENT }}
                        >
                          Register
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 od-au" style={{ animationDelay: '280ms' }}>
              <div className={`od-glass rounded-xl p-4 text-center`}>
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>{org._teamCount || 0}</p>
                <p className={`od-label text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Teams</p>
              </div>
              <div className={`od-glass rounded-xl p-4 text-center`}>
                <p className="text-2xl font-bold" style={{ color: ACCENT }}>{org._seasonCount || 0}</p>
                <p className={`od-label text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Seasons</p>
              </div>
            </div>

            {/* Join CTA */}
            <div className="od-au" style={{ animationDelay: '320ms' }}>
              <button
                onClick={() => onJoin(org)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-bold text-black transition hover:opacity-90 hover:scale-[1.01]"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #F59E0B)` }}
              >
                <Building2 className="w-5 h-5" />
                Join This Organization
              </button>
              <p className={`text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mt-2`}>
                Sign up or log in to register for a season
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════ MAIN PAGE ═══════
function OrgDirectoryPage({ isEmbedded, onNavigateToLogin }) {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [sportFilter, setSportFilter] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState(null)

  // Detect theme (for embedded mode, use theme context; for standalone, dark default)
  let isDark = true
  try {
    const theme = useTheme()
    isDark = theme.isDark
  } catch {
    // Not wrapped in ThemeProvider — standalone mode, use dark
  }

  useEffect(() => { loadOrgs() }, [])

  async function loadOrgs() {
    setLoading(true)
    setError(null)
    try {
      const { data: orgData, error: orgErr } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url, settings, is_active, created_at')
        .eq('is_active', true)
        .order('name')

      if (orgErr) {
        // RLS might block anon access
        if (orgErr.code === '42501' || orgErr.message?.includes('permission') || orgErr.message?.includes('policy')) {
          setError('rls')
        } else {
          setError('generic')
          console.error('Error loading orgs:', orgErr)
        }
        setLoading(false)
        return
      }

      const organizations = orgData || []

      // Enrich with counts
      if (organizations.length > 0) {
        const orgIds = organizations.map(o => o.id)

        // Get season counts per org
        const { data: seasonData } = await supabase
          .from('seasons')
          .select('organization_id')
          .in('organization_id', orgIds)

        const seasonCountMap = {}
        for (const s of (seasonData || [])) {
          seasonCountMap[s.organization_id] = (seasonCountMap[s.organization_id] || 0) + 1
        }

        // Get active season IDs for team counting
        const { data: activeSeasons } = await supabase
          .from('seasons')
          .select('id, organization_id')
          .in('organization_id', orgIds)
          .eq('status', 'active')

        const seasonToOrg = {}
        for (const s of (activeSeasons || [])) {
          seasonToOrg[s.id] = s.organization_id
        }

        const activeSeasonIds = Object.keys(seasonToOrg)
        let teamCountMap = {}

        if (activeSeasonIds.length > 0) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('season_id')
            .in('season_id', activeSeasonIds)

          for (const t of (teamData || [])) {
            const oid = seasonToOrg[t.season_id]
            if (oid) teamCountMap[oid] = (teamCountMap[oid] || 0) + 1
          }
        }

        for (const org of organizations) {
          org._teamCount = teamCountMap[org.id] || 0
          org._seasonCount = seasonCountMap[org.id] || 0
        }
      }

      setOrgs(organizations)
    } catch (err) {
      console.error('Error loading orgs:', err)
      setError('generic')
    }
    setLoading(false)
  }

  // Derive unique sports & states from data
  const allSports = useMemo(() => {
    const set = new Set()
    orgs.forEach(o => getSportsFromOrg(o).forEach(s => set.add(s)))
    return [...set].sort()
  }, [orgs])

  const allStates = useMemo(() => {
    const set = new Set()
    orgs.forEach(o => {
      const st = (o.settings || {}).state
      if (st) set.add(st)
    })
    return [...set].sort()
  }, [orgs])

  // Filter & sort
  const filteredOrgs = useMemo(() => {
    let result = [...orgs]

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(o => {
        const s = o.settings || {}
        return (
          o.name?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q) ||
          getSportsFromOrg(o).some(sp => sp.toLowerCase().includes(q)) ||
          s.mission?.toLowerCase().includes(q)
        )
      })
    }

    // State filter
    if (stateFilter) {
      result = result.filter(o => (o.settings || {}).state === stateFilter)
    }

    // Sport filter
    if (sportFilter) {
      result = result.filter(o => getSportsFromOrg(o).some(sp => sp.toLowerCase() === sportFilter.toLowerCase()))
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'location':
        result.sort((a, b) => getLocationFromOrg(a).localeCompare(getLocationFromOrg(b)))
        break
      case 'newest':
        result.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        break
      case 'teams':
        result.sort((a, b) => (b._teamCount || 0) - (a._teamCount || 0))
        break
    }

    return result
  }, [orgs, searchQuery, stateFilter, sportFilter, sortBy])

  function handleJoinOrg(org) {
    // If there's a login handler (embedded mode), use it
    if (onNavigateToLogin) {
      onNavigateToLogin()
      return
    }
    // Otherwise, check if any active season has a slug for registration
    if (org.slug) {
      // Try to find an active season to register for
      supabase
        .from('seasons')
        .select('id')
        .eq('organization_id', org.id)
        .eq('status', 'active')
        .limit(1)
        .then(({ data }) => {
          if (data?.[0]) {
            window.location.href = `/register/${org.slug}/${data[0].id}`
          } else {
            // No active season, just go to login
            window.location.href = '/'
          }
        })
    } else {
      window.location.href = '/'
    }
  }

  const activeFilterCount = [stateFilter, sportFilter].filter(Boolean).length

  return (
    <div className={`${isDark ? '' : 'od-light'} min-h-screen`} style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
      <style>{OD_STYLES}</style>

      {/* Standalone header (when not embedded in MainApp) */}
      {!isEmbedded && (
        <header className="sticky top-0 z-50 px-4 py-3 od-ai" style={{ background: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(248,250,252,0.9)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <VolleyballIcon className="w-8 h-8" />
              <span className={`od-display text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>VolleyBrain</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="px-4 py-2 rounded-xl text-sm font-medium transition"
                style={{ color: ACCENT }}
              >
                Sign In
              </a>
              <a
                href="/"
                className="px-4 py-2 rounded-xl text-sm font-bold text-black transition hover:opacity-90"
                style={{ background: ACCENT }}
              >
                Get Started
              </a>
            </div>
          </div>
        </header>
      )}

      <div className={`max-w-7xl mx-auto ${isEmbedded ? '' : 'px-4 sm:px-6 lg:px-8'}`}>
        {/* Hero Section */}
        <div className="text-center py-10 od-au">
          <div className="od-float inline-block mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto" style={{ background: `${ACCENT}20` }}>
              <Building2 className="w-8 h-8" style={{ color: ACCENT }} />
            </div>
          </div>
          <h1 className={`od-display text-5xl sm:text-6xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Find Your League
          </h1>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'} mt-3 max-w-2xl mx-auto`}>
            Discover youth sports organizations in your area. Browse leagues, view teams, and register your player today.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="od-glass-solid rounded-xl p-4 mb-8 od-au" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search by name, city, or sport..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} border focus:outline-none focus:ring-2`}
                style={{ '--tw-ring-color': `${ACCENT}40` }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-black/[0.05] text-slate-400'}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition ${showFilters ? 'text-black' : isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:bg-white/[0.08]' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'} border`}
              style={showFilters ? { background: ACCENT } : {}}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-red-500 text-white">{activeFilterCount}</span>
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={`appearance-none pl-4 pr-10 py-3 rounded-xl text-sm font-medium ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'} border focus:outline-none cursor-pointer`}
              >
                <option value="name">A — Z</option>
                <option value="location">Location</option>
                <option value="newest">Newest</option>
                <option value="teams">Most Teams</option>
              </select>
              <SortAsc className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div className="flex-1 min-w-[150px]">
                <label className={`od-label text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'} block mb-1.5`}>State</label>
                <select
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'} border focus:outline-none`}
                >
                  <option value="">All States</option>
                  {allStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className={`od-label text-xs uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'} block mb-1.5`}>Sport</label>
                <select
                  value={sportFilter}
                  onChange={e => setSportFilter(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl text-sm ${isDark ? 'bg-white/[0.04] border-white/[0.06] text-slate-300' : 'bg-white border-slate-200 text-slate-700'} border focus:outline-none`}
                >
                  <option value="">All Sports</option>
                  {allSports.map(sp => (
                    <option key={sp} value={sp}>{sp.charAt(0).toUpperCase() + sp.slice(1)}</option>
                  ))}
                </select>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setStateFilter(''); setSportFilter('') }}
                  className={`self-end px-3 py-2.5 rounded-xl text-sm font-medium transition ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        {!loading && !error && (
          <div className={`flex items-center justify-between mb-6 od-ai`}>
            <p className={`od-label text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}

        {/* RLS Error */}
        {error === 'rls' && (
          <div className="od-glass rounded-xl p-8 text-center od-au max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Building2 className="w-8 h-8 text-red-400" />
            </div>
            <h2 className={`od-display text-2xl ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Directory Not Available Yet</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4 max-w-md mx-auto`}>
              The organization directory needs a public read policy to allow browsing without login.
            </p>
            <div className={`od-glass rounded-xl p-4 text-left text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'} font-mono max-w-lg mx-auto`}>
              <p className={`od-label text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'} mb-2 font-sans`}>Run this SQL in Supabase:</p>
              <pre className="whitespace-pre-wrap">
{`CREATE POLICY "Public read active organizations"
  ON organizations FOR SELECT
  USING (is_active = true);

-- Also allow public read on active seasons
CREATE POLICY "Public read active seasons"
  ON seasons FOR SELECT
  USING (status = 'active');

-- Allow public team counts
CREATE POLICY "Public read teams"
  ON teams FOR SELECT
  USING (true);`}
              </pre>
            </div>
          </div>
        )}

        {/* Generic Error */}
        {error === 'generic' && (
          <div className="od-glass rounded-xl p-8 text-center od-au max-w-md mx-auto">
            <p className={`text-lg ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Something went wrong</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4`}>Could not load organizations. Please try again.</p>
            <button onClick={loadOrgs} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black transition hover:opacity-90" style={{ background: ACCENT }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Org Grid */}
        {!loading && !error && filteredOrgs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pb-12">
            {filteredOrgs.map((org, i) => (
              <OrgCard
                key={org.id}
                org={org}
                onSelect={setSelectedOrg}
                isDark={isDark}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredOrgs.length === 0 && orgs.length > 0 && (
          <div className="text-center py-16 od-au">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${ACCENT}15` }}>
              <Search className="w-7 h-7" style={{ color: ACCENT }} />
            </div>
            <h3 className={`od-display text-2xl ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>No Results Found</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4`}>
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => { setSearchQuery(''); setStateFilter(''); setSportFilter('') }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-black transition hover:opacity-90"
              style={{ background: ACCENT }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* No Orgs at all */}
        {!loading && !error && orgs.length === 0 && (
          <div className="text-center py-16 od-au">
            <div className="od-float w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: `${ACCENT}15` }}>
              <Building2 className="w-7 h-7" style={{ color: ACCENT }} />
            </div>
            <h3 className={`od-display text-2xl ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Coming Soon</h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} max-w-md mx-auto`}>
              Organizations are being added to the directory. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Detail Slide-over */}
      <OrgDetailPanel
        org={selectedOrg}
        isOpen={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
        isDark={isDark}
        onJoin={handleJoinOrg}
      />
    </div>
  )
}

export { OrgDirectoryPage }
