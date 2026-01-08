/*
  # Super Admin System for Lifetime Deal Management

  ## Overview
  This migration creates the super admin system to allow designated admin users 
  to manage all workspaces, approve lifetime deals, and handle manual payments.

  ## Changes

  ### 1. Super Admins Table
  - Stores user IDs that have super admin privileges
  - Enables RLS with read access for authenticated users (to check admin status)

  ### 2. RLS Policies for Businesses Table
  - Allows super admins to SELECT all businesses (bypassing tenant isolation)
  - Allows super admins to UPDATE all businesses (for approving payments, etc.)

  ### 3. RLS Policies for Super Admins Table
  - Authenticated users can check if they are admins (SELECT)
  - Only existing super admins can add new super admins (INSERT)

  ## Security Notes
  - Super admin status is explicitly stored in a table (not JWT claims)
  - Policies use subqueries to check admin status
  - Regular users cannot modify the super_admins table
*/

-- ================================================
-- 1. CREATE SUPER ADMINS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT super_admins_user_id_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_super_admins_user_id ON super_admins(user_id);

-- Enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. RLS POLICIES FOR SUPER ADMINS TABLE
-- ================================================

-- Policy: Authenticated users can check if they are super admins
CREATE POLICY "Authenticated users can read super_admins"
  ON super_admins FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only super admins can add new super admins
CREATE POLICY "Super admins can insert new super admins"
  ON super_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Only super admins can remove super admins
CREATE POLICY "Super admins can delete super admins"
  ON super_admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- ================================================
-- 3. RLS POLICIES FOR BUSINESSES (SUPER ADMIN ACCESS)
-- ================================================

-- Drop existing policies if they need to be updated
DROP POLICY IF EXISTS "Super admins can view all businesses" ON businesses;
DROP POLICY IF EXISTS "Super admins can update all businesses" ON businesses;

-- Policy: Super admins can SELECT all businesses (bypasses tenant isolation)
CREATE POLICY "Super admins can view all businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Super admins can UPDATE all businesses
CREATE POLICY "Super admins can update all businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- ================================================
-- 4. RLS POLICIES FOR BUSINESS_BILLING (SUPER ADMIN ACCESS)
-- ================================================

-- Drop existing policies if they need to be updated
DROP POLICY IF EXISTS "Super admins can view all billing" ON business_billing;
DROP POLICY IF EXISTS "Super admins can update all billing" ON business_billing;

-- Policy: Super admins can SELECT all business billing
CREATE POLICY "Super admins can view all billing"
  ON business_billing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Super admins can UPDATE all business billing
CREATE POLICY "Super admins can update all billing"
  ON business_billing FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON TABLE super_admins IS 'Users with super admin privileges who can manage all workspaces';
COMMENT ON COLUMN super_admins.user_id IS 'Reference to the auth.users table';
COMMENT ON COLUMN super_admins.created_by IS 'Which admin added this super admin';