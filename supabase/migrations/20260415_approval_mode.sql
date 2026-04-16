-- Payment-gated approval: per-season workflow mode
-- Determines when fees are generated and whether payment gates approval

-- Add approval_mode to seasons
ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS approval_mode TEXT DEFAULT 'open'
  CHECK (approval_mode IN ('open', 'pay_first', 'tryout_first'));

-- Add gates_approval to fee configuration
-- This allows admins to choose WHICH fee types must be paid before approval
-- Stored as a JSONB array on the season: e.g. ['registration'] means only reg fee gates
-- If null/empty, ALL auto-generated fees gate (backward compat for pay_first mode)
ALTER TABLE seasons
  ADD COLUMN IF NOT EXISTS approval_gate_fees JSONB DEFAULT '["registration"]';

COMMENT ON COLUMN seasons.approval_mode IS 'open = approve anytime (default), pay_first = require payment before approval, tryout_first = fees generated after team assignment';
COMMENT ON COLUMN seasons.approval_gate_fees IS 'JSON array of fee_type values that must be paid before approval in pay_first mode. e.g. ["registration"] or ["registration","uniform"]';
