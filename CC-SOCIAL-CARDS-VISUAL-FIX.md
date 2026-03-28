# CC-SOCIAL-CARDS-VISUAL-FIX

## PURPOSE
The Phase 3 game day card templates were implemented but do NOT match the reference HTML designs. They look generic, the fonts aren't loading correctly, the gradients are wrong, the typography-only cards look empty, and the photo integration is off. This spec fixes every template to match the reference quality.

## PRIORITY: This is a visual quality pass. Every pixel matters.

## REPO
```bash
cd volleybrain-admin
git checkout feat/desktop-dashboard-redesign
```

## REFERENCE
Open `lynx-gameday-templates-v2.html` in a browser. This is the EXACT visual target for every template. If your implementation doesn't look like this file, it's wrong.

---

## FIX 0: FONTS

**This is the #1 problem.** The fonts are not loading or not being applied correctly.

### 0A: Verify Google Fonts link in index.html
**Check:** `public/index.html` (or `index.html` at repo root)

Ensure this EXACT link tag is in the `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;600;700&family=Rajdhani:wght@500;600;700&family=Teko:wght@400;500;600;700&display=swap" rel="stylesheet">
```

If it's missing or different, add it. If it's there, the issue is in how the fonts are referenced in inline styles.

### 0B: Font family strings in templates
Every template MUST use these exact font-family strings in inline styles:

```javascript
// Display headlines ("GAME DAY", big text)
fontFamily: "'Bebas Neue', sans-serif"

// Team names, opponent names
fontFamily: "'Oswald', sans-serif"

// Labels, dates, small caps text
fontFamily: "'Rajdhani', sans-serif"

// Body text (rarely used)
fontFamily: "'Inter', sans-serif"
```

**CRITICAL:** The quotes around the font name inside the string are required. `'Bebas Neue'` not `Bebas Neue`. Without the inner quotes, CSS falls back to sans-serif.

### 0C: Font loading before export
In CardExporter.js, ensure fonts are loaded before html2canvas:
```javascript
export async function exportCardAsPng(element, filename) {
  await document.fonts.ready // Wait for all fonts to load
  // small delay to ensure rendering is complete
  await new Promise(r => setTimeout(r, 100))
  const canvas = await html2canvas(element, {
    scale: 2, useCORS: true, allowTaint: true, backgroundColor: null
  })
  // ...
}
```

---

## FIX 1: TAKEOVER CARD

**Problem:** The gradient is a vertical gold band instead of a diagonal sweep. The no-photo fallback looks broken.

**Open the TakeoverCard component file.** Replace the gradient and layout with:

### With photo:
```javascript
// The card container
<div ref={cardRef} style={{
  width: format === 'wide' ? 960 : 540,
  height: 540,
  position: 'relative',
  overflow: 'hidden',
  background: '#000',
}}>
  {/* Player photo - full bleed */}
  {featuredPlayer?.photo_url && (
    <img src={featuredPlayer.photo_url} style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      objectFit: 'cover', objectPosition: 'top center',
    }} crossOrigin="anonymous" />
  )}
  
  {/* THE KEY GRADIENT - diagonal sweep from bottom-left */}
  <div style={{
    position: 'absolute', inset: 0, zIndex: 2,
    background: `linear-gradient(135deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.85) 25%, ${hexToRgba(teamColor, 0.6)} 50%, transparent 75%)`,
  }} />
  
  {/* Logo badge top-right */}
  {logoUrl && (
    <img src={logoUrl} style={{
      position: 'absolute', top: 16, right: 16,
      width: 52, height: 52, objectFit: 'contain',
      zIndex: 10,
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
    }} crossOrigin="anonymous" />
  )}
  
  {/* Text content - bottom left */}
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: format === 'wide' ? '28px 32px' : '24px 28px',
    zIndex: 10,
  }}>
    <div style={{
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: 10, fontWeight: 700,
      letterSpacing: 4, textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.45)',
    }}>{orgName}</div>
    
    <div style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: format === 'wide' ? 64 : 52,
      lineHeight: 0.88, letterSpacing: 2,
      color: '#fff',
    }}>GAME<br/>DAY</div>
    
    <div style={{
      fontFamily: "'Oswald', sans-serif",
      fontSize: 20, fontWeight: 700,
      color: teamColor,
      textTransform: 'uppercase',
      marginTop: 4,
    }}>{teamName}</div>
    
    <div style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: 13, fontWeight: 600,
      color: 'rgba(255,255,255,0.7)',
      marginTop: 6,
    }}>vs. {opponent}</div>
    
    <div style={{
      display: 'flex', gap: 14, marginTop: 12,
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: 11, fontWeight: 700,
      letterSpacing: 1.5, textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.4)',
    }}>
      <span>{dayName}, {monthDay}</span>
      <span style={{ opacity: 0.3 }}>|</span>
      <span>{formattedTime}</span>
      <span style={{ opacity: 0.3 }}>|</span>
      <span>{venue}</span>
    </div>
  </div>
  
  {/* Lynx watermark */}
  <div style={{
    position: 'absolute', bottom: 7, right: 12,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 8, letterSpacing: 3,
    textTransform: 'uppercase',
    color: teamColor, opacity: 0.3, zIndex: 20,
  }}>POWERED BY LYNX</div>
</div>
```

