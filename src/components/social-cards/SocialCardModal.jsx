import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, Download, Share2, Copy } from '../../constants/icons'
import { TEMPLATE_CATEGORIES } from './registry'
import { exportCardAsPng, shareCardText, copyCardText } from './CardExporter'

// ============================================
// SOCIAL CARD MODAL — Shared shell
// ============================================
// Renders any card category (gameday, schedule, results)
// with template selector, player picker, format toggle,
// and export/share/copy buttons.

// ── Lazy template imports ────────────────────────
const TEMPLATE_COMPONENTS = {
  // Game Day
  'takeover': lazy(() => import('./templates/gameday/TakeoverCard')),
  'split': lazy(() => import('./templates/gameday/SplitCard')),
  'poster': lazy(() => import('./templates/gameday/PosterCard')),
  'banner': lazy(() => import('./templates/gameday/BannerCard')),
  'scoreboard-gd': lazy(() => import('./templates/gameday/ScoreboardGDCard')),
  'headline-gd': lazy(() => import('./templates/gameday/HeadlineGDCard')),
  'minimal-gd': lazy(() => import('./templates/gameday/MinimalGDCard')),
  'badge-gd': lazy(() => import('./templates/gameday/BadgeGDCard')),
  // Schedule
  'program': lazy(() => import('./templates/schedule/ProgramCard')),
  'program-logo': lazy(() => import('./templates/schedule/ProgramLogoCard')),
  'program-light': lazy(() => import('./templates/schedule/ProgramLightCard')),
  'column-card': lazy(() => import('./templates/schedule/ColumnCard')),
  'badge-sched': lazy(() => import('./templates/schedule/BadgeScheduleCard')),
  'split-sched': lazy(() => import('./templates/schedule/SplitScheduleCard')),
  'minimal-sched': lazy(() => import('./templates/schedule/MinimalScheduleCard')),
  // Results
  'scoreboard-res': lazy(() => import('./templates/results/ScoreboardResCard')),
  'hero-score': lazy(() => import('./templates/results/HeroScoreCard')),
  'stat-line': lazy(() => import('./templates/results/StatLineCard')),
  'headline-score': lazy(() => import('./templates/results/HeadlineScoreCard')),
  'waves': lazy(() => import('./templates/results/WavesCard')),
  'tri-panel': lazy(() => import('./templates/results/TriPanelCard')),
  'urban': lazy(() => import('./templates/results/UrbanCard')),
}

// ── Helpers ──────────────────────────────────────
function fmtTime12(t) {
  if (!t) return 'TBD'
  const [h, m] = t.split(':')
  const hr = parseInt(h)
  return `${hr > 12 ? hr - 12 : hr === 0 ? 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`
}

function getCardDimensions(format, category) {
  if (category === 'schedule') {
    return format === 'wide' ? { w: 960, h: 640 } : { w: 540, h: 756 }
  }
  return format === 'wide' ? { w: 960, h: 540 } : { w: 540, h: 540 }
}

