/*
  # Enhance Products System

  1. New Tables
    - `product_categories`
      - `id` (uuid, primary key)
      - `business_id` (uuid, references businesses)
      - `name_ar` (text, Arabic name)
      - `name_en` (text, optional English name)
      - `color` (text, hex color for display)
      - `display_order` (integer, for ordering)
      - `created_at` (timestamp)

  2. Changes to `products` table
    - Add `price` column (selling price)
    - Add `category_id` column (references product_categories)
    - Add `image_url` column (for product image)

  3. Security
    - Enable RLS on `product_categories` table
    - Add policies for authenticated users to manage their business categories
*/

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text,
  color text DEFAULT '#3B82F6',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view product categories for their businesses"
  ON product_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = product_categories.business_id
      AND business_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert product categories for their businesses"
  ON product_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = product_categories.business_id
      AND business_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update product categories for their businesses"
  ON product_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = product_categories.business_id
      AND business_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = product_categories.business_id
      AND business_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete product categories for their businesses"
  ON product_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = product_categories.business_id
      AND business_members.user_id = auth.uid()
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE products ADD COLUMN price numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_categories_business ON product_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
