// ============================================
// CARD COLOR UTILITIES
// Shared color manipulation for social card templates
// ============================================

function parseHex(hex) {
  if (!hex) return [100, 100, 240]
  const c = hex.replace('#', '')
  return [
    parseInt(c.substr(0, 2), 16),
    parseInt(c.substr(2, 2), 16),
    parseInt(c.substr(4, 2), 16),
  ]
}

export function getContrastText(hex) {
  if (!hex) return '#fff'
  const [r, g, b] = parseHex(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1a1a2e' : '#ffffff'
}

export function darken(hex, pct = 0.3) {
  if (!hex) return '#1a1a2e'
  const [r, g, b] = parseHex(hex)
  return `rgb(${Math.round(r * (1 - pct))},${Math.round(g * (1 - pct))},${Math.round(b * (1 - pct))})`
}

export function lighten(hex, pct = 0.3) {
  if (!hex) return '#e2e8f0'
  const [r, g, b] = parseHex(hex)
  return `rgb(${Math.round(r + (255 - r) * pct)},${Math.round(g + (255 - g) * pct)},${Math.round(b + (255 - b) * pct)})`
}

export function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(100,100,240,${alpha})`
  const [r, g, b] = parseHex(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

export function isLightColor(hex) {
  if (!hex) return false
  const [r, g, b] = parseHex(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}
