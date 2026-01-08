/*
  # Fix RLS Policies for Onboarding Flow

  ## Summary
  The onboarding process is failing because authenticated users cannot successfully
  insert into the `businesses` and `business_members` tables due to overly restrictive
  RLS policies.

  ## Changes Made

  1. **Businesses Table - INSERT Policy**
     - Drops existing restrictive policy
     - Creates new permissive policy allowing any authenticated user to create a business
     - Rationale: During onboarding, users need to create their first workspace
  
  2. **Business Members Table - INSERT Policy**
     - Ensures users can insert their own membership row
     - Required for the onboarding flow which creates both business and membership
  
  3. **Business Billing Table - INSERT Policy**
     - Allows authenticated users to create billing records for businesses they created
     - Required for trial period initialization during onboarding

  ## Security Considerations
  - Users can only create businesses (no update/delete without admin role)
  - Users can only insert themselves as members (user_id = auth.uid())
  - Billing records can only be created by the business creator
  - All other operations remain restricted by existing policies
*/

-- =====================================================
-- BUSINESSES TABLE: Allow authenticated users to create
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;

CREATE POLICY "Authenticated users can create businesses" 
ON public.businesses 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- =====================================================
-- BUSINESS_MEMBERS TABLE: Allow users to add themselves
-- =====================================================

DROP POLICY IF EXISTS "Users can insert their own membership" ON public.business_members;

CREATE POLICY "Users can insert their own membership" 
ON public.business_members 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- BUSINESS_BILLING TABLE: Allow billing record creation
-- =====================================================

DROP POLICY IF EXISTS "Users can create billing for their businesses" ON public.business_billing;

CREATE POLICY "Users can create billing for their businesses" 
ON public.business_billing 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = business_billing.business_id 
    AND businesses.created_by = auth.uid()
  )
);
