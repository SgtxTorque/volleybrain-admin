import React, { useState, useEffect } from 'react';
import { Award, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSeason } from '../../../contexts/SeasonContext';
import { useThemeClasses } from '../../../contexts/ThemeContext';

/**
 * MyBadgesWidget - Player Dashboard Widget
 * Shows badges earned this season with recent highlights
 */
const MyBadgesWidget = ({ playerId, onViewBadges }) => {
  const { selectedSeason } = useSeason();
  const tc = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [recentBadge, setRecentBadge] = useState(null);

  // Badge definitions (could come from a badges table)
  const badgeDefinitions = {
    'ace_master': { name: 'Ace Master', icon: '🎯', description: '5+ aces in a game', color: 'from-emerald-400 to-green-600' },
    'kill_leader': { name: 'Kill Leader', icon: '💥', description: 'Most kills in a game', color: 'from-red-400 to-rose-600' },
    'perfect_serve': { name: 'Perfect Server', icon: '✨', description: '100% serve accuracy', color: 'from-amber-400 to-yellow-600' },
    'dig_machine': { name: 'Dig Machine', icon: '🛡️', description: '10+ digs in a game', color: 'from-purple-400 to-violet-600' },
    'block_party': { name: 'Block Party', icon: '🧱', description: '3+ blocks in a game', color: 'from-orange-400 to-red-600' },
    'mvp': { name: 'Game MVP', icon: '🏆', description: 'Most Valuable Player', color: 'from-amber-500 to-orange-600' },
    'attendance_star': { name: 'Attendance Star', icon: '⭐', description: 'Perfect attendance', color: 'from-blue-400 to-indigo-600' },
    'team_player': { name: 'Team Player', icon: '🤝', description: 'Most assists in a game', color: 'from-cyan-400 to-blue-600' },
    'hot_streak': { name: 'Hot Streak', icon: '🔥', description: '3+ game win streak', color: 'from-orange-500 to-red-600' },
    'first_game': { name: 'First Game', icon: '🎮', description: 'Played first game', color: 'from-gray-400 to-gray-600' },
  };

  useEffect(() => {
    if (playerId && selectedSeason?.id) {
      fetchMyBadges();
    } else {
      setLoading(false);
    }
  }, [playerId, selectedSeason?.id]);

  const fetchMyBadges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('player_badges')
        .select(`
          id,
          badge_id,
          earned_at,
          context,
          event:schedule_events(id, event_date, opponent_name)
        `)
        .eq('player_id', playerId)
        .eq('season_id', selectedSeason.id)
        .order('earned_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching badges:', error);
      }
      
      setBadges(data || []);
      if (data?.length > 0) {
        setRecentBadge(data[0]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeInfo = (badgeId) => {
    return badgeDefinitions[badgeId] || {
      name: badgeId,
      icon: '🏅',
      description: 'Achievement unlocked',
      color: 'from-gray-400 to-gray-600'
    };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group badges by type and count
  const badgeCounts = badges.reduce((acc, b) => {
    acc[b.badge_id] = (acc[b.badge_id] || 0) + 1;
    return acc;
  }, {});

  const uniqueBadges = Object.keys(badgeCounts);

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
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className={`font-semibold ${tc.text}`}>My Badges</h3>
        </div>
        <div className={`text-sm ${tc.textMuted}`}>
          {badges.length} earned
        </div>
      </div>

      {badges.length > 0 ? (
        <>
          {/* Recent Badge Highlight */}
          {recentBadge && (
            <div className={`bg-gradient-to-r ${getBadgeInfo(recentBadge.badge_id).color} rounded-xl p-4 mb-4 text-white relative overflow-hidden`}>
              <Sparkles className="absolute top-2 right-2 w-5 h-5 opacity-50" />
              <div className="flex items-center gap-3">
                <div className="text-4xl">{getBadgeInfo(recentBadge.badge_id).icon}</div>
                <div>
                  <div className="text-xs opacity-90">Latest Badge</div>
                  <div className="font-bold">{getBadgeInfo(recentBadge.badge_id).name}</div>
                  <div className="text-xs opacity-90">
                    {formatDate(recentBadge.earned_at)}
                    {recentBadge.event?.opponent_name && ` vs ${recentBadge.event.opponent_name}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Badge Collection */}
          <div className="grid grid-cols-4 gap-2">
            {uniqueBadges.slice(0, 8).map((badgeId) => {
              const info = getBadgeInfo(badgeId);
              const count = badgeCounts[badgeId];
              return (
                <div
                  key={badgeId}
                  className={`relative text-center p-2 ${tc.cardBgAlt} rounded-lg ${tc.hoverBg} transition cursor-default`}
                  title={`${info.name}: ${info.description}`}
                >
                  <div className="text-2xl">{info.icon}</div>
                  {count > 1 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-primary)] text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show more indicator */}
          {uniqueBadges.length > 8 && (
            <div className={`text-center text-xs ${tc.textMuted} mt-2`}>
              +{uniqueBadges.length - 8} more badges
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏅</div>
          <div className={`${tc.textMuted} text-sm`}>No badges earned yet</div>
          <div className={`${tc.textMuted} text-xs mt-1`}>
            Play games to earn achievements!
          </div>
        </div>
      )}

      {/* View All Badges Link */}
      {onViewBadges && badges.length > 0 && (
        <button
          onClick={onViewBadges}
          className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-[var(--accent-primary)] hover:underline font-medium"
        >
          View All Badges
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MyBadgesWidget;
