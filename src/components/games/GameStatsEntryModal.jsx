import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// ============================================
// INLINE ICONS
// ============================================
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const SaveIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)

const ChevronLeftIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const ChevronRightIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

const UserIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

// ============================================
// STAT CATEGORIES FOR VOLLEYBALL
// ============================================
const VOLLEYBALL_STAT_FIELDS = [
  { section: 'Serving', color: '#10B981', stats: [
    { key: 'serves', label: 'Serves', icon: '🏐' },
    { key: 'aces', label: 'Aces', icon: '🎯' },
    { key: 'service_errors', label: 'Service Errors', icon: '❌', negative: true },
  ]},
  { section: 'Attacking', color: '#EF4444', stats: [
    { key: 'attacks', label: 'Attacks', icon: '💥' },
    { key: 'kills', label: 'Kills', icon: '⚡' },
    { key: 'attack_errors', label: 'Attack Errors', icon: '❌', negative: true },
  ]},
  { section: 'Blocking', color: '#6366F1', stats: [
    { key: 'blocks', label: 'Solo Blocks', icon: '🛡️' },
    { key: 'block_assists', label: 'Block Assists', icon: '🤝' },
  ]},
  { section: 'Defense', color: '#F59E0B', stats: [
    { key: 'digs', label: 'Digs', icon: '🏃' },
  ]},
  { section: 'Setting', color: '#8B5CF6', stats: [
    { key: 'assists', label: 'Assists', icon: '🙌' },
  ]},
  { section: 'Receiving', color: '#EC4899', stats: [
    { key: 'receptions', label: 'Receptions', icon: '📥' },
    { key: 'reception_errors', label: 'Reception Errors', icon: '❌', negative: true },
  ]},
]

