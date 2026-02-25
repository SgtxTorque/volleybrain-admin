# DATABASE_SCHEMA.md — VolleyBrain Supabase Schema Reference

**Supabase Project**: `uqpjvbiuokwpldjvxiby`
**Shared by**: volleybrain-admin (web) + volleybrain-mobile3 (mobile)
**Last updated**: February 2026
**Total tables**: 62+

> ⚠️ IMPORTANT: Run this query in Supabase SQL Editor to get the latest live schema:
> ```sql
> SELECT table_name, column_name, data_type
> FROM information_schema.columns
> WHERE table_schema = 'public'
> ORDER BY table_name, ordinal_position
> LIMIT 2000;
> ```
> Export as CSV and compare against this doc if anything seems off.

---

## CORE TABLES

### organizations
- id (uuid, PK)
- name, slug, description, logo_url, banner_url
- sport_type, website, email, phone
- address, city, state, zip
- settings (jsonb) — org-level config
- stripe_enabled, stripe_mode, stripe_publishable_key
- payment_processing_fee_mode, allow_partial_payments
- minimum_payment_amount, send_receipt_emails
- venmo_handle, zelle_info, cashapp_handle, payment_instructions
- is_active, created_at, updated_at

### profiles
- id (uuid, PK — matches auth.users.id)
- full_name, email, phone, avatar_url
- role (text — 'admin', 'coach', 'parent', 'player')
- organization_id (FK → organizations)
- created_at, updated_at

### user_roles
- id (uuid, PK)
- user_id (FK → profiles)
- organization_id (FK → organizations)
- role (text)
- created_at

### seasons
- id (uuid, PK)
- organization_id (FK → organizations)
- sport_id (FK → sports)
- name, description
- start_date, end_date
- registration_start, registration_end
- status ('draft', 'open', 'active', 'completed', 'archived')
- is_active (boolean)
- max_players, fee_amount
- settings (jsonb)
- created_at, updated_at

### sports
- id (uuid, PK)
- name, icon, description
- positions (jsonb — array of position names)
- stats_config (jsonb — stat categories for this sport)
- created_at

---

## TEAM & PLAYER TABLES

### teams
- id (uuid, PK)
- organization_id, season_id (FKs)
- name, color, level, age_group, gender
- logo_url, banner_url, motto
- max_players, is_active
- created_at, updated_at

