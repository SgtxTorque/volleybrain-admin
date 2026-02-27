import { useState, useRef, useEffect } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, Download, Share2, Copy } from '../../constants/icons'

// ============================================
// GAME DAY SHARE CARD v2
// ============================================
// Branded "GAME DAY / Come Support Us!" graphics
// for parents to text, post on social, etc.

function getContrastText(hex) {
  if (!hex) return '#fff'
  const c = hex.replace('#', '')
  const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16)
  return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.55 ? '#1a1a2e' : '#ffffff'
}
function darken(hex, pct=0.3) {
  if (!hex) return '#1a1a2e'
  const c = hex.replace('#','')
  return `rgb(${Math.round(parseInt(c.substr(0,2),16)*(1-pct))},${Math.round(parseInt(c.substr(2,2),16)*(1-pct))},${Math.round(parseInt(c.substr(4,2),16)*(1-pct))})`
}
function hexToRgba(hex, a) {
  if (!hex) return `rgba(100,100,240,${a})`
  const c = hex.replace('#','')
  return `rgba(${parseInt(c.substr(0,2),16)},${parseInt(c.substr(2,2),16)},${parseInt(c.substr(4,2),16)},${a})`
}

const CARD_STYLES = [
  { id: 'bold', name: 'Bold', desc: 'Team colors' },
  { id: 'clean', name: 'Clean', desc: 'White minimal' },
  { id: 'dark', name: 'Dark', desc: 'Dark premium' },
  { id: 'hype', name: 'Hype', desc: 'Big & loud' },
]

