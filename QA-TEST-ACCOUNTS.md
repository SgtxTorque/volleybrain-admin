# QA Test Accounts — Lynx Platform
## Updated: April 17, 2026

| Role | Email | Password | Org | Notes |
|------|-------|----------|-----|-------|
| Admin | qatestdirector2026@gmail.com | QATest2026! | QA Panthers Athletics | Primary QA admin |
| Coach | qatestdirector2026+coach@gmail.com | TestCoach2026! | QA Panthers Athletics | Head coach, first team in season |
| Parent | qatestdirector2026+parent@gmail.com | TestParent2026! | QA Panthers Athletics | Parent of first unlinked player |
| Player | (needs Player Pass setup) | — | QA Panthers Athletics | Create via parent dashboard |
| Team Mgr | (not created yet) | — | QA Panthers Athletics | Mobile-only role |

**NEVER use:** fuentez.carlos@gmail.com or fuentezinaction@gmail.com
**DEPRECATED:** All @example.com accounts are non-functional (Supabase rejects the domain)

## How to Create Accounts

```bash
# From the repo root:
node scripts/create-qa-test-accounts.mjs
```

The script reads `.env` for Supabase credentials. If `SUPABASE_SERVICE_ROLE_KEY` is not in `.env`, set it:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/create-qa-test-accounts.mjs
```

All Gmail subaddressed emails deliver to the same `qatestdirector2026@gmail.com` inbox.
