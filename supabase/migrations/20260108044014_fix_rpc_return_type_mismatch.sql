/*
  # Fix RPC Return Type Mismatch

  ## Problem
  The `get_all_workspaces_with_owners` function was returning varchar(255) for owner_email
  but the return type definition expected text, causing a type mismatch error.

  ## Solution
  Cast the email column explicitly to text to match the return type definition.
*/

DROP FUNCTION IF EXISTS get_all_workspaces_with_owners();

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
  IF NOT EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Super admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.name::text,
    b.created_by,
    b.created_at,
    b.updated_at,
    b.plan_type::text,
    b.is_lifetime_deal,
    b.manual_payment_status::text,
    b.max_orders_limit,
    b.settings,
    COALESCE(b.status, 'active')::text,
    u.email::text as owner_email,
    bb.status::text as billing_status,
    bb.plan::text as billing_plan,
    bb.is_trial
  FROM businesses b
  LEFT JOIN auth.users u ON b.created_by = u.id
  LEFT JOIN business_billing bb ON b.id = bb.business_id
  ORDER BY b.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_workspaces_with_owners() TO authenticated;