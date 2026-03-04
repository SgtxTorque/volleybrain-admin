import { Icon } from '../ui'

// NavIcon - Maps nav icon names to Icon component
export const NavIcon = ({ name, className = "w-5 h-5" }) => {
  return <Icon name={name} className={className} />
}

export default NavIcon
