import { useState, useEffect, useRef } from 'react'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { X, Download, Printer, Check, Image } from '../../constants/icons'

// ============================================
// SEASON SCHEDULE POSTER GENERATOR v2
// ============================================
// College-athletics-quality branded posters

const POSTER_LAYOUTS = [
  { id: 'wofford', name: 'Classic Wide', aspect: 'landscape' },
  { id: 'editorial', name: 'Editorial', aspect: 'landscape' },
  { id: 'story', name: 'Social Story', aspect: 'portrait' },
  { id: 'baruch', name: 'Clean Grid', aspect: 'landscape' },
]

function getContrastText(hex) {
  if (!hex) return '#fff'
  const c = hex.replace('#', '')
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1a1a2e' : '#ffffff'
}
function darken(hex, pct = 0.3) {
  if (!hex) return '#1a1a2e'
  const c = hex.replace('#', '')
  return `rgb(${Math.round(parseInt(c.substr(0,2),16)*(1-pct))},${Math.round(parseInt(c.substr(2,2),16)*(1-pct))},${Math.round(parseInt(c.substr(4,2),16)*(1-pct))})`
}
function lighten(hex, pct = 0.3) {
  if (!hex) return '#e2e8f0'
  const c = hex.replace('#', '')
  const f = (s) => Math.min(255, Math.round(parseInt(c.substr(s,2),16) + (255 - parseInt(c.substr(s,2),16)) * pct))
  return `rgb(${f(0)},${f(2)},${f(4)})`
}
function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(100,100,240,${alpha})`
  const c = hex.replace('#', '')
  return `rgba(${parseInt(c.substr(0,2),16)},${parseInt(c.substr(2,2),16)},${parseInt(c.substr(4,2),16)},${alpha})`
}

function SchedulePosterModal({ season, team, organization, events, onClose, showToast }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  const posterRef = useRef(null)
  
  const [layout, setLayout] = useState('wofford')
  const [allTeams, setAllTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(team || null)
  const [roster, setRoster] = useState([])
  const [featuredPlayers, setFeaturedPlayers] = useState([])
  const [exporting, setExporting] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showPlayerPicker, setShowPlayerPicker] = useState(false)
  const [gamesOnly, setGamesOnly] = useState(true)

  const teamColor = selectedTeam?.color || organization?.accent_color || '#6366F1'
  const teamColorDark = darken(teamColor, 0.4)
  const textOnColor = getContrastText(teamColor)
  const sportIcon = season?.sports?.icon || '🏐'
  const sportName = season?.sports?.name || 'Volleyball'
  const yearStr = season?.name?.match(/\d{4}/)?.[0] || new Date().getFullYear().toString()

  useEffect(() => { loadTeams() }, [season?.id])
  useEffect(() => { if (selectedTeam?.id) loadRoster() }, [selectedTeam?.id])

  async function loadTeams() {
    if (!season?.id) return
    const { data } = await supabase.from('teams').select('id, name, color, logo_url').eq('season_id', season.id).order('name')
    setAllTeams(data || [])
    if (!selectedTeam && data?.length > 0) setSelectedTeam(data[0])
  }

  async function loadRoster() {
    const { data } = await supabase.from('team_players').select('*, players(id, first_name, last_name, photo_url, jersey_number, position)').eq('team_id', selectedTeam.id)
    const players = (data || []).map(tp => tp.players).filter(Boolean)
    setRoster(players)
    setFeaturedPlayers(players.filter(p => p.photo_url).slice(0, 3).map(p => p.id))
  }

  // Events filtered for poster
  const teamEvents = events
    .filter(e => !selectedTeam || e.team_id === selectedTeam.id || e.team_id === null)
    .filter(e => !gamesOnly || e.event_type === 'game' || e.event_type === 'tournament')
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))

  const gameEvents = teamEvents.filter(e => e.event_type === 'game' || e.event_type === 'tournament')

  const eventsByMonth = {}
  teamEvents.forEach(e => {
    const key = new Date(e.event_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
    if (!eventsByMonth[key]) eventsByMonth[key] = []
    eventsByMonth[key].push(e)
  })
  const months = Object.keys(eventsByMonth)
  const featuredRoster = roster.filter(p => featuredPlayers.includes(p.id))

  // Helpers
  const fmtDate = (d) => { const x = new Date(d + 'T00:00:00'); return `${x.getMonth()+1}/${x.getDate()}` }
  const fmtMonthDay = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  const fmtTime12 = (t) => { if (!t) return ''; const [h,m] = t.split(':'); const hr = parseInt(h); return `${hr>12?hr-12:hr===0?12:hr}:${m} ${hr>=12?'PM':'AM'}` }
  const isAway = (e) => e.location_type === 'away'
  const isHome = (e) => e.location_type === 'home' || e.is_home_game !== false
  const opName = (e) => e.opponent_name || e.opponent || e.title || e.event_type

  // Export
  async function exportAsImage() {
    setExporting(true); setShowControls(false)
    await new Promise(r => setTimeout(r, 150))
    try {
      const el = posterRef.current
      if (window.html2canvas) {
        const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, allowTaint: true })
        const link = document.createElement('a')
        link.download = `${selectedTeam?.name || 'team'}-schedule-${yearStr}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } else {
        const w = window.open('', '_blank')
        w.document.write(`<html><head><title>${selectedTeam?.name} Schedule</title><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;justify-content:center;background:#111}</style></head><body>${el.outerHTML}</body></html>`)
        w.document.close()
        setTimeout(() => w.print(), 500)
      }
      showToast?.('Schedule poster exported!', 'success')
    } catch { window.print() }
    setShowControls(true); setExporting(false)
  }

  function toggleFeaturedPlayer(pid) {
    setFeaturedPlayers(prev => prev.includes(pid) ? prev.filter(id => id !== pid) : prev.length < 3 ? [...prev, pid] : [...prev.slice(1), pid])
  }

  // ═══════════════════════════════════════════════
  // POSTER: CLASSIC WIDE (Wofford-inspired)
  // ═══════════════════════════════════════════════
  function ClassicWidePoster() {
    const hasPhotos = featuredRoster.length > 0 && featuredRoster.some(p => p.photo_url)
    const cols = months.length <= 2 ? months.length : months.length <= 4 ? 2 : 3
    return (
      <div style={{ width: 1200, minHeight: 800, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${darken(teamColor,0.5)} 0%, ${darken(teamColor,0.3)} 30%, ${darken(teamColor,0.45)} 100%)`, fontFamily: "'Segoe UI', system-ui, sans-serif", color: textOnColor }}>
        {/* Diagonal stripe */}
        {hasPhotos && <div style={{ position:'absolute', top:0, right:335, bottom:0, width:3, background: teamColor, transform:'skewX(-6deg)', transformOrigin:'top' }} />}
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:`repeating-linear-gradient(45deg,transparent,transparent 40px,${textOnColor} 40px,${textOnColor} 41px)` }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', minHeight:800 }}>
          <div style={{ flex:1, padding:'44px 50px 36px', display:'flex', flexDirection:'column' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28 }}>
              {selectedTeam?.logo_url && <img src={selectedTeam.logo_url} alt="" style={{ width:72, height:72, borderRadius:14, objectFit:'cover', border:`3px solid ${hexToRgba(textOnColor,0.2)}` }} />}
              <div>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:4, opacity:0.5 }}>{organization?.name}</div>
                <div style={{ fontSize:14, fontWeight:700, textTransform:'uppercase', letterSpacing:2, opacity:0.7 }}>{sportIcon} {sportName}</div>
              </div>
            </div>

            {/* Big year + SCHEDULE */}
            <div style={{ display:'flex', alignItems:'baseline', gap:16, marginBottom:28 }}>
              <span style={{ fontSize:110, fontWeight:900, lineHeight:0.85, letterSpacing:-6 }}>{yearStr}</span>
              <div>
                <div style={{ fontSize:30, fontWeight:900, textTransform:'uppercase', letterSpacing:10 }}>SCHEDULE</div>
                <div style={{ fontSize:22, fontWeight:800, marginTop:2, color: teamColor === textOnColor ? lighten(teamColor,0.5) : teamColor }}>{selectedTeam?.name}</div>
              </div>
            </div>

            {/* Schedule columns */}
            <div style={{ flex:1, display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:'6px 28px', alignContent:'start' }}>
              {months.map(month => (
                <div key={month} style={{ marginBottom:8 }}>
                  {eventsByMonth[month].map((evt, i) => {
                    const away = isAway(evt), isG = evt.event_type==='game'||evt.event_type==='tournament'
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 0', fontSize:12.5, fontWeight:isG?700:400 }}>
                        <span style={{ fontWeight:900, fontSize:13, minWidth:34, color: teamColor===textOnColor ? lighten(teamColor,0.3) : teamColor }}>{fmtDate(evt.event_date)}</span>
                        <span style={{ fontStyle:away?'italic':'normal', opacity:isG?1:0.5 }}>
                          {away?'AT ':isHome(evt)?'VS. ':''}<span style={{ fontWeight:800, textTransform:'uppercase' }}>{opName(evt)}</span>
                          {evt.event_type==='tournament' && <sup style={{ fontSize:9 }}>*</sup>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, paddingTop:12, borderTop:`1px solid ${hexToRgba(textOnColor,0.12)}` }}>
              <div style={{ display:'flex', gap:16, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:2 }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:12, height:12, borderRadius:3, background: teamColor===textOnColor ? lighten(teamColor,0.3) : teamColor }} /> HOME</span>
                <span style={{ display:'flex', alignItems:'center', gap:5, fontStyle:'italic' }}><span style={{ width:12, height:12, borderRadius:3, background: hexToRgba(textOnColor,0.25) }} /> AWAY</span>
                {teamEvents.some(e=>e.event_type==='tournament') && <span>* TOURNAMENT</span>}
              </div>
              <div style={{ fontSize:10, fontWeight:600, opacity:0.4, letterSpacing:1 }}>Powered by VolleyBrain</div>
            </div>
          </div>

          {/* Player photos */}
          {hasPhotos && (
            <div style={{ width:340, position:'relative', display:'flex', flexDirection:'column' }}>
              {featuredRoster.filter(p=>p.photo_url).slice(0,2).map((player,i) => (
                <div key={player.id} style={{ flex:1, position:'relative', overflow:'hidden' }}>
                  <img src={player.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:300 }} />
                  <div style={{ position:'absolute', inset:0, background:`linear-gradient(${i===0?'180deg':'0deg'}, transparent 40%, ${darken(teamColor,0.6)}cc 100%)` }} />
                  <div style={{ position:'absolute', [i===0?'bottom':'top']:0, left:0, right:0, padding:'20px', color:'#fff', background:i===0?'linear-gradient(transparent,rgba(0,0,0,0.6))':'linear-gradient(rgba(0,0,0,0.6),transparent)' }}>
                    <div style={{ fontSize:36, fontWeight:900, lineHeight:1, opacity:0.3 }}>#{player.jersey_number||''}</div>
                    <div style={{ fontSize:14, fontWeight:800, textTransform:'uppercase', letterSpacing:1 }}>{player.first_name} {player.last_name}</div>
                    {player.position && <div style={{ fontSize:10, fontWeight:600, opacity:0.7, textTransform:'uppercase', letterSpacing:2 }}>{player.position}</div>}
                  </div>
                </div>
              ))}
              {featuredRoster.filter(p=>p.photo_url).length > 1 && <div style={{ position:'absolute', top:'50%', left:0, right:0, height:4, background:teamColor, transform:'translateY(-50%)', zIndex:2 }} />}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // POSTER: EDITORIAL (Dark premium)
  // ═══════════════════════════════════════════════
  function EditorialPoster() {
    return (
      <div style={{ width:1200, minHeight:800, position:'relative', overflow:'hidden', background:'#0c0c16', fontFamily:"'Segoe UI', system-ui, sans-serif", color:'#fff' }}>
        <div style={{ position:'absolute', top:-80, right:-80, width:500, height:500, borderRadius:'50%', filter:'blur(140px)', opacity:0.2, background:teamColor }} />
        <div style={{ position:'absolute', bottom:-80, left:-80, width:400, height:400, borderRadius:'50%', filter:'blur(120px)', opacity:0.1, background:teamColor }} />

        <div style={{ position:'relative', zIndex:1, padding:50 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:40 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:5, color:teamColor, marginBottom:10 }}>{organization?.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                {selectedTeam?.logo_url && <img src={selectedTeam.logo_url} alt="" style={{ width:56, height:56, borderRadius:12, objectFit:'cover', border:`2px solid ${hexToRgba(teamColor,0.3)}` }} />}
                <div>
                  <div style={{ fontSize:48, fontWeight:900, lineHeight:1, letterSpacing:-2 }}>{selectedTeam?.name}</div>
                  <div style={{ fontSize:13, color:'#666', fontWeight:500, marginTop:4 }}>{sportIcon} {sportName} • {season?.name} • {gameEvents.length} Games</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:120, fontWeight:900, lineHeight:0.8, letterSpacing:-8, color:teamColor, opacity:0.85 }}>{yearStr}</div>
              <div style={{ fontSize:22, fontWeight:900, textTransform:'uppercase', letterSpacing:10, marginTop:4 }}>SCHEDULE</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {months.map(month => (
              <div key={month} style={{ flex:'1 1 200px', minWidth:180, background:'rgba(255,255,255,0.03)', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ padding:'12px 18px', background:`linear-gradient(135deg, ${teamColor}, ${darken(teamColor,0.2)})`, color:getContrastText(teamColor), fontSize:13, fontWeight:900, textTransform:'uppercase', letterSpacing:4 }}>{month}</div>
                <div style={{ padding:'8px 18px 14px' }}>
                  {eventsByMonth[month].map((evt,i) => {
                    const isG = evt.event_type==='game'||evt.event_type==='tournament', away = isAway(evt)
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:i<eventsByMonth[month].length-1?'1px solid rgba(255,255,255,0.04)':'none', fontSize:12, fontWeight:isG?600:400, opacity:isG?1:0.4 }}>
                        <span style={{ fontWeight:800, color:teamColor, minWidth:32, fontSize:11 }}>{fmtDate(evt.event_date)}</span>
                        <span style={{ color:away?'#888':'#fff', fontStyle:away?'italic':'normal', textTransform:'uppercase', fontSize:11, fontWeight:700, letterSpacing:0.5 }}>
                          {away?'at ':isHome(evt)?'vs. ':''}{opName(evt)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:28, display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:10, color:'#444' }}>
            <div style={{ display:'flex', gap:16, fontWeight:700, textTransform:'uppercase', letterSpacing:2 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:3, background:teamColor }} /> HOME</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontStyle:'italic' }}><span style={{ width:10, height:10, borderRadius:3, background:'#333' }} /> AWAY</span>
            </div>
            <span style={{ letterSpacing:2 }}>Powered by VolleyBrain</span>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // POSTER: SOCIAL STORY (9:16, Lafayette-inspired)
  // ═══════════════════════════════════════════════
  function StoryPoster() {
    const hasPhoto = featuredRoster.length > 0 && featuredRoster[0]?.photo_url
    return (
      <div style={{ width:540, minHeight:960, position:'relative', overflow:'hidden', background:`linear-gradient(180deg, ${darken(teamColor,0.5)} 0%, ${darken(teamColor,0.35)} 30%, ${darken(teamColor,0.5)} 100%)`, fontFamily:"'Segoe UI', system-ui, sans-serif", color:textOnColor }}>
        {hasPhoto && <>
          <img src={featuredRoster[0].photo_url} alt="" style={{ position:'absolute', top:0, left:0, right:0, height:'50%', width:'100%', objectFit:'cover', objectPosition:'top' }} />
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'50%', background:`linear-gradient(180deg, ${hexToRgba(darken(teamColor,0.5),0.3)} 0%, ${darken(teamColor,0.5)} 100%)` }} />
        </>}
        <div style={{ position:'absolute', top:0, right:60, width:2, height:'100%', background:hexToRgba(textOnColor,0.06), transform:'skewX(-8deg)' }} />

        <div style={{ position:'relative', zIndex:1, padding:'40px 32px' }}>
          <div style={{ textAlign:'center', marginBottom:8 }}>
            {selectedTeam?.logo_url && <img src={selectedTeam.logo_url} alt="" style={{ width:56, height:56, borderRadius:14, objectFit:'cover', margin:'0 auto 10px', border:`2px solid ${hexToRgba(textOnColor,0.2)}` }} />}
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:5, opacity:0.5 }}>{organization?.name}</div>
          </div>

          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:90, fontWeight:900, lineHeight:0.85, letterSpacing:-6 }}>{yearStr}</div>
            <div style={{ fontSize:22, fontWeight:900, textTransform:'uppercase', letterSpacing:10, marginTop:4 }}>SCHEDULE</div>
            <div style={{ fontSize:20, fontWeight:800, marginTop:8, letterSpacing:1 }}>{selectedTeam?.name}</div>
          </div>

          {months.map(month => (
            <div key={month} style={{ marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:900, textTransform:'uppercase', letterSpacing:5, padding:'8px 16px', background:hexToRgba(textOnColor,0.1), borderRadius:8, textAlign:'center', marginBottom:6 }}>{month}</div>
              {eventsByMonth[month].map((evt,i) => {
                const isG = evt.event_type==='game'||evt.event_type==='tournament', away = isAway(evt)
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 12px', fontSize:13, fontWeight:isG?700:400, opacity:isG?1:0.4 }}>
                    <span style={{ fontWeight:900, fontSize:12, minWidth:30 }}>{fmtDate(evt.event_date)}</span>
                    <span style={{ textAlign:'right', fontStyle:away?'italic':'normal', textTransform:'uppercase', fontSize:12, fontWeight:800, letterSpacing:0.5 }}>
                      {away&&'at '}{isHome(evt)&&!away&&'vs. '}{opName(evt)}{evt.event_type==='tournament'&&'*'}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}

          <div style={{ textAlign:'center', marginTop:20, display:'flex', justifyContent:'center', gap:16, fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:3, opacity:0.5 }}>
            <span>HOME</span><span>|</span><span style={{ fontStyle:'italic' }}>AWAY</span>
            {teamEvents.some(e=>e.event_type==='tournament')&&<><span>|</span><span>*TOURNEY</span></>}
          </div>
          <div style={{ textAlign:'center', marginTop:14, fontSize:9, opacity:0.3, fontWeight:600, letterSpacing:2 }}>Powered by VolleyBrain</div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // POSTER: CLEAN GRID (Baruch-inspired)
  // ═══════════════════════════════════════════════
  function CleanGridPoster() {
    const half = Math.ceil(teamEvents.length / 2)
    const col1 = teamEvents.slice(0, half), col2 = teamEvents.slice(half)
    return (
      <div style={{ width:1200, minHeight:700, position:'relative', overflow:'hidden', background:'#ffffff', fontFamily:"'Segoe UI', system-ui, sans-serif", color:'#1a1a2e' }}>
        {featuredRoster[0]?.photo_url && <>
          <img src={featuredRoster[0].photo_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.88)' }} />
        </>}

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ background:teamColor, padding:'24px 50px', color:getContrastText(teamColor), display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              {selectedTeam?.logo_url && <img src={selectedTeam.logo_url} alt="" style={{ width:48, height:48, borderRadius:10, objectFit:'cover' }} />}
              <div>
                <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:4, opacity:0.7 }}>{organization?.name}</div>
                <div style={{ fontSize:26, fontWeight:900, textTransform:'uppercase', letterSpacing:2 }}>{selectedTeam?.name||'Team'} {sportName.toUpperCase()} SCHEDULE</div>
              </div>
            </div>
            <div style={{ fontSize:44, fontWeight:900, letterSpacing:-2, opacity:0.9 }}>{yearStr}</div>
          </div>

          <div style={{ display:'flex', gap:40, padding:'32px 50px 28px' }}>
            {[col1,col2].map((col,ci) => (
              <div key={ci} style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                {col.map((evt,i) => {
                  const isG = evt.event_type==='game'||evt.event_type==='tournament', away = isAway(evt), home = isHome(evt)
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'8px 0', borderBottom:'1px solid #eee', opacity:isG?1:0.5 }}>
                      <div style={{ background:home&&!away?teamColor:'#f1f5f9', color:home&&!away?getContrastText(teamColor):'#475569', padding:'6px 14px', borderRadius:8, fontSize:13, fontWeight:900, minWidth:80, textAlign:'center', textTransform:'uppercase', letterSpacing:1 }}>
                        {fmtMonthDay(evt.event_date)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:away?'#64748b':'#1e293b', fontStyle:away?'italic':'normal' }}>
                          {away?'*':''}{opName(evt)}
                        </div>
                        {evt.event_time && <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600 }}>{fmtTime12(evt.event_time)}{evt.venue_name?` • ${evt.venue_name}`:''}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <div style={{ padding:'14px 50px', background:'#f8fafc', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:10, color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:2 }}>
            <div style={{ display:'flex', gap:20 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:14, borderRadius:4, background:teamColor }} /> HOME</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:14, height:14, borderRadius:4, background:'#f1f5f9', border:'1px solid #e2e8f0' }} /> AWAY</span>
            </div>
            <span>Powered by VolleyBrain</span>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  const currentLayout = POSTER_LAYOUTS.find(l => l.id === layout) || POSTER_LAYOUTS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <div className={`relative z-10 w-full max-w-[1500px] max-h-[95vh] overflow-hidden rounded-2xl ${isDark?'bg-slate-900 border-slate-700':'bg-white border-slate-200'} border shadow-2xl flex flex-col`} onClick={e => e.stopPropagation()}>
        
        {/* TOOLBAR */}
        {showControls && (
          <div className={`flex items-center justify-between p-4 border-b ${tc.border} flex-shrink-0`}>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className={`text-lg font-bold ${tc.text}`}>📋 Season Schedule Poster</h2>
              {allTeams.length > 1 && (
                <select value={selectedTeam?.id||''} onChange={e => setSelectedTeam(allTeams.find(t=>t.id===e.target.value))}
                  className={`text-sm px-3 py-1.5 rounded-lg border ${isDark?'bg-slate-800 border-slate-600 text-white':'bg-slate-50 border-slate-200'}`}>
                  {allTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
              <div className={`flex rounded-xl border ${tc.border} overflow-hidden`}>
                {POSTER_LAYOUTS.map(l => (
                  <button key={l.id} onClick={() => setLayout(l.id)}
                    className={`px-3 py-1.5 text-xs font-semibold transition ${layout===l.id?'bg-[var(--accent-primary)] text-white':`${isDark?'text-slate-400 hover:bg-slate-700':'text-slate-500 hover:bg-slate-100'}`}`}>{l.name}</button>
                ))}
              </div>
              <button onClick={() => setGamesOnly(!gamesOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${gamesOnly?'bg-amber-500/15 border-amber-500/30 text-amber-600':isDark?'bg-slate-800 border-slate-600 text-slate-400':'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {gamesOnly ? '🏐 Games Only' : '📅 All Events'}
              </button>
              {roster.filter(p=>p.photo_url).length > 0 && (
                <button onClick={() => setShowPlayerPicker(!showPlayerPicker)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${isDark?'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700':'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  <Image className="w-3.5 h-3.5" /> Players ({featuredPlayers.length}/3)
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportAsImage} disabled={exporting}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${isDark?'bg-slate-700 text-white hover:bg-slate-600':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Save Image'}
              </button>
              <button onClick={() => { setShowControls(false); setTimeout(()=>{window.print();setShowControls(true)},100) }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${isDark?'bg-slate-700 text-white hover:bg-slate-600':'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                <Printer className="w-4 h-4" /> Print / PDF
              </button>
              <button onClick={onClose} className={`p-2 rounded-lg ${isDark?'hover:bg-slate-700':'hover:bg-slate-100'}`}>
                <X className={`w-5 h-5 ${tc.textMuted}`} />
              </button>
            </div>
          </div>
        )}

        {/* Player picker */}
        {showPlayerPicker && showControls && (
          <div className={`px-4 py-3 border-b ${tc.border} ${isDark?'bg-slate-800/50':'bg-slate-50'}`}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${tc.textMuted} mr-2`}>Featured players (up to 3):</span>
              {roster.filter(p=>p.photo_url).map(player => (
                <button key={player.id} onClick={() => toggleFeaturedPlayer(player.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    featuredPlayers.includes(player.id)
                      ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/40 text-[var(--accent-primary)]'
                      : isDark?'border-slate-600 text-slate-400 hover:bg-slate-700':'border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}>
                  <img src={player.photo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  #{player.jersey_number} {player.first_name}
                  {featuredPlayers.includes(player.id) && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* POSTER PREVIEW */}
        <div className="flex-1 overflow-auto p-6 flex justify-center" style={{ background:isDark?'#080812':'#d1d5db' }}>
          <div ref={posterRef} style={{ boxShadow:'0 30px 100px rgba(0,0,0,0.5)', borderRadius:4, overflow:'hidden', flexShrink:0, transform:currentLayout.aspect==='portrait'?'scale(0.8)':'scale(0.7)', transformOrigin:'top center' }}>
            {layout === 'wofford' && <ClassicWidePoster />}
            {layout === 'editorial' && <EditorialPoster />}
            {layout === 'story' && <StoryPoster />}
            {layout === 'baruch' && <CleanGridPoster />}
          </div>
        </div>

        {/* Empty state */}
        {teamEvents.length === 0 && showControls && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <div className={`${isDark?'bg-slate-800':'bg-white'} rounded-2xl p-8 text-center max-w-sm`}>
              <div className="text-4xl mb-3">📅</div>
              <h3 className={`text-lg font-bold ${tc.text} mb-2`}>No events to show</h3>
              <p className={`text-sm ${tc.textMuted}`}>{gamesOnly ? 'No games found — try "All Events".' : 'Add events to generate a poster.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SchedulePosterModal
