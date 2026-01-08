/*
  # Create Platform Settings Table

  1. New Tables
    - `platform_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - setting key like 'whatsapp_number', 'whatsapp_cta_text'
      - `value` (text) - the setting value
      - `description` (text) - description of what this setting does
      - `updated_at` (timestamptz)
      - `updated_by` (uuid) - reference to the super admin who updated it

  2. Security
    - Enable RLS
    - Super admins can read/write
    - All authenticated users can read (for display purposes)

  3. Initial Data
    - Insert default WhatsApp settings
*/

CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform settings"
  ON platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can update platform settings"
  ON platform_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can insert platform settings"
  ON platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  );

INSERT INTO platform_settings (key, value, description) VALUES
  ('whatsapp_number', '966500000000', 'رقم الواتساب للتواصل (بدون + أو 00)'),
  ('whatsapp_cta_text', 'تواصل معنا عبر واتساب', 'نص زر الواتساب في صفحة الدفع'),
  ('whatsapp_message', 'مرحباً، أريد الاشتراك في خطة {plan} بسعر ${price}', 'رسالة الواتساب التلقائية')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION get_platform_settings()
RETURNS TABLE (key text, value text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT key, value FROM platform_settings;
$$;

CREATE OR REPLACE FUNCTION update_platform_setting(
  p_key text,
  p_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM super_admins
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only super admins can update platform settings';
  END IF;

  UPDATE platform_settings
  SET value = p_value,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE platform_settings.key = p_key;
END;
$$;