-- Dump all current RLS policies for security-critical tables
-- Run this in Supabase SQL Editor to see actual live policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename IN (
  'teams', 'players', 'schedule_events', 'payments',
  'registrations', 'families', 'profiles', 'user_roles',
  'team_players', 'team_posts', 'chat_channels', 'chat_messages',
  'notifications', 'invitations', 'registration_fees',
  'player_parents', 'coaches', 'seasons', 'programs',
  'organizations'
)
ORDER BY tablename, policyname;
