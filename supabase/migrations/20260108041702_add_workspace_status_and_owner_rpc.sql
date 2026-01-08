/*
  # Workspace Status and Owner RPC Function

  ## Overview
  This migration adds workspace suspension capabilities and creates an RPC function
  to retrieve all workspaces with their owner information for super admins.

  ## Changes

  ### 1. Add Status Column to Businesses
  - `status` column with values: 'active', 'suspended'
  - Default is 'active'
  - Allows super admins to suspend workspaces

  ### 2. RPC Function: get_all_workspaces_with_owners
  - Returns all business fields plus owner email
  - Uses SECURITY DEFINER to access auth.users
  - Only accessible by super admins (checked within function)

  ## Security Notes
  - The RPC function validates super admin status before returning data
  - Suspended workspaces can still be viewed/managed by super admins
*/

-- ================================================
-- 1. ADD STATUS COLUMN TO BUSINESSES
-- ================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'status'
  ) THEN
    ALTER TABLE businesses ADD COLUMN status text DEFAULT 'active' NOT NULL;
    
    ALTER TABLE businesses ADD CONSTRAINT businesses_status_check
      CHECK (status IN ('active', 'suspended'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);

-- ================================================
-- 2. CREATE RPC FUNCTION FOR ADMIN WORKSPACE LIST
-- ================================================

CREATE OR REPLACE FUNCTION get_all_workspaces_with_owners()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  plan_type text,
  is_lifetime_deal boolean,
  manual_payment_status text,
  max_orders_limit integer,
  settings jsonb,
  status text,
  owner_email text,
  billing_status text,
  billing_plan text,
  is_trial boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.slug,
    b.created_by,
    b.created_at,
    b.updated_at,
    b.plan_type,
    b.is_lifetime_deal,
    b.manual_payment_status,
    b.max_orders_limit,
    b.settings,
    b.status,
    u.email as owner_email,
    bb.status as billing_status,
    bb.plan as billing_plan,
    bb.is_trial
  FROM businesses b
  LEFT JOIN auth.users u ON b.created_by = u.id
  LEFT JOIN business_billing bb ON b.id = bb.business_id
  ORDER BY b.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (the function itself checks admin status)
GRANT EXECUTE ON FUNCTION get_all_workspaces_with_owners() TO authenticated;

-- ================================================
-- 3. COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON COLUMN businesses.status IS 'Workspace status: active or suspended';
COMMENT ON FUNCTION get_all_workspaces_with_owners() IS 'Returns all workspaces with owner emails for super admins only';