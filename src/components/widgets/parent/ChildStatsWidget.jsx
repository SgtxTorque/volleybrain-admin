import React, { useState, useEffect } from 'react';
import { User, Award, TrendingUp, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSeason } from '../../../contexts/SeasonContext';
import { useThemeClasses } from '../../../contexts/ThemeContext';

/**
 * ChildStatsWidget - Parent Dashboard Widget
 * Shows child's season stats summary and leaderboard positions
 * Supports multiple children with a selector
 */
const ChildStatsWidget = ({ children = [], onViewLeaderboards }) => {
  const { selectedSeason } = useSeason();
  const tc = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [childStats, setChildStats] = useState(null);
  const [leaderboardPositions, setLeaderboardPositions] = useState({});

  const statCategories = [
    { key: 'points', label: 'Points', icon: '🏆' },
    { key: 'kills', label: 'Kills', icon: '💥' },
    { key: 'aces', label: 'Aces', icon: '🎯' },
    { key: 'assists', label: 'Assists', icon: '🤝' },
  ];

  useEffect(() => {
    if (children.length > 0 && selectedSeason?.id) {
      fetchChildStats(children[selectedChildIndex]);
    } else {
      setLoading(false);
    }
  }, [children, selectedChildIndex, selectedSeason?.id]);

  const fetchChildStats = async (child) => {
    if (!child) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Fetch player's season stats
      const { data: stats, error: statsError } = await supabase
        .from('player_season_stats')
        .select('*')
        .eq('player_id', child.id)
        .eq('season_id', selectedSeason.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        console.error('Error fetching stats:', statsError);
      }

      setChildStats(stats);

      // Fetch leaderboard positions for key stats
      if (stats?.team_id) {
        const positions = {};
        
        for (const cat of statCategories) {
          const { data: rankings, error: rankError } = await supabase
            .from('player_season_stats')
            .select('player_id')
            .eq('team_id', stats.team_id)
            .eq('season_id', selectedSeason.id)
            .order(cat.key, { ascending: false });

          if (!rankError && rankings) {
            const position = rankings.findIndex(r => r.player_id === child.id) + 1;
            positions[cat.key] = position || '-';
          }
        }
        
        setLeaderboardPositions(positions);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedChild = children[selectedChildIndex];

  const getInitials = (first, last) => {
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  };

  const navigateChild = (direction) => {
    if (direction === 'next') {
      setSelectedChildIndex((prev) => (prev + 1) % children.length);
    } else {
      setSelectedChildIndex((prev) => (prev - 1 + children.length) % children.length);
    }
  };

  if (children.length === 0) {
    return null;
  }

  if (loading && !childStats) {
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-[var(--accent-primary)]" />
        <h3 className={`font-semibold ${tc.text}`}>Player Stats</h3>
      </div>

      {/* Child Selector (if multiple) */}
      {children.length > 1 && (
        <div className={`flex items-center justify-between mb-4 ${tc.cardBgAlt} rounded-lg p-2`}>
          <button
            onClick={() => navigateChild('prev')}
            className={`p-1 ${tc.hoverBg} rounded-full transition`}
          >
            <ChevronLeft className={`w-5 h-5 ${tc.textMuted}`} />
          </button>
          <div className="flex items-center gap-2">
            {selectedChild?.photo_url ? (
              <img
                src={selectedChild.photo_url}
                alt={selectedChild.first_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-xs font-bold">
                {getInitials(selectedChild?.first_name, selectedChild?.last_name)}
              </div>
            )}
            <span className={`font-medium ${tc.text}`}>
              {selectedChild?.first_name}
            </span>
          </div>
          <button
            onClick={() => navigateChild('next')}
            className={`p-1 ${tc.hoverBg} rounded-full transition`}
          >
            <ChevronRight className={`w-5 h-5 ${tc.textMuted}`} />
          </button>
        </div>
      )}

      {/* Single Child Header (if only one) */}
      {children.length === 1 && (
        <div className="flex items-center gap-3 mb-4">
          {selectedChild?.photo_url ? (
            <img
              src={selectedChild.photo_url}
              alt={selectedChild.first_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[var(--accent-primary)]/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white font-bold">
              {getInitials(selectedChild?.first_name, selectedChild?.last_name)}
            </div>
          )}
          <div>
            <div className={`font-semibold ${tc.text}`}>
              {selectedChild?.first_name} {selectedChild?.last_name}
            </div>
            {selectedChild?.jersey_number && (
              <div className={`text-sm ${tc.textMuted}`}>#{selectedChild.jersey_number}</div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
        </div>
      ) : childStats ? (
        <>
          {/* Games Played */}
          <div className="text-center mb-3">
            <span className={`text-sm ${tc.textMuted}`}>
              {childStats.games_played || 0} games played
            </span>
          </div>

          {/* Stats & Rankings Grid */}
          <div className="grid grid-cols-2 gap-2">
            {statCategories.map((cat) => (
              <div key={cat.key} className={`${tc.cardBgAlt} rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2 py-0.5 rounded-full font-medium">
                    #{leaderboardPositions[cat.key] || '-'}
                  </span>
                </div>
                <div className={`text-xl font-bold ${tc.text}`}>
                  {childStats[cat.key] || 0}
                </div>
                <div className={`text-xs ${tc.textMuted}`}>{cat.label}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <div className="text-3xl mb-2">📊</div>
          <div className={`${tc.textMuted} text-sm`}>No stats recorded yet</div>
        </div>
      )}

      {/* View Leaderboards Link */}
      {onViewLeaderboards && childStats && (
        <button
          onClick={onViewLeaderboards}
          className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-[var(--accent-primary)] hover:underline font-medium"
        >
          View Leaderboards
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ChildStatsWidget;
