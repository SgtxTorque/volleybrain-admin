-- =============================================================
-- Migration: Enable pg_cron + pg_net for automated email queue
-- =============================================================
-- This sets up a cron job that calls the send-payment-reminder
-- edge function every 2 minutes, so queued emails get processed
-- automatically without manual invocation.
--
-- PREREQUISITES (run these in Supabase Dashboard → SQL Editor FIRST):
--   1. Go to Database → Extensions
--   2. Enable "pg_cron"
--   3. Enable "pg_net"
--   Or run:
--     CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
--     CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
--
-- Then run the rest of this migration.
-- =============================================================

-- Step 1: Enable extensions (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Step 2: Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Step 3: Remove existing job if re-running this migration
SELECT cron.unschedule('process-email-queue')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'process-email-queue'
);

-- Step 4: Schedule the cron job — every 2 minutes
-- Uses pg_net to make an HTTP POST to the edge function
SELECT cron.schedule(
  'process-email-queue',          -- job name
  '*/2 * * * *',                  -- every 2 minutes
  $$
  SELECT net.http_post(
    url := 'https://uqpjvbiuokwpldjvxiby.supabase.co/functions/v1/send-payment-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcGp2Yml1b2t3cGxkanZ4aWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTEwODMsImV4cCI6MjA4Mjc4NzA4M30.k643d5gVS2uWWe_QgSvAMjWVuRgBIU2wI0bR38vYDCc'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Step 5: Verify the job was created
-- SELECT * FROM cron.job WHERE jobname = 'process-email-queue';
