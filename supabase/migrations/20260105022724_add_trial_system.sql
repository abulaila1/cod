/*
  # إضافة نظام التجربة المجانية

  1. تعديلات على جدول business_billing
    - إضافة `is_trial` (boolean) - هل الحساب في فترة تجربة
    - إضافة `trial_ends_at` (timestamptz) - تاريخ انتهاء التجربة

  2. تحديث الـ function
    - تعديل `create_default_billing()` لإنشاء trial افتراضي عند إنشاء business جديد
    - مدة التجربة: 24 ساعة
    - حد الطلبات: 100 طلب
    - السعر: 0 (مجاني)
    - الحالة: trial

  3. الأمان
    - الحفاظ على جميع RLS policies الموجودة
    - التجربة متاحة لجميع المستخدمين الجدد

  4. ملاحظات مهمة
    - التجربة تعتمد على الوقت (24 ساعة) وليس الدفع
    - بعد انتهاء التجربة، يجب على المستخدم الاشتراك
    - لا يوجد تحديث تلقائي بعد انتهاء التجربة
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. إضافة الأعمدة الجديدة
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- إضافة عمود is_trial
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_billing' AND column_name = 'is_trial'
  ) THEN
    ALTER TABLE business_billing ADD COLUMN is_trial boolean DEFAULT false;
  END IF;

  -- إضافة عمود trial_ends_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_billing' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE business_billing ADD COLUMN trial_ends_at timestamptz NULL;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. تحديث status enum لإضافة 'trial'
-- ═══════════════════════════════════════════════════════════════════════════

-- إزالة الـ constraint القديم
ALTER TABLE business_billing DROP CONSTRAINT IF EXISTS business_billing_status_check;

-- إضافة الـ constraint الجديد مع 'trial'
ALTER TABLE business_billing ADD CONSTRAINT business_billing_status_check 
  CHECK (status IN ('inactive', 'active', 'trial'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. تحديث create_default_billing function
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS create_default_billing() CASCADE;

CREATE OR REPLACE FUNCTION create_default_billing()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- إنشاء trial مجاني لمدة 24 ساعة
  INSERT INTO business_billing (
    business_id,
    plan,
    status,
    is_trial,
    trial_ends_at,
    lifetime_price_usd,
    monthly_order_limit,
    created_by
  ) VALUES (
    NEW.id,
    'starter',
    'trial',
    true,
    now() + interval '24 hours',
    0.00,
    100,
    NEW.created_by
  );
  RETURN NEW;
END;
$$;

-- إعادة إنشاء الـ trigger
DROP TRIGGER IF EXISTS create_billing_on_business_insert ON businesses;
CREATE TRIGGER create_billing_on_business_insert
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_billing();

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Index للأداء
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_business_billing_trial_ends_at 
  ON business_billing(trial_ends_at) 
  WHERE is_trial = true;
