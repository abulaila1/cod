/*
  # Rebuild Auth System from Scratch

  ## Philosophy

  **SIMPLE IS BETTER THAN COMPLEX**

  The new system follows ONE principle:
  - When user signs up → Database automatically creates workspace
  - Frontend does NOTHING except sign up/sign in
  - Everything happens in database triggers

  ## Changes

  1. Drop all old RLS policies and triggers
  2. Create new simple RLS policies
  3. Create ONE trigger that handles everything on user signup
  4. No frontend complexity

  ## New Flow

  ### Signup Flow:
  ```
  User signs up via Supabase Auth
    ↓
  auth.users record created
    ↓
  (NO MORE STEPS - Frontend just waits)
    ↓
  User is logged in
    ↓
  Frontend loads dashboard
    ↓
  BusinessContext loads user's businesses (already exists)
  ```

  ### Login Flow:
  ```
  User logs in via Supabase Auth
    ↓
  Session established
    ↓
  Frontend loads dashboard
    ↓
  BusinessContext loads user's businesses
  ```

  ## Security Model

  - Only authenticated users can INSERT businesses
  - Businesses are auto-created by admin (service role)
  - Users can only SELECT businesses they are members of
  - Users can only UPDATE businesses they are admins of
*/

-- =====================================================
-- STEP 1: Clean up old system
-- =====================================================

-- Drop all triggers on businesses
DROP TRIGGER IF EXISTS create_billing_on_business_insert ON businesses;
DROP TRIGGER IF EXISTS trg_businesses_set_created_by ON businesses;
DROP TRIGGER IF EXISTS trigger_provision_new_business ON businesses;
DROP TRIGGER IF EXISTS trigger_set_created_by_if_null ON businesses;

-- Drop trigger functions
DROP FUNCTION IF EXISTS create_default_billing();
DROP FUNCTION IF EXISTS businesses_set_created_by();
DROP FUNCTION IF EXISTS provision_new_business();
DROP FUNCTION IF EXISTS set_created_by_if_null();

-- Drop all old policies on businesses
DROP POLICY IF EXISTS "businesses_insert_authenticated" ON businesses;
DROP POLICY IF EXISTS "businesses_insert_own" ON businesses;
DROP POLICY IF EXISTS "businesses_select_member" ON businesses;
DROP POLICY IF EXISTS "businesses_update_admin" ON businesses;
DROP POLICY IF EXISTS "Users can create own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;

-- Drop all old policies on business_members
DROP POLICY IF EXISTS "business_members_insert_own" ON business_members;
DROP POLICY IF EXISTS "business_members_select_own" ON business_members;
DROP POLICY IF EXISTS "business_members_update_own" ON business_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON business_members;
DROP POLICY IF EXISTS "Users can delete own memberships" ON business_members;

-- =====================================================
-- STEP 2: Create new simple RLS policies
-- =====================================================

-- Businesses: Users can only see businesses they are members of
CREATE POLICY "select_member_businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
        AND business_members.user_id = auth.uid()
        AND business_members.status = 'active'
    )
  );

-- Businesses: Only admins can update
CREATE POLICY "update_admin_businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = businesses.id
        AND business_members.user_id = auth.uid()
        AND business_members.role = 'admin'
        AND business_members.status = 'active'
    )
  );

-- Businesses: Service role can insert (for auto-provisioning)
-- Frontend NEVER inserts directly
CREATE POLICY "service_role_insert_businesses"
  ON businesses FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Business Members: Users can see their own memberships
CREATE POLICY "select_own_memberships"
  ON business_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Business Members: Service role can insert (for auto-provisioning)
CREATE POLICY "service_role_insert_memberships"
  ON business_members FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Business Members: Admins can update memberships in their business
CREATE POLICY "admin_update_memberships"
  ON business_members FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND status = 'active'
    )
  );

-- =====================================================
-- STEP 3: Auto-provision workspace on user creation
-- =====================================================

