import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { DollarSign, Calendar, Clock, Megaphone } from '../../constants/icons'

// ============================================
// BLAST ALERT POPUP
// ============================================
function BlastAlertPopup({ blast, onAcknowledge, remainingCount }) {
  const tc = useThemeClasses()
  const { isDark } = useTheme()
  
  const getTypeIcon = (type) => {
    switch(type) {
      case 'payment_reminder': return <DollarSign className="w-8 h-8" />
      case 'schedule_change': return <Calendar className="w-8 h-8" />
      case 'deadline': return <Clock className="w-8 h-8" />
      default: return <Megaphone className="w-8 h-8" />
    }
  }
  
  const getTypeColor = (type, priority) => {
    if (priority === 'urgent') return 'from-red-600 to-red-800'
    switch(type) {
      case 'payment_reminder': return 'from-emerald-600 to-emerald-800'
      case 'schedule_change': return 'from-blue-600 to-blue-800'
      case 'deadline': return 'from-amber-600 to-amber-800'
      default: return 'from-purple-600 to-purple-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4">
      <div className={`${tc.cardBg} rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-bounce-in`}>
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getTypeColor(blast.message_type, blast.priority)} p-6 text-center`}>
          <div className="text-6xl mb-3">
            {blast.priority === 'urgent' ? '🚨' : getTypeIcon(blast.message_type)}
          </div>
          {blast.priority === 'urgent' && (
            <span className="inline-block px-4 py-1 rounded-full bg-white/20 text-white text-sm font-bold mb-3 animate-pulse">
              URGENT
            </span>
          )}
          <h2 className="text-2xl font-bold text-white">{blast.title}</h2>
          <p className="text-white/70 text-sm mt-2">
            From {blast.profiles?.full_name || 'League Admin'} • {new Date(blast.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        
        {/* Body */}
        <div className="p-6">
          <p className={`${tc.text} text-lg leading-relaxed whitespace-pre-wrap`}>
            {blast.body}
          </p>
        </div>
        
        {/* Footer */}
        <div className={`p-6 border-t ${tc.border} space-y-3`}>
          <button
            onClick={onAcknowledge}
            className="w-full py-4 rounded-xl bg-[var(--accent-primary)] text-white font-bold text-lg hover:brightness-110 transition"
          >
            ✓ I've Read This
          </button>
          
          {remainingCount > 1 && (
            <p className={`text-center text-sm ${tc.textMuted}`}>
              {remainingCount - 1} more announcement{remainingCount > 2 ? 's' : ''} to read
            </p>
          )}
        </div>
      </div>
      
      {/* Animation styles */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.9); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// ============================================
// BLAST ALERT CHECKER
// ============================================
export function BlastAlertChecker() {
  const { user } = useAuth()
  const { selectedSeason } = useSeason()
  const [pendingBlasts, setPendingBlasts] = useState([])
  const [currentBlastAlert, setCurrentBlastAlert] = useState(null)
  
  // Check for unacknowledged blasts
  useEffect(() => {
    if (user?.id && selectedSeason?.id) {
      checkForPendingBlasts()
    }
  }, [user?.id, selectedSeason?.id])
  
  async function checkForPendingBlasts() {
    try {
      // Get unacknowledged blasts for this user
      const { data: unacknowledged } = await supabase
        .from('message_recipients')
        .select(`
          id,
          message_id,
          acknowledged,
          profile_id,
          messages (
            id, title, body, message_type, priority, created_at,
            profiles:sender_id (full_name)
          )
        `)
        .eq('profile_id', user.id)
        .eq('acknowledged', false)
      
      // Filter to messages that exist
      const pending = (unacknowledged || [])
        .filter(r => r.messages)
        .map(r => ({ ...r.messages, recipient_id: r.id }))
      
      setPendingBlasts(pending)
      
      // Show first unacknowledged blast
      if (pending.length > 0) {
        setCurrentBlastAlert(pending[0])
      }
    } catch (err) {
      console.error('Error checking for blasts:', err)
    }
  }
  
  async function acknowledgeBlast(recipientId) {
    await supabase
      .from('message_recipients')
      .update({ acknowledged: true, acknowledged_at: new Date().toISOString() })
      .eq('id', recipientId)
    
    // Update pending blasts
    const remaining = pendingBlasts.filter(b => b.recipient_id !== recipientId)
    setPendingBlasts(remaining)
    
    // Show next blast or close
    if (remaining.length > 0) {
      setCurrentBlastAlert(remaining[0])
    } else {
      setCurrentBlastAlert(null)
    }
  }
  
  if (!currentBlastAlert) return null
  
  return (
    <BlastAlertPopup
      blast={currentBlastAlert}
      onAcknowledge={() => acknowledgeBlast(currentBlastAlert.recipient_id)}
      remainingCount={pendingBlasts.length}
    />
  )
}
