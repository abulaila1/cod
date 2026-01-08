/*
  # Fix Performance and Security Issues
  
  This migration addresses all security and performance issues identified by Supabase:
  
  1. **Missing Indexes on Foreign Keys**
     - Add indexes for employee_activity foreign keys
     - Add indexes for employee_bonuses, employee_logins
     - Add indexes for platform_settings and super_admins
  
  2. **RLS Performance Optimization**
     - Replace `auth.uid()` with `(select auth.uid())` in all policies
     - This prevents re-evaluation for each row, improving performance
  
  3. **Consolidate Duplicate RLS Policies**
     - Remove redundant policies that cause confusion
     - Keep only the most specific and secure policies
*/

-- ============================================================================
-- SECTION 1: ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_employee_activity_business_id 
  ON employee_activity(business_id);

CREATE INDEX IF NOT EXISTS idx_employee_activity_new_status_id 
  ON employee_activity(new_status_id);

CREATE INDEX IF NOT EXISTS idx_employee_activity_old_status_id 
  ON employee_activity(old_status_id);

CREATE INDEX IF NOT EXISTS idx_employee_bonuses_created_by_fk 
  ON employee_bonuses(created_by);

CREATE INDEX IF NOT EXISTS idx_employee_logins_business_id_fk 
  ON employee_logins(business_id);

CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by_fk 
  ON platform_settings(updated_by);

CREATE INDEX IF NOT EXISTS idx_super_admins_created_by_fk 
  ON super_admins(created_by);

-- ============================================================================
-- SECTION 2: OPTIMIZE RLS POLICIES - SUPER ADMINS
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can insert new super admins" ON super_admins;
CREATE POLICY "Super admins can insert new super admins"
  ON super_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can delete super admins" ON super_admins;
CREATE POLICY "Super admins can delete super admins"
  ON super_admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 3: OPTIMIZE RLS POLICIES - BUSINESSES
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can view all businesses" ON businesses;
CREATE POLICY "Super admins can view all businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can update all businesses" ON businesses;
CREATE POLICY "Super admins can update all businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 4: OPTIMIZE RLS POLICIES - BUSINESS MEMBERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own membership" ON business_members;
CREATE POLICY "Users can view own membership"
  ON business_members FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can join businesses" ON business_members;
CREATE POLICY "Authenticated users can join businesses"
  ON business_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own membership" ON business_members;

-- ============================================================================
-- SECTION 5: OPTIMIZE RLS POLICIES - BUSINESS BILLING
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create billing" ON business_billing;
CREATE POLICY "Authenticated users can create billing"
  ON business_billing FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = business_billing.business_id
      AND user_id = (select auth.uid())
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can create billing for their businesses" ON business_billing;

DROP POLICY IF EXISTS "Super admins can view all billing" ON business_billing;
CREATE POLICY "Super admins can view all billing"
  ON business_billing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can update all billing" ON business_billing;
CREATE POLICY "Super admins can update all billing"
  ON business_billing FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 6: OPTIMIZE RLS POLICIES - AUDIT LOGS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view audit logs for their workspaces" ON audit_logs;
CREATE POLICY "Users can view audit logs for their workspaces"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = audit_logs.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create audit logs for their workspaces" ON audit_logs;
CREATE POLICY "Users can create audit logs for their workspaces"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = audit_logs.business_id
      AND user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 7: OPTIMIZE RLS POLICIES - PLATFORM SETTINGS
-- ============================================================================

DROP POLICY IF EXISTS "Super admins can update platform settings" ON platform_settings;
CREATE POLICY "Super admins can update platform settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admins can insert platform settings" ON platform_settings;
CREATE POLICY "Super admins can insert platform settings"
  ON platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 8: OPTIMIZE RLS POLICIES - PRODUCT CATEGORIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view product categories for their businesses" ON product_categories;
CREATE POLICY "Users can view product categories for their businesses"
  ON product_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = product_categories.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert product categories for their businesses" ON product_categories;
CREATE POLICY "Users can insert product categories for their businesses"
  ON product_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = product_categories.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update product categories for their businesses" ON product_categories;
