import { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'

// ============================================
// ORG BRANDING CONTEXT
// Provides organization branding to public/parent-facing views
// Falls back to defaults when no custom branding exists
// ============================================

const OrgBrandingContext = createContext(null)

const DEFAULTS = {
  primaryColor: '#EAB308',
  secondaryColor: '#1E293B',
  logo: null,
  banner: null,
  tagline: '',
  emailHeaderColor: '#EAB308',
  emailHeaderLogo: null,
  background: null, // { type: 'solid'|'gradient'|'pattern', value: string, opacity: number }
}

export function OrgBrandingProvider({ children }) {
  const auth = useAuth()
  if (!auth) return children
  const { organization } = auth

  const branding = useMemo(() => {
    const settings = organization?.settings || {}
    const b = settings.branding || {}

    const primaryColor = b.primary_color || settings.primary_color || DEFAULTS.primaryColor
    const secondaryColor = b.secondary_color || settings.secondary_color || DEFAULTS.secondaryColor
    const logo = organization?.logo_url || DEFAULTS.logo
    const banner = b.banner_url || DEFAULTS.banner
    const tagline = b.tagline || settings.tagline || DEFAULTS.tagline
    const emailHeaderColor = b.email_header_color || primaryColor
    const emailHeaderLogo = b.email_header_logo || logo
    const background = b.background || DEFAULTS.background

    const hasCustomBranding = !!(
      b.primary_color || b.banner_url || b.tagline || organization?.logo_url
    )

    return {
      orgName: organization?.name || '',
      orgLogo: logo,
      orgColors: { primary: primaryColor, secondary: secondaryColor },
      orgTagline: tagline,
      orgBanner: banner,
      emailHeaderColor,
      emailHeaderLogo,
      background,
      hasCustomBranding,

      // Helper: returns inline style object using org branding
      getAccentStyles: (overrides = {}) => ({
        '--org-primary': primaryColor,
        '--org-secondary': secondaryColor,
        ...overrides,
      }),

      // Helper: returns just the primary color for simple use
      accentColor: primaryColor,
    }
  }, [organization])

  return (
    <OrgBrandingContext.Provider value={branding}>
      {children}
    </OrgBrandingContext.Provider>
  )
}

export function useOrgBranding() {
  const ctx = useContext(OrgBrandingContext)
  // Return safe defaults if used outside provider (e.g. public pages)
  if (!ctx) {
    return {
      orgName: '',
      orgLogo: null,
      orgColors: { primary: DEFAULTS.primaryColor, secondary: DEFAULTS.secondaryColor },
      orgTagline: '',
      orgBanner: null,
      emailHeaderColor: DEFAULTS.primaryColor,
      emailHeaderLogo: null,
      background: null,
      hasCustomBranding: false,
      getAccentStyles: () => ({ '--org-primary': DEFAULTS.primaryColor, '--org-secondary': DEFAULTS.secondaryColor }),
      accentColor: DEFAULTS.primaryColor,
    }
  }
  return ctx
}
