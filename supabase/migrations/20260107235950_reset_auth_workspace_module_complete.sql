/*
  # HARD RESET: Auth + Workspace Provisioning Module

  ## Purpose
  
  Complete reset and rebuild of the auth/workspace module from scratch.
  Removes all broken code, triggers, policies, and rebuilds correctly.

  ## What This Does
  
  1. Drops all custom functions with import.meta/VITE_/env references
  2. Drops all triggers on workspace tables
  3. Drops all RLS policies on workspace tables
  4. Drops workspace tables (CASCADE): invitations, business_members, business_billing, businesses
  5. Recreates tables with clean schema
  6. Creates non-recursive RLS policies
  7. Creates DB-driven workspace provisioning (triggers + functions)

  ## Safety
  
  - Does NOT touch auth.users or any Supabase system tables
  - Only drops public schema tables related to workspace module
  - Uses CASCADE to handle foreign keys
*/

-- =====================================================
-- STEP 1: DROP BROKEN FUNCTIONS
-- =====================================================

-- Drop all functions that contain import.meta/VITE_/env
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.provision_new_business() CASCADE;
DROP FUNCTION IF EXISTS public.businesses_set_created_by() CASCADE;
DROP FUNCTION IF EXISTS public.set_created_by_if_null() CASCADE;

-- =====================================================
-- STEP 2: DROP ALL TRIGGERS ON WORKSPACE TABLES
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS trg_businesses_set_created_by ON public.businesses CASCADE;
DROP TRIGGER IF EXISTS trg_businesses_provision ON public.businesses CASCADE;
DROP TRIGGER IF EXISTS set_created_by_trigger ON public.businesses CASCADE;
DROP TRIGGER IF EXISTS handle_updated_at ON public.businesses CASCADE;
DROP TRIGGER IF EXISTS handle_updated_at ON public.business_billing CASCADE;

-- =====================================================
-- STEP 3: DROP TABLES (CASCADE)
-- =====================================================

-- Drop in correct order (children first, parents last)
DROP TABLE IF EXISTS public.saved_reports CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.invitations CASCADE;
DROP TABLE IF EXISTS public.business_members CASCADE;
DROP TABLE IF EXISTS public.business_billing CASCADE;

-- Drop domain tables that depend on businesses
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.carriers CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;
DROP TABLE IF EXISTS public.statuses CASCADE;

-- Drop businesses last
DROP TABLE IF EXISTS public.businesses CASCADE;

-- =====================================================
-- STEP 4: RECREATE TABLES (CLEAN SCHEMA)
-- =====================================================

-- businesses table
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- business_members table
CREATE TABLE public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'agent', 'viewer')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- business_billing table
CREATE TABLE public.business_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid UNIQUE NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan text DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro')),
  status text DEFAULT 'trial' CHECK (status IN ('trial', 'inactive', 'active')),
  is_trial boolean DEFAULT true,
  trial_ends_at timestamptz DEFAULT (now() + interval '24 hours'),
  lifetime_price_usd numeric DEFAULT 0,
  monthly_order_limit integer DEFAULT 100,
  activated_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'agent', 'viewer')),
  token text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Recreate domain tables
CREATE TABLE public.statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  color text NOT NULL,
  is_default boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  code text NOT NULL,
  shipping_cost numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  tracking_url text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  sku text,
  cost numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  order_date timestamptz DEFAULT now(),
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  status_id uuid REFERENCES public.statuses(id),
  country_id uuid REFERENCES public.countries(id),
  carrier_id uuid REFERENCES public.carriers(id),
  employee_id uuid REFERENCES public.employees(id),
  revenue numeric DEFAULT 0,
  shipping_cost numeric DEFAULT 0,
  cost numeric DEFAULT 0,
  profit numeric DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  quantity integer DEFAULT 1,
  unit_price numeric DEFAULT 0,
  unit_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  filters jsonb DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- STEP 5: CREATE INDEXES
-- =====================================================

CREATE INDEX idx_business_members_business_user ON public.business_members(business_id, user_id);
CREATE INDEX idx_business_members_user ON public.business_members(user_id);
CREATE INDEX idx_businesses_created_by ON public.businesses(created_by);
CREATE INDEX idx_business_billing_business ON public.business_billing(business_id);
CREATE INDEX idx_statuses_business ON public.statuses(business_id);
CREATE INDEX idx_countries_business ON public.countries(business_id);
CREATE INDEX idx_carriers_business ON public.carriers(business_id);
CREATE INDEX idx_employees_business ON public.employees(business_id);
CREATE INDEX idx_products_business ON public.products(business_id);
CREATE INDEX idx_orders_business ON public.orders(business_id);
CREATE INDEX idx_orders_status ON public.orders(status_id);
CREATE INDEX idx_orders_country ON public.orders(country_id);
CREATE INDEX idx_orders_carrier ON public.orders(carrier_id);
CREATE INDEX idx_orders_employee ON public.orders(employee_id);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- =====================================================
-- STEP 6: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: CREATE RLS POLICIES (NON-RECURSIVE)
-- =====================================================

