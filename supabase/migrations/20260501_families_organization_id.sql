-- Add organization_id to families table for cross-org data isolation
-- Each org gets its own family record per parent email

-- Step 1: Add the column (nullable initially for backfill)
ALTER TABLE families
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Step 2: Backfill from linked players → seasons → organizations
-- Each family gets the org_id of its first linked player's season
UPDATE families f
SET organization_id = sub.org_id
FROM (
  SELECT DISTINCT ON (p.family_id)
    p.family_id,
    s.organization_id AS org_id
  FROM players p
  JOIN seasons s ON p.season_id = s.id
  WHERE p.family_id IS NOT NULL
    AND s.organization_id IS NOT NULL
  ORDER BY p.family_id, p.created_at DESC
) sub
WHERE f.id = sub.family_id
  AND f.organization_id IS NULL;

-- Step 3: For any remaining families with no linked players,
-- try to derive from registrations
UPDATE families f
SET organization_id = sub.org_id
FROM (
  SELECT DISTINCT ON (r.family_id)
    r.family_id,
    s.organization_id AS org_id
  FROM registrations r
  JOIN seasons s ON r.season_id = s.id
  WHERE r.family_id IS NOT NULL
    AND s.organization_id IS NOT NULL
  ORDER BY r.family_id, r.created_at DESC
) sub
WHERE f.id = sub.family_id
  AND f.organization_id IS NULL;

-- Step 4: Add unique constraint (only after backfill)
-- This prevents duplicate families per org+email
-- Must be partial — only enforced where both columns are NOT NULL
CREATE UNIQUE INDEX IF NOT EXISTS families_org_email_unique
ON families (organization_id, primary_email)
WHERE organization_id IS NOT NULL AND primary_email IS NOT NULL;

-- Step 5: Create index for the common lookup pattern
CREATE INDEX IF NOT EXISTS families_org_email_lookup
ON families (organization_id, primary_email)
WHERE primary_email IS NOT NULL;
