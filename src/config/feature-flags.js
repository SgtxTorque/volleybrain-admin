/**
 * Feature flags for Lynx Web Admin
 *
 * These control visibility of features in navigation/sidebar.
 * Routes still exist — features are hidden from nav, not deleted.
 *
 * To re-enable a feature:
 * 1. Set its flag to true
 * 2. Build and deploy
 *
 * Categories:
 * - CORE: Always visible. The TeamSnap/Heja basics.
 * - ADVANCED: Hidden until core is bulletproof. Re-enable one at a time.
 * - PLATFORM: PA-only features, always gated behind isPlatformAdmin.
 */

export const FEATURE_FLAGS = {
  // ===== GAME DAY (advanced coach tools) =====
  gamePrep: false,          // Lineup builder, game completion, stats entry
  standings: false,         // Team standings (requires game data)
  leaderboards: false,      // Season leaderboards (requires stats data)

  // ===== GAMIFICATION (engagement layer) =====
  achievements: false,      // Badge catalog, achievement tracking
  playerStats: false,       // Individual player stats page
  playerPass: false,        // PIN-based player login, QR code
  playerDashboard: false,   // Player-specific dashboard with badges/challenges
  engagement: false,        // Shoutouts, challenges, XP/levels display

  // ===== COACH TOOLS (advanced) =====
  drillLibrary: false,      // Practice planning, drill library
  coachReflection: false,   // Post-practice reflection
  coachAvailability: true,  // Coach availability scheduling — KEEP VISIBLE

  // ===== OPERATIONS (nice-to-have) =====
  jerseys: true,            // Jersey management — KEEP VISIBLE
  archives: false,          // Season archives

  // ===== ANALYTICS (power user) =====
  registrationFunnel: true,  // Funnel analytics dashboard — KEEP VISIBLE
  dataExport: false,         // Data export tools

  // ===== BUSINESS =====
  subscription: false,      // Subscription management

  // ===== AUTH =====
  googleOAuth: false,       // Google sign-in (requires Supabase OAuth config)
  appleOAuth: false,        // Apple sign-in (requires Supabase OAuth config)

  // ===== SOCIAL =====
  teamWall: false,          // Team wall post feed, photo gallery, reactions

  // ===== ALWAYS ON (core basics — listed for documentation) =====
  // dashboard: true,
  // teams: true,
  // coaches: true,
  // registrations: true,
  // payments: true,
  // schedule: true,
  // attendance: true,
  // chat: true,
  // blasts: true,
  // reports: true,
  // settings: true,
  // setup: true,
  // roster: true,
  // programs: true,
  // notifications: true,
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Key from FEATURE_FLAGS
 * @returns {boolean}
 */
export function isFeatureEnabled(featureName) {
  return FEATURE_FLAGS[featureName] === true;
}
