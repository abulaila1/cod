/*
  # إضافة حقل تكلفة الإعلانات إلى جدول الطلبات

  ## التغييرات
  - إضافة حقل `ad_cost` إلى جدول orders لتخزين تكلفة الإعلانات المخصصة لكل طلب
  - الحقل نوعه numeric مع قيمة افتراضية 0
*/

-- إضافة حقل ad_cost إلى جدول orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ad_cost numeric DEFAULT 0 CHECK (ad_cost >= 0);

-- إنشاء index للأداء (للفلترة والتقارير)
CREATE INDEX IF NOT EXISTS idx_orders_ad_cost ON orders(business_id, ad_cost) WHERE ad_cost > 0;

-- تعليق توضيحي
COMMENT ON COLUMN orders.ad_cost IS 'تكلفة الإعلانات المخصصة لهذا الطلب (من نظام الحملات الإعلانية)';