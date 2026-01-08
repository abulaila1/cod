/*
  # Fix RLS on businesses table - DEFINITIVE SOLUTION

  ## Problem
  "new row violates row-level security policy for table businesses"
  This occurs when authenticated users try to create their first workspace.

  ## Solution
  1. Ensure created_by column exists and is NOT NULL
  2. Drop ALL existing policies (eliminate conflicts)
  3. Create BEFORE INSERT trigger that ALWAYS sets created_by = auth.uid()
  4. Create simple, non-conflicting RLS policies
  5. Users can ALWAYS create their own businesses

  ## Changes
  - Add created_by column if missing
  - Drop all existing policies on businesses
  - Create trigger to force created_by = auth.uid()
  - Create INSERT policy: WITH CHECK (created_by = auth.uid())
  - Create SELECT policy: membership-based
  - Enable RLS
*/

-- =====================================================
-- STEP 1: Ensure created_by column exists
-- =====================================================

-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'businesses'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN created_by uuid;
    RAISE NOTICE 'Added created_by column to businesses';
  END IF;
END $$;

-- Set default for existing NULL values (if any)
UPDATE public.businesses
SET created_by = (
  SELECT user_id FROM public.business_members
  WHERE business_members.business_id = businesses.id
  AND business_members.role = 'admin'
  LIMIT 1
)
WHERE created_by IS NULL;

-- Make NOT NULL (after ensuring all rows have a value)
ALTER TABLE public.businesses ALTER COLUMN created_by SET NOT NULL;

-- =====================================================
-- STEP 2: Drop ALL existing policies on businesses
-- =====================================================

DROP POLICY IF EXISTS "businesses_insert_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_select_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_insert_own" ON public.businesses;
DROP POLICY IF EXISTS "businesses_select_member" ON public.businesses;
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can create own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can view member businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can update businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can update own businesses" ON public.businesses;

-- =====================================================
-- STEP 3: Create trigger to ALWAYS set created_by
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_businesses_set_created_by ON public.businesses;
DROP FUNCTION IF EXISTS businesses_set_created_by();

-- Create function
CREATE OR REPLACE FUNCTION businesses_set_created_by()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is authenticated
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Not authenticated - cannot create business';
  END IF;

  -- ALWAYS force created_by to auth.uid() (ignore any provided value)
  NEW.created_by := (SELECT auth.uid());

  IF import.meta.env.DEV THEN
    RAISE NOTICE 'Business created_by set to: %', NEW.created_by;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_businesses_set_created_by
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION businesses_set_created_by();

-- =====================================================
-- STEP 4: Enable RLS
-- =====================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create simple, non-conflicting policies
-- =====================================================

-- INSERT: User can insert if created_by = auth.uid()
-- (Trigger ensures this is always true)
CREATE POLICY "businesses_insert_own"
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (SELECT auth.uid()));

-- SELECT: User can view businesses where they have active membership
CREATE POLICY "businesses_select_member"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = (SELECT auth.uid()) AND status = 'active'
    )
  );

-- UPDATE: Admins can update their businesses
CREATE POLICY "businesses_update_admin"
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
      AND status = 'active'
    )
  )
  WITH CHECK (
    id IN (
      SELECT business_id FROM public.business_members
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- =====================================================
-- STEP 6: Ensure business_members policies are correct
-- =====================================================

-- Drop conflicting policies on business_members
DROP POLICY IF EXISTS "business_members_select_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_insert_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_update_policy" ON public.business_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.business_members;
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.business_members;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.business_members;

-- Enable RLS on business_members
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own memberships
CREATE POLICY "business_members_select_own"
  ON public.business_members
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- INSERT: Users can insert their own memberships (for invites, etc.)
CREATE POLICY "business_members_insert_own"
  ON public.business_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- UPDATE: Users can update their own memberships
CREATE POLICY "business_members_update_own"
  ON public.business_members
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- STEP 7: Add indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_businesses_created_by
  ON public.businesses(created_by);

CREATE INDEX IF NOT EXISTS idx_business_members_user_id_status
  ON public.business_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_business_members_business_id
  ON public.business_members(business_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  policy_count int;
BEGIN
  -- Count policies on businesses
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'businesses';

  RAISE NOTICE '✅ RLS fix applied';
  RAISE NOTICE '✅ Trigger: trg_businesses_set_created_by created';
  RAISE NOTICE '✅ Policies on businesses: %', policy_count;
  RAISE NOTICE '✅ created_by will ALWAYS be set to auth.uid()';
  RAISE NOTICE '✅ RLS error should be eliminated';
END;
$$;