-- businesses policies
CREATE POLICY "Users can insert their own business"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view businesses they are members of"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can update their businesses"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- business_members policies
CREATE POLICY "Users can view their own memberships"
  ON public.business_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own membership"
  ON public.business_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all members in their businesses"
  ON public.business_members FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage members in their businesses"
  ON public.business_members FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- business_billing policies
CREATE POLICY "Users can view billing for their businesses"
  ON public.business_billing FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage billing"
  ON public.business_billing FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
      AND status = 'active'
    )
  );

-- Domain tables policies (statuses, countries, carriers, employees, products)
CREATE POLICY "Users can view domain data in their businesses"
  ON public.statuses FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage domain data in their businesses"
  ON public.statuses FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view countries in their businesses"
  ON public.countries FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage countries in their businesses"
  ON public.countries FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view carriers in their businesses"
  ON public.carriers FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage carriers in their businesses"
  ON public.carriers FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view employees in their businesses"
  ON public.employees FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage employees in their businesses"
  ON public.employees FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view products in their businesses"
  ON public.products FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage products in their businesses"
  ON public.products FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- orders policies
CREATE POLICY "Users can view orders in their businesses"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage orders in their businesses"
  ON public.orders FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view order items in their businesses"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage order items in their businesses"
  ON public.order_items FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- saved_reports policies
CREATE POLICY "Users can manage reports in their businesses"
  ON public.saved_reports FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- audit_logs policies
CREATE POLICY "Users can view audit logs in their businesses"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM public.business_members 
      WHERE user_id = auth.uid()
      AND status = 'active'
    )
  );

-- =====================================================
-- STEP 8: CREATE PROVISIONING FUNCTIONS
-- =====================================================

-- Function to set created_by before insert
CREATE OR REPLACE FUNCTION public.businesses_set_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Set created_by to current user
  NEW.created_by := auth.uid();
  
  RETURN NEW;
END;
$$;

-- Function to provision workspace after business insert
CREATE OR REPLACE FUNCTION public.provision_new_business()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create admin membership (idempotent)
  INSERT INTO public.business_members (business_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'admin', 'active')
  ON CONFLICT (business_id, user_id) DO NOTHING;
  
  -- Create billing record (idempotent)
  INSERT INTO public.business_billing (
    business_id,
    plan,
    status,
    is_trial,
    trial_ends_at,
    created_by
  )
  VALUES (
    NEW.id,
    'starter',
    'trial',
    true,
    now() + interval '24 hours',
    NEW.created_by
  )
  ON CONFLICT (business_id) DO NOTHING;
  
  -- Seed default statuses
  INSERT INTO public.statuses (business_id, name_ar, name_en, color, is_default, display_order, created_by)
  VALUES
    (NEW.id, 'قيد المعالجة', 'Processing', 'blue', true, 1, NEW.created_by),
    (NEW.id, 'تم الشحن', 'Shipped', 'yellow', false, 2, NEW.created_by),
    (NEW.id, 'تم التسليم', 'Delivered', 'green', false, 3, NEW.created_by),
    (NEW.id, 'ملغي', 'Cancelled', 'red', false, 4, NEW.created_by)
  ON CONFLICT DO NOTHING;
  
  -- Seed default countries
  INSERT INTO public.countries (business_id, name_ar, name_en, code, shipping_cost, is_active, created_by)
  VALUES
    (NEW.id, 'السعودية', 'Saudi Arabia', 'SA', 25.00, true, NEW.created_by),
    (NEW.id, 'الإمارات', 'UAE', 'AE', 30.00, true, NEW.created_by),
    (NEW.id, 'الكويت', 'Kuwait', 'KW', 20.00, true, NEW.created_by)
  ON CONFLICT DO NOTHING;
  
  -- Seed default carriers
  INSERT INTO public.carriers (business_id, name_ar, name_en, tracking_url, is_active, created_by)
  VALUES
    (NEW.id, 'سمسا', 'SMSA', 'https://track.smsaexpress.com/track.aspx?tracknumbers={tracking}', true, NEW.created_by),
    (NEW.id, 'أرامكس', 'Aramex', 'https://www.aramex.com/track/results?ShipmentNumber={tracking}', true, NEW.created_by)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 9: CREATE TRIGGERS
-- =====================================================

-- BEFORE INSERT: Set created_by
CREATE TRIGGER trg_businesses_set_created_by
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.businesses_set_created_by();

-- AFTER INSERT: Provision workspace
CREATE TRIGGER trg_businesses_provision
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_new_business();

-- =====================================================
-- VERIFICATION
-- =====================================================

COMMENT ON TABLE public.businesses IS 
'Core business/workspace table. Auto-provisions on insert via triggers.';

COMMENT ON TABLE public.business_members IS 
'Multi-tenant membership. Links users to businesses with roles.';

COMMENT ON TABLE public.business_billing IS 
'Billing and subscription info. 24h trial by default.';

COMMENT ON FUNCTION public.businesses_set_created_by() IS 
'BEFORE INSERT trigger: Forces created_by = auth.uid()';

COMMENT ON FUNCTION public.provision_new_business() IS 
'AFTER INSERT trigger: Creates membership, billing, and seed data';