// ─────────────────────────────────────────────────
export default function SocialCardModal({
  category = 'gameday',
  event, events, team, organization, season, stats: externalStats,
  onClose, showToast,
}) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const cardRef = useRef(null)

  const catConfig = TEMPLATE_CATEGORIES[category]
  const templates = catConfig?.templates || []
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id || '')
  const [format, setFormat] = useState('square')
  const [exporting, setExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [roster, setRoster] = useState([])
  const [featuredPlayer, setFeaturedPlayer] = useState(null)
  const [gameStats, setGameStats] = useState(externalStats || null)

  const teamColor = team?.color || '#0B1628'
  const teamName = team?.name || 'Team'
  const orgName = organization?.name || ''
  const logoUrl = team?.logo_url
  const sportIcon = season?.sports?.icon || '🏐'

  // ── Load roster ────────────────────────────────
  useEffect(() => {
    if (team?.id) loadRoster()
  }, [team?.id])

  async function loadRoster() {
    const { data } = await supabase.from('team_players')
      .select('*, players(id, first_name, last_name, photo_url, jersey_number)')
      .eq('team_id', team.id)
    const players = (data || []).map(tp => tp.players).filter(Boolean)
    setRoster(players)
    const withPhoto = players.find(p => p.photo_url)
    if (withPhoto) setFeaturedPlayer(withPhoto)
  }

  // ── Load stats for results cards ───────────────
  useEffect(() => {
    if (category === 'results' && event?.id && !externalStats) loadStats()
  }, [category, event?.id])

  async function loadStats() {
    const { data } = await supabase
      .from('game_player_stats')
      .select('*, players(first_name, last_name, photo_url, jersey_number)')
      .eq('event_id', event.id)
      .order('kills', { ascending: false })
    setGameStats(data || [])
  }

  // ── Share text generation ──────────────────────
  function getShareText() {
    if (category === 'gameday') {
      const opponent = event?.opponent_name || event?.opponent || 'TBD'
      const eventDate = event?.event_date ? new Date(event.event_date + 'T00:00:00') : new Date()
      const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' })
      const monthDay = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
      return `${sportIcon} GAME DAY!\n${teamName} vs ${opponent}\n📅 ${dayName}, ${monthDay}\n⏰ ${fmtTime12(event?.event_time)}\n📍 ${event?.venue_name || 'TBD'}\n\nCome support us! 💪`
    }
    if (category === 'schedule') {
      const seasonName = season?.name || 'Season'
      return `📅 ${teamName} — ${seasonName} Schedule\nCheck out our upcoming games!\n\n🏐 Powered by Lynx`
    }
    if (category === 'results') {
      const opponent = event?.opponent_name || event?.opponent || 'TBD'
      const result = event?.game_result === 'win' ? '🏆 WIN' : event?.game_result === 'loss' ? 'LOSS' : 'TIE'
      return `${result}!\n${teamName} vs ${opponent}\n${event?.our_score || 0} - ${event?.opponent_score || 0}\n\n🏐 Powered by Lynx`
    }
    return ''
  }

  // ── Actions ────────────────────────────────────
  async function handleExport() {
    setExporting(true)
    try {
      const el = cardRef.current
      const filename = `lynx-${category}-${teamName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`
      await exportCardAsPng(el, filename)
      showToast?.('Card saved!', 'success')
    } catch (err) {
      console.error(err)
      showToast?.('Export failed — try a screenshot', 'error')
    }
    setExporting(false)
  }

  async function handleShare() {
    const ok = await shareCardText(`${teamName} - ${catConfig.label}`, getShareText())
    if (ok) showToast?.('Shared!', 'success')
  }

  async function handleCopy() {
    const ok = await copyCardText(getShareText())
    if (ok) {
      setCopied(true)
      showToast?.('Copied!', 'success')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // ── Template props ─────────────────────────────
  const dims = getCardDimensions(format, category)
  const templateProps = {
    event, events, team, organization, season,
    stats: gameStats,
    teamColor, teamName, orgName, logoUrl,
    featuredPlayer,
    format,
    width: dims.w,
    height: dims.h,
    sportIcon,
  }

  const TemplateComponent = TEMPLATE_COMPONENTS[selectedTemplate]
  const playersWithPhotos = roster.filter(p => p.photo_url)

  // ── Scale to fit ───────────────────────────────
  const maxPreviewW = 680
  const maxPreviewH = 520
  const scaleX = maxPreviewW / dims.w
  const scaleY = maxPreviewH / dims.h
  const displayScale = Math.min(scaleX, scaleY, 1)

  const categoryEmoji = category === 'gameday' ? '🏟️' : category === 'schedule' ? '📅' : '📊'

  // ═══════════════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className={`relative z-10 w-full max-w-[820px] max-h-[95vh] overflow-hidden rounded-xl ${isDark ? 'bg-lynx-midnight border-lynx-border-dark' : 'bg-white border-lynx-silver'} border shadow-2xl flex flex-col`}
        onClick={e => e.stopPropagation()}>

        {/* ── Toolbar ─────────────────────────── */}
        <div className={`flex items-center justify-between p-3 border-b ${tc.border} flex-shrink-0`}>
          <div className="flex items-center gap-3 min-w-0">
            <h2 className={`text-base font-bold ${tc.text} whitespace-nowrap`}>{categoryEmoji} {catConfig.label}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Format toggle */}
            <div className={`flex rounded-lg border ${tc.border} overflow-hidden`}>
              <button onClick={() => setFormat('square')}
                className={`px-2.5 py-1.5 text-xs font-semibold transition ${format === 'square' ? 'bg-[var(--accent-primary)] text-white' : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                1:1
              </button>
              <button onClick={() => setFormat('wide')}
                className={`px-2.5 py-1.5 text-xs font-semibold transition ${format === 'wide' ? 'bg-[var(--accent-primary)] text-white' : isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                16:9
              </button>
            </div>
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={handleCopy} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${copied ? 'bg-emerald-500/15 text-emerald-500' : isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleExport} disabled={exporting} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Download className="w-3.5 h-3.5" /> {exporting ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}>
              <X className={`w-4 h-4 ${tc.textMuted}`} />
            </button>
          </div>
        </div>

        {/* ── Template selector ───────────────── */}
        <div className={`flex items-center gap-1.5 px-4 py-2.5 border-b ${tc.border} ${isDark ? 'bg-slate-800/50' : 'bg-lynx-cloud'} overflow-x-auto flex-shrink-0`}>
          {templates.map(t => (
            <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${selectedTemplate === t.id
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : isDark ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
              title={t.desc}>
              {t.name}
            </button>
          ))}
        </div>

        {/* ── Player selector ─────────────────── */}
        {playersWithPhotos.length > 0 && (
          <div className={`flex items-center gap-2 px-4 py-2 border-b ${tc.border} ${isDark ? 'bg-slate-800/30' : 'bg-white'} flex-shrink-0 overflow-x-auto`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${tc.textMuted} whitespace-nowrap`}>Featured:</span>
            <button onClick={() => setFeaturedPlayer(null)}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition ${!featuredPlayer ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]' : isDark ? 'border-slate-600 text-slate-400' : 'border-lynx-silver text-slate-500'}`}>
              None
            </button>
            {playersWithPhotos.slice(0, 8).map(player => (
              <button key={player.id} onClick={() => setFeaturedPlayer(player)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition ${featuredPlayer?.id === player.id
                  ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
                  : isDark ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-lynx-silver text-slate-500 hover:bg-slate-100'
                }`}>
                <img src={player.photo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                #{player.jersey_number}
              </button>
            ))}
          </div>
        )}

        {/* ── Card preview ────────────────────── */}
        <div className="flex-1 overflow-auto flex justify-center items-center p-6" style={{ background: isDark ? '#080812' : '#d1d5db', minHeight: 300 }}>
          <div style={{
            transform: `scale(${displayScale})`,
            transformOrigin: 'center center',
            flexShrink: 0,
          }}>
            <div ref={cardRef} style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'hidden', width: dims.w, height: dims.h }}>
              <Suspense fallback={
                <div style={{ width: dims.w, height: dims.h, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#555', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
                  Loading template...
                </div>
              }>
                {TemplateComponent && <TemplateComponent {...templateProps} />}
              </Suspense>
            </div>
          </div>
        </div>

        {/* ── Share text footer ────────────────── */}
        <div className={`px-4 py-2.5 border-t ${tc.border} ${isDark ? 'bg-slate-800/50' : 'bg-lynx-cloud'} flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className={`text-[11px] ${tc.textMuted} max-w-lg truncate`}>
              <span className="font-semibold">Share text:</span> {getShareText().replace(/\n/g, ' · ')}
            </div>
            <button onClick={handleCopy} className={`text-[11px] font-semibold ${copied ? 'text-emerald-500' : 'text-[var(--accent-primary)]'} hover:underline whitespace-nowrap`}>
              {copied ? '✓ Copied' : 'Copy text'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