### players
- id (uuid, PK)
- organization_id, season_id (FKs)
- first_name, last_name, email
- phone, date_of_birth, gender, grade
- parent_name, parent_email, parent_phone
- parent_account_id (FK → profiles — links player to parent's auth account)
- emergency_contact_name, emergency_contact_phone
- medical_notes, allergies
- photo_url, jersey_number, position
- status ('pending', 'approved', 'waitlisted', 'denied', 'inactive')
- registration_date, registration_notes
- school, address, city, state, zip
- created_at, updated_at

### team_players
- id (uuid, PK)
- team_id (FK → teams)
- player_id (FK → players)
- jersey_number, position, role
- is_active, joined_at

### coaches
- id (uuid, PK)
- user_id (FK → profiles)
- organization_id (FK → organizations)
- first_name, last_name, email, phone
- photo_url, bio, certifications
- background_check_status, background_check_date
- is_active, created_at, updated_at

### team_coaches
- id (uuid, PK)
- team_id (FK → teams)
- coach_id (FK → coaches)
- role ('head', 'assistant')
- created_at

---

## SCHEDULE & EVENTS

### schedule_events
- id (uuid, PK)
- organization_id, season_id, team_id (FKs)
- title, description
- event_type ('practice', 'game', 'tournament', 'meeting', 'other')
- event_date, event_time, end_time, duration_minutes
- location, venue_id, venue_name, venue_address
- opponent_name, opponent_id
- is_home_game, uniform_color
- recurring_pattern, recurring_end_date
- status ('scheduled', 'cancelled', 'completed', 'postponed')
- notes, created_by
- created_at, updated_at

### event_rsvps
- id (uuid, PK)
- event_id (FK → schedule_events)
- player_id (FK → players)
- status ('going', 'not_going', 'maybe')
- responded_by (FK → profiles)
- notes, responded_at
- created_at, updated_at

### event_volunteers
- id (uuid, PK)
- event_id (FK → schedule_events)
- user_id (FK → profiles)
- role ('line_judge', 'scorekeeper', 'snack_parent', 'other')
- status ('signed_up', 'confirmed', 'cancelled')
- notes, created_at

### venues
- id (uuid, PK)
- organization_id (FK)
- name, address, city, state, zip
- courts_count, notes
- is_active, created_at

---

## PAYMENTS & REGISTRATION

### payments
- id (uuid, PK)
- organization_id, season_id, player_id (FKs)
- amount, payment_method, payment_date
- status ('pending', 'completed', 'failed', 'refunded')
- transaction_id, notes
- recorded_by (FK → profiles)
- verified, verified_by, verified_at
- created_at, updated_at

### registration_fees
- id (uuid, PK)
- season_id, player_id (FKs)
- fee_type, description, amount
- due_date, status
- created_at

### payment_plans
- id (uuid, PK)
- player_id, season_id (FKs)
- total_amount, number_of_installments
- status, created_at

### payment_plan_installments
- id (uuid, PK)
- plan_id (FK → payment_plans)
- amount, due_date, status
- paid_at, payment_id

### registration_templates
- id (uuid, PK)
- organization_id, season_id (FKs)
- name, fields (jsonb — custom form field definitions)
- is_active, created_at

### registration_custom_fields
- id (uuid, PK)
- template_id (FK → registration_templates)
- field_name, field_type, field_options (jsonb)
- is_required, sort_order

---

## CHAT & MESSAGING

### chat_channels
- id (uuid, PK)
- team_id, organization_id, season_id (FKs)
- channel_name, channel_type ('team_chat', 'player_chat', 'coach_chat', 'dm', 'group_dm', 'league_announcement')
- description, is_active, created_by
- last_message_at, message_count
- created_at

### channel_members
- id (uuid, PK)
- channel_id (FK → chat_channels)
- user_id (FK → profiles)
- display_name, member_role ('admin', 'coach', 'parent', 'player')
- can_post, can_moderate
- is_muted, last_read_at, last_read_message_id
- joined_at, left_at
- UNIQUE(channel_id, user_id)

### chat_messages
- id (uuid, PK)
- channel_id (FK → chat_channels)
- sender_id (FK → profiles)
- message_type ('text', 'image', 'video', 'gif', 'system')
- content, reply_to_id (FK → chat_messages for threading)
- is_pinned, is_edited, is_deleted, deleted_by
- created_at, edited_at, deleted_at

### message_attachments
- id (uuid, PK)
- message_id (FK → chat_messages)
- attachment_type ('image', 'video', 'gif')
- file_url, file_name, file_size, mime_type
- width, height, duration_seconds, thumbnail_url
- created_at

### message_reactions
- id (uuid, PK)
- message_id (FK → chat_messages)
- user_id (FK → profiles)
- reaction_type (text — emoji)
- created_at
- UNIQUE(message_id, user_id, reaction_type)

---

## ANNOUNCEMENTS & BLASTS

### announcements
- id (uuid, PK)
- organization_id, season_id (FKs)
- title, body, announcement_type, priority
- target_type ('all', 'team', 'parents', 'coaches')
- target_team_id, created_by
- is_active, is_pinned
- total_recipients, read_count
- published_at, expires_at, created_at

### announcement_reads
- id (uuid, PK)
- announcement_id (FK), user_id (FK)
- read_at

### messages (blast messages)
- id (uuid, PK)
- organization_id, season_id, sender_id (FKs)
- title, body, message_type, priority
- target_type, target_team_id
- requires_acknowledgment
- total_recipients, acknowledged_count
- created_at

### message_recipients
- id (uuid, PK)
- message_id (FK → messages)
- player_id (FK → players)
- recipient_name, recipient_email, recipient_phone, recipient_type
- acknowledged, acknowledged_at
- delivered, delivered_at, delivery_method
- created_at

---

## TEAM WALL / SOCIAL FEED

### team_posts
- id (uuid, PK)
- team_id (FK → teams)
- author_id (FK → profiles)
- post_type ('announcement', 'photo', 'game_recap', 'shoutout', 'milestone')
- content (text)
- media_urls (jsonb — array of image/video URLs)
- is_pinned, is_published
- reaction_count, comment_count, share_count
- created_at, updated_at

### team_post_reactions (⚠️ web code may reference as 'post_reactions' — verify!)
- id (uuid, PK)
- post_id (FK → team_posts)
- user_id (FK → profiles)
- reaction_type ('like', 'love', 'celebrate', 'fire', 'clap')
- created_at
- UNIQUE(post_id, user_id)

### team_post_comments
- id (uuid, PK)
- post_id (FK → team_posts)
- author_id (FK → profiles)
- parent_comment_id (FK → team_post_comments, for threading)
- content (text)
- is_deleted, deleted_at, deleted_by
- created_at, updated_at

### team_documents
- id (uuid, PK)
- team_id (FK → teams)
- uploaded_by (FK → profiles)
- name, description, file_url
- file_type, file_size, category
- is_archived, created_at, updated_at

### team_milestones
- id (uuid, PK)
- team_id (FK → teams)
- title, description, milestone_type
- milestone_date, created_at

---

## GAME & STATS

### games
- id (uuid, PK)
- schedule_event_id (FK → schedule_events)
- team_id, season_id (FKs)
- opponent_name, opponent_score
- home_score, result ('win', 'loss', 'tie')
- status ('scheduled', 'in_progress', 'completed')
- notes, completed_at, created_at

### game_sets
- id (uuid, PK)
- game_id (FK → games)
- set_number, home_score, away_score
- result, created_at

### game_stats
- id (uuid, PK)
- game_id, player_id (FKs)
- stat_type (text — 'kill', 'assist', 'block', 'dig', 'ace', 'serve_error', etc.)
- value (integer)
- set_number, created_at

### game_lineups
- id (uuid, PK)
- game_id, team_id (FKs)
- lineup_name, is_active
- created_at

### game_lineup_players
- id (uuid, PK)
- lineup_id (FK → game_lineups)
- player_id (FK → players)
- position, rotation_order
- is_starter, created_at

### team_standings
- id (uuid, PK)
- team_id, season_id (FKs)
- wins, losses, ties, points_for, points_against
- win_percentage, streak
- last_10 (jsonb)
- updated_at

---

## JERSEYS

### jerseys
- id (uuid, PK)
- organization_id, season_id (FKs)
- number, size, color, status
- created_at

### jersey_assignments
- id (uuid, PK)
- jersey_id, player_id, team_id (FKs)
- assigned_at, returned_at
- status, notes

### jersey_change_requests
- id (uuid, PK)
- player_id, team_id (FKs)
- current_number, requested_number
- reason, status ('pending', 'approved', 'denied')
- created_at

---

## WAIVERS

### waivers
- id (uuid, PK)
- organization_id, season_id (FKs)
- title, content (text — the waiver text)
- waiver_type, is_required, is_active
- created_at, updated_at

### waiver_signatures
- id (uuid, PK)
- waiver_id (FK → waivers)
- player_id (FK → players)
- signed_by (FK → profiles)
- signature_data, signed_at
- ip_address, created_at

---

## ACHIEVEMENTS & BADGES

### achievement_categories
- id (uuid, PK)
- name, description, icon, color
- sort_order, created_at

### achievements
- id (uuid, PK)
- category_id (FK → achievement_categories)
- name, description, icon, badge_image_url
- criteria_type, criteria_value (jsonb)
- points, tier ('bronze', 'silver', 'gold', 'platinum')
- is_active, created_at

### player_achievements
- id (uuid, PK)
- player_id (FK → players)
- achievement_id (FK → achievements)
- awarded_at, awarded_by
- notes, created_at

### player_achievement_progress
- id (uuid, PK)
- player_id (FK → players)
- achievement_id (FK → achievements)
- current_value, target_value
- percentage, last_updated

---

## NOTIFICATIONS

### admin_notifications
- id (uuid, PK)
- organization_id (FK)
- type (text — 'jersey_change', 'payment_received', 'waiver_signed', 'registration_new', 'rsvp_update')
- title, message, data (jsonb)
- is_read, created_at

### notification_templates
- id (uuid, PK)
- organization_id (FK)
- name, subject, body
- trigger_event, is_active
- created_at

### push_subscriptions
- id (uuid, PK)
- user_id (FK → profiles)
- endpoint, p256dh, auth
- is_active, created_at

---

## NOTES ON TABLE NAME CONFLICTS

⚠️ The web codebase references `post_reactions` in some places, but the actual Supabase table may be `team_post_reactions`. Before building features, always verify the actual table name:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE '%reaction%';
```

Similarly, some older code references `events` while newer code uses `schedule_events`. The correct table is `schedule_events`.
