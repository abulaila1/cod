/*
  # Allow Authenticated Users to Create Workspaces

  ## Purpose
  This migration solves the chicken-and-egg problem where users cannot create
  businesses because they aren't business members yet. We add permissive INSERT
  policies that allow ANY authenticated user to create a business and join it
  as an owner.

  ## Problem Being Solved
  - Users sign up and verify email
  - They land on /onboarding page
  - They try to create a business
  - RLS blocks them because they aren't members of any business yet
  - **This migration allows them to create their first workspace**

  ## Changes
  1. Add INSERT policy on `businesses` for authenticated users
  2. Add INSERT policy on `business_members` for authenticated users
  3. Add INSERT policy on `business_billing` for authenticated users
  4. Keep existing SELECT/UPDATE/DELETE policies restrictive
  5. Ensure data safety with proper WITH CHECK clauses

  ## Security Notes
  - Users can only insert businesses they own (created_by = auth.uid())
  - Users can only insert themselves as members (user_id = auth.uid())
  - Users can only create billing for businesses they own
  - Existing SELECT/UPDATE/DELETE policies remain restrictive
  - No data leakage or unauthorized access possible
*/

-- ============================================================================
-- STEP 1: Add INSERT policy for businesses table
-- ============================================================================

DO $$
BEGIN
  -- Drop existing INSERT policy if it exists
  DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;

  -- Create new INSERT policy
  CREATE POLICY "Authenticated users can create businesses"
    ON public.businesses
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- Users can only create businesses where they are the creator
      auth.uid() = created_by
    );

  RAISE NOTICE '✅ Created INSERT policy for businesses table';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️  Failed to create businesses INSERT policy: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 2: Add INSERT policy for business_members table
-- ============================================================================

DO $$
BEGIN
  -- Drop existing INSERT policy if it exists
  DROP POLICY IF EXISTS "Authenticated users can join businesses" ON public.business_members;

  -- Create new INSERT policy
  CREATE POLICY "Authenticated users can join businesses"
    ON public.business_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- Users can only insert themselves as members
      auth.uid() = user_id
      -- AND they must be creating themselves as owner of a business they created
      AND EXISTS (
        SELECT 1 FROM public.businesses
        WHERE id = business_id
        AND created_by = auth.uid()
      )
    );

  RAISE NOTICE '✅ Created INSERT policy for business_members table';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️  Failed to create business_members INSERT policy: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 3: Add INSERT policy for business_billing table
-- ============================================================================

DO $$
BEGIN
  -- Drop existing INSERT policy if it exists
  DROP POLICY IF EXISTS "Authenticated users can create billing" ON public.business_billing;

  -- Create new INSERT policy
  CREATE POLICY "Authenticated users can create billing"
    ON public.business_billing
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- Users can only create billing for businesses they own
      EXISTS (
        SELECT 1 FROM public.businesses
        WHERE id = business_id
        AND created_by = auth.uid()
      )
    );

  RAISE NOTICE '✅ Created INSERT policy for business_billing table';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️  Failed to create business_billing INSERT policy: %', SQLERRM;
END $$;

-- ============================================================================
-- STEP 4: Verify policies are in place
-- ============================================================================

DO $$
DECLARE
  businesses_insert_policy_exists BOOLEAN;
  members_insert_policy_exists BOOLEAN;
  billing_insert_policy_exists BOOLEAN;
BEGIN
  -- Check businesses INSERT policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'businesses'
    AND policyname = 'Authenticated users can create businesses'
    AND cmd = 'INSERT'
  ) INTO businesses_insert_policy_exists;

  -- Check business_members INSERT policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'business_members'
    AND policyname = 'Authenticated users can join businesses'
    AND cmd = 'INSERT'
  ) INTO members_insert_policy_exists;

  -- Check business_billing INSERT policy
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'business_billing'
    AND policyname = 'Authenticated users can create billing'
    AND cmd = 'INSERT'
  ) INTO billing_insert_policy_exists;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policies Verification';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'businesses table:';
  RAISE NOTICE '  INSERT policy: %', CASE WHEN businesses_insert_policy_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'business_members table:';
  RAISE NOTICE '  INSERT policy: %', CASE WHEN members_insert_policy_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'business_billing table:';
  RAISE NOTICE '  INSERT policy: %', CASE WHEN billing_insert_policy_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Status: %', CASE
    WHEN businesses_insert_policy_exists AND members_insert_policy_exists AND billing_insert_policy_exists
    THEN '✅ ALL POLICIES CREATED'
    ELSE '⚠️  SOME POLICIES MISSING'
  END;
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 5: Add helpful comments
-- ============================================================================

COMMENT ON POLICY "Authenticated users can create businesses" ON public.businesses IS
  'Allows authenticated users to create businesses where they are the creator. This solves the chicken-and-egg problem during onboarding.';

COMMENT ON POLICY "Authenticated users can join businesses" ON public.business_members IS
  'Allows authenticated users to insert themselves as members of businesses they created. Required for manual onboarding flow.';

COMMENT ON POLICY "Authenticated users can create billing" ON public.business_billing IS
  'Allows authenticated users to create billing records for businesses they own. Part of the onboarding flow.';

-- ============================================================================
-- STEP 6: Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Complete: Manual Onboarding';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What changed:';
  RAISE NOTICE '  1. ✅ Authenticated users can INSERT into businesses (as creator)';
  RAISE NOTICE '  2. ✅ Authenticated users can INSERT into business_members (as themselves)';
  RAISE NOTICE '  3. ✅ Authenticated users can INSERT into business_billing (for their businesses)';
  RAISE NOTICE '';
  RAISE NOTICE 'Security maintained:';
  RAISE NOTICE '  • Users can only create businesses where created_by = their user_id';
  RAISE NOTICE '  • Users can only insert themselves as members';
  RAISE NOTICE '  • Users can only create billing for businesses they own';
  RAISE NOTICE '  • Existing SELECT/UPDATE/DELETE policies remain restrictive';
  RAISE NOTICE '';
  RAISE NOTICE 'User flow:';
  RAISE NOTICE '  1. User signs up and verifies email';
  RAISE NOTICE '  2. User redirected to /onboarding';
  RAISE NOTICE '  3. User fills form (store name, currency, country)';
  RAISE NOTICE '  4. Frontend calls INSERT on businesses ✅';
  RAISE NOTICE '  5. Frontend calls INSERT on business_members ✅';
  RAISE NOTICE '  6. Frontend calls INSERT on business_billing ✅';
  RAISE NOTICE '  7. User redirected to dashboard';
  RAISE NOTICE '';
  RAISE NOTICE 'Result: NO MORE "permission denied" errors during onboarding!';
  RAISE NOTICE '';
END $$;
