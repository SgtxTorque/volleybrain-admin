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
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('vb_accent') || 'orange')

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
  const currentAccent = accentColors[accentColor]
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
    
    // Accent colors
    root.style.setProperty('--accent-primary', currentAccent.primary)
    root.style.setProperty('--accent-light', currentAccent.light)
    root.style.setProperty('--accent-dark', currentAccent.dark)
    
    // NavBar colors (new)
    root.style.setProperty('--navbar-bg', currentAccent.navBar)
    root.style.setProperty('--navbar-bg-solid', currentAccent.navBarSolid)
    
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

// Helper hook for common theme classes
export function useThemeClasses() {
  const { isDark, accent } = useTheme()
  return {
    pageBg: isDark ? 'bg-slate-900' : 'bg-slate-50',
    cardBg: isDark ? 'bg-slate-800' : 'bg-white',
    cardBgAlt: isDark ? 'bg-slate-900' : 'bg-slate-50',
    inputBg: isDark ? 'bg-slate-900' : 'bg-white',
    modalBg: isDark ? 'bg-slate-800' : 'bg-white',
    border: isDark ? 'border-slate-700' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    hoverBg: isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100',
    hoverBgAlt: isDark ? 'hover:bg-slate-600' : 'hover:bg-slate-200',
    card: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
    input: isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
    modal: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
    colors: isDark ? themes.dark.colors : themes.light.colors,
    accent: accent,
    // NavBar specific
    navBar: accent.navBar,
    navBarSolid: accent.navBarSolid,
  }
}
