/*
  # إصلاح مشاكل الأمان والأداء

  1. إضافة Indexes للـ Foreign Keys
    - business_billing.created_by
    - businesses.created_by
    - invitations.created_by

  2. تحسين RLS Policies
    - استبدال auth.uid() بـ (select auth.uid()) في جميع السياسات
    - هذا يحسن الأداء عند التوسع لأن القيمة تُحسب مرة واحدة فقط

  3. إصلاح Function Search Paths
    - update_updated_at_column
    - create_default_billing
*/

-- ════════════════════════════════════════════════════════════════════════════
-- 1. إضافة Indexes للـ Foreign Keys
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_business_billing_created_by 
  ON business_billing(created_by);

CREATE INDEX IF NOT EXISTS idx_businesses_created_by 
  ON businesses(created_by);

CREATE INDEX IF NOT EXISTS idx_invitations_created_by 
  ON invitations(created_by);

-- ════════════════════════════════════════════════════════════════════════════
-- 2. تحسين RLS Policies - استبدال auth.uid() بـ (select auth.uid())
-- ════════════════════════════════════════════════════════════════════════════

-- businesses
DROP POLICY IF EXISTS "Users can view businesses they are members of" ON businesses;
CREATE POLICY "Users can view businesses they are members of"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Business admins can update their business" ON businesses;
CREATE POLICY "Business admins can update their business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- business_members
DROP POLICY IF EXISTS "Members can view their business members" ON business_members;
CREATE POLICY "Members can view their business members"
  ON business_members FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members bm
      WHERE bm.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Business admins can update memberships" ON business_members;
CREATE POLICY "Business admins can update memberships"
  ON business_members FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Business admins can delete memberships" ON business_members;
CREATE POLICY "Business admins can delete memberships"
  ON business_members FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- invitations
DROP POLICY IF EXISTS "Members can view their business invitations" ON invitations;
CREATE POLICY "Members can view their business invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Business admins can create invitations" ON invitations;
CREATE POLICY "Business admins can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Business admins can delete invitations" ON invitations;
CREATE POLICY "Business admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- statuses
DROP POLICY IF EXISTS "Users can view statuses in their businesses" ON statuses;
CREATE POLICY "Users can view statuses in their businesses"
  ON statuses FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert statuses in their businesses" ON statuses;
CREATE POLICY "Users can insert statuses in their businesses"
  ON statuses FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can update statuses in their businesses" ON statuses;
CREATE POLICY "Users can update statuses in their businesses"
  ON statuses FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can delete statuses in their businesses" ON statuses;
CREATE POLICY "Users can delete statuses in their businesses"
  ON statuses FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- countries
DROP POLICY IF EXISTS "Users can view countries in their businesses" ON countries;
CREATE POLICY "Users can view countries in their businesses"
  ON countries FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert countries in their businesses" ON countries;
CREATE POLICY "Users can insert countries in their businesses"
  ON countries FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can update countries in their businesses" ON countries;
CREATE POLICY "Users can update countries in their businesses"
  ON countries FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can delete countries in their businesses" ON countries;
CREATE POLICY "Users can delete countries in their businesses"
  ON countries FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- carriers
DROP POLICY IF EXISTS "Users can view carriers in their businesses" ON carriers;
CREATE POLICY "Users can view carriers in their businesses"
  ON carriers FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert carriers in their businesses" ON carriers;
CREATE POLICY "Users can insert carriers in their businesses"
  ON carriers FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can update carriers in their businesses" ON carriers;
CREATE POLICY "Users can update carriers in their businesses"
  ON carriers FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can delete carriers in their businesses" ON carriers;
CREATE POLICY "Users can delete carriers in their businesses"
  ON carriers FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- employees
DROP POLICY IF EXISTS "Users can view employees in their businesses" ON employees;
CREATE POLICY "Users can view employees in their businesses"
  ON employees FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert employees in their businesses" ON employees;
