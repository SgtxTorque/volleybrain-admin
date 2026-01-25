import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSeason } from '../../../contexts/SeasonContext';
import { useThemeClasses } from '../../../contexts/ThemeContext';

/**
 * TopPlayerWidget - Coach Dashboard Widget
 * Displays the top performing player based on a key stat
 */
const TopPlayerWidget = ({ teamId, onViewLeaderboards }) => {
  const { selectedSeason } = useSeason();
  const tc = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [topPlayer, setTopPlayer] = useState(null);
  const [statCategory, setStatCategory] = useState('points');

  const statCategories = [
    { key: 'points', label: 'Points', icon: '🏆' },
    { key: 'kills', label: 'Kills', icon: '💥' },
    { key: 'aces', label: 'Aces', icon: '🎯' },
    { key: 'assists', label: 'Assists', icon: '🤝' },
    { key: 'digs', label: 'Digs', icon: '🛡️' },
    { key: 'blocks', label: 'Blocks', icon: '🧱' },
  ];

  useEffect(() => {
    if (teamId && selectedSeason?.id) {
      fetchTopPlayer();
    }
  }, [teamId, selectedSeason?.id, statCategory]);

  const fetchTopPlayer = async () => {
    setLoading(true);
    try {
      // Fetch top player for the selected stat category
      const { data, error } = await supabase
        .from('player_season_stats')
        .select(`
          *,
          player:players(
            id,
            first_name,
            last_name,
            jersey_number,
            photo_url,
            position
          )
        `)
        .eq('team_id', teamId)
        .eq('season_id', selectedSeason.id)
        .order(statCategory, { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching top player:', error);
      }

      setTopPlayer(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (first, last) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  const getCurrentStat = () => {
    if (!topPlayer) return { value: 0, perGame: 0 };
    const value = topPlayer[statCategory] || 0;
    const games = topPlayer.games_played || 1;
    return {
      value,
      perGame: (value / games).toFixed(1),
    };
  };

  const stat = getCurrentStat();
  const currentCategory = statCategories.find(c => c.key === statCategory);

  if (loading) {
    return (
      <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-2xl p-5`}>
      {/* Header with Category Selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          <h3 className={`font-semibold ${tc.text}`}>Top Player</h3>
        </div>
        <select
          value={statCategory}
          onChange={(e) => setStatCategory(e.target.value)}
          className={`text-sm border ${tc.border} rounded-lg px-2 py-1 ${tc.cardBgAlt} ${tc.text} focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]`}
        >
          {statCategories.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {topPlayer?.player ? (
        <>
          {/* Player Info */}
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            {topPlayer.player.photo_url ? (
              <img
                src={topPlayer.player.photo_url}
                alt={`${topPlayer.player.first_name} ${topPlayer.player.last_name}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-amber-400"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-amber-400">
                {getInitials(topPlayer.player.first_name, topPlayer.player.last_name)}
              </div>
            )}

            {/* Name & Position */}
            <div className="flex-1">
              <div className={`font-semibold ${tc.text}`}>
                {topPlayer.player.first_name} {topPlayer.player.last_name}
              </div>
              <div className={`text-sm ${tc.textMuted} flex items-center gap-2`}>
                {topPlayer.player.jersey_number && (
                  <span className={`${tc.cardBgAlt} px-2 py-0.5 rounded text-xs font-medium`}>
                    #{topPlayer.player.jersey_number}
                  </span>
                )}
                {topPlayer.player.position && (
                  <span>{topPlayer.player.position}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stat Display */}
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-4 text-center">
            <div className="text-3xl mb-1">{currentCategory?.icon}</div>
            <div className="text-3xl font-bold text-amber-400">
              {stat.value}
            </div>
            <div className={`text-sm ${tc.textSecondary}`}>
              {currentCategory?.label} ({stat.perGame}/game)
            </div>
          </div>

          {/* Games Played */}
          <div className={`mt-3 text-center text-xs ${tc.textMuted}`}>
            {topPlayer.games_played || 0} games played this season
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="text-center py-6">
          <div className="text-4xl mb-2">📊</div>
          <div className={`${tc.textMuted} text-sm`}>No stats recorded yet</div>
          <div className={`${tc.textMuted} text-xs mt-1`}>
            Complete games and enter player stats to see leaders
          </div>
        </div>
      )}

      {/* View Leaderboards Link */}
      {onViewLeaderboards && topPlayer?.player && (
        <button
          onClick={onViewLeaderboards}
          className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-[var(--accent-primary)] hover:underline font-medium"
        >
          View All Leaderboards
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default TopPlayerWidget;
