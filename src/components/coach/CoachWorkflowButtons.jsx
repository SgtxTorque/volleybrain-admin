import { Swords, ClipboardCheck, Users, Calendar } from '../../constants/icons'
import { useTheme } from '../../contexts/ThemeContext'
import { adjustBrightness } from '../../constants/hubStyles'

/**
 * CoachWorkflowButtons — 4 branded gradient buttons for core coach workspaces
 * Game Day, Practice, Roster, Schedule — each with smart notification badges
 */
export default function CoachWorkflowButtons({
  teamColor,
  onNavigate,
  gameDayBadge,
  practiceBadge,
  rosterBadge,
  scheduleBadge,
}) {
  const { isDark } = useTheme()

  const buttons = [
    { icon: Swords, label: 'Game Day', badge: gameDayBadge || 0, onClick: () => onNavigate?.('gameprep') },
    { icon: ClipboardCheck, label: 'Practice', badge: practiceBadge || 0, onClick: () => onNavigate?.('schedule') },
    { icon: Users, label: 'Roster', badge: rosterBadge || 0, onClick: () => onNavigate?.('teams') },
    { icon: Calendar, label: 'Schedule', badge: scheduleBadge || 0, onClick: () => onNavigate?.('schedule') },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {buttons.map(btn => (
        <WorkflowButton
          key={btn.label}
          icon={btn.icon}
          label={btn.label}
          badge={btn.badge}
          onClick={btn.onClick}
          teamColor={teamColor}
          isDark={isDark}
        />
      ))}
    </div>
  )
}

function WorkflowButton({ icon: Icon, label, badge, onClick, teamColor, isDark }) {
  const baseColor = teamColor || '#4BB9EC'
  const darker = adjustBrightness(baseColor, -20)

  const gradientStyle = {
    background: `linear-gradient(135deg, ${baseColor}dd, ${baseColor}99, ${darker}bb)`
  }

  return (
    <button
      onClick={onClick}
      className="relative rounded-xl p-4 text-left transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 group overflow-hidden min-h-[80px]"
      style={gradientStyle}
    >
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-bold text-white">{label}</span>
      </div>

      {/* Notification badge */}
      {badge > 0 && (
        <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-20 shadow-lg">
          {badge}
        </span>
      )}
    </button>
  )
}
