import { iconMap, Circle } from '../../constants/icons'

// Icon component for consistent rendering
export function Icon({ name, className = "w-5 h-5", ...props }) {
  const IconComponent = iconMap[name] || Circle
  return <IconComponent className={className} {...props} />
}

// Legacy NavIcon for sidebar (keeping for compatibility)
export function NavIcon({ name, className = "w-5 h-5" }) {
  return <Icon name={name} className={className} />
}

// Helper function to get icon component by name
export function getIconComponent(iconName, size = "w-4 h-4") {
  const IconComponent = iconMap[iconName] || Circle
  return <IconComponent className={size} />
}
