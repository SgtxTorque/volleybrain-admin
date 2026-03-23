import { MessageCircle, AlertCircle, Check, ChevronDown, ChevronUp } from '../../constants/icons'

function MessageCard({ message, isDark, cardCls, expanded, onToggle, timeAgo, getTypeInfo }) {
  const typeInfo = getTypeInfo(message.message_type || message.type)
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left ${cardCls} rounded-[14px] p-5 transition hover:shadow-md ${
        !message.isRead ? 'border-l-4 border-l-[#4BB9EC]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeInfo.cls}`}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            {!message.isRead && (
              <span className="w-2 h-2 rounded-full bg-[#4BB9EC] flex-shrink-0" />
            )}
          </div>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {message.subject || message.title || 'Message'}
          </h3>
          <p className={`text-sm mt-1 ${expanded ? '' : 'line-clamp-2'} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {message.content || message.body}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(message.created_at)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      {expanded && (
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            From {message.senderName} &middot; {new Date(message.created_at).toLocaleString()}
          </p>
        </div>
      )}
    </button>
  )
}

function TeamPostCard({ post, isDark, cardCls, expanded, onToggle, timeAgo }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full text-left ${cardCls} rounded-[14px] p-5 transition hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {post.teams && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: post.teams.color || '#4BB9EC' }} />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{post.teams.name}</span>
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              post.post_type === 'announcement' ? 'bg-red-500/10 text-red-500' : 'bg-[#4BB9EC]/10 text-[#4BB9EC]'
            }`}>
              {post.post_type || 'Update'}
            </span>
            {post.is_pinned && <span className="text-amber-500 text-xs">Pinned</span>}
          </div>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {post.title || 'Team Update'}
          </h3>
          <p className={`text-sm mt-1 ${expanded ? '' : 'line-clamp-2'} ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {post.content}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(post.created_at)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>
      {expanded && (
        <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {post.profiles?.full_name && `By ${post.profiles.full_name} · `}
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      )}
    </button>
  )
}

function ActionCard({ item, isDark, cardCls, onAcknowledge, timeAgo, getTypeInfo }) {
  const typeInfo = getTypeInfo(item.message_type || item.type)
  return (
    <div className={`${cardCls} rounded-[14px] p-5 border-l-4 border-l-amber-500`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeInfo.cls}`}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500">
              <AlertCircle className="w-3 h-3" /> Action Required
            </span>
          </div>
          <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {item.subject || item.title || 'Message'}
          </h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {item.content || item.body}
          </p>
          <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            From {item.senderName} &middot; {timeAgo(item.created_at)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAcknowledge() }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10284C] text-white font-bold text-sm hover:brightness-110 transition flex-shrink-0"
        >
          <Check className="w-4 h-4" /> Acknowledge
        </button>
      </div>
    </div>
  )
}

function EmptyState({ isDark, cardCls, message, icon }) {
  return (
    <div className={`${cardCls} rounded-[14px] p-12 text-center`}>
      {icon || <MessageCircle className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />}
      <p className={`text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{message}</p>
    </div>
  )
}

export { MessageCard, TeamPostCard, ActionCard, EmptyState }