// ============================================
// STAT INPUT COMPONENT
// ============================================
function StatInput({ value, onChange, label, icon, color, negative }) {
  return (
    <div className="flex items-center justify-between p-3 bg-lynx-cloud rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, (value || 0) - 1))}
          className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold transition"
        >
          -
        </button>
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className={`w-16 h-10 text-center font-bold text-lg rounded-lg border-2 focus:outline-none ${
            negative 
              ? 'border-red-200 bg-red-50 text-red-600 focus:border-red-400'
              : 'border-lynx-silver focus:border-indigo-400'
          }`}
          style={!negative ? { color } : {}}
          min="0"
        />
        <button
          onClick={() => onChange((value || 0) + 1)}
          className="w-8 h-8 rounded-lg text-white font-bold transition"
          style={{ backgroundColor: negative ? '#EF4444' : color }}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ============================================
// PLAYER STAT CARD COMPONENT
// ============================================
function PlayerStatCard({ player, stats, onChange, onExpand, isExpanded }) {
  // Calculate quick summary
  const points = (stats?.aces || 0) + (stats?.kills || 0) + (stats?.blocks || 0)
  
  return (
    <div className={`bg-white rounded-xl border-2 transition ${
      isExpanded ? 'border-indigo-500 shadow-lg' : 'border-lynx-silver hover:border-slate-300'
    }`}>
      {/* Player header */}
      <div 
        onClick={onExpand}
        className="flex items-center gap-4 p-4 cursor-pointer"
      >
        {player.photo_url ? (
          <img src={player.photo_url} className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center">
            <span className="text-slate-500 font-bold">{player.jersey_number || '?'}</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">
            {player.first_name} {player.last_name}
          </p>
          <p className="text-sm text-slate-500">#{player.jersey_number} • {player.position || 'Player'}</p>
        </div>
        
        {/* Quick stats summary */}
        <div className="flex gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-emerald-600">{stats?.aces || 0}</p>
            <p className="text-[10px] text-slate-400">Aces</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{stats?.kills || 0}</p>
            <p className="text-[10px] text-slate-400">Kills</p>
          </div>
          <div>
            <p className="text-lg font-bold text-indigo-600">{stats?.digs || 0}</p>
            <p className="text-[10px] text-slate-400">Digs</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-600">{points}</p>
            <p className="text-[10px] text-slate-400">Pts</p>
          </div>
        </div>
        
        <ChevronRightIcon className={`w-5 h-5 text-slate-400 transition ${isExpanded ? 'rotate-90' : ''}`} />
      </div>
      
      {/* Expanded stats entry */}
      {isExpanded && (
        <div className="border-t border-lynx-silver p-4 space-y-4">
          {VOLLEYBALL_STAT_FIELDS.map(section => (
            <div key={section.section}>
              <h4 
                className="text-sm font-semibold mb-2 flex items-center gap-2"
                style={{ color: section.color }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: section.color }} />
                {section.section}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {section.stats.map(stat => (
                  <StatInput
                    key={stat.key}
                    value={stats?.[stat.key]}
                    onChange={(val) => onChange(stat.key, val)}
                    label={stat.label}
                    icon={stat.icon}
                    color={section.color}
                    negative={stat.negative}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// QUICK ENTRY MODE COMPONENT
// ============================================
function QuickEntryMode({ players, stats, onStatChange, selectedStat, onSelectStat }) {
  const quickStats = [
    { key: 'aces', label: 'Ace', icon: '🎯', color: '#10B981' },
    { key: 'kills', label: 'Kill', icon: '⚡', color: '#EF4444' },
    { key: 'blocks', label: 'Block', icon: '🛡️', color: '#6366F1' },
    { key: 'digs', label: 'Dig', icon: '🏃', color: '#F59E0B' },
    { key: 'assists', label: 'Assist', icon: '🙌', color: '#8B5CF6' },
    { key: 'service_errors', label: 'Svc Err', icon: '❌', color: '#EF4444', negative: true },
    { key: 'attack_errors', label: 'Atk Err', icon: '💢', color: '#EF4444', negative: true },
  ]
  
  return (
    <div>
      {/* Stat selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {quickStats.map(stat => (
          <button
            key={stat.key}
            onClick={() => onSelectStat(stat.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              selectedStat === stat.key
                ? 'text-white shadow-lg'
                : 'bg-white border border-lynx-silver text-slate-600 hover:bg-lynx-cloud'
            }`}
            style={selectedStat === stat.key ? { backgroundColor: stat.color } : {}}
          >
            <span>{stat.icon}</span>
            <span>{stat.label}</span>
          </button>
        ))}
      </div>
      
      {/* Player grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {players.map(player => {
          const playerStats = stats[player.id] || {}
          const statValue = playerStats[selectedStat] || 0
          const selectedStatInfo = quickStats.find(s => s.key === selectedStat)
          
          return (
            <button
              key={player.id}
              onClick={() => {
                onStatChange(player.id, selectedStat, statValue + 1)
              }}
              className="bg-white rounded-xl p-4 border-2 border-lynx-silver hover:border-indigo-400 hover:shadow-md transition text-center group"
            >
              {player.photo_url ? (
                <img src={player.photo_url} className="w-14 h-14 rounded-full mx-auto object-cover mb-2" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-slate-500">{player.jersey_number}</span>
                </div>
              )}
              
              <p className="font-semibold text-slate-800 truncate">{player.first_name}</p>
              <p className="text-xs text-slate-500">#{player.jersey_number}</p>
              
              <div 
                className="mt-2 text-2xl font-bold transition group-hover:scale-110"
                style={{ color: selectedStatInfo?.color }}
              >
                {statValue}
              </div>
              <p className="text-[10px] text-slate-400">{selectedStatInfo?.label || 'Select stat'}</p>
            </button>
          )
        })}
      </div>
      
      <p className="text-center text-sm text-slate-500 mt-4">
        Tap a player to add +1 {quickStats.find(s => s.key === selectedStat)?.label || ''}
      </p>
    </div>
  )
}

// ============================================
// MAIN GAME STATS ENTRY MODAL
// ============================================
function GameStatsEntryModal({ event, team, roster, onClose, onSave, showToast }) {
  const { user } = useAuth()
  
  const [stats, setStats] = useState({}) // { playerId: { stat: value } }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entryMode, setEntryMode] = useState('quick') // 'quick' or 'detailed'
  const [selectedStat, setSelectedStat] = useState('kills')
  const [expandedPlayer, setExpandedPlayer] = useState(null)
  
  useEffect(() => {
    loadExistingStats()
  }, [event.id])
  
  async function loadExistingStats() {
    setLoading(true)
    
    try {
      const { data } = await supabase
        .from('game_player_stats')
        .select('*')
        .eq('event_id', event.id)
      
      // Convert to our format
      const statsMap = {}
      data?.forEach(s => {
        statsMap[s.player_id] = {
          serves: s.serves,
          aces: s.aces,
          service_errors: s.service_errors,
          attacks: s.attacks,
          kills: s.kills,
          attack_errors: s.attack_errors,
          blocks: s.blocks,
          block_assists: s.block_assists,
          digs: s.digs,
          assists: s.assists,
          receptions: s.receptions,
          reception_errors: s.reception_errors,
        }
      })
      
      setStats(statsMap)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
    
    setLoading(false)
  }
  
  function handleStatChange(playerId, statKey, value) {
    setStats(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || {}),
        [statKey]: value
      }
    }))
  }
  
  async function handleSave() {
    setSaving(true)
    
    try {
      // Delete existing stats for this game
      await supabase
        .from('game_player_stats')
        .delete()
        .eq('event_id', event.id)
      
      // Insert new stats
      const records = Object.entries(stats)
        .filter(([_, playerStats]) => {
          // Only save if player has some stats
          return Object.values(playerStats || {}).some(v => v > 0)
        })
        .map(([playerId, playerStats]) => ({
          event_id: event.id,
          player_id: playerId,
          team_id: team.id,
          serves: playerStats.serves || 0,
          aces: playerStats.aces || 0,
          service_errors: playerStats.service_errors || 0,
          attacks: playerStats.attacks || 0,
          kills: playerStats.kills || 0,
          attack_errors: playerStats.attack_errors || 0,
          blocks: playerStats.blocks || 0,
          block_assists: playerStats.block_assists || 0,
          digs: playerStats.digs || 0,
          assists: playerStats.assists || 0,
          receptions: playerStats.receptions || 0,
          reception_errors: playerStats.reception_errors || 0,
          points: (playerStats.aces || 0) + (playerStats.kills || 0) + (playerStats.blocks || 0),
          created_by: user?.id,
        }))
      
      if (records.length > 0) {
        const { error } = await supabase
          .from('game_player_stats')
          .insert(records)
        
        if (error) throw error
      }
      
      showToast?.('Stats saved successfully!', 'success')
      onSave?.()
      onClose()
      
    } catch (err) {
      console.error('Error saving stats:', err)
      showToast?.('Error saving stats', 'error')
    }
    
    setSaving(false)
  }
  
  // Calculate team totals
  const teamTotals = Object.values(stats).reduce((acc, playerStats) => {
    Object.entries(playerStats || {}).forEach(([key, val]) => {
      acc[key] = (acc[key] || 0) + (val || 0)
    })
    return acc
  }, {})
  
  const playersWithStats = roster.filter(p => stats[p.id] && Object.values(stats[p.id]).some(v => v > 0))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-100 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-white border-b border-lynx-silver px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition"
              >
                <XIcon className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-800">📊 Game Stats Entry</h2>
                <p className="text-sm text-slate-500">
                  {team.name} vs {event.opponent_name || 'TBD'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Entry mode toggle */}
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setEntryMode('quick')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    entryMode === 'quick' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
                  }`}
                >
                  ⚡ Quick
                </button>
                <button
                  onClick={() => setEntryMode('detailed')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    entryMode === 'detailed' ? 'bg-white shadow text-slate-800' : 'text-slate-500'
                  }`}
                >
                  📋 Detailed
                </button>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                <SaveIcon className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Stats'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-10 h-10 border-4 border-lynx-sky border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Quick Entry Mode */}
              {entryMode === 'quick' && (
                <QuickEntryMode
                  players={roster}
                  stats={stats}
                  onStatChange={handleStatChange}
                  selectedStat={selectedStat}
                  onSelectStat={setSelectedStat}
                />
              )}
              
              {/* Detailed Entry Mode */}
              {entryMode === 'detailed' && (
                <div className="space-y-3">
                  {roster.map(player => (
                    <PlayerStatCard
                      key={player.id}
                      player={player}
                      stats={stats[player.id]}
                      onChange={(statKey, value) => handleStatChange(player.id, statKey, value)}
                      onExpand={() => setExpandedPlayer(expandedPlayer === player.id ? null : player.id)}
                      isExpanded={expandedPlayer === player.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer - Team Totals */}
        <div className="bg-white border-t border-lynx-silver px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Team Totals</p>
              <p className="text-xs text-slate-400">{playersWithStats.length} players with stats</p>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-600">{teamTotals.aces || 0}</p>
                <p className="text-xs text-slate-500">Aces</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-600">{teamTotals.kills || 0}</p>
                <p className="text-xs text-slate-500">Kills</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-indigo-600">{teamTotals.blocks || 0}</p>
                <p className="text-xs text-slate-500">Blocks</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-amber-600">{teamTotals.digs || 0}</p>
                <p className="text-xs text-slate-500">Digs</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-600">{teamTotals.assists || 0}</p>
                <p className="text-xs text-slate-500">Assists</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-800">
                  {(teamTotals.aces || 0) + (teamTotals.kills || 0) + (teamTotals.blocks || 0)}
                </p>
                <p className="text-xs text-slate-500">Points</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { GameStatsEntryModal }
