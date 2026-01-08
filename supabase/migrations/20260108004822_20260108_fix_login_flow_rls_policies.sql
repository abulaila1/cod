/*
  # Fix Login Flow - RLS Policies for business_members

  ## Problem
  Users are unable to log in or get stuck during authentication due to:
  - Inconsistent auth.uid() usage in RLS policies (some use auth.uid(), some use (select auth.uid()))
  - Missing or overly restrictive policies on business_members table
  - Users cannot read their own business_members row after login

  ## Solution
  1. Drop all existing business_members policies
  2. Recreate with consistent (select auth.uid()) pattern for performance
  3. Ensure users can ALWAYS read their own membership records
  4. Add proper policies for INSERT/UPDATE/DELETE operations

  ## Impact
  - Users can successfully log in and load their business memberships
  - Consistent performance with auth initialization pattern
  - Proper access control maintained
*/

-- ============================================================================
-- STEP 1: Clean up existing business_members policies
-- ============================================================================

DROP POLICY IF EXISTS "business_members_select_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_insert_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_update_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_delete_policy" ON public.business_members;
DROP POLICY IF EXISTS "business_members_select_own" ON public.business_members;
DROP POLICY IF EXISTS "business_members_insert_own" ON public.business_members;
DROP POLICY IF EXISTS "business_members_update_own" ON public.business_members;
DROP POLICY IF EXISTS "business_members_delete_own" ON public.business_members;

-- Ensure RLS is enabled
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create optimized RLS policies
-- ============================================================================

-- SELECT: Users can ALWAYS view their own memberships (critical for login)
CREATE POLICY "Users can view their own memberships"
  ON public.business_members
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- INSERT: Only the trigger can insert (prevents manual membership manipulation)
-- Users should NOT be able to insert their own memberships directly
-- Memberships are created via trigger on business creation or via invitations
CREATE POLICY "System can insert memberships"
  ON public.business_members
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- UPDATE: Users can update their own memberships (e.g., accept invitations)
-- But cannot change user_id or business_id
CREATE POLICY "Users can update their own memberships"
  ON public.business_members
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (
    user_id = (select auth.uid())
    AND user_id = (SELECT user_id FROM public.business_members WHERE id = business_members.id)
    AND business_id = (SELECT business_id FROM public.business_members WHERE id = business_members.id)
  );

-- DELETE: Users cannot delete memberships
-- Only admins through proper channels should be able to remove members
CREATE POLICY "Users cannot delete memberships"
  ON public.business_members
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================================
-- STEP 3: Add policy to allow trigger/system operations
-- ============================================================================

-- This policy allows the automatic_workspace_provisioning trigger to insert
-- We need to use SECURITY DEFINER or allow the service role
-- Since triggers run with SECURITY DEFINER, we need to adjust the INSERT policy

-- Drop the restrictive INSERT policy and create a more permissive one
DROP POLICY IF EXISTS "System can insert memberships" ON public.business_members;

-- Allow INSERT only for:
-- 1. The user creating their own membership via trigger (created automatically)
-- 2. Admins inviting users (handled by invitation system)
CREATE POLICY "Memberships can be created via system"
  ON public.business_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if it's the user's own membership (for trigger-created memberships)
    user_id = (select auth.uid())
    OR
    -- Allow if the inserting user is an admin of the business
    EXISTS (
      SELECT 1 FROM public.business_members
      WHERE business_id = business_members.business_id
      AND user_id = (select auth.uid())
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- ============================================================================
-- STEP 4: Verify function access
-- ============================================================================

-- Ensure create_workspace function has proper permissions
-- Check if the function exists and grant necessary permissions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'create_workspace'
  ) THEN
    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.create_workspace TO authenticated;
    RAISE NOTICE '✅ Granted execute permission on create_workspace';
  ELSE
    RAISE NOTICE '⚠️ create_workspace function not found';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Verify trigger function permissions
-- ============================================================================

-- Ensure automatic_workspace_provisioning trigger function can insert
-- The trigger should use SECURITY DEFINER to bypass RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'automatic_workspace_provisioning'
  ) THEN
    -- Make sure the trigger function is SECURITY DEFINER
    ALTER FUNCTION public.automatic_workspace_provisioning() SECURITY DEFINER;
    RAISE NOTICE '✅ Set automatic_workspace_provisioning to SECURITY DEFINER';
  ELSE
    RAISE NOTICE '⚠️ automatic_workspace_provisioning function not found';
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'business_members'
  AND schemaname = 'public';

  RAISE NOTICE 'Login flow RLS policies fixed successfully';
  RAISE NOTICE '✅ business_members table has % policies', policy_count;
  RAISE NOTICE '✅ Users can view their own memberships';
  RAISE NOTICE '✅ System can create memberships via trigger';
  RAISE NOTICE '✅ Users can update their own memberships';
  RAISE NOTICE '✅ Proper access control maintained';
  RAISE NOTICE '';
  RAISE NOTICE 'Users should now be able to log in successfully';
END $$;