CREATE POLICY "Users can insert employees in their businesses"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can update employees in their businesses" ON employees;
CREATE POLICY "Users can update employees in their businesses"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can delete employees in their businesses" ON employees;
CREATE POLICY "Users can delete employees in their businesses"
  ON employees FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- products
DROP POLICY IF EXISTS "Users can view products in their businesses" ON products;
CREATE POLICY "Users can view products in their businesses"
  ON products FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert products in their businesses" ON products;
CREATE POLICY "Users can insert products in their businesses"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can update products in their businesses" ON products;
CREATE POLICY "Users can update products in their businesses"
  ON products FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Users can delete products in their businesses" ON products;
CREATE POLICY "Users can delete products in their businesses"
  ON products FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- orders
DROP POLICY IF EXISTS "Users can view orders in their businesses" ON orders;
CREATE POLICY "Users can view orders in their businesses"
  ON orders FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert orders in their businesses" ON orders;
CREATE POLICY "Users can insert orders in their businesses"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager', 'agent')
    )
  );

DROP POLICY IF EXISTS "Users can update orders in their businesses" ON orders;
CREATE POLICY "Users can update orders in their businesses"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager', 'agent')
    )
  );

DROP POLICY IF EXISTS "Users can delete orders in their businesses" ON orders;
CREATE POLICY "Users can delete orders in their businesses"
  ON orders FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- order_items
DROP POLICY IF EXISTS "Users can view order_items in their businesses" ON order_items;
CREATE POLICY "Users can view order_items in their businesses"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert order_items in their businesses" ON order_items;
CREATE POLICY "Users can insert order_items in their businesses"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager', 'agent')
    )
  );

DROP POLICY IF EXISTS "Users can update order_items in their businesses" ON order_items;
CREATE POLICY "Users can update order_items in their businesses"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager', 'agent')
    )
  );

DROP POLICY IF EXISTS "Users can delete order_items in their businesses" ON order_items;
CREATE POLICY "Users can delete order_items in their businesses"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager', 'agent')
    )
  );

-- audit_logs
DROP POLICY IF EXISTS "Users can view audit_logs in their businesses" ON audit_logs;
CREATE POLICY "Users can view audit_logs in their businesses"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert audit_logs in their businesses" ON audit_logs;
CREATE POLICY "Users can insert audit_logs in their businesses"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

-- business_billing
DROP POLICY IF EXISTS "Members can view billing for their business" ON business_billing;
CREATE POLICY "Members can view billing for their business"
  ON business_billing FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admin and manager can update billing" ON business_billing;
CREATE POLICY "Admin and manager can update billing"
  ON business_billing FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admin and manager can insert billing" ON business_billing;
CREATE POLICY "Admin and manager can insert billing"
  ON business_billing FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- saved_reports
DROP POLICY IF EXISTS "Members can view saved reports in their business" ON saved_reports;
CREATE POLICY "Members can view saved reports in their business"
  ON saved_reports FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Managers can create saved reports" ON saved_reports;
CREATE POLICY "Managers can create saved reports"
  ON saved_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can update saved reports" ON saved_reports;
CREATE POLICY "Managers can update saved reports"
  ON saved_reports FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can delete saved reports" ON saved_reports;
CREATE POLICY "Managers can delete saved reports"
  ON saved_reports FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'manager')
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- 3. إصلاح Function Search Paths
-- ════════════════════════════════════════════════════════════════════════════

-- update_updated_at_column
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- create_default_billing
DROP FUNCTION IF EXISTS create_default_billing() CASCADE;
CREATE OR REPLACE FUNCTION create_default_billing()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO business_billing (
    business_id,
    plan,
    status,
    lifetime_price_usd,
    monthly_order_limit,
    created_by
  ) VALUES (
    NEW.id,
    'starter',
    'inactive',
    25.00,
    1000,
    NEW.created_by
  );
  RETURN NEW;
END;
$$;

-- إعادة إنشاء الـ trigger بعد تعديل الـ function
DROP TRIGGER IF EXISTS create_billing_on_business_insert ON businesses;
CREATE TRIGGER create_billing_on_business_insert
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_billing();
