/*
  # Fix Business Members RLS Infinite Recursion

  ## Problem
  The existing RLS policies on `business_members` cause infinite recursion (Postgres error 42P17)
  because they reference `business_members` in their own subqueries.

  ## Solution
  Replace all recursive policies with simple, non-recursive ones that only use `auth.uid()` directly.

  ## Changes
  1. Drop all existing policies on `business_members`
  2. Create new non-recursive policies:
     - SELECT: Users can only read their own membership rows
     - INSERT: Users can only insert rows where user_id = auth.uid()
     - UPDATE: Users can only update their own membership rows
     - DELETE: Users can only delete their own membership rows

  ## Security
  - RLS remains enabled on business_members
  - Each user can only access their own membership records
  - No recursive policy checks
*/

-- Drop all existing policies on business_members
DROP POLICY IF EXISTS "Members can view their business members" ON business_members;
DROP POLICY IF EXISTS "System can create memberships" ON business_members;
DROP POLICY IF EXISTS "Business admins can update memberships" ON business_members;
DROP POLICY IF EXISTS "Business admins can delete memberships" ON business_members;

-- Create new non-recursive policies

-- SELECT: Users can only read their own membership rows
CREATE POLICY "Users can read own memberships"
  ON business_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- INSERT: Users can only insert rows where user_id = auth.uid()
CREATE POLICY "Users can insert own memberships"
  ON business_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can only update their own membership rows
CREATE POLICY "Users can update own memberships"
  ON business_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can only delete their own membership rows
CREATE POLICY "Users can delete own memberships"
  ON business_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());