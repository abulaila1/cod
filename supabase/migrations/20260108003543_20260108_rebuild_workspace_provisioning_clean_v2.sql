/*
  # Rebuild Workspace Provisioning System - Clean Implementation v2

  ## Problem Fixed
  - RLS recursion in business_members policies causing 42P17 errors
  - Invalid SQL with "import.meta.env" references in Postgres functions
  - Frontend 403 errors when inserting into businesses table
  - Inconsistent workspace provisioning flow

  ## Solution Implemented
  1. Clean Slate - Drop ALL existing policies
  2. Helper Functions (Non-Recursive)
  3. Workspace Creation RPC
  4. Safe Trigger
  5. Simple RLS Policies

  ## Security
  - All tables have RLS enabled
  - Policies check authentication and membership
  - SECURITY DEFINER functions use safe search_path
  - Audit logging for workspace creation
*/

-- ============================================================================
-- STEP 1: CLEAN SLATE - Drop ALL existing objects
-- ============================================================================

-- Drop ALL policies on businesses (comprehensive list)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'businesses' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.businesses';
  END LOOP;
END $$;

-- Drop ALL policies on business_members (comprehensive list)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'business_members' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.business_members';
  END LOOP;
END $$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS set_businesses_created_by ON public.businesses;
DROP TRIGGER IF EXISTS businesses_set_created_by_trigger ON public.businesses;
DROP TRIGGER IF EXISTS businesses_force_created_by_trigger ON public.businesses;
DROP TRIGGER IF EXISTS provision_new_business_trigger ON public.businesses;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.businesses_set_created_by() CASCADE;
DROP FUNCTION IF EXISTS public.businesses_force_created_by() CASCADE;
DROP FUNCTION IF EXISTS public.provision_new_business() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_billing() CASCADE;
DROP FUNCTION IF EXISTS public.is_active_business_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_business_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_workspace(text) CASCADE;

-- ============================================================================
-- STEP 2: Ensure required columns exist
-- ============================================================================