### No-photo fallback:
When `!featuredPlayer?.photo_url`, replace the `<img>` with:
```javascript
{/* No photo - dark gradient with subtle texture */}
<div style={{
  position: 'absolute', inset: 0,
  background: `linear-gradient(135deg, #0a0a0a 0%, ${darken(teamColor, 0.5)} 100%)`,
}} />
<div style={{
  position: 'absolute', inset: 0, opacity: 0.06,
  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 22px)',
}} />
```
The gradient still sweeps with the same 135deg angle — it just uses the team color at a darkened level instead of a photo.

---

## FIX 2: SPLIT CARD

**Problem:** The color panel is using raw team color as fill. Should use dark navy (#111) for dark teams or the team color for vivid teams. Photo needs more room.

### Key changes:
1. **Left panel width: 48%** (not 55%) — give the photo more breathing room
2. **Left panel background:** For dark team colors, use the team color. For light team colors (like the Black Hornets gold), use `#111` (dark) with the team color as accent text
3. **Skew edge:** The diagonal cut uses `skewX(-8deg)` on a pseudo-element
4. **Photo side:** 60% width with a gradient bleed from the left panel color

```javascript
// Determine if team color is light or dark
const isLight = isLightColor(teamColor)
const panelBg = isLight ? '#111' : teamColor
const textColor = isLight ? '#fff' : getContrastText(teamColor)
const accentColor = isLight ? teamColor : 'rgba(255,255,255,0.8)'

// Left panel
<div style={{
  position: 'absolute', top: 0, left: 0, bottom: 0,
  width: '48%', background: panelBg,
  zIndex: 2, display: 'flex', flexDirection: 'column',
  justifyContent: 'center', padding: '28px',
}}>
  {/* Skewed edge */}
  <div style={{
    position: 'absolute', top: 0, right: -50, bottom: 0,
    width: 100, background: panelBg,
    transform: 'skewX(-8deg)',
  }} />
  {/* Content */}
  <div style={{ position: 'relative', zIndex: 2 }}>
    <div style={{
      fontFamily: "'Teko', sans-serif",
      fontSize: 13, fontWeight: 600,
      letterSpacing: 6, textTransform: 'uppercase',
      color: accentColor, opacity: isLight ? 1 : 0.6,
    }}>GAME DAY</div>
    
    <div style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 44, lineHeight: 0.92,
      color: textColor, marginTop: 2,
    }}>{teamName.split(' ').slice(0, 2).join('\n').toUpperCase()}</div>
    
    <div style={{
      width: 30, height: 3,
      background: accentColor,
      margin: '10px 0',
    }} />
    
    <div style={{
      fontFamily: "'Oswald', sans-serif",
      fontSize: 15, fontWeight: 600,
      color: isLight ? '#ccc' : 'rgba(255,255,255,0.85)',
      textTransform: 'uppercase',
    }}>vs. {opponent}</div>
    
    <div style={{
      marginTop: 14, display: 'flex', flexDirection: 'column', gap: 3,
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: 11, fontWeight: 700, letterSpacing: 1,
      textTransform: 'uppercase',
      color: isLight ? '#666' : 'rgba(255,255,255,0.45)',
    }}>
      <span>{dayName}, {monthDay} · {formattedTime}</span>
      <span>{venue}</span>
    </div>
  </div>
</div>

// Right photo side
<div style={{
  position: 'absolute', top: 0, right: 0, bottom: 0,
  width: '60%', zIndex: 1, overflow: 'hidden',
}}>
  {featuredPlayer?.photo_url ? (
    <>
      <img src={featuredPlayer.photo_url} style={{
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center top',
      }} crossOrigin="anonymous" />
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(90deg, ${panelBg} 0%, transparent 35%)`,
      }} />
    </>
  ) : (
    // No photo fallback - darker shade + logo watermark
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(135deg, ${darken(teamColor, 0.3)} 0%, ${darken(teamColor, 0.6)} 100%)`,
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.1) 15px, rgba(255,255,255,0.1) 17px)',
      }} />
    </div>
  )}
</div>
```

---

## FIX 3: SCOREBOARD CARD (Typography-Only)

**Problem:** The card is a flat yellow rectangle with tiny text. This is the WORST looking card. It needs to be completely redone.

**The reference design:** Dark background (#0a0a0a), team color as a thin top stripe (4px), the team name in HUGE Bebas Neue filling 40% of the card vertically in the team color, "VS. OPPONENT" below in white, and a team-colored bottom bar with date/time/location.

```javascript
<div ref={cardRef} style={{
  width: format === 'wide' ? 960 : 540,
  height: 540,
  position: 'relative', overflow: 'hidden',
  background: isLight ? '#0a0a0a' : '#fafaf5',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  textAlign: 'center',
}}>
  {/* Top stripe */}
  <div style={{
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 4, background: teamColor, zIndex: 2,
  }} />
  
  {/* Logo watermark behind text at very low opacity */}
  {logoUrl && (
    <img src={logoUrl} style={{
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 220, height: 220,
      objectFit: 'contain', opacity: 0.06, zIndex: 1,
    }} crossOrigin="anonymous" />
  )}
  
  {/* GAME DAY small label */}
  <div style={{
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 13, fontWeight: 700,
    letterSpacing: 8, textTransform: 'uppercase',
    color: isLight ? '#555' : teamColor,
    marginBottom: 10, position: 'relative', zIndex: 2,
  }}>GAME DAY</div>
  
  {/* TEAM NAME - THE HERO */}
  <div style={{
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: format === 'wide' ? 84 : 72,
    lineHeight: 0.85, letterSpacing: 3,
    color: teamColor,
    position: 'relative', zIndex: 2,
  }}>{teamName.replace(/\s+/g, '\n').toUpperCase()}</div>
  
  {/* VS. OPPONENT */}
  <div style={{
    fontFamily: "'Oswald', sans-serif",
    fontSize: 20, fontWeight: 500,
    textTransform: 'uppercase',
    color: isLight ? '#ccc' : '#333',
    marginTop: 8, position: 'relative', zIndex: 2,
  }}>
    <span style={{ fontSize: 13, opacity: 0.4, marginRight: 6 }}>VS.</span>
    {opponent}
  </div>
  
  {/* Bottom bar with date/time/location */}
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '14px 24px',
    background: teamColor,
    display: 'flex', justifyContent: 'center', gap: 20,
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 12, fontWeight: 700,
    letterSpacing: 2, textTransform: 'uppercase',
    color: getContrastText(teamColor),
    zIndex: 2,
  }}>
    <span>{dayName}, {monthDay}</span>
    <span style={{ opacity: 0.3 }}>·</span>
    <span>{formattedTime}</span>
    <span style={{ opacity: 0.3 }}>·</span>
    <span>{venue}</span>
  </div>
  
  <div style={{
    position: 'absolute', bottom: 48, right: 12,
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 8, letterSpacing: 3,
    textTransform: 'uppercase',
    color: teamColor, opacity: 0.25, zIndex: 20,
  }}>POWERED BY LYNX</div>
</div>
```

**Note the `isLight` logic:** If the team color is light (like Black Hornets gold), the background is dark (#0a0a0a) and text is the team color. If the team color is dark, the background is light (#fafaf5) and text is the team color on a light field. This ensures the team name always pops.

---

## FIX 4: HEADLINE CARD

**Problem:** The team color header bar doesn't have enough visual weight, and the photo/text layout below is awkward.

### Key changes:
1. Header bar should be taller with bigger "GAME DAY" text (44px Bebas Neue)
2. Below the header: photo on left 45%, text content on right, on a dark (#0a0a0a) background
3. The photo fades into the dark right side via `linear-gradient(90deg, transparent 60%, #0a0a0a 100%)`

Follow the reference HTML for Template 7 (The Headline) exactly. The header bar is the team color at full saturation, "GAME DAY" in contrasting text (black for light colors, white for dark). Logo sits in the header bar at low opacity on the right side.

---

## FIX 5: POSTER CARD

**Problem:** The vignette effect isn't strong enough and the text at the bottom is hard to read.

### Key changes:
1. The radial vignette must be more aggressive: `radial-gradient(ellipse at 50% 35%, transparent 20%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.95) 85%)`
2. Add a second layer with team color tint: `radial-gradient(ellipse at 50% 35%, transparent 30%, ${hexToRgba(teamColor, 0.15)} 60%, ${hexToRgba(teamColor, 0.3)} 100%)`
3. "GAME DAY" watermark text across the top at 15% opacity (big, visible but ghostly)
4. Team name at the bottom should be in the team color, not white
5. Increase bottom padding and text sizes for readability

---

## FIX 6: BANNER CARD

**Problem:** The geometric accent shape doesn't look right and the photo clipping is off.

### Key changes:
1. The geometric shape should be: `position: absolute; top: -30px; right: -20px; width: 260px; height: 300px; transform: skewY(-12deg); overflow: hidden; border-radius: 0 0 0 30px;`
2. The photo inside the shape needs a counter-skew: `transform: skewY(12deg) scale(1.15)` to appear straight
3. Team color gradient tint at the bottom of the shape: `linear-gradient(180deg, transparent 40%, ${hexToRgba(teamColor, 0.4)} 100%)`
4. "GAME DAY" text should be 72px Bebas Neue, stacked (GAME on one line, DAY on the next)
5. Dark gradient base: `linear-gradient(135deg, #0a0a0a 0%, ${darken(teamColor, 0.7)} 100%)`

---

## FIX 7: GENERAL QUALITY RULES

Apply these to ALL templates:

### Text readability
- No text should ever be smaller than 9px
- All small text (dates, times, locations) must use `fontWeight: 700` and `letterSpacing: 1.5` at minimum
- Always use rgba for muted text colors (e.g., `rgba(255,255,255,0.45)`) not hex grays

### Contrast
- Every text element must be readable against its background
- Use the `getContrastText()` utility everywhere team color touches text
- When team color is used as text on a dark bg, ensure it's not too dark — use `lighten()` if needed

### Photo handling
- Every `<img>` must have `crossOrigin="anonymous"` for html2canvas
- Photos must have `objectFit: 'cover'` and `objectPosition: 'top center'` (focus on face/upper body)
- Photos should never have visible edges touching the card boundary without a gradient or overlay softening them

### No-photo states
- Must look COMPLETE and DESIGNED, not like something is missing
- Use team color gradients, subtle patterns, and logo watermarks
- A card without a photo should look like a deliberate design choice

---

## COMMIT
```bash
git add -A && git commit -m "CC-SOCIAL-CARDS: Visual quality fix — fonts, gradients, layouts, contrast per reference HTML" && git push
```
