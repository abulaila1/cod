/*
  # نظام الفوترة والخطط

  1. جدول جديد
    - `business_billing`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key, unique)
      - `plan` (text) - الخطة: starter, growth, pro
      - `status` (text) - الحالة: inactive, active
      - `activated_at` (timestamptz) - تاريخ التفعيل
      - `lifetime_price_usd` (numeric) - السعر الدائم
      - `monthly_order_limit` (int) - الحد الشهري للطلبات (null = unlimited)
      - `notes` (text) - ملاحظات
      - `created_by` (uuid) - المنشئ
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمان
    - تفعيل RLS على جدول business_billing
    - السماح للأعضاء بقراءة billing لوورك سبيسهم
    - السماح لـ admin/manager بالتعديل

  3. Trigger
    - عند إنشاء business جديد، يتم إنشاء سجل billing افتراضي
*/

-- إنشاء جدول business_billing
CREATE TABLE IF NOT EXISTS business_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid UNIQUE NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'pro')),
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active')),
  activated_at timestamptz,
  lifetime_price_usd numeric(10, 2) NOT NULL DEFAULT 25.00,
  monthly_order_limit int DEFAULT 1000,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE business_billing ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: الأعضاء يمكنهم قراءة billing لوورك سبيسهم
CREATE POLICY "Members can view billing for their business"
  ON business_billing FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
    )
  );

-- سياسة التحديث: admin/manager يمكنهم تعديل billing
CREATE POLICY "Admin and manager can update billing"
  ON business_billing FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- سياسة الإدراج: admin/manager يمكنهم إنشاء billing (للـ trigger)
CREATE POLICY "Admin and manager can insert billing"
  ON business_billing FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
    )
  );

-- Function لإنشاء billing افتراضي عند إنشاء business
CREATE OR REPLACE FUNCTION create_default_billing()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO business_billing (
    business_id,
    plan,
    status,
    lifetime_price_usd,
    monthly_order_limit,
    created_by
  ) VALUES (
    NEW.id,
    'starter',
    'inactive',
    25.00,
    1000,
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger لإنشاء billing عند إنشاء business
DROP TRIGGER IF EXISTS create_billing_on_business_insert ON businesses;
CREATE TRIGGER create_billing_on_business_insert
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_billing();

-- إنشاء billing records للـ businesses الموجودة
INSERT INTO business_billing (business_id, plan, status, lifetime_price_usd, monthly_order_limit, created_by)
SELECT
  id,
  'starter',
  'inactive',
  25.00,
  1000,
  created_by
FROM businesses
WHERE id NOT IN (SELECT business_id FROM business_billing)
ON CONFLICT (business_id) DO NOTHING;

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_business_billing_business_id ON business_billing(business_id);
CREATE INDEX IF NOT EXISTS idx_business_billing_status ON business_billing(status);
