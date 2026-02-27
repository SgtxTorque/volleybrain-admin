import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Loader2, ChevronRight, Target } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSeason } from '../../../contexts/SeasonContext';
import { useThemeClasses } from '../../../contexts/ThemeContext';

/**
 * MyStatsWidget - Player Dashboard Widget
 * Shows the player's personal season stats summary
 */
const MyStatsWidget = ({ playerId, onViewStats }) => {
  const { selectedSeason } = useSeason();
  const tc = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentTrend, setRecentTrend] = useState(null);

  const statItems = [
    { key: 'points', label: 'Points', icon: '🏆', color: 'from-amber-400 to-orange-500' },
    { key: 'kills', label: 'Kills', icon: '💥', color: 'from-red-400 to-pink-500' },
    { key: 'aces', label: 'Aces', icon: '🎯', color: 'from-emerald-400 to-green-500' },
    { key: 'assists', label: 'Assists', icon: '🤝', color: 'from-blue-400 to-indigo-500' },
    { key: 'digs', label: 'Digs', icon: '🛡️', color: 'from-purple-400 to-violet-500' },
    { key: 'blocks', label: 'Blocks', icon: '🧱', color: 'from-orange-400 to-red-500' },
  ];

  useEffect(() => {
    if (playerId && selectedSeason?.id) {
      fetchMyStats();
    } else {
      setLoading(false);
    }
  }, [playerId, selectedSeason?.id]);

  const fetchMyStats = async () => {
    setLoading(true);
    try {
      // Fetch season stats
      const { data: seasonStats, error: statsError } = await supabase
        .from('player_season_stats')
        .select('*')
        .eq('player_id', playerId)
        .eq('season_id', selectedSeason.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching stats:', statsError);
      }

      setStats(seasonStats);

      // Fetch last 3 games to calculate trend
      const { data: recentGames, error: gamesError } = await supabase
        .from('game_player_stats')
        .select('points, kills, aces, created_at')
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!gamesError && recentGames?.length >= 2) {
        const mostRecent = recentGames[0].points || 0;
        const previousAvg = recentGames.slice(1).reduce((sum, g) => sum + (g.points || 0), 0) / (recentGames.length - 1);
        setRecentTrend(mostRecent >= previousAvg ? 'up' : 'down');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find best stat (highest per-game average)
  const getBestStat = () => {
    if (!stats || !stats.games_played) return null;
    
    let best = { key: null, value: 0, perGame: 0 };
    
    for (const item of statItems) {
      const perGame = (stats[item.key] || 0) / stats.games_played;
      if (perGame > best.perGame) {
        best = { 
          key: item.key, 
          value: stats[item.key] || 0, 
          perGame,
          ...item 
        };
      }
    }
    
    return best.key ? best : null;
  };

  const bestStat = getBestStat();

  if (!playerId) {
    return null;
  }

  if (loading) {
    return (
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className={`font-semibold ${tc.text}`}>My Stats</h3>
        </div>
        {recentTrend && (
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            recentTrend === 'up' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            <TrendingUp className={`w-3 h-3 ${recentTrend === 'down' ? 'rotate-180' : ''}`} />
            {recentTrend === 'up' ? 'Trending Up' : 'Trending Down'}
          </div>
        )}
      </div>

      {stats ? (
        <>
          {/* Games Played */}
          <div className="text-center mb-4">
            <div className={`text-3xl font-bold ${tc.text}`}>{stats.games_played || 0}</div>
            <div className={`text-sm ${tc.textMuted}`}>Games Played</div>
          </div>

          {/* Best Stat Highlight */}
          {bestStat && (
            <div className={`bg-gradient-to-r ${bestStat.color} rounded-xl p-4 mb-4 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Best Stat</div>
                  <div className="text-2xl font-bold">{bestStat.value} {bestStat.label}</div>
                  <div className="text-sm opacity-90">{bestStat.perGame.toFixed(1)}/game</div>
                </div>
                <div className="text-4xl">{bestStat.icon}</div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            {statItems.slice(0, 6).map((item) => (
              <div 
                key={item.key} 
                className={`text-center p-2 rounded-lg ${
                  bestStat?.key === item.key 
                    ? 'bg-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]/30' 
                    : tc.cardBgAlt
                }`}
              >
                <div className="text-lg">{item.icon}</div>
                <div className={`text-lg font-bold ${tc.text}`}>{stats[item.key] || 0}</div>
                <div className={`text-xs ${tc.textMuted}`}>{item.label}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Target className={`w-12 h-12 mx-auto ${tc.textMuted}`} />
          <div className={`${tc.textMuted} text-sm mt-2`}>No stats recorded yet</div>
          <div className={`${tc.textMuted} text-xs mt-1`}>
            Play games to start tracking your progress!
          </div>
        </div>
      )}

      {/* View All Stats Link */}
      {onViewStats && stats && (
        <button
          onClick={onViewStats}
          className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-[var(--accent-primary)] hover:underline font-medium"
        >
          View Full Stats
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MyStatsWidget;
