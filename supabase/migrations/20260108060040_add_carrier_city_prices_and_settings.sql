/*
  # Carrier City Prices and Performance Settings

  1. New Tables
    - `carrier_city_prices`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `carrier_id` (uuid, references carriers)
      - `city_id` (uuid, references cities)
      - `shipping_cost` (numeric, custom shipping cost for this carrier in this city)
      - `created_at` (timestamp)
    
    - `carrier_settings`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `carrier_id` (uuid, references carriers)
      - `good_threshold` (numeric, percentage above which city is "good" - default 70)
      - `warning_threshold` (numeric, percentage above which city is "warning" - default 50)
      - `good_color` (text, color for good performance - default green)
      - `warning_color` (text, color for warning performance - default yellow)
      - `bad_color` (text, color for bad performance - default red)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS carrier_city_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  shipping_cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(carrier_id, city_id)
);

ALTER TABLE carrier_city_prices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'carrier_city_prices' AND policyname = 'Users can view carrier city prices for their businesses'
  ) THEN
    CREATE POLICY "Users can view carrier city prices for their businesses"
      ON carrier_city_prices FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_city_prices.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'carrier_city_prices' AND policyname = 'Users can insert carrier city prices for their businesses'
  ) THEN
    CREATE POLICY "Users can insert carrier city prices for their businesses"
      ON carrier_city_prices FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_city_prices.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'carrier_city_prices' AND policyname = 'Users can update carrier city prices for their businesses'
  ) THEN
    CREATE POLICY "Users can update carrier city prices for their businesses"
      ON carrier_city_prices FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_city_prices.business_id
          AND business_members.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_city_prices.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'carrier_city_prices' AND policyname = 'Users can delete carrier city prices for their businesses'
  ) THEN
    CREATE POLICY "Users can delete carrier city prices for their businesses"
      ON carrier_city_prices FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_city_prices.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS carrier_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
  good_threshold numeric NOT NULL DEFAULT 70,
  warning_threshold numeric NOT NULL DEFAULT 50,
  good_color text NOT NULL DEFAULT '#10B981',
  warning_color text NOT NULL DEFAULT '#F59E0B',
  bad_color text NOT NULL DEFAULT '#EF4444',
  created_at timestamptz DEFAULT now(),
  UNIQUE(carrier_id)
);

ALTER TABLE carrier_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'carrier_settings' AND policyname = 'Users can view carrier settings for their businesses'
  ) THEN
    CREATE POLICY "Users can view carrier settings for their businesses"
      ON carrier_settings FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_settings.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'carrier_settings' AND policyname = 'Users can insert carrier settings for their businesses'
  ) THEN
    CREATE POLICY "Users can insert carrier settings for their businesses"
      ON carrier_settings FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_settings.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'carrier_settings' AND policyname = 'Users can update carrier settings for their businesses'
  ) THEN
    CREATE POLICY "Users can update carrier settings for their businesses"
      ON carrier_settings FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_settings.business_id
          AND business_members.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = carrier_settings.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_carrier_city_prices_business ON carrier_city_prices(business_id);
CREATE INDEX IF NOT EXISTS idx_carrier_city_prices_carrier ON carrier_city_prices(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_city_prices_city ON carrier_city_prices(city_id);
CREATE INDEX IF NOT EXISTS idx_carrier_settings_business ON carrier_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_carrier_settings_carrier ON carrier_settings(carrier_id);