-- Ensure businesses.created_by exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'businesses'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Set created_by for existing rows and make it NOT NULL
DO $$
BEGIN
  UPDATE public.businesses b
  SET created_by = (
    SELECT user_id FROM public.business_members
    WHERE business_id = b.id AND role = 'admin'
    ORDER BY created_at LIMIT 1
  )
  WHERE created_by IS NULL;

  ALTER TABLE public.businesses ALTER COLUMN created_by SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Ensure business_billing has trial columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_billing'
    AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE public.business_billing ADD COLUMN is_trial boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'business_billing'
    AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.business_billing ADD COLUMN trial_ends_at timestamptz;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create non-recursive helper functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_active_business_member(p_business_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_member boolean;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  SELECT EXISTS(
    SELECT 1
    FROM public.business_members
    WHERE business_id = p_business_id
    AND user_id = auth.uid()
    AND status = 'active'
  ) INTO v_is_member;

  RETURN COALESCE(v_is_member, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_business_admin(p_business_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  PERFORM set_config('row_security', 'off', true);

  SELECT EXISTS(
    SELECT 1
    FROM public.business_members
    WHERE business_id = p_business_id
    AND user_id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
  ) INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- ============================================================================
-- STEP 4: Create safe BEFORE INSERT trigger for created_by
-- ============================================================================

CREATE OR REPLACE FUNCTION public.businesses_force_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM set_config('row_security', 'off', true);
  NEW.created_by := auth.uid();

  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'Cannot create business without authenticated user';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER businesses_force_created_by_trigger
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.businesses_force_created_by();

-- ============================================================================
-- STEP 5: Create workspace provisioning RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_workspace(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_business_id uuid;
  v_trial_ends_at timestamptz;
BEGIN
  PERFORM set_config('row_security', 'off', true);
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_trial_ends_at := now() + interval '24 hours';

  INSERT INTO public.businesses (name, created_by, created_at, updated_at)
  VALUES (p_name, v_user_id, now(), now())
  RETURNING id INTO v_business_id;

  INSERT INTO public.business_members (business_id, user_id, role, status, created_at, updated_at)
  VALUES (v_business_id, v_user_id, 'admin', 'active', now(), now());

  INSERT INTO public.business_billing (
    business_id, plan, status, is_trial, trial_ends_at,
    lifetime_price_usd, monthly_order_limit, created_by, created_at, updated_at
  )
  VALUES (
    v_business_id, 'starter', 'trial', true, v_trial_ends_at,
    0, 100, v_user_id, now(), now()
  )
  ON CONFLICT (business_id) DO UPDATE SET
    is_trial = EXCLUDED.is_trial,
    trial_ends_at = EXCLUDED.trial_ends_at,
    status = EXCLUDED.status,
    updated_at = now();

  INSERT INTO public.statuses (business_id, name_ar, name_en, color, is_system, created_by, created_at, updated_at)
  VALUES
    (v_business_id, 'قيد الانتظار', 'Pending', '#FCD34D', true, v_user_id, now(), now()),
    (v_business_id, 'تم التأكيد', 'Confirmed', '#60A5FA', true, v_user_id, now(), now()),
    (v_business_id, 'جاري التجهيز', 'Processing', '#A78BFA', true, v_user_id, now(), now()),
    (v_business_id, 'جاري الشحن', 'Shipping', '#34D399', true, v_user_id, now(), now()),
    (v_business_id, 'تم التوصيل', 'Delivered', '#10B981', true, v_user_id, now(), now()),
    (v_business_id, 'تم الإلغاء', 'Cancelled', '#EF4444', true, v_user_id, now(), now()),
    (v_business_id, 'مرتجع', 'Returned', '#F59E0B', true, v_user_id, now(), now()),
    (v_business_id, 'تأجيل', 'Postponed', '#8B5CF6', true, v_user_id, now(), now()),
    (v_business_id, 'لم يتم الرد', 'No Answer', '#6B7280', true, v_user_id, now(), now()),
    (v_business_id, 'رقم خاطئ', 'Wrong Number', '#9CA3AF', true, v_user_id, now(), now()),
    (v_business_id, 'مكرر', 'Duplicate', '#D1D5DB', true, v_user_id, now(), now()),
    (v_business_id, 'استبدال', 'Exchange', '#F472B6', true, v_user_id, now(), now()),
    (v_business_id, 'رفض الاستلام', 'Refused', '#DC2626', true, v_user_id, now(), now()),
    (v_business_id, 'خطأ في البيانات', 'Data Error', '#7C3AED', true, v_user_id, now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.countries (business_id, name_ar, name_en, code, shipping_cost, created_by, created_at, updated_at)
  VALUES (v_business_id, 'مصر', 'Egypt', 'EG', 50, v_user_id, now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.carriers (business_id, name, is_active, created_by, created_at, updated_at)
  VALUES (v_business_id, 'شركة الشحن الافتراضية', true, v_user_id, now(), now())
  ON CONFLICT DO NOTHING;

  INSERT INTO public.audit_logs (
    business_id, user_id, entity_type, entity_id, action, changes, created_at
  )
  VALUES (
    v_business_id, v_user_id, 'billing', v_business_id, 'trial_started',
    jsonb_build_object(
      'plan', 'starter', 'status', 'trial',
      'trial_ends_at', v_trial_ends_at, 'monthly_order_limit', 100
    ),
    now()
  );

  RETURN v_business_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_workspace(text) TO authenticated;

-- ============================================================================
-- STEP 6: Create simple, non-recursive RLS policies
-- ============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their businesses"
  ON public.businesses FOR SELECT TO authenticated
  USING (public.is_active_business_member(id));

CREATE POLICY "Authenticated users can create businesses"
  ON public.businesses FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their businesses"
  ON public.businesses FOR UPDATE TO authenticated
  USING (public.is_business_admin(id))
  WITH CHECK (public.is_business_admin(id));

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view business memberships"
  ON public.business_members FOR SELECT TO authenticated
  USING (public.is_active_business_member(business_id));

CREATE POLICY "Admins can insert members"
  ON public.business_members FOR INSERT TO authenticated
  WITH CHECK (public.is_business_admin(business_id));

CREATE POLICY "Admins can update members"
  ON public.business_members FOR UPDATE TO authenticated
  USING (public.is_business_admin(business_id))
  WITH CHECK (public.is_business_admin(business_id));

CREATE POLICY "Admins can delete members"
  ON public.business_members FOR DELETE TO authenticated
  USING (public.is_business_admin(business_id));

-- ============================================================================
-- STEP 7: Ensure updated_at triggers exist
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_businesses_updated_at') THEN
    CREATE TRIGGER update_businesses_updated_at
      BEFORE UPDATE ON public.businesses
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_members_updated_at') THEN
    CREATE TRIGGER update_business_members_updated_at
      BEFORE UPDATE ON public.business_members
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_billing_updated_at') THEN
    CREATE TRIGGER update_business_billing_updated_at
      BEFORE UPDATE ON public.business_billing
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
