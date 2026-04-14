-- Add unique constraint to prevent duplicate auto-generated fees
-- This prevents the race condition where two simultaneous approve clicks
-- both pass the check-then-insert guard in fee-calculator.js

-- First, find and report any existing duplicates
SELECT player_id, season_id, fee_type, fee_name, COUNT(*), array_agg(id) as payment_ids
FROM payments
WHERE auto_generated = true
GROUP BY player_id, season_id, fee_type, fee_name
HAVING COUNT(*) > 1;

-- To add the constraint (run AFTER reviewing duplicates):
-- ALTER TABLE payments ADD CONSTRAINT payments_unique_auto_fee
--   UNIQUE (player_id, season_id, fee_type, fee_name)
--   WHERE (auto_generated = true);
--
-- NOTE: This is a partial unique index (only applies to auto_generated rows).
-- Manual fee additions by admin are NOT constrained.
-- If duplicates exist, they must be cleaned up BEFORE adding the constraint.