CREATE POLICY "Users can update product categories for their businesses"
  ON product_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = product_categories.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete product categories for their businesses" ON product_categories;
CREATE POLICY "Users can delete product categories for their businesses"
  ON product_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = product_categories.business_id
      AND user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 9: OPTIMIZE RLS POLICIES - CITIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view cities for their businesses" ON cities;
CREATE POLICY "Users can view cities for their businesses"
  ON cities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = cities.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert cities for their businesses" ON cities;
CREATE POLICY "Users can insert cities for their businesses"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = cities.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update cities for their businesses" ON cities;
CREATE POLICY "Users can update cities for their businesses"
  ON cities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = cities.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete cities for their businesses" ON cities;
CREATE POLICY "Users can delete cities for their businesses"
  ON cities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = cities.business_id
      AND user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 10: OPTIMIZE RLS POLICIES - CARRIER CITY PRICES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view carrier city prices for their businesses" ON carrier_city_prices;
CREATE POLICY "Users can view carrier city prices for their businesses"
  ON carrier_city_prices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = carrier_city_prices.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert carrier city prices for their businesses" ON carrier_city_prices;
CREATE POLICY "Users can insert carrier city prices for their businesses"
  ON carrier_city_prices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = carrier_city_prices.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update carrier city prices for their businesses" ON carrier_city_prices;
CREATE POLICY "Users can update carrier city prices for their businesses"
  ON carrier_city_prices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = carrier_city_prices.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete carrier city prices for their businesses" ON carrier_city_prices;
CREATE POLICY "Users can delete carrier city prices for their businesses"
  ON carrier_city_prices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = carrier_city_prices.business_id
      AND user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 11: OPTIMIZE RLS POLICIES - CARRIER SETTINGS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view carrier settings for their businesses" ON carrier_settings;
CREATE POLICY "Users can view carrier settings for their businesses"
  ON carrier_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = carrier_settings.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert carrier settings for their businesses" ON carrier_settings;
CREATE POLICY "Users can insert carrier settings for their businesses"
  ON carrier_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = carrier_settings.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update carrier settings for their businesses" ON carrier_settings;
CREATE POLICY "Users can update carrier settings for their businesses"
  ON carrier_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = carrier_settings.business_id
      AND user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 12: OPTIMIZE RLS POLICIES - EMPLOYEE BONUSES
-- ============================================================================

DROP POLICY IF EXISTS "Business members can view bonuses" ON employee_bonuses;
CREATE POLICY "Business members can view bonuses"
  ON employee_bonuses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = employee_bonuses.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Business members can insert bonuses" ON employee_bonuses;
CREATE POLICY "Business members can insert bonuses"
  ON employee_bonuses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = employee_bonuses.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Business members can update bonuses" ON employee_bonuses;
CREATE POLICY "Business members can update bonuses"
  ON employee_bonuses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = employee_bonuses.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Business members can delete bonuses" ON employee_bonuses;
CREATE POLICY "Business members can delete bonuses"
  ON employee_bonuses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = employee_bonuses.business_id
      AND user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 13: OPTIMIZE RLS POLICIES - EMPLOYEE LOGINS
-- ============================================================================

DROP POLICY IF EXISTS "Business members can view logins" ON employee_logins;
CREATE POLICY "Business members can view logins"
  ON employee_logins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = employee_logins.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Business members can insert logins" ON employee_logins;
CREATE POLICY "Business members can insert logins"
  ON employee_logins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = employee_logins.business_id
      AND user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- SECTION 14: OPTIMIZE RLS POLICIES - EMPLOYEE ACTIVITY
-- ============================================================================

DROP POLICY IF EXISTS "Business members can view activity" ON employee_activity;
CREATE POLICY "Business members can view activity"
  ON employee_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = employee_activity.business_id
      AND user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Business members can insert activity" ON employee_activity;
CREATE POLICY "Business members can insert activity"
  ON employee_activity FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_id = employee_activity.business_id
      AND user_id = (select auth.uid())
    )
  );
