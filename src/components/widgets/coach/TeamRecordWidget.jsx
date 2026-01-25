import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Flame, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSeason } from '../../../contexts/SeasonContext';
import { useThemeClasses } from '../../../contexts/ThemeContext';

/**
 * TeamRecordWidget - Coach Dashboard Widget
 * Displays team's W-L record, win percentage, current streak, and recent form
 */
const TeamRecordWidget = ({ teamId }) => {
  const { selectedSeason } = useSeason();
  const tc = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    if (teamId && selectedSeason?.id) {
      fetchTeamStats();
    }
  }, [teamId, selectedSeason?.id]);

  const fetchTeamStats = async () => {
    setLoading(true);
    try {
      // Fetch team standings
      const { data: standings, error: standingsError } = await supabase
        .from('team_standings')
        .select('*')
        .eq('team_id', teamId)
        .eq('season_id', selectedSeason.id)
        .single();

      if (standingsError && standingsError.code !== 'PGRST116') {
        console.error('Error fetching standings:', standingsError);
      }

      // Fetch recent completed games for form guide
      const { data: games, error: gamesError } = await supabase
        .from('schedule_events')
        .select('id, game_result, our_score, opponent_score, event_date')
        .eq('team_id', teamId)
        .eq('season_id', selectedSeason.id)
        .eq('event_type', 'game')
        .eq('game_status', 'completed')
        .order('event_date', { ascending: false })
        .limit(5);

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
      }

      setStats(standings || { wins: 0, losses: 0, ties: 0, points_for: 0, points_against: 0 });
      setRecentGames(games || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateWinPct = () => {
    if (!stats) return 0;
    const total = stats.wins + stats.losses + stats.ties;
    if (total === 0) return 0;
    return ((stats.wins + (stats.ties * 0.5)) / total * 100).toFixed(1);
  };

  const calculateStreak = () => {
    if (recentGames.length === 0) return { type: 'none', count: 0 };
    
    const firstResult = recentGames[0]?.game_result;
    if (!firstResult) return { type: 'none', count: 0 };
    
    let count = 0;
    for (const game of recentGames) {
      if (game.game_result === firstResult) {
        count++;
      } else {
        break;
      }
    }
    
    return { type: firstResult, count };
  };

  const streak = calculateStreak();

  const getStreakDisplay = () => {
    if (streak.type === 'none' || streak.count === 0) {
      return { text: '-', color: tc.textMuted, icon: Minus };
    }
    if (streak.type === 'win') {
      return { text: `W${streak.count}`, color: 'text-emerald-400', icon: TrendingUp };
    }
    if (streak.type === 'loss') {
      return { text: `L${streak.count}`, color: 'text-red-400', icon: TrendingDown };
    }
    return { text: `T${streak.count}`, color: 'text-amber-400', icon: Minus };
  };

  const streakDisplay = getStreakDisplay();
  const StreakIcon = streakDisplay.icon;

  const getFormColor = (result) => {
    switch (result) {
      case 'win': return 'bg-emerald-500';
      case 'loss': return 'bg-red-500';
      case 'tie': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

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
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className={`font-semibold ${tc.text}`}>Team Record</h3>
      </div>

      {/* Main Record Display */}
      <div className="text-center mb-4">
        <div className={`text-4xl font-bold ${tc.text}`}>
          {stats?.wins || 0} - {stats?.losses || 0}
          {stats?.ties > 0 && <span className={`text-2xl ${tc.textMuted}`}> - {stats.ties}</span>}
        </div>
        <div className={`text-sm ${tc.textMuted} mt-1`}>
          {calculateWinPct()}% Win Rate
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Streak */}
        <div className={`${tc.cardBgAlt} rounded-xl p-3 text-center`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <StreakIcon className={`w-4 h-4 ${streakDisplay.color}`} />
            <span className={`text-lg font-bold ${streakDisplay.color}`}>
              {streakDisplay.text}
            </span>
          </div>
          <div className={`text-xs ${tc.textMuted}`}>Current Streak</div>
        </div>

        {/* Point Differential */}
        <div className={`${tc.cardBgAlt} rounded-xl p-3 text-center`}>
          <div className={`text-lg font-bold ${
            (stats?.points_for - stats?.points_against) >= 0 
              ? 'text-emerald-400' 
              : 'text-red-400'
          }`}>
            {(stats?.points_for - stats?.points_against) >= 0 ? '+' : ''}
            {(stats?.points_for || 0) - (stats?.points_against || 0)}
          </div>
          <div className={`text-xs ${tc.textMuted}`}>Point Diff</div>
        </div>
      </div>

      {/* Recent Form */}
      {recentGames.length > 0 && (
        <div>
          <div className={`text-xs ${tc.textMuted} mb-2`}>Recent Form</div>
          <div className="flex gap-1.5 justify-center">
            {recentGames.map((game, idx) => (
              <div
                key={game.id || idx}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold ${getFormColor(game.game_result)}`}
                title={`${game.our_score} - ${game.opponent_score}`}
              >
                {game.game_result === 'win' ? 'W' : game.game_result === 'loss' ? 'L' : 'T'}
              </div>
            ))}
            {/* Fill empty slots */}
            {[...Array(5 - recentGames.length)].map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className={`w-8 h-8 rounded-md ${tc.cardBgAlt} border-2 border-dashed ${tc.border}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentGames.length === 0 && (
        <div className={`text-center ${tc.textMuted} text-sm`}>
          No games completed yet
        </div>
      )}
    </div>
  );
};

export default TeamRecordWidget;
