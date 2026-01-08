/*
  # Fix Businesses RLS - Auto-set created_by to Prevent 403

  ## Problem
  POST /rest/v1/businesses returns 403 "new row violates row-level security policy"
  Infinite spinner on "جاري التحقق من حسابك" because workspace creation fails.

  ## Root Cause
  The `created_by` field is not being set correctly during INSERT, causing RLS policy to reject the row.

  ## Solution
  1. Add BEFORE INSERT trigger to auto-set `created_by = auth.uid()` if null
  2. Fix RLS INSERT policy to allow when `created_by = auth.uid()`
  3. Add index on `created_by` for performance
  4. Keep AFTER INSERT provisioning trigger intact

  ## Changes
  - BEFORE INSERT trigger ensures `created_by` is always set
  - RLS policy now simple and reliable
  - Index improves query performance
*/

-- =====================================================
-- STEP 1: Create BEFORE INSERT trigger to auto-set created_by
-- =====================================================

CREATE OR REPLACE FUNCTION set_business_created_by()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- If created_by is not set, set it to the current authenticated user
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;

  -- Ensure created_by matches the authenticated user (security check)
  IF NEW.created_by != auth.uid() THEN
    RAISE EXCEPTION 'created_by must match authenticated user';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_set_business_created_by ON businesses;

-- Create BEFORE INSERT trigger
CREATE TRIGGER trigger_set_business_created_by
  BEFORE INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION set_business_created_by();

-- =====================================================
-- STEP 2: Fix RLS Policies for businesses
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view member businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can update own businesses" ON businesses;

-- INSERT policy: Allow authenticated users to create businesses
-- Since BEFORE trigger sets created_by = auth.uid(), this will always pass
CREATE POLICY "Authenticated users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- SELECT policy: Users can view businesses where they have active membership
CREATE POLICY "Users can view member businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- UPDATE policy: Admins can update their businesses
CREATE POLICY "Admins can update businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  )
  WITH CHECK (
    id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- =====================================================
-- STEP 3: Add index for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_businesses_created_by 
  ON businesses(created_by);

-- =====================================================
-- STEP 4: Verify RLS is enabled
-- =====================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test that the trigger and policies are working:
-- 1. BEFORE INSERT trigger should auto-set created_by
-- 2. RLS INSERT policy should allow the insert
-- 3. AFTER INSERT trigger should provision the workspace
-- 4. User should be able to SELECT their new business

DO $$
BEGIN
  RAISE NOTICE 'Migration complete: businesses table now auto-sets created_by';
  RAISE NOTICE 'BEFORE INSERT trigger: set_business_created_by()';
  RAISE NOTICE 'AFTER INSERT trigger: provision_new_business()';
  RAISE NOTICE 'RLS policies: INSERT, SELECT, UPDATE enabled';
END;
$$;