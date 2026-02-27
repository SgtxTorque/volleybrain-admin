import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useSeason } from '../../../contexts/SeasonContext';
import { useThemeClasses } from '../../../contexts/ThemeContext';

/**
 * TeamStandingsWidget - Parent Dashboard Widget
 * Shows team's current standing position and key stats at a glance
 */
const TeamStandingsWidget = ({ teamId, onViewStandings }) => {
  const { selectedSeason } = useSeason();
  const tc = useThemeClasses();
  const [loading, setLoading] = useState(true);
  const [teamStats, setTeamStats] = useState(null);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (teamId && selectedSeason?.id) {
      setLoading(true);
      fetchTeamStandings(cancelled).finally(() => {
        if (!cancelled) setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => { cancelled = true; };
  }, [teamId, selectedSeason?.id]);

  const defaultStats = {
    wins: 0, losses: 0, ties: 0,
    points_for: 0, points_against: 0,
    streak_type: null, streak_count: 0
  };

  const fetchTeamStandings = async (cancelled) => {
    try {
      // Fetch team info
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('name, color')
        .eq('id', teamId)
        .single();

      if (cancelled) return;
      if (!teamError && team) {
        setTeamName(team.name || 'Your Team');
      }

      // Fetch team standings — may not exist, handle gracefully
      const { data: standings, error: standingsError } = await supabase
        .from('team_standings')
        .select('*')
        .eq('team_id', teamId)
        .eq('season_id', selectedSeason.id)
        .single();

      if (cancelled) return;
      if (standingsError) {
        if (standingsError.code !== 'PGRST116') {
          console.warn('team_standings query failed (table may not exist):', standingsError.message);
        }
        setTeamStats(defaultStats);
        return;
      }

      setTeamStats(standings || defaultStats);
    } catch (err) {
      if (!cancelled) {
        console.warn('TeamStandingsWidget fetch error:', err.message);
        setTeamStats(defaultStats);
      }
    }
  };

  const calculateWinPct = () => {
    if (!teamStats) return 0;
    const total = teamStats.wins + teamStats.losses + teamStats.ties;
    if (total === 0) return 0;
    return ((teamStats.wins + (teamStats.ties * 0.5)) / total * 100).toFixed(0);
  };

  const getStreakInfo = () => {
    if (!teamStats?.streak_type || teamStats.streak_count === 0) {
      return { text: '-', color: tc.textMuted, icon: Minus };
    }
    if (teamStats.streak_type === 'win') {
      return { text: `${teamStats.streak_count}W`, color: 'text-emerald-400', icon: TrendingUp };
    }
    if (teamStats.streak_type === 'loss') {
      return { text: `${teamStats.streak_count}L`, color: 'text-red-400', icon: TrendingDown };
    }
    return { text: `${teamStats.streak_count}T`, color: 'text-amber-400', icon: Minus };
  };

  const streak = getStreakInfo();
  const StreakIcon = streak.icon;
  const winPct = calculateWinPct();
  const pointDiff = (teamStats?.points_for || 0) - (teamStats?.points_against || 0);

  if (loading) {
    return (
      <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
        </div>
      </div>
    );
  }

  if (!teamId) {
    return null;
  }

  return (
    <div className={`${tc.cardBg} border ${tc.border} rounded-xl p-5`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
        <h3 className={`font-semibold ${tc.text}`}>Team Standings</h3>
      </div>

      {/* Team Name */}
      <div className="text-center mb-3">
        <div className={`text-sm ${tc.textMuted}`}>{teamName}</div>
      </div>

      {/* Record Display */}
      <div className="bg-gradient-to-r from-[var(--accent-primary)]/10 to-purple-500/10 border border-[var(--accent-primary)]/20 rounded-xl p-4 mb-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${tc.text}`}>
            {teamStats?.wins || 0} - {teamStats?.losses || 0}
            {teamStats?.ties > 0 && (
              <span className={`text-xl ${tc.textMuted}`}> - {teamStats.ties}</span>
            )}
          </div>
          <div className={`text-sm ${tc.textSecondary} mt-1`}>Season Record</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Win % */}
        <div className={`${tc.cardBgAlt} rounded-lg p-3`}>
          <div className="text-lg font-bold text-[var(--accent-primary)]">{winPct}%</div>
          <div className={`text-xs ${tc.textMuted}`}>Win %</div>
        </div>

        {/* Streak */}
        <div className={`${tc.cardBgAlt} rounded-lg p-3`}>
          <div className={`text-lg font-bold flex items-center justify-center gap-1 ${streak.color}`}>
            <StreakIcon className="w-4 h-4" />
            {streak.text}
          </div>
          <div className={`text-xs ${tc.textMuted}`}>Streak</div>
        </div>

        {/* Point Diff */}
        <div className={`${tc.cardBgAlt} rounded-lg p-3`}>
          <div className={`text-lg font-bold ${pointDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {pointDiff >= 0 ? '+' : ''}{pointDiff}
          </div>
          <div className={`text-xs ${tc.textMuted}`}>Pt Diff</div>
        </div>
      </div>

      {/* View Full Standings Link */}
      {onViewStandings && (
        <button
          onClick={onViewStandings}
          className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-[var(--accent-primary)] hover:underline font-medium"
        >
          View Full Standings
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default TeamStandingsWidget;