-- Function to create workspace when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_business_id uuid;
BEGIN
  -- Create business for new user
  INSERT INTO businesses (name, created_by)
  VALUES ('متجري', NEW.id)
  RETURNING id INTO new_business_id;

  -- Create admin membership
  INSERT INTO business_members (business_id, user_id, role, status)
  VALUES (new_business_id, NEW.id, 'admin', 'active');

  -- Create billing record with 24h trial
  INSERT INTO business_billing (
    business_id,
    plan,
    status,
    trial_ends_at,
    created_at,
    updated_at
  )
  VALUES (
    new_business_id,
    'trial',
    'trial',
    NOW() + INTERVAL '24 hours',
    NOW(),
    NOW()
  );

  -- Seed default statuses
  INSERT INTO statuses (business_id, name_ar, name_en, color, is_default, display_order, created_by)
  VALUES
    (new_business_id, 'قيد المعالجة', 'Processing', 'blue', true, 1, NEW.id),
    (new_business_id, 'تم الشحن', 'Shipped', 'green', false, 2, NEW.id),
    (new_business_id, 'تم التسليم', 'Delivered', 'emerald', false, 3, NEW.id),
    (new_business_id, 'ملغي', 'Cancelled', 'red', false, 4, NEW.id);

  -- Seed default countries
  INSERT INTO countries (business_id, name_ar, name_en, code, shipping_cost, is_active, created_by)
  VALUES
    (new_business_id, 'السعودية', 'Saudi Arabia', 'SA', 25.00, true, NEW.id),
    (new_business_id, 'الإمارات', 'UAE', 'AE', 30.00, true, NEW.id),
    (new_business_id, 'الكويت', 'Kuwait', 'KW', 20.00, true, NEW.id);

  -- Seed default carriers
  INSERT INTO carriers (business_id, name_ar, name_en, tracking_url, is_active, created_by)
  VALUES
    (new_business_id, 'سمسا', 'SMSA', 'https://track.smsaexpress.com/track.aspx?tracknumbers={tracking}', true, NEW.id),
    (new_business_id, 'أرامكس', 'Aramex', 'https://www.aramex.com/track/results?ShipmentNumber={tracking}', true, NEW.id);

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 4: Grant necessary permissions
-- =====================================================

-- Grant service role full access (for triggers)
GRANT ALL ON businesses TO service_role;
GRANT ALL ON business_members TO service_role;
GRANT ALL ON business_billing TO service_role;
GRANT ALL ON statuses TO service_role;
GRANT ALL ON countries TO service_role;
GRANT ALL ON carriers TO service_role;

-- Grant authenticated users SELECT only
GRANT SELECT ON businesses TO authenticated;
GRANT SELECT ON business_members TO authenticated;

COMMENT ON FUNCTION handle_new_user() IS 'Automatically provisions a workspace when a new user signs up. Creates business, membership, billing, and seeds defaults.';

-- =====================================================
-- VERIFICATION
-- =====================================================

/*
  ## New System Flow:

  ### Signup:
  1. User signs up via supabase.auth.signUp()
  2. auth.users record created
  3. Trigger fires: handle_new_user()
     - Creates business (متجري)
     - Creates admin membership
     - Creates billing (24h trial)
     - Seeds defaults (statuses, countries, carriers)
  4. User is authenticated
  5. Frontend redirects to dashboard
  6. BusinessContext loads businesses (already exists)

  ### Login:
  1. User logs in via supabase.auth.signInWithPassword()
  2. Session established
  3. Frontend redirects to dashboard
  4. BusinessContext loads businesses

  ### Security:
  - Frontend NEVER creates businesses directly
  - Only service role (via trigger) can INSERT
  - Users can only SELECT their own businesses (via membership)
  - Users can only UPDATE as admin

  ### Testing:
  ```sql
  -- This should work (as authenticated user):
  SELECT * FROM businesses;

  -- This should fail (as authenticated user):
  INSERT INTO businesses (name) VALUES ('Test');
  
  -- But signup will work because trigger uses service role
  ```
*/
