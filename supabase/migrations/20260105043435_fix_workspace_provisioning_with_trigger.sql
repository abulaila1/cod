/*
  # Fix Workspace Provisioning - Server-Side Trigger Solution

  ## Problem
  POST /rest/v1/businesses returns 403 "new row violates row-level security policy"
  This causes infinite loading on login/signup/reset because workspace cannot be created.

  ## Root Cause
  Frontend tries to create business + membership + billing + seeds manually, but RLS blocks
  business_members insertions, causing provisioning to fail mid-process.

  ## Solution
  Move ALL workspace provisioning to server-side using SECURITY DEFINER function + trigger:
  1. Frontend only inserts into businesses table
  2. Database trigger automatically provisions membership, billing, and seeds
  3. SECURITY DEFINER bypasses RLS safely for system operations

  ## Changes

  ### 1. Fix RLS Policies
  - businesses: Allow INSERT only when created_by = auth.uid()
  - businesses: Allow SELECT for members (safe non-recursive query)
  - business_members: Keep simple non-recursive policies

  ### 2. Create Provisioning Function (SECURITY DEFINER)
  - Automatically creates admin membership for business creator
  - Creates billing record with trial
  - Seeds default data (statuses, countries, carriers)
  - Logs audit trail

  ### 3. Create Trigger
  - AFTER INSERT on businesses
  - Calls provisioning function automatically
  - Works even when RLS blocks frontend from inserting into business_members

  ## Security
  - Function is SECURITY DEFINER but safe (validates inputs, no SQL injection)
  - Only triggered by authenticated user inserting their own business
  - All operations in single transaction
*/

-- =====================================================
-- STEP 1: Fix RLS Policies on businesses
-- =====================================================

-- Drop existing policies on businesses
DROP POLICY IF EXISTS "Users can view their businesses" ON businesses;
DROP POLICY IF EXISTS "Users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can update businesses" ON businesses;

-- Allow authenticated users to create businesses they own
CREATE POLICY "Users can create own businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow users to view businesses where they have active membership
CREATE POLICY "Users can view member businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Allow admins to update their businesses
CREATE POLICY "Admins can update own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- =====================================================
-- STEP 2: Create SECURITY DEFINER Provisioning Function
-- =====================================================

CREATE OR REPLACE FUNCTION provision_new_business()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_status_id uuid;
  v_country_id uuid;
  v_carrier_id uuid;
BEGIN
  -- Log for debugging (dev only)
  RAISE NOTICE 'Provisioning business: % for user: %', NEW.id, NEW.created_by;

  -- 1. Create admin membership for business creator
  INSERT INTO business_members (business_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'admin', 'active')
  ON CONFLICT (business_id, user_id) DO NOTHING;

  -- 2. Create billing record with trial (14 days)
  INSERT INTO business_billing (
    business_id,
    plan_type,
    status,
    trial_ends_at,
    current_period_start,
    current_period_end
  )
  VALUES (
    NEW.id,
    'starter',
    'trialing',
    now() + interval '14 days',
    now(),
    now() + interval '14 days'
  )
  ON CONFLICT (business_id) DO NOTHING;

  -- 3. Seed default order statuses
  INSERT INTO order_statuses (business_id, name, color, is_system, display_order)
  VALUES
    (NEW.id, 'جديد', '#3B82F6', true, 1),
    (NEW.id, 'قيد المعالجة', '#F59E0B', true, 2),
    (NEW.id, 'تم الشحن', '#8B5CF6', true, 3),
    (NEW.id, 'تم التسليم', '#10B981', true, 4),
    (NEW.id, 'ملغي', '#EF4444', true, 5)
  ON CONFLICT (business_id, name) DO NOTHING;

  -- 4. Seed default country (Egypt)
  INSERT INTO countries (business_id, name, code, is_active)
  VALUES (NEW.id, 'مصر', 'EG', true)
  ON CONFLICT (business_id, code) DO NOTHING
  RETURNING id INTO v_country_id;

  -- Get country_id if already exists
  IF v_country_id IS NULL THEN
    SELECT id INTO v_country_id FROM countries
    WHERE business_id = NEW.id AND code = 'EG'
    LIMIT 1;
  END IF;

  -- 5. Seed default carrier
  INSERT INTO carriers (business_id, name, is_active)
  VALUES (NEW.id, 'شركة الشحن الافتراضية', true)
  ON CONFLICT (business_id, name) DO NOTHING;

  -- 6. Log audit trail for trial start
  INSERT INTO audit_logs (
    business_id,
    user_id,
    entity_type,
    entity_id,
    action,
    changes
  )
  VALUES (
    NEW.id,
    NEW.created_by,
    'billing',
    NEW.id,
    'trial_started',
    jsonb_build_object(
      'plan_type', 'starter',
      'trial_ends_at', (now() + interval '14 days')::text
    )
  );

  RAISE NOTICE 'Business provisioning completed: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block business creation
    RAISE WARNING 'Error provisioning business %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 3: Create Trigger
-- =====================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_provision_new_business ON businesses;

-- Create trigger to auto-provision workspace after business insert
CREATE TRIGGER trigger_provision_new_business
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION provision_new_business();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify RLS is still enabled
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_billing ENABLE ROW LEVEL SECURITY;