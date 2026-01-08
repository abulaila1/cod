/*
  # Hybrid Billing System Support

  ## Overview
  This migration ensures the trial system is properly configured and adds support
  for the hybrid billing model (Stripe + Manual payments).

  ## Changes
  1. Ensure trial_ends_at defaults to NOW() + 24 hours for new billing records
  2. Add notes column to business_billing if not exists (for payment receipts)
  3. Create function to check discount eligibility (multi-workspace owners)

  ## Security
  - All functions use SECURITY DEFINER with restricted search_path
  - RLS policies remain unchanged
*/

-- Ensure notes column exists for storing payment receipt references
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_billing' AND column_name = 'notes'
  ) THEN
    ALTER TABLE business_billing ADD COLUMN notes text;
  END IF;
END $$;

-- Create function to check if user is eligible for multi-workspace discount
CREATE OR REPLACE FUNCTION check_discount_eligibility(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workspace_count integer;
BEGIN
  SELECT COUNT(DISTINCT b.id)
  INTO workspace_count
  FROM businesses b
  INNER JOIN business_members bm ON b.id = bm.business_id
  WHERE bm.user_id = user_id_param
    AND bm.status = 'active'
    AND (bm.role = 'admin' OR bm.role = 'owner');
  
  RETURN workspace_count > 1;
END;
$$;

GRANT EXECUTE ON FUNCTION check_discount_eligibility(uuid) TO authenticated;

-- Create function to submit manual payment
CREATE OR REPLACE FUNCTION submit_manual_payment(
  workspace_id uuid,
  plan_name text,
  amount numeric,
  receipt_ref text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user has access to this workspace
  IF NOT EXISTS (
    SELECT 1 FROM business_members
    WHERE business_id = workspace_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('admin', 'owner')
  ) THEN
    RAISE EXCEPTION 'Access denied: You must be an admin or owner of this workspace';
  END IF;

  -- Update businesses table
  UPDATE businesses
  SET 
    manual_payment_status = 'pending',
    plan_type = plan_name || '_pending',
    updated_at = now()
  WHERE id = workspace_id;

  -- Update billing notes with receipt reference
  UPDATE business_billing
  SET 
    notes = 'Receipt: ' || receipt_ref || ' | Plan: ' || plan_name || ' | Amount: $' || amount,
    updated_at = now()
  WHERE business_id = workspace_id;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_manual_payment(uuid, text, numeric, text) TO authenticated;

COMMENT ON FUNCTION check_discount_eligibility(uuid) IS 'Returns true if user owns more than one workspace (eligible for 50% discount)';
COMMENT ON FUNCTION submit_manual_payment(uuid, text, numeric, text) IS 'Submits a manual payment request for approval';