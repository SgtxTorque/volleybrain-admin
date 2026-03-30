# Security Notes

## pg_cron Email Queue Job
The cron job `process-email-queue` (created by `supabase/migrations/20260326_pg_cron_email_queue.sql`)
uses a hardcoded anon JWT for the Authorization header.

**To fix:** In Supabase Dashboard → SQL Editor, run:
```sql
SELECT cron.unschedule('process-email-queue');

SELECT cron.schedule(
  'process-email-queue',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uqpjvbiuokwpldjvxiby.supabase.co/functions/v1/send-payment-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Prerequisite:** Store the service_role key in Supabase Vault first:
1. Go to Supabase Dashboard → Settings → Vault
2. Add secret: name = `service_role_key`, value = your service_role JWT
