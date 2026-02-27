import { createContext, useContext, useEffect, useState } from 'react'
import { accentColors, themes } from '../constants/theme'

// ============================================
// THEME CONTEXT - Enhanced with Accent Colors & NavBar
// ============================================
const ThemeContext = createContext(null)

export function useTheme() { 
  return useContext(ThemeContext) 
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('vb_theme') || 'dark')
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('vb_accent') || 'lynx')

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('vb_theme', newTheme)
  }

  const changeAccent = (color) => {
    if (accentColors[color]) {
      setAccentColor(color)
      localStorage.setItem('vb_accent', color)
    }
  }

  const currentTheme = themes[theme]
  const currentAccent = accentColors[accentColor] || accentColors.lynx
  const isDark = theme === 'dark'

  useEffect(() => {
    const root = document.documentElement
    const colors = currentTheme.colors
    
    // Theme colors
    root.style.setProperty('--bg-primary', colors.bg)
    root.style.setProperty('--bg-secondary', colors.bgSecondary)
    root.style.setProperty('--bg-tertiary', colors.bgTertiary)
    root.style.setProperty('--border-color', colors.border)
    root.style.setProperty('--text-primary', colors.text)
    root.style.setProperty('--text-secondary', colors.textSecondary)
    root.style.setProperty('--text-muted', colors.textMuted)
    
    // Accent — always Lynx
    root.style.setProperty('--accent-primary', '#4BB9EC')
    root.style.setProperty('--accent-light', '#E8F4FD')
    root.style.setProperty('--accent-dark', '#2A9BD4')
    root.style.setProperty('--navbar-bg', '#10284C')
    root.style.setProperty('--navbar-bg-solid', '#10284C')
    
    document.body.setAttribute('data-theme', theme)
  }, [theme, currentTheme, accentColor, currentAccent])

  return (
    <ThemeContext.Provider value={{ 
      theme, toggleTheme, isDark, 
      accentColor, changeAccent, accent: currentAccent, accentColors,
      ...currentTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Helper hook for common theme classes — Lynx brand tokens
export function useThemeClasses() {
  const { isDark, accent } = useTheme()
  return {
    pageBg: isDark ? 'bg-lynx-midnight' : 'bg-lynx-cloud',
    cardBg: isDark ? 'bg-lynx-charcoal' : 'bg-white',
    cardBgAlt: isDark ? 'bg-lynx-graphite' : 'bg-lynx-frost',
    inputBg: isDark ? 'bg-lynx-graphite' : 'bg-white',
    modalBg: isDark ? 'bg-lynx-charcoal' : 'bg-white',
    border: isDark ? 'border-lynx-border-dark' : 'border-lynx-silver',
    text: isDark ? 'text-white' : 'text-lynx-navy',
    textSecondary: isDark ? 'text-slate-300' : 'text-lynx-slate',
    textMuted: isDark ? 'text-slate-400' : 'text-lynx-slate',
    hoverBg: isDark ? 'hover:bg-lynx-graphite' : 'hover:bg-lynx-frost',
    hoverBgAlt: isDark ? 'hover:bg-lynx-charcoal' : 'hover:bg-lynx-cloud',
    card: isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver',
    input: isDark
      ? 'bg-lynx-graphite border-lynx-border-dark text-white placeholder-slate-500'
      : 'bg-white border-lynx-silver text-lynx-navy placeholder-slate-400',
    modal: isDark ? 'bg-lynx-charcoal border-lynx-border-dark' : 'bg-white border-lynx-silver',
    // Zebra row for tables
    zebraRow: isDark ? 'bg-lynx-graphite/50' : 'bg-lynx-frost/50',
    // Keep backward compatibility
    colors: isDark ? themes.dark.colors : themes.light.colors,
    accent: accent,
    navBar: '#10284C',
    navBarSolid: '#10284C',
  }
}
