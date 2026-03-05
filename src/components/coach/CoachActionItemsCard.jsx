// =============================================================================
// CoachActionItemsCard — Action items with mobile app tone and voice
// Flat styling: no background, no shadow, no border — text only
// =============================================================================

import { useTheme } from '../../contexts/ThemeContext'
import { ChevronRight } from 'lucide-react'

// Mobile app-style copy for action items
function getActionCopy(item) {
  const { type, count } = item
  switch (type) {
    case 'pending_stats':
      return {
        emoji: '📊',
        text: count === 1
          ? "Uh oh, you haven't recorded stats for last week's game — the players are waiting to see how they did"
          : `${count} games need stats entered — don't leave the players hanging`,
      }
    case 'pending_rsvps':
      return {
        emoji: '📋',
        text: `${count} pending RSVPs — let's lock in who's coming`,
      }
    case 'due_evaluations':
      return {
        emoji: '🎯',
        text: `Evaluations are due this week for ${count} player${count !== 1 ? 's' : ''}`,
      }
    case 'missing_lineup':
      return {
        emoji: '📝',
        text: "You haven't built a lineup for the next game yet — let's get that locked in",
      }
    case 'unread_messages':
      return {
        emoji: '💬',
        text: `${count} unread message${count !== 1 ? 's' : ''} from parents`,
      }
    case 'unsigned_waivers':
      return {
        emoji: '📄',
        text: `${count} player${count !== 1 ? 's' : ''} still need${count === 1 ? 's' : ''} waivers signed`,
      }
    default:
      return {
        emoji: '⚡',
        text: item.text || item.label || 'Action needed',
      }
  }
}

const EMPTY_MESSAGES = [
  "You're all caught up, Coach! The Den is running smooth. 🔥",
  "Nothing pending — go enjoy your day, Coach.",
  "All clear. Your team is quietly crushing it. 💪",
  "Zero action items. That's what we like to see.",
]

export default function CoachActionItemsCard({ items = [], onNavigate }) {
  const { isDark } = useTheme()

  const emptyMsg = EMPTY_MESSAGES[Math.floor(Math.random() * EMPTY_MESSAGES.length)]

  return (
    <div className="py-2">
      <p className={`text-sm font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        Action Items
      </p>

      {items.length === 0 ? (
        <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {emptyMsg}
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const { emoji, text } = getActionCopy(item)
            return (
              <button
                key={item.id || idx}
                onClick={() => {
                  if (item.page) onNavigate?.(item.page)
                }}
                className={`w-full text-left flex items-start gap-3 group transition-colors rounded-lg p-2 -ml-2 ${
                  isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-xl mt-0.5 shrink-0">{emoji}</span>
                <span className={`text-lg font-medium leading-snug flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {text}
                </span>
                <ChevronRight className={`w-4 h-4 mt-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
