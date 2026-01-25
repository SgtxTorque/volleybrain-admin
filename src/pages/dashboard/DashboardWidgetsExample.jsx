import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSeason } from '../../context/SeasonContext';

// Import all widgets
import {
  TeamRecordWidget,
  TopPlayerWidget,
  TeamStandingsWidget,
  ChildStatsWidget,
  MyStatsWidget,
  MyBadgesWidget,
} from '../../components/widgets';

/**
 * DashboardWidgetsExample
 * 
 * This file demonstrates how to integrate the dashboard widgets
 * into your existing role-based dashboards.
 * 
 * Copy the relevant sections into your dashboard pages.
 */

// ============================================
// COACH DASHBOARD WIDGETS
// ============================================
export const CoachDashboardWidgets = ({ teamId }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Team Record Widget */}
      <TeamRecordWidget teamId={teamId} />

      {/* Top Player Widget */}
      <TopPlayerWidget
        teamId={teamId}
        onViewLeaderboards={() => navigate('/leaderboards')}
      />
    </div>
  );
};

// ============================================
// PARENT DASHBOARD WIDGETS
// ============================================
export const ParentDashboardWidgets = ({ teamId, childIds }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Team Standings Widget */}
      <TeamStandingsWidget
        teamId={teamId}
        onViewStandings={() => navigate('/standings')}
      />

      {/* Child Stats Widget (supports multiple children) */}
      <ChildStatsWidget
        parentId={user?.id}
        childIds={childIds}
        onViewLeaderboards={() => navigate('/leaderboards')}
      />
    </div>
  );
};

// ============================================
// PLAYER DASHBOARD WIDGETS
// ============================================
export const PlayerDashboardWidgets = ({ playerId }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* My Stats Widget */}
      <MyStatsWidget
        playerId={playerId}
        onViewStats={() => navigate('/profile/stats')}
      />

      {/* My Badges Widget */}
      <MyBadgesWidget
        playerId={playerId}
        onViewBadges={() => navigate('/profile/badges')}
      />
    </div>
  );
};

// ============================================
// ADMIN DASHBOARD - FULL OVERVIEW
// ============================================
export const AdminDashboardWidgets = ({ teamId, selectedPlayerId }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Team Overview Row */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TeamRecordWidget teamId={teamId} />
          <TopPlayerWidget
            teamId={teamId}
            onViewLeaderboards={() => navigate('/leaderboards')}
          />
          <TeamStandingsWidget
            teamId={teamId}
            onViewStandings={() => navigate('/standings')}
          />
        </div>
      </div>

      {/* Player Spotlight (optional - shows selected player) */}
      {selectedPlayerId && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Player Spotlight</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MyStatsWidget playerId={selectedPlayerId} />
            <MyBadgesWidget playerId={selectedPlayerId} />
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// UNIFIED DASHBOARD SWITCHER
// ============================================
const DashboardWidgetsExample = () => {
  const { user, userRole } = useAuth();
  const { currentSeason } = useSeason();
  const navigate = useNavigate();

  // Get team ID based on role
  const getTeamId = () => {
    // This would come from your context or user data
    return user?.current_team_id || user?.team_id;
  };

  // Get child IDs for parent role
  const getChildIds = () => {
    // This would come from your linked_players or similar
    return user?.linked_player_ids || [];
  };

  const teamId = getTeamId();

  // Render based on role
  const renderWidgets = () => {
    switch (userRole) {
      case 'admin':
        return <AdminDashboardWidgets teamId={teamId} />;
      
      case 'coach':
        return <CoachDashboardWidgets teamId={teamId} />;
      
      case 'parent':
        return (
          <ParentDashboardWidgets
            teamId={teamId}
            childIds={getChildIds()}
          />
        );
      
      case 'player':
        return <PlayerDashboardWidgets playerId={user?.player_id} />;
      
      default:
        return (
          <div className="text-center py-12 text-gray-500">
            No dashboard widgets available for your role.
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Season Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {currentSeason?.name || 'Dashboard'}
        </h1>
        <p className="text-gray-500">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}!
        </p>
      </div>

      {/* Role-based Widgets */}
      {renderWidgets()}
    </div>
  );
};

export default DashboardWidgetsExample;
