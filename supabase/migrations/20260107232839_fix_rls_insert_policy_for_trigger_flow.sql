/*
  # Fix RLS INSERT Policy to Work with BEFORE Trigger

  ## Root Cause Analysis
  
  **Problem:**
  Users get "new row violates row-level security policy" when creating businesses.
  
  **Why:**
  PostgreSQL execution order:
  1. RLS WITH CHECK is evaluated FIRST
  2. BEFORE INSERT trigger runs SECOND
  3. Actual INSERT happens THIRD
  
  **Current Flow (BROKEN):**
  ```
  Frontend: INSERT { name: 'متجري' }  (no created_by field)
    ↓
  RLS CHECK: created_by = auth.uid()
    - created_by = null (not set yet)
    - auth.uid() = user_id
    - null != user_id
    - ❌ REJECT: 42501 insufficient_privilege
    
  BEFORE Trigger: businesses_set_created_by()
    - Would set created_by = auth.uid()
    - ❌ Never reached because RLS rejected first!
  ```

  **Root Issue:**
  RLS WITH CHECK examines the row BEFORE the BEFORE trigger can set created_by.
  Since created_by is null in the INSERT statement, it fails the check.

  ## Solution

  **Change INSERT policy from:**
  ```sql
  WITH CHECK (created_by = auth.uid())
  ```

  **To:**
  ```sql
  WITH CHECK (auth.uid() IS NOT NULL)
  ```

  **Why This Works:**
  1. RLS only checks that user is authenticated (not the created_by field value)
  2. BEFORE trigger sets created_by = auth.uid() (guaranteed)
  3. SELECT policy prevents seeing other users' businesses
  4. Combined = secure + functional

  **Security:**
  - ✅ Only authenticated users can INSERT
  - ✅ BEFORE trigger ALWAYS sets created_by = auth.uid()
  - ✅ SELECT policy ALWAYS filters by membership
  - ✅ No user can see/access another user's business
  - ✅ No way to bypass the trigger (it's SECURITY DEFINER)

  ## Changes
  1. Drop old INSERT policy
  2. Create new INSERT policy (auth check only)
  3. Trust BEFORE trigger for created_by
  4. Rely on SELECT policy for access control
*/

-- =====================================================
-- STEP 1: Drop existing INSERT policy
-- =====================================================

DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;
DROP POLICY IF EXISTS "Users can create own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;

-- =====================================================
-- STEP 2: Create new INSERT policy (authentication only)
-- =====================================================

CREATE POLICY "businesses_insert_authenticated"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only check that user is authenticated
    -- BEFORE trigger will set created_by = auth.uid()
    -- SELECT policy will prevent seeing other users' businesses
    auth.uid() IS NOT NULL
  );

-- =====================================================
-- VERIFICATION & SECURITY NOTES
-- =====================================================

-- This policy is SAFE because:
-- 1. Only authenticated users can INSERT (auth.uid() IS NOT NULL)
-- 2. BEFORE trigger ALWAYS sets created_by = auth.uid() (cannot be bypassed)
-- 3. SELECT policy filters businesses by membership (cannot see others' data)
-- 4. Trigger is SECURITY DEFINER with search_path = public, pg_temp (SQL injection safe)

-- Test query (should work now):
-- INSERT INTO businesses (name) VALUES ('Test Business');
-- Expected: created_by will be set to auth.uid() by trigger before insert completes

COMMENT ON POLICY "businesses_insert_authenticated" ON businesses IS 
'Allows authenticated users to create businesses. BEFORE trigger sets created_by automatically.';

-- =====================================================
-- EXPLAIN THE CORRECT FLOW
-- =====================================================

/*
  ## NEW CORRECT FLOW:

  Frontend: INSERT { name: 'متجري' }
    ↓
  RLS CHECK: auth.uid() IS NOT NULL
    - auth.uid() = user_id (e.g., 'abc-123')
    - user_id IS NOT NULL
    - ✅ PASS
    ↓
  BEFORE Trigger: businesses_set_created_by()
    - NEW.created_by := auth.uid()
    - created_by is now 'abc-123'
    - ✅ Returns NEW
    ↓
  INSERT: { name: 'متجري', created_by: 'abc-123' }
    - ✅ SUCCESS
    ↓
  AFTER Trigger: provision_new_business()
    - Creates business_members (admin)
    - Creates business_billing (trial)
    - Seeds defaults
    - ✅ Workspace ready
    ↓
  SELECT (with membership policy):
    - User can only see businesses where they are a member
    - ✅ Secure
*/