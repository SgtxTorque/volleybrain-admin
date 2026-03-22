import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSeason } from '../../contexts/SeasonContext'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'

// ---------------------------------------------------------------
// NEW CHAT MODAL
// ---------------------------------------------------------------
export default function NewChatModal({ onClose, onCreated, showToast, isDark }) {
  const { user, profile } = useAuth()
  const { selectedSeason } = useSeason()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(null)

  useEffect(() => { loadTeams() }, [])

  async function loadTeams() {
    if (!selectedSeason?.id || selectedSeason.id === 'all') return
    const { data } = await supabase.from('teams').select('*').eq('season_id', selectedSeason?.id).order('name')
    setTeams(data || [])
    setLoading(false)
  }

  async function createTeamChat(team, type = 'team_chat') {
    setCreating(`${team.id}-${type}`)
    try {
      const { data: existing } = await supabase
        .from('chat_channels').select('*').eq('team_id', team.id).eq('channel_type', type).maybeSingle()

      if (existing) {
        const { data: membership } = await supabase
          .from('channel_members').select('id').eq('channel_id', existing.id).eq('user_id', user?.id).maybeSingle()
        if (!membership) {
          await supabase.from('channel_members').insert({
            channel_id: existing.id, user_id: user?.id,
            display_name: profile?.full_name || profile?.email || 'User',
            member_role: 'member', can_post: type !== 'player_chat'
          })
        }
        onCreated(existing)
        return
      }

      const name = type === 'player_chat' ? `${team.name} - Player Chat` : `${team.name} - Team Chat`
      const { data: newChannel, error } = await supabase
        .from('chat_channels').insert({ season_id: selectedSeason.id, team_id: team.id, name, channel_type: type, created_by: user?.id })
        .select().single()

      if (error) { console.error('Error creating chat:', error); showToast?.('Error creating chat: ' + error.message, 'error'); setCreating(null); return }

      await supabase.from('channel_members').insert({
        channel_id: newChannel.id, user_id: user?.id,
        display_name: profile?.full_name || 'Admin',
        member_role: 'admin', can_post: true, can_moderate: true
      })

      showToast?.('Chat created!', 'success')
      onCreated(newChannel)
    } catch (err) {
      console.error('Error:', err)
      showToast?.('Error creating chat', 'error')
      setCreating(null)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md overflow-hidden rounded-[14px] border animate-scale-in ${
          isDark
            ? 'bg-lynx-charcoal/95 backdrop-blur-xl border-white/[0.08]'
            : 'bg-white/95 backdrop-blur-xl border-slate-200 shadow-soft-lg'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-5 flex items-center justify-between border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
          <h2 className={`text-r-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            New Chat
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${
              isDark ? 'text-white/25 hover:bg-white/[0.04]' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : teams.length === 0 ? (
            <div className={`p-8 text-center text-r-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
              No teams found
            </div>
          ) : (
            <div className="p-3">
              <p className={`px-3 py-2 text-r-xs font-bold uppercase tracking-widest ${isDark ? 'text-white/20' : 'text-slate-400'}`}>
                Create Team Chat
              </p>
              {teams.map(team => (
                <div key={team.id} className="mb-1">
                  {[
                    { type: 'team_chat', icon: '👥', label: 'Team Chat', desc: 'Parents, coaches, and players' },
                    { type: 'player_chat', icon: '🏐', label: 'Player Chat', desc: 'Coaches only. Parents view-only' },
                  ].map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => createTeamChat(team, opt.type)}
                      disabled={creating !== null}
                      className={`w-full p-3.5 rounded-lg flex items-center gap-3.5 transition-all disabled:opacity-40 ${
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg ${
                          isDark ? 'bg-white/[0.06]' : 'bg-slate-100'
                        }`}
                        style={team.color ? { backgroundColor: `${team.color}15` } : undefined}
                      >
                        {creating === `${team.id}-${opt.type}` ? (
                          <div
                            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: team.color || '#4BB9EC', borderTopColor: 'transparent' }}
                          />
                        ) : opt.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-bold text-r-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {team.name} - {opt.label}
                        </p>
                        <p className={`text-r-xs ${isDark ? 'text-white/30' : 'text-slate-500'}`}>{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
