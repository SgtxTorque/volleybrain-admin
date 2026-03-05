// =============================================================================
// TeamWallRightSidebar — gallery, challenges, coach card, roster, documents
// Extracted from TeamWallPage.jsx
// =============================================================================

import {
  ChevronRight, Users, FileText, BarChart3, Trophy, Award,
  Image as ImageIcon
} from '../../constants/icons'

export default function TeamWallRightSidebar({
  roster, headCoach, galleryImages, documents, activeChallenges,
  th, onNavigate, onGalleryClick, onSelectPlayer, onShoutout,
}) {
  const { cardBg, innerBg, borderColor, textPrimary, textSecondary, textMuted, shadow, shadowElevated, labelStyle, isDark, BRAND } = th

  return (
    <aside className="hidden md:flex flex-col gap-4 p-4 xl:p-5 overflow-y-auto tw-hide-scrollbar" style={{ height: '100%' }}>

      {/* Gallery */}
      <div>
        <span style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Gallery</span>
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5">
            {galleryImages.slice(0, 6).map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden cursor-pointer"
                style={{ borderRadius: 8 }} onClick={() => onGalleryClick(i)}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6" style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow }}>
            <ImageIcon className="w-8 h-8 mx-auto" style={{ color: textMuted }} />
            <p style={{ fontSize: 14, fontWeight: 500, color: textMuted, marginTop: 8 }}>No photos yet</p>
          </div>
        )}
      </div>

      {/* Challenges / Achievements / Leaderboard */}
      <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow }}>
        {[
          { icon: Trophy, label: 'Challenges', count: activeChallenges.length, nav: 'challenges' },
          { icon: Award, label: 'Achievements', nav: 'achievements' },
          { icon: BarChart3, label: 'Leaderboard', nav: 'leaderboards' },
        ].map((item, i, arr) => (
          <button key={item.label} onClick={() => onNavigate?.(item.nav)}
            className="flex items-center gap-3 w-full p-3.5 transition-all text-left"
            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${borderColor}` : 'none', color: textPrimary }}
            onMouseEnter={e => e.currentTarget.style.background = innerBg}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <item.icon className="w-5 h-5" style={{ color: BRAND.sky }} />
            <span style={{ fontSize: 16, fontWeight: 500, flex: 1 }}>{item.label}</span>
            {item.count > 0 && (
              <span style={{ fontSize: 13, fontWeight: 700, padding: '1px 8px', borderRadius: 999,
                background: isDark ? `${BRAND.sky}20` : BRAND.ice, color: BRAND.sky }}>{item.count}</span>
            )}
            <ChevronRight className="w-4 h-4" style={{ color: textMuted }} />
          </button>
        ))}
      </div>

      {/* Give Shoutout Link */}
      <div onClick={() => onShoutout(null)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderRadius: 10 }}
        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ fontSize: 18 }}>⭐</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#4BB9EC' }}>Give Shoutout</span>
      </div>

      {/* Head Coach Profile Card */}
      {headCoach && (
        <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow, cursor: 'pointer' }}
          className="flex items-center gap-3 p-4"
          onMouseEnter={e => e.currentTarget.style.boxShadow = shadowElevated}
          onMouseLeave={e => e.currentTarget.style.boxShadow = shadow}>
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: BRAND.ice, color: BRAND.deepSky, fontSize: 20, fontWeight: 700 }}>
            {headCoach.avatar_url ? (
              <img src={headCoach.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (headCoach.full_name?.charAt(0) || '?')}
          </div>
          <div>
            <span style={labelStyle}>Head Coach</span>
            <p style={{ fontSize: 17, fontWeight: 700, color: textPrimary, marginTop: 2 }}>{headCoach.full_name}</p>
            {headCoach.email && (
              <p style={{ fontSize: 14, fontWeight: 500, color: textMuted }} className="truncate">{headCoach.email}</p>
            )}
          </div>
        </div>
      )}

      {/* Team Roster */}
      <div>
        <span style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Roster · {roster.length}</span>
        <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow, overflow: 'hidden' }}>
          {roster.map((player, i) => (
            <div key={player.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
              borderBottom: i < roster.length - 1 ? `1px solid ${borderColor}` : 'none',
            }}
              onMouseEnter={e => e.currentTarget.style.background = innerBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}
                onClick={() => onSelectPlayer(player)}>
                <div className="shrink-0 overflow-hidden" style={{
                  width: 36, height: 36, borderRadius: '50%', background: BRAND.ice,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: BRAND.deepSky, fontSize: 11, fontWeight: 700,
                }}>
                  {player.photo_url ? (
                    <img src={player.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : ((player.first_name?.[0] || '') + (player.last_name?.[0] || ''))}
                </div>
                <div className="min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 600, color: textPrimary }} className="truncate">
                    {player.first_name} {player.last_name}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: isDark ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.45)' }}>
                    {player.jersey_number ? `#${player.jersey_number}` : ''}{player.jersey_number && player.position ? ' · ' : ''}{player.position || ''}
                  </p>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onShoutout({ id: player.id, full_name: `${player.first_name} ${player.last_name}`, avatar_url: player.photo_url || null, role: 'player' }) }}
                title="Give Shoutout" style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}
                onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(75,185,236,.15)' : 'rgba(75,185,236,.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                ⭐
              </button>
            </div>
          ))}
          {roster.length === 0 && (
            <div className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto" style={{ color: textMuted }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: textMuted, marginTop: 8 }}>No players yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      {documents.length > 0 && (
        <div>
          <span style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>Documents</span>
          <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: shadow, overflow: 'hidden' }}>
            {documents.slice(0, 3).map((doc, i) => (
              <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 transition-all"
                style={{ borderBottom: i < Math.min(documents.length, 3) - 1 ? `1px solid ${borderColor}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = innerBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <FileText className="h-4 w-4 shrink-0" style={{ color: textMuted }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: textSecondary }} className="truncate">{doc.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
