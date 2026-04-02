import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { assignDrillToPlayers } from '../../lib/development-service'
import { X, UserPlus, Search, Check, Clock, Calendar } from 'lucide-react'

export default function AssignDrillModal({ drill, visible, onClose, onSuccess, teamId, showToast }) {
  const { user, organization } = useAuth()
  const { isDark } = useTheme()
  const orgId = organization?.id

  const [players, setPlayers] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [search, setSearch] = useState('')
  const [playerGoal, setPlayerGoal] = useState('')
  const [targetCompletions, setTargetCompletions] = useState('1')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (visible && orgId) loadPlayers()
  }, [visible, orgId, teamId])

  async function loadPlayers() {
    setLoading(true)
    let query = supabase
      .from('team_players')
      .select('player_id, players(id, first_name, last_name, photo_url)')
      .eq('status', 'active')

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data } = await query
    if (data) {
      // Deduplicate by player_id
      const unique = new Map()
      data.forEach(tp => {
        if (tp.players && !unique.has(tp.player_id)) {
          unique.set(tp.player_id, tp.players)
        }
      })
      setPlayers(Array.from(unique.values()))
    }
    setLoading(false)
  }

  function togglePlayer(playerId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  async function handleAssign() {
    if (selectedIds.size === 0) return
    setAssigning(true)

    const { error } = await assignDrillToPlayers({
      orgId,
      drillId: drill.id,
      playerIds: Array.from(selectedIds),
      assignedBy: user.id,
      teamId: teamId || null,
      playerGoal: playerGoal.trim() || null,
      targetCompletions: Number(targetCompletions) || 1,
      dueDate: dueDate || null,
    })

    if (error) {
      showToast?.('Failed to assign drill', 'error')
    } else {
      showToast?.(`Drill assigned to ${selectedIds.size} player${selectedIds.size > 1 ? 's' : ''}`, 'success')
      onSuccess?.()
      onClose()
    }
    setAssigning(false)
  }

  if (!visible || !drill) return null

  const bg = isDark ? 'rgba(15,23,42,.97)' : 'rgba(255,255,255,.98)'
  const border = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'
  const textColor = isDark ? 'white' : '#1a1a1a'
  const mutedColor = isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)'
  const inputBg = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.03)'
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textColor }

  const filteredPlayers = search.trim()
    ? players.filter(p => `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()))
    : players

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md max-h-[85vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: bg, border: `1px solid ${border}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
          <button onClick={onClose} className="p-1 rounded-lg transition hover:bg-white/10">
            <X className="w-5 h-5" style={{ color: textColor }} />
          </button>
          <h2 className="text-base font-bold" style={{ color: textColor }}>Assign to Players</h2>
          <div className="w-7" />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Drill info */}
          <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
            {drill.video_thumbnail_url ? (
              <img src={drill.video_thumbnail_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                🏐
              </div>
            )}
            <div>
              <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>{drill.title}</div>
              <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {drill.duration_minutes}m · {drill.category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </div>
            </div>
          </div>

          {/* Player search */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>
              Select Players ({selectedIds.size} selected)
            </label>
            <div className="relative mb-2">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search players..." className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none" style={inputStyle}
              />
            </div>

            <div className={`rounded-xl border max-h-48 overflow-y-auto ${isDark ? 'border-white/[0.06]' : 'border-[#E8ECF2]'}`}>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 border-2 border-[#4BB9EC] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredPlayers.length === 0 ? (
                <p className={`text-xs text-center py-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No players found
                </p>
              ) : (
                <div className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-[#E8ECF2]'}`}>
                  {filteredPlayers.map(player => {
                    const isSelected = selectedIds.has(player.id)
                    return (
                      <button
                        key={player.id}
                        onClick={() => togglePlayer(player.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition ${
                          isSelected
                            ? (isDark ? 'bg-[#4BB9EC]/10' : 'bg-[#4BB9EC]/5')
                            : (isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50')
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          isSelected ? 'bg-[#4BB9EC] border-[#4BB9EC]' : isDark ? 'border-white/[0.15]' : 'border-[#CBD5E1]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {player.photo_url ? (
                          <img src={player.photo_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {(player.first_name || '?')[0]}{(player.last_name || '')[0]}
                          </div>
                        )}

                        <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-[#10284C]'}`}>
                          {player.first_name} {player.last_name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Player Goal</label>
            <input
              type="text" value={playerGoal} onChange={e => setPlayerGoal(e.target.value)}
              placeholder="e.g., Work on your first touch accuracy"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
            />
          </div>

          {/* Target + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Target Reps</label>
              <input
                type="number" value={targetCompletions} onChange={e => setTargetCompletions(e.target.value)}
                min="1" placeholder="1"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
              />
            </div>
            <div>
              <label className="text-sm font-bold mb-1.5 block" style={{ color: textColor }}>Due Date</label>
              <input
                type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}
              />
            </div>
          </div>

          {/* Assign button */}
          <button
            onClick={handleAssign}
            disabled={assigning || selectedIds.size === 0}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-40"
            style={{ background: 'var(--accent-primary)' }}
          >
            {assigning ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Assign to {selectedIds.size} Player{selectedIds.size !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
