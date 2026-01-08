/*
  # Consolidate Duplicate RLS Policies
  
  Remove duplicate and conflicting RLS policies to improve performance and maintainability.
  Keep only one clear policy per table/action combination.
*/

-- ============================================================================
-- AUDIT LOGS - Remove duplicate SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view audit logs in their businesses" ON audit_logs;

-- ============================================================================
-- BUSINESS BILLING - Consolidate multiple INSERT policies
-- ============================================================================
DROP POLICY IF EXISTS "Members can view and admins can manage billing" ON business_billing;

-- ============================================================================
-- BUSINESS MEMBERS - Consolidate policies
-- ============================================================================
-- Keep only the system-friendly INSERT policy
DROP POLICY IF EXISTS "Admins can insert members" ON business_members;
DROP POLICY IF EXISTS "Memberships can be created via system" ON business_members;

-- Keep only one SELECT policy
DROP POLICY IF EXISTS "Members can view business memberships" ON business_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON business_members;

-- Keep only one UPDATE policy
DROP POLICY IF EXISTS "Admins can update members" ON business_members;

-- Keep only one DELETE policy (the permissive one)
DROP POLICY IF EXISTS "Users cannot delete memberships" ON business_members;

-- ============================================================================
-- CARRIERS, COUNTRIES, EMPLOYEES, etc. - Remove duplicate SELECT policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view carriers in their businesses" ON carriers;
DROP POLICY IF EXISTS "Users can view countries in their businesses" ON countries;
DROP POLICY IF EXISTS "Users can view employees in their businesses" ON employees;
DROP POLICY IF EXISTS "Users can view invitations in their businesses" ON invitations;
DROP POLICY IF EXISTS "Users can view order items in their businesses" ON order_items;
DROP POLICY IF EXISTS "Users can view orders in their businesses" ON orders;
DROP POLICY IF EXISTS "Users can view products in their businesses" ON products;
DROP POLICY IF EXISTS "Users can view reports in their businesses" ON saved_reports;
DROP POLICY IF EXISTS "Users can view statuses in their businesses" ON statuses;
