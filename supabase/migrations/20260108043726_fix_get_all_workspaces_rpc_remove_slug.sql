/*
  # Fix RPC Function - Remove Non-Existent Slug Column

  ## Problem
  The `get_all_workspaces_with_owners` RPC function was trying to select a `slug` column
  that doesn't exist in the `businesses` table, causing the function to fail.

  ## Solution
  Update the RPC function to only select columns that actually exist in the table.
  Remove the `slug` field from the return type and query.

  ## Changes
  - Drop the existing function
  - Recreate it without the `slug` column
  - Adjust return type accordingly
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS get_all_workspaces_with_owners();

-- Recreate the function without the slug column
CREATE OR REPLACE FUNCTION get_all_workspaces_with_owners()
RETURNS TABLE (
  id uuid,
  name text,
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
    b.created_by,
    b.created_at,
    b.updated_at,
    b.plan_type,
    b.is_lifetime_deal,
    b.manual_payment_status,
    b.max_orders_limit,
    b.settings,
    COALESCE(b.status, 'active') as status,
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_workspaces_with_owners() TO authenticated;

COMMENT ON FUNCTION get_all_workspaces_with_owners() IS 'Returns all workspaces with owner emails for super admins only (fixed - no slug)';