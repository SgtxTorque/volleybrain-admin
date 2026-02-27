import { useState } from 'react'
import { Smile, Reply, Trash2, CheckCheck } from '../../constants/icons'

// ═══════════════════════════════════════════════════════════
// MESSAGE BUBBLE — Glass + gradient accents (extracted from ChatsPage)
// ═══════════════════════════════════════════════════════════

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🎉']

function MessageBubble({ message, isOwn, showAvatar, isDark, accent, onReply, onReact, onDelete, canDelete, onImageClick, teamColor }) {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,5}$/u
  const isEmojiOnly = message.message_type === 'text' && emojiRegex.test(message.content?.trim() || '')

  const renderContent = () => {
    if (message.message_type === 'gif') {
      return <img src={message.content} alt="GIF" className="max-w-[240px] rounded-xl" loading="lazy" onError={(e) => { e.target.style.display = 'none' }} />
    }
    if (message.message_type === 'image') {
      return <img src={message.content} alt="Image" className="max-w-[280px] rounded-xl cursor-pointer hover:opacity-90 transition shadow-md" loading="lazy" onClick={() => onImageClick?.(message.content)} />
    }
    if (message.message_type === 'system') {
      return <p className="text-xs italic opacity-80">{message.content}</p>
    }
    if (isEmojiOnly) {
      return <span className="text-4xl leading-tight">{message.content}</span>
    }
    return <p className="text-[14px] whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
  }

  const reactions = message.reactions || {}
  const hasReactions = Object.keys(reactions).length > 0

  const getBubbleStyle = () => {
    if (message.message_type === 'system') {
      return { background: isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)', color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)', boxShadow: 'none', border: 'none' }
    }
    if (isEmojiOnly) {
      return { background: 'transparent', color: isDark ? '#ffffff' : '#000000', boxShadow: 'none', border: 'none' }
    }
    if (isOwn) {
      return {
        background: isDark ? `linear-gradient(135deg, ${accent.primary}, ${accent.primary}cc)` : `linear-gradient(135deg, ${accent.primary}18, ${accent.primary}0a)`,
        color: isDark ? '#ffffff' : '#1a1a1a',
        border: isDark ? 'none' : `1px solid ${accent.primary}20`,
        boxShadow: isDark ? `0 4px 16px ${accent.primary}25` : `0 2px 12px ${accent.primary}10`
      }
    }
    return {
      background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.8)',
      color: isDark ? '#ffffff' : '#1a1a1a',
      border: isDark ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.06)',
      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,.15)' : '0 2px 8px rgba(0,0,0,.05)'
    }
  }

  const bubbleStyle = getBubbleStyle()

  return (
    <div className="flex gap-2.5 mb-2 group ch-msg"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false) }}>
      <div className="w-8 flex-shrink-0">
        {showAvatar && (
          message.sender?.avatar_url ? (
            <img src={message.sender.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover" style={{ boxShadow: '0 2px 8px rgba(0,0,0,.15)' }} />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: `hsl(${(message.sender?.full_name?.charCodeAt(0) || 0) * 10 % 360}, 55%, 50%)` }}>
              {message.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )
        )}
      </div>

      <div className="max-w-[70%] flex flex-col">
        {showAvatar && (
          <span className="text-[11px] mb-1 font-bold" style={{ color: isDark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.4)' }}>
            {message.sender?.full_name || 'Unknown'} {isOwn && <span style={{ opacity: .4 }}>(you)</span>}
          </span>
        )}

        {message.reply_to && (
          <div className="text-[11px] px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2"
            style={{
              background: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)',
              borderColor: isOwn ? accent.primary : (isDark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)'),
              color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)',
            }}>
            <span className="font-bold">{message.reply_to.sender?.full_name}</span>
            <p className="truncate opacity-70">{message.reply_to.content}</p>
          </div>
        )}

        <div className="relative">
          <div className={`${isEmojiOnly ? 'px-1 py-1' : 'px-4 py-2.5'} ${isEmojiOnly ? '' : 'rounded-2xl'} ${isOwn && !isEmojiOnly ? 'rounded-br-md' : !isOwn && !isEmojiOnly ? 'rounded-bl-md' : ''}`}
            style={bubbleStyle}>
            {renderContent()}
            {!isEmojiOnly && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px]" style={{ color: isDark ? (isOwn ? 'rgba(255,255,255,.5)' : 'rgba(255,255,255,.25)') : 'rgba(0,0,0,.3)' }}>
                  {formatTime(message.created_at)}
                </span>
                {isOwn && <CheckCheck className="w-3 h-3" style={{ color: isDark ? (message.read_at ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)') : (message.read_at ? 'rgba(0,0,0,.5)' : 'rgba(0,0,0,.2)') }} />}
              </div>
            )}
          </div>

          {isEmojiOnly && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.25)' }}>{formatTime(message.created_at)}</span>
            </div>
          )}

          {showActions && message.message_type !== 'system' && (
            <div className="absolute top-0 flex items-center gap-1 left-full ml-2">
              {[
                { icon: <Smile className="w-4 h-4" />, action: () => setShowReactions(!showReactions) },
                { icon: <Reply className="w-4 h-4" />, action: onReply },
                canDelete && { icon: <Trash2 className="w-4 h-4" />, action: onDelete, danger: true },
              ].filter(Boolean).map((btn, i) => (
                <button key={i} onClick={btn.action}
                  className="p-1.5 rounded-lg transition"
                  style={{
                    background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.9)',
                    color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)',
                    boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,.08)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = btn.danger ? (isDark ? 'rgba(239,68,68,.3)' : 'rgba(239,68,68,.1)') : (isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)'); if (btn.danger) e.currentTarget.style.color = '#EF4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.9)'; e.currentTarget.style.color = isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)' }}>
                  {btn.icon}
                </button>
              ))}
            </div>
          )}

          {showReactions && (
            <div className="absolute top-8 flex items-center gap-1 p-2 rounded-2xl shadow-xl z-10 left-0"
              style={{ background: isDark ? 'rgba(15,23,42,.95)' : 'rgba(255,255,255,.95)', backdropFilter: 'blur(16px)', border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.08)' }}>
              {REACTION_EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => { onReact(emoji); setShowReactions(false) }}
                  className="w-8 h-8 rounded-lg transition-all hover:scale-125 text-lg"
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {hasReactions && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <button key={emoji} onClick={() => onReact(emoji)}
                  className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1 transition-all hover:scale-110"
                  style={{ background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)', border: isDark ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.04)' }}>
                  <span>{emoji}</span>
                  <span style={{ color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)' }}>{users.length}</span>
                </button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
