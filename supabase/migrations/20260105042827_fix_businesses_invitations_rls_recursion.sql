/*
  # Fix Businesses and Invitations RLS Policies

  ## Problem
  The `businesses` and `invitations` tables have RLS policies that reference `business_members`
  in subqueries. While not directly recursive, these can still cause performance issues and
  potential recursion when combined with the business_members policies.

  ## Solution
  Simplify policies to work with the new non-recursive business_members policies.

  ## Changes
  1. Update businesses policies to work with simplified business_members access
  2. Update invitations policies to work with simplified business_members access
*/

-- Drop existing policies on businesses
DROP POLICY IF EXISTS "Users can view businesses they are members of" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Business admins can update their business" ON businesses;

-- Create new simplified policies for businesses

-- SELECT: Users can view businesses where they have an active membership
CREATE POLICY "Users can view their businesses"
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

-- INSERT: Any authenticated user can create a business
CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- UPDATE: Only business admins can update
CREATE POLICY "Admins can update businesses"
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

-- Drop existing policies on invitations
DROP POLICY IF EXISTS "Members can view their business invitations" ON invitations;
DROP POLICY IF EXISTS "Business admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Business admins can delete invitations" ON invitations;

-- Create new simplified policies for invitations

-- SELECT: Members can view invitations for their businesses
CREATE POLICY "Members can view business invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members 
      WHERE business_members.business_id = invitations.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.status = 'active'
    )
  );

-- INSERT: Only admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members 
      WHERE business_members.business_id = invitations.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
      AND business_members.status = 'active'
    )
  );

-- DELETE: Only admins can delete invitations
CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members 
      WHERE business_members.business_id = invitations.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.role = 'admin'
      AND business_members.status = 'active'
    )
  );