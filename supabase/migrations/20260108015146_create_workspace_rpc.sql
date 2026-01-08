/*
  # Create Workspace RPC Function

  ## Summary
  Implements a secure server-side function to handle complete workspace creation
  atomically, bypassing RLS policies through SECURITY DEFINER.

  ## Problem
  Multiple RLS policies create complex interdependencies that make it difficult
  for clients to insert into businesses, business_members, and business_billing
  tables in the correct order.

  ## Solution
  Create a single RPC function that runs with elevated privileges (SECURITY DEFINER)
  to perform all workspace creation operations atomically in a transaction.

  ## Function Details
  - **Name:** `create_workspace_v2`
  - **Parameters:**
    - `business_name` (text): Name of the workspace/business
    - `currency_code` (text): Default currency (e.g., 'USD', 'SAR')
    - `country_code` (text): Country code (e.g., 'SA', 'EG')
  - **Returns:** JSON object with `business_id` and `business_name`
  - **Security:** SECURITY DEFINER (runs with owner privileges)

  ## Operations Performed
  1. Insert new business record with settings
  2. Insert business member record (creator as admin)
  3. Insert business billing record (24-hour trial)
  4. Return business details for client to use

  ## Security Considerations
  - Function only accessible to authenticated users
  - User can only create workspace for themselves (uses auth.uid())
  - All operations are atomic (transaction boundary)
  - No way to create workspace for another user
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_workspace_v2(text, text, text);

-- Create the workspace creation function
CREATE OR REPLACE FUNCTION create_workspace_v2(
  business_name text,
  currency_code text DEFAULT 'USD',
  country_code text DEFAULT 'SA'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_business_id uuid;
  v_trial_ends_at timestamptz;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Ensure user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate inputs
  IF business_name IS NULL OR trim(business_name) = '' THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;

  -- Calculate trial end date (24 hours from now)
  v_trial_ends_at := now() + interval '24 hours';

  -- Insert business record
  INSERT INTO businesses (
    name,
    created_by,
    settings
  ) VALUES (
    trim(business_name),
    v_user_id,
    jsonb_build_object(
      'currency', currency_code,
      'country', country_code
    )
  )
  RETURNING id INTO v_business_id;

  -- Insert business member record (creator as admin)
  INSERT INTO business_members (
    business_id,
    user_id,
    role,
    status
  ) VALUES (
    v_business_id,
    v_user_id,
    'admin',
    'active'
  );

  -- Insert billing record (trial period)
  INSERT INTO business_billing (
    business_id,
    plan,
    status,
    is_trial,
    trial_ends_at,
    created_by
  ) VALUES (
    v_business_id,
    'starter',
    'trial',
    true,
    v_trial_ends_at,
    v_user_id
  );

  -- Return success with business details
  RETURN json_build_object(
    'business_id', v_business_id,
    'business_name', trim(business_name),
    'trial_ends_at', v_trial_ends_at
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Failed to create workspace: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_workspace_v2(text, text, text) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_workspace_v2 IS 
  'Creates a new workspace (business) with billing and membership for the authenticated user. Bypasses RLS through SECURITY DEFINER.';
