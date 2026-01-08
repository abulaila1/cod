/*
  # Fix RLS Policies for Trigger Seeds

  ## Problem
  
  The trigger `handle_new_user()` runs as SECURITY DEFINER and tries to INSERT into:
  - statuses
  - countries  
  - carriers
  
  But these tables have RLS enabled with policies only for `authenticated` users.
  The trigger (running as service_role) has no INSERT policies, so it fails with 500 error.

  ## Solution
  
  Add service_role INSERT policies to these tables so the trigger can seed data.
*/

-- =====================================================
-- Drop old policies if they exist
-- =====================================================

DROP POLICY IF EXISTS "service_role_insert_statuses" ON statuses;
DROP POLICY IF EXISTS "service_role_select_statuses" ON statuses;
DROP POLICY IF EXISTS "service_role_insert_countries" ON countries;
DROP POLICY IF EXISTS "service_role_select_countries" ON countries;
DROP POLICY IF EXISTS "service_role_insert_carriers" ON carriers;
DROP POLICY IF EXISTS "service_role_select_carriers" ON carriers;
DROP POLICY IF EXISTS "service_role_insert_business_billing" ON business_billing;
DROP POLICY IF EXISTS "service_role_select_business_billing" ON business_billing;

-- =====================================================
-- Add service_role policies for statuses
-- =====================================================

CREATE POLICY "service_role_insert_statuses"
  ON statuses FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select_statuses"
  ON statuses FOR SELECT
  TO service_role
  USING (true);

-- =====================================================
-- Add service_role policies for countries
-- =====================================================

CREATE POLICY "service_role_insert_countries"
  ON countries FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select_countries"
  ON countries FOR SELECT
  TO service_role
  USING (true);

-- =====================================================
-- Add service_role policies for carriers
-- =====================================================

CREATE POLICY "service_role_insert_carriers"
  ON carriers FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select_carriers"
  ON carriers FOR SELECT
  TO service_role
  USING (true);

-- =====================================================
-- Add service_role policy for business_billing
-- =====================================================

CREATE POLICY "service_role_insert_business_billing"
  ON business_billing FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "service_role_select_business_billing"
  ON business_billing FOR SELECT
  TO service_role
  USING (true);

-- =====================================================
-- Grant necessary table permissions
-- =====================================================

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT INSERT, SELECT ON statuses TO service_role;
GRANT INSERT, SELECT ON countries TO service_role;
GRANT INSERT, SELECT ON carriers TO service_role;
GRANT INSERT, SELECT ON business_billing TO service_role;

COMMENT ON POLICY "service_role_insert_statuses" ON statuses IS 
'Allows service_role (triggers) to insert default statuses for new businesses';

COMMENT ON POLICY "service_role_insert_countries" ON countries IS 
'Allows service_role (triggers) to insert default countries for new businesses';

COMMENT ON POLICY "service_role_insert_carriers" ON carriers IS 
'Allows service_role (triggers) to insert default carriers for new businesses';

COMMENT ON POLICY "service_role_insert_business_billing" ON business_billing IS 
'Allows service_role (triggers) to insert billing records for new businesses';
