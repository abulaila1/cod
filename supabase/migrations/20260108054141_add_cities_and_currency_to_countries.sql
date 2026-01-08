/*
  # Add Cities Management System

  1. Changes to `countries` table
    - Add `currency` column (e.g., SAR, AED, USD)
    - Add `currency_symbol` column (e.g., ر.س, د.إ, $)

  2. New Tables
    - `cities`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `country_id` (uuid, references countries)
      - `name_ar` (text, Arabic name)
      - `name_en` (text, English name)
      - `shipping_cost` (numeric, default shipping cost for this city)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)

  3. Security
    - Enable RLS on `cities` table
    - Add policies for authenticated users
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'countries' AND column_name = 'currency'
  ) THEN
    ALTER TABLE countries ADD COLUMN currency text DEFAULT 'SAR';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'countries' AND column_name = 'currency_symbol'
  ) THEN
    ALTER TABLE countries ADD COLUMN currency_symbol text DEFAULT 'ر.س';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  country_id uuid NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text,
  shipping_cost numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cities' AND policyname = 'Users can view cities for their businesses'
  ) THEN
    CREATE POLICY "Users can view cities for their businesses"
      ON cities FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = cities.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cities' AND policyname = 'Users can insert cities for their businesses'
  ) THEN
    CREATE POLICY "Users can insert cities for their businesses"
      ON cities FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = cities.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cities' AND policyname = 'Users can update cities for their businesses'
  ) THEN
    CREATE POLICY "Users can update cities for their businesses"
      ON cities FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = cities.business_id
          AND business_members.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = cities.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cities' AND policyname = 'Users can delete cities for their businesses'
  ) THEN
    CREATE POLICY "Users can delete cities for their businesses"
      ON cities FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = cities.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cities_business ON cities(business_id);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_active ON cities(is_active);
