import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { X } from '../../constants/icons'

export default function QuickAttendanceModal({ event, roster, onClose, onSave, showToast }) {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const [attendance, setAttendance] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExistingData()
  }, [event?.id])

  async function loadExistingData() {
    setLoading(true)
    const initial = {}

    // Load existing attendance
    const { data: existing } = await supabase
      .from('event_attendance')
      .select('player_id, status')
      .eq('event_id', event.id)

    if (existing?.length > 0) {
      existing.forEach(a => { initial[a.player_id] = a.status })
    } else {
      // Pre-fill from RSVP data
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('player_id, status')
        .eq('event_id', event.id)

      roster.forEach(p => {
        const rsvp = rsvps?.find(r => r.player_id === p.id)
        if (rsvp?.status === 'yes' || rsvp?.status === 'attending') {
          initial[p.id] = 'present'
        } else if (rsvp?.status === 'no' || rsvp?.status === 'not_attending') {
          initial[p.id] = 'absent'
        } else {
          initial[p.id] = 'present'
        }
      })
    }

    // Ensure all roster players have a status
    roster.forEach(p => {
      if (!initial[p.id]) initial[p.id] = 'present'
    })

    setAttendance(initial)
    setLoading(false)
  }

  function toggle(playerId) {
    setAttendance(prev => ({
      ...prev,
      [playerId]: prev[playerId] === 'present' ? 'absent' : 'present'
    }))
  }

  async function save() {
    setSaving(true)
    try {
      // Delete existing
      await supabase.from('event_attendance').delete().eq('event_id', event.id)

      // Insert new
      const records = Object.entries(attendance).map(([playerId, status]) => ({
        event_id: event.id,
        player_id: playerId,
        status,
        recorded_by: user?.id,
      }))

      if (records.length > 0) {
        const { error } = await supabase.from('event_attendance').insert(records)
        if (error) throw error
      }

      showToast?.('Attendance saved', 'success')
      onSave?.()
      onClose()
    } catch (err) {
      console.error('Error saving attendance:', err)
      showToast?.('Failed to save attendance', 'error')
    }
    setSaving(false)
  }

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className={`${isDark ? 'bg-lynx-charcoal' : 'bg-white'} rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-lynx-navy'}`}>Take Attendance</h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
              vs {event?.opponent_name} · {roster.length} players on roster
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-lynx-frost'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-3 border-lynx-sky border-t-transparent rounded-full" />
            </div>
          ) : roster.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl">👥</span>
              <p className={`font-semibold mt-3 ${isDark ? 'text-white' : 'text-lynx-navy'}`}>No Players on Roster</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>Add players to your team first</p>
            </div>
          ) : (
            <div className="space-y-2">
              {roster
                .sort((a, b) => (a.jersey_number || 999) - (b.jersey_number || 999))
                .map(player => {
                  const isPresent = attendance[player.id] === 'present'
                  return (
                    <button
                      key={player.id}
                      onClick={() => toggle(player.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition border-2 text-left ${
                        isPresent
                          ? isDark
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-emerald-50 border-emerald-300'
                          : isDark
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-red-50 border-red-300'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                        isPresent ? 'bg-emerald-500' : 'bg-red-500'
                      }`}>
                        {isPresent ? '✓' : '✗'}
                      </span>
                      <span className={`flex-1 font-medium ${isDark ? 'text-white' : 'text-lynx-navy'}`}>
                        {player.jersey_number != null && <span className={isDark ? 'text-slate-400' : 'text-lynx-slate'}>#{player.jersey_number} </span>}
                        {player.first_name} {player.last_name}
                      </span>
                      <span className={`text-xs font-semibold ${isPresent ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isPresent ? 'Present' : 'Absent'}
                      </span>
                    </button>
                  )
                })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-lynx-border-dark' : 'border-lynx-silver'} flex items-center justify-between`}>
          <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-lynx-slate'}`}>
            {presentCount} present · {absentCount} absent
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-[10px] font-medium text-sm transition ${
                isDark ? 'bg-lynx-graphite text-slate-300 hover:bg-white/10' : 'bg-lynx-frost text-lynx-slate hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-5 py-2.5 rounded-[10px] bg-lynx-sky hover:bg-lynx-deep text-white font-semibold text-sm transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