function GameDayShareModal({ event, team, organization, season, onClose, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const cardRef = useRef(null)
  const [style, setStyle] = useState('bold')
  const [exporting, setExporting] = useState(false)
  const [roster, setRoster] = useState([])
  const [featuredPlayer, setFeaturedPlayer] = useState(null)
  const [copied, setCopied] = useState(false)

  const teamColor = team?.color || '#6366F1'
  const textOnColor = getContrastText(teamColor)
  const sportIcon = season?.sports?.icon || '🏐'

  const eventDate = event?.event_date ? new Date(event.event_date + 'T00:00:00') : new Date()
  const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const dayOfWeek = eventDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const monthShort = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const dayNum = eventDate.getDate()
  const year = eventDate.getFullYear()
  const isHomeGame = event?.location_type === 'home' || event?.is_home_game !== false
  const opponent = event?.opponent_name || event?.opponent || 'TBD'

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

  function fmtTime12(t) {
    if (!t) return 'TBD'
    const [h,m] = t.split(':'); const hr = parseInt(h)
    return `${hr>12?hr-12:hr===0?12:hr}:${m} ${hr>=12?'PM':'AM'}`
  }

  const shareText = `${sportIcon} GAME DAY!\n${team?.name} vs ${opponent}\n📅 ${dayName}, ${monthDay}\n⏰ ${fmtTime12(event?.event_time)}\n📍 ${event?.venue_name || 'TBD'}\n\nCome support us! 💪`

  async function exportCard() {
    setExporting(true)
    try {
      const el = cardRef.current
      if (window.html2canvas) {
        const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, allowTaint: true })
        const link = document.createElement('a')
        link.download = `gameday-${team?.name || 'game'}-${event?.event_date || 'card'}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        showToast?.('Game day card saved!', 'success')
      } else {
        const w = window.open('', '_blank')
        w.document.write(`<html><head><title>Game Day</title></head><body style="margin:0;display:flex;justify-content:center;background:#111">${el.outerHTML}</body></html>`)
        w.document.close()
        setTimeout(() => w.print(), 500)
      }
    } catch (err) {
      console.error(err)
      showToast?.('Export failed — try a screenshot', 'error')
    }
    setExporting(false)
  }

  async function shareCard() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${team?.name} - Game Day`, text: shareText })
      } catch (e) { if (e.name !== 'AbortError') console.error(e) }
    } else {
      await copyText()
    }
  }

  async function copyText() {
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    showToast?.('Game info copied!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  // ═══════════════════════════════════════
  // BOLD CARD — Team color background
  // ═══════════════════════════════════════
  function BoldCard() {
    return (
      <div style={{ width:540, height:540, position:'relative', overflow:'hidden', background:`linear-gradient(135deg, ${teamColor} 0%, ${teamColor}dd 60%, ${darken(teamColor,0.2)} 100%)`, fontFamily:"'Segoe UI', system-ui, sans-serif", color:textOnColor }}>
        {/* Pattern */}
        <div style={{ position:'absolute', inset:0, opacity:0.06, backgroundImage:`radial-gradient(circle at 25% 25%, ${textOnColor} 1px, transparent 1px)`, backgroundSize:'24px 24px' }} />
        {/* Player photo on right side */}
        {featuredPlayer?.photo_url && <>
          <img src={featuredPlayer.photo_url} alt="" style={{ position:'absolute', right:0, bottom:0, height:'80%', width:'45%', objectFit:'cover', objectPosition:'top' }} />
          <div style={{ position:'absolute', right:0, bottom:0, height:'80%', width:'45%', background:`linear-gradient(90deg, ${teamColor} 0%, transparent 50%)` }} />
          <div style={{ position:'absolute', right:0, bottom:0, height:'80%', width:'45%', background:`linear-gradient(0deg, ${darken(teamColor,0.3)} 0%, transparent 40%)` }} />
        </>}

        <div style={{ position:'relative', zIndex:1, padding:40, height:'100%', display:'flex', flexDirection:'column' }}>
          {/* Top */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'auto' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:4, opacity:0.6 }}>{organization?.name || 'Lynx'}</div>
            {team?.logo_url && <img src={team.logo_url} alt="" style={{ width:48, height:48, borderRadius:12, objectFit:'cover', border:`2px solid ${hexToRgba(textOnColor,0.2)}` }} />}
          </div>

          {/* Center */}
          <div>
            <div style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:6, opacity:0.7, marginBottom:8 }}>
              {sportIcon} {event?.event_type === 'tournament' ? 'TOURNAMENT DAY' : 'GAME DAY'}
            </div>
            <div style={{ fontSize:46, fontWeight:900, lineHeight:1, marginBottom:16, letterSpacing:-1, maxWidth: featuredPlayer?.photo_url ? '60%' : '100%' }}>
              {team?.name || 'Team'}
            </div>
            <div style={{ fontSize:18, fontWeight:700, padding:'10px 24px', background:`${hexToRgba(textOnColor,0.1)}`, borderRadius:12, display:'inline-block', borderLeft:`4px solid ${hexToRgba(textOnColor,0.3)}` }}>
              vs. {opponent}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ marginTop:'auto', display:'flex', justifyContent:'space-between', alignItems:'flex-end', maxWidth: featuredPlayer?.photo_url ? '55%' : '100%' }}>
            <div>
              <div style={{ fontSize:24, fontWeight:900, lineHeight:1.2 }}>{dayName}</div>
              <div style={{ fontSize:15, fontWeight:600, opacity:0.8 }}>{monthDay}, {year}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:28, fontWeight:900 }}>{fmtTime12(event?.event_time)}</div>
              {event?.venue_name && <div style={{ fontSize:12, fontWeight:600, opacity:0.7, maxWidth:180 }}>📍 {event.venue_name}</div>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════
  // CLEAN CARD — White background
  // ═══════════════════════════════════════
  function CleanCard() {
    return (
      <div style={{ width:540, height:540, position:'relative', overflow:'hidden', background:'#fff', fontFamily:"'Segoe UI', system-ui, sans-serif", color:'#1a1a2e' }}>
        <div style={{ height:6, background:teamColor }} />
        <div style={{ padding:'36px 40px', height:'calc(100% - 6px)', display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:3, color:'#999' }}>{organization?.name}</div>
            {team?.logo_url && <img src={team.logo_url} alt="" style={{ width:40, height:40, borderRadius:10, objectFit:'cover' }} />}
          </div>

          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <div style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:6, color:teamColor, marginBottom:12 }}>{sportIcon} GAME DAY</div>
            <div style={{ fontSize:42, fontWeight:900, lineHeight:1.1, marginBottom:24 }}>
              {team?.name}<br/>
              <span style={{ color:'#999', fontWeight:400, fontSize:24 }}>vs.</span> {opponent}
            </div>
            
            <div style={{ display:'flex', gap:16 }}>
              {/* Date card */}
              <div style={{ padding:'14px 20px', background:'#f8f9fa', borderRadius:14, borderLeft:`4px solid ${teamColor}`, minWidth:120 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Date</div>
                <div style={{ fontSize:15, fontWeight:800 }}>{dayName}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#666' }}>{monthDay}</div>
              </div>
              {/* Time card */}
              <div style={{ padding:'14px 20px', background:'#f8f9fa', borderRadius:14, borderLeft:`4px solid ${teamColor}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Time</div>
                <div style={{ fontSize:18, fontWeight:800 }}>{fmtTime12(event?.event_time)}</div>
              </div>
              {/* Location card */}
              {event?.venue_name && (
                <div style={{ padding:'14px 20px', background:'#f8f9fa', borderRadius:14, borderLeft:`4px solid ${teamColor}`, flex:1 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#999', textTransform:'uppercase', letterSpacing:1 }}>Location</div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{event.venue_name}</div>
                  {isHomeGame && <div style={{ fontSize:10, fontWeight:700, color:teamColor, marginTop:2 }}>🏠 HOME</div>}
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize:14, fontWeight:700, color:teamColor, textAlign:'center', marginTop:20 }}>Come support us! 💪</div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════
  // DARK CARD — Premium dark
  // ═══════════════════════════════════════
  function DarkCard() {
    return (
      <div style={{ width:540, height:540, position:'relative', overflow:'hidden', background:'#0a0a14', fontFamily:"'Segoe UI', system-ui, sans-serif", color:'#fff' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', width:400, height:400, borderRadius:'50%', filter:'blur(100px)', opacity:0.15, background:teamColor, transform:'translate(-50%,-50%)' }} />
        {featuredPlayer?.photo_url && <>
          <img src={featuredPlayer.photo_url} alt="" style={{ position:'absolute', right:-20, bottom:-20, height:'75%', width:'45%', objectFit:'cover', objectPosition:'top', opacity:0.25 }} />
          <div style={{ position:'absolute', right:-20, bottom:-20, height:'75%', width:'45%', background:'linear-gradient(90deg, #0a0a14 30%, transparent 100%)' }} />
        </>}

        <div style={{ position:'relative', zIndex:1, padding:40, height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' }}>
          {team?.logo_url && <img src={team.logo_url} alt="" style={{ width:56, height:56, borderRadius:14, objectFit:'cover', margin:'0 auto 20px', border:`2px solid ${hexToRgba(teamColor,0.3)}` }} />}
          
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:6, color:teamColor, marginBottom:12 }}>{sportIcon} GAME DAY</div>
            <div style={{ fontSize:40, fontWeight:900, lineHeight:1.1, marginBottom:8 }}>{team?.name}</div>
            <div style={{ fontSize:16, color:'#555', marginBottom:24, fontWeight:500 }}>vs. {opponent}</div>
            <div style={{ width:60, height:3, background:teamColor, margin:'0 auto 24px', borderRadius:2 }} />
            <div style={{ fontSize:22, fontWeight:800 }}>{dayName}, {monthDay}</div>
            <div style={{ fontSize:32, fontWeight:900, color:teamColor, margin:'8px 0' }}>{fmtTime12(event?.event_time)}</div>
            {event?.venue_name && <div style={{ fontSize:14, color:'#666', fontWeight:500 }}>📍 {event.venue_name}</div>}
            <div style={{ marginTop:28, fontSize:14, fontWeight:700, color:teamColor }}>Come support us! 💪</div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════
  // HYPE CARD — Big & Loud
  // ═══════════════════════════════════════
  function HypeCard() {
    return (
      <div style={{ width:540, height:540, position:'relative', overflow:'hidden', background:`linear-gradient(135deg, ${darken(teamColor,0.5)} 0%, #0a0a14 50%, ${darken(teamColor,0.4)} 100%)`, fontFamily:"'Segoe UI', system-ui, sans-serif", color:'#fff' }}>
        {/* Big diagonal team color slash */}
        <div style={{ position:'absolute', top:-100, left:-100, width:'120%', height:300, background:teamColor, transform:'rotate(-12deg)', transformOrigin:'center', opacity:0.9 }} />
        {/* Player photo */}
        {featuredPlayer?.photo_url && <>
          <img src={featuredPlayer.photo_url} alt="" style={{ position:'absolute', left:'50%', top:0, height:'55%', width:'60%', objectFit:'cover', objectPosition:'top', transform:'translateX(-50%)' }} />
          <div style={{ position:'absolute', left:'50%', top:0, height:'55%', width:'60%', transform:'translateX(-50%)', background:'linear-gradient(180deg, transparent 30%, #0a0a14 100%)' }} />
        </>}

        <div style={{ position:'relative', zIndex:2, padding:36, height:'100%', display:'flex', flexDirection:'column' }}>
          {/* Top bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {team?.logo_url && <img src={team.logo_url} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover' }} />}
              <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:3, color:getContrastText(teamColor) }}>{organization?.name}</div>
            </div>
            <div style={{ padding:'4px 12px', background:'rgba(0,0,0,0.3)', borderRadius:20, fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:2, color:getContrastText(teamColor) }}>
              {isHomeGame ? '🏠 HOME' : '✈️ AWAY'}
            </div>
          </div>

          {/* Spacer */}
          <div style={{ flex:1 }} />

          {/* Bottom content */}
          <div>
            <div style={{ fontSize:60, fontWeight:900, lineHeight:0.9, letterSpacing:-3, marginBottom:8, textShadow:'0 4px 20px rgba(0,0,0,0.5)' }}>
              GAME<br/>DAY
            </div>
            
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:800, marginBottom:4 }}>{team?.name}</div>
                <div style={{ fontSize:22, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ color:'#888', fontSize:14 }}>vs</span>
                  <span style={{ color:teamColor }}>{opponent}</span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:2, color:'#888', marginBottom:4 }}>{dayName}</div>
                <div style={{ fontSize:28, fontWeight:900, color:teamColor }}>{fmtTime12(event?.event_time)}</div>
              </div>
            </div>

            {/* Info bar */}
            <div style={{ display:'flex', gap:12, padding:'12px 16px', background:'rgba(255,255,255,0.05)', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:2, color:'#666' }}>Date</div>
                <div style={{ fontSize:13, fontWeight:800 }}>{monthDay}</div>
              </div>
              <div style={{ width:1, background:'rgba(255,255,255,0.1)' }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:2, color:'#666' }}>Time</div>
                <div style={{ fontSize:13, fontWeight:800 }}>{fmtTime12(event?.event_time)}</div>
              </div>
              {event?.venue_name && <>
                <div style={{ width:1, background:'rgba(255,255,255,0.1)' }} />
                <div style={{ flex:1.5 }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:2, color:'#666' }}>Location</div>
                  <div style={{ fontSize:12, fontWeight:700 }}>{event.venue_name}</div>
                </div>
              </>}
            </div>

            <div style={{ textAlign:'center', marginTop:14, fontSize:12, fontWeight:700, color:teamColor, letterSpacing:2 }}>
              COME SUPPORT US! 💪
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className={`relative z-10 w-full max-w-[720px] max-h-[95vh] overflow-hidden rounded-2xl ${isDark?'bg-slate-900 border-slate-700':'bg-white border-slate-200'} border shadow-2xl flex flex-col`}
        onClick={e => e.stopPropagation()}>
        
        {/* Toolbar */}
        <div className={`flex items-center justify-between p-4 border-b ${tc.border} flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <h2 className={`text-lg font-bold ${tc.text}`}>🏟️ Game Day Card</h2>
            <div className={`flex rounded-xl border ${tc.border} overflow-hidden`}>
              {CARD_STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`px-3 py-1.5 text-xs font-semibold transition ${style===s.id?'bg-[var(--accent-primary)] text-white':`${isDark?'text-slate-400 hover:bg-slate-700':'text-slate-500 hover:bg-slate-100'}`}`}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={shareCard} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:brightness-110 transition">
              <Share2 className="w-4 h-4" /> Share
            </button>
            <button onClick={copyText} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${copied ? 'bg-emerald-500/15 text-emerald-500' : isDark?'bg-slate-700 text-white hover:bg-slate-600':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={exportCard} disabled={exporting} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${isDark?'bg-slate-700 text-white hover:bg-slate-600':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Download className="w-4 h-4" /> {exporting ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className={`p-2 rounded-lg ${isDark?'hover:bg-slate-700':'hover:bg-slate-100'}`}>
              <X className={`w-5 h-5 ${tc.textMuted}`} />
            </button>
          </div>
        </div>

        {/* Player selector */}
        {roster.filter(p=>p.photo_url).length > 0 && (style === 'bold' || style === 'dark' || style === 'hype') && (
          <div className={`px-4 py-2.5 border-b ${tc.border} ${isDark?'bg-slate-800/50':'bg-slate-50'} flex items-center gap-2`}>
            <span className={`text-xs font-semibold ${tc.textMuted}`}>Featured:</span>
            <button onClick={() => setFeaturedPlayer(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${!featuredPlayer ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]' : isDark?'border-slate-600 text-slate-400':'border-slate-200 text-slate-500'}`}>
              None
            </button>
            {roster.filter(p=>p.photo_url).slice(0,6).map(player => (
              <button key={player.id} onClick={() => setFeaturedPlayer(player)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  featuredPlayer?.id===player.id ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]' : isDark?'border-slate-600 text-slate-400 hover:bg-slate-700':'border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}>
                <img src={player.photo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                #{player.jersey_number}
              </button>
            ))}
          </div>
        )}

        {/* Card Preview */}
        <div className="flex-1 overflow-auto p-8 flex justify-center items-center" style={{ background:isDark?'#080812':'#d1d5db' }}>
          <div ref={cardRef} style={{ boxShadow:'0 25px 80px rgba(0,0,0,0.4)', borderRadius:4, overflow:'hidden', flexShrink:0 }}>
            {style === 'bold' && <BoldCard />}
            {style === 'clean' && <CleanCard />}
            {style === 'dark' && <DarkCard />}
            {style === 'hype' && <HypeCard />}
          </div>
        </div>

        {/* Quick share text preview */}
        <div className={`px-4 py-3 border-t ${tc.border} ${isDark?'bg-slate-800/50':'bg-slate-50'}`}>
          <div className="flex items-center justify-between">
            <div className={`text-xs ${tc.textMuted} max-w-lg`}>
              <span className="font-semibold">Share text:</span> {sportIcon} GAME DAY! {team?.name} vs {opponent} • {dayName}, {monthDay} • {fmtTime12(event?.event_time)} • {event?.venue_name || 'TBD'}
            </div>
            <button onClick={copyText} className={`text-xs font-semibold ${copied ? 'text-emerald-500' : 'text-[var(--accent-primary)]'} hover:underline`}>
              {copied ? '✓ Copied' : 'Copy text'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameDayShareModal
