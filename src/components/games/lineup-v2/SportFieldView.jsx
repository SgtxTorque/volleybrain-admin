import VolleyballCourt from './fields/VolleyballCourt'
import BasketballCourt from './fields/BasketballCourt'
import BaseballDiamond from './fields/BaseballDiamond'
import SoccerPitch from './fields/SoccerPitch'
import FootballField from './fields/FootballField'
import { useTheme, useThemeClasses } from '../../../contexts/ThemeContext'

const FIELD_COMPONENTS = {
  'volleyball-court': VolleyballCourt,
  'basketball-court': BasketballCourt,
  'baseball-diamond': BaseballDiamond,
  'soccer-pitch': SoccerPitch,
  'football-field': FootballField,
}

export default function SportFieldView({ sport, sportConfig, ...props }) {
  const { isDark } = useTheme()
  const tc = useThemeClasses()

  const FieldComponent = FIELD_COMPONENTS[sportConfig?.fieldType]

  if (!FieldComponent) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 ${isDark ? 'bg-lynx-charcoal' : 'bg-white'}`}>
        <div className="text-4xl mb-3">{sportConfig?.icon || '🏟️'}</div>
        <div className={`text-sm font-semibold ${tc.text} mb-1`}>{sportConfig?.name || 'Sport'} Lineup</div>
        <div className={`text-xs ${tc.textMuted}`}>Field visualization coming soon</div>
      </div>
    )
  }

  return <FieldComponent sportConfig={sportConfig} {...props} />
}
