/*
  # إنشاء جدول التقارير المحفوظة (Saved Reports)

  1. الجداول الجديدة
    - `saved_reports`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key)
      - `name` (text) - اسم التقرير
      - `group_by` (text) - day/week/month
      - `filters_json` (jsonb) - الفلاتر المحفوظة
      - `created_by` (uuid) - المستخدم الذي أنشأ التقرير
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. الأمان (Security)
    - تفعيل RLS على جدول saved_reports
    - المستخدمون المصرح لهم يمكنهم عرض التقارير
    - فقط managers/admins يمكنهم حفظ وحذف التقارير
*/

CREATE TABLE IF NOT EXISTS saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  group_by text NOT NULL CHECK (group_by IN ('day', 'week', 'month')),
  filters_json jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم عرض التقارير المحفوظة في workspace الخاص بهم
CREATE POLICY "Members can view saved reports in their business"
  ON saved_reports
  FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM business_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: فقط managers/admins يمكنهم إنشاء تقارير محفوظة
CREATE POLICY "Managers can create saved reports"
  ON saved_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id 
      FROM business_members 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
    AND created_by = auth.uid()
  );

-- Policy: فقط managers/admins يمكنهم تحديث التقارير المحفوظة
CREATE POLICY "Managers can update saved reports"
  ON saved_reports
  FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM business_members 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT business_id 
      FROM business_members 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- Policy: فقط managers/admins يمكنهم حذف التقارير المحفوظة
CREATE POLICY "Managers can delete saved reports"
  ON saved_reports
  FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM business_members 
      WHERE user_id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
  );

-- إنشاء index لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_saved_reports_business_id 
  ON saved_reports(business_id);

CREATE INDEX IF NOT EXISTS idx_saved_reports_created_by 
  ON saved_reports(created_by);
