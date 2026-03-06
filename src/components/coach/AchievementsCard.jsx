// =============================================================================
// AchievementsCard — Recent team achievements dashboard widget
// Self-contained: fetches from Supabase using selectedTeam
// =============================================================================

import { useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import { Trophy, ChevronRight } from 'lucide-react'

export default function AchievementsCard({ selectedTeam, onNavigate }) {
  const { isDark } = useTheme()
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedTeam?.id) { setAchievements([]); setLoading(false); return }

    async function fetch() {
      setLoading(true)
      try {
        // Get player IDs on this team
        const { data: tp } = await supabase
          .from('team_players')
          .select('player_id')
          .eq('team_id', selectedTeam.id)

        const playerIds = (tp || []).map(p => p.player_id).filter(Boolean)
        if (playerIds.length === 0) { setAchievements([]); setLoading(false); return }

        // Get recent earned achievements
        const { data: earned } = await supabase
          .from('player_achievements')
          .select('id, awarded_at, player_id, achievement_id, achievements(name, icon, rarity)')
          .in('player_id', playerIds)
          .order('awarded_at', { ascending: false })
          .limit(5)

        // Enrich with player names
        const { data: players } = await supabase
          .from('players')
          .select('id, first_name, last_name')
          .in('id', playerIds)

        const playerMap = {}
        for (const p of (players || [])) playerMap[p.id] = p

        const enriched = (earned || []).map(e => ({
          ...e,
          playerName: playerMap[e.player_id]
            ? `${playerMap[e.player_id].first_name} ${(playerMap[e.player_id].last_name || '')[0]}.`
            : 'Player',
        }))

        setAchievements(enriched)
      } catch (err) {
        console.error('AchievementsCard error:', err)
        setAchievements([])
      }
      setLoading(false)
    }

    fetch()
  }, [selectedTeam?.id])

  const cardBg = isDark
    ? 'bg-lynx-charcoal border border-white/[0.06]'
    : 'bg-white border border-brand-border'

  const rarityColors = {
    legendary: 'text-amber-400',
    epic: 'text-purple-400',
    rare: 'text-blue-400',
    uncommon: 'text-emerald-400',
    common: 'text-zinc-400',
  }

  return (
    <div className={`${cardBg} rounded-2xl shadow-sm p-4 h-full flex flex-col`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <h3 className={`text-[10px] font-bold uppercase tracking-[1.2px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Achievements
          </h3>
        </div>
        <button onClick={() => onNavigate?.('achievements')} className="text-xs text-lynx-sky font-medium flex items-center gap-1">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-lynx-sky border-t-transparent rounded-full animate-spin" />
          </div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🏆</p>
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>No achievements yet</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Unlock badges through gameplay</p>
          </div>
        ) : (
          <div className="space-y-2">
            {achievements.map(a => (
              <div key={a.id} className={`flex items-center gap-2.5 p-2 rounded-lg ${isDark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                <span className="text-lg shrink-0">{a.achievements?.icon || '🏆'}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {a.achievements?.name || 'Achievement'}
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {a.playerName}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase ${rarityColors[a.achievements?.rarity] || 'text-zinc-400'}`}>
                  {a.achievements?.rarity || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
