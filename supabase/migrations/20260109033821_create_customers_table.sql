/*
  # Create Customers Table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key to businesses)
      - `name` (text, required) - Customer name
      - `phone` (text) - Phone number
      - `email` (text) - Email address
      - `city_id` (uuid, foreign key to cities) - Optional city
      - `address` (text) - Detailed address
      - `notes` (text) - Any notes about the customer
      - `total_orders` (int) - Cached count of orders
      - `total_revenue` (numeric) - Cached total revenue
      - `is_active` (boolean) - Active status
      - `created_by` (uuid) - User who created
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to Orders
    - Add `customer_id` column to orders table

  3. Security
    - Enable RLS on `customers` table
    - Add policies for business members to manage customers
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  city_id uuid REFERENCES cities(id) ON DELETE SET NULL,
  address text,
  notes text,
  total_orders int DEFAULT 0,
  total_revenue numeric(12,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customers in their businesses"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = customers.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.status = 'active'
    )
  );

CREATE POLICY "Users can insert customers in their businesses"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = customers.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.status = 'active'
    )
  );

CREATE POLICY "Users can update customers in their businesses"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = customers.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = customers.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.status = 'active'
    )
  );

CREATE POLICY "Users can delete customers in their businesses"
  ON customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_members
      WHERE business_members.business_id = customers.business_id
      AND business_members.user_id = auth.uid()
      AND business_members.status = 'active'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
    CREATE INDEX idx_orders_customer_id ON orders(customer_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET 
      total_orders = total_orders + 1,
      total_revenue = total_revenue + COALESCE(NEW.revenue, 0),
      updated_at = now()
    WHERE id = NEW.customer_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.customer_id IS NOT NULL THEN
    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id THEN
      IF OLD.customer_id IS NOT NULL THEN
        UPDATE customers
        SET 
          total_orders = GREATEST(0, total_orders - 1),
          total_revenue = GREATEST(0, total_revenue - COALESCE(OLD.revenue, 0)),
          updated_at = now()
        WHERE id = OLD.customer_id;
      END IF;
      UPDATE customers
      SET 
        total_orders = total_orders + 1,
        total_revenue = total_revenue + COALESCE(NEW.revenue, 0),
        updated_at = now()
      WHERE id = NEW.customer_id;
    ELSIF OLD.revenue IS DISTINCT FROM NEW.revenue THEN
      UPDATE customers
      SET 
        total_revenue = total_revenue - COALESCE(OLD.revenue, 0) + COALESCE(NEW.revenue, 0),
        updated_at = now()
      WHERE id = NEW.customer_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.customer_id IS NOT NULL THEN
    UPDATE customers
    SET 
      total_orders = GREATEST(0, total_orders - 1),
      total_revenue = GREATEST(0, total_revenue - COALESCE(OLD.revenue, 0)),
      updated_at = now()
    WHERE id = OLD.customer_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_customer_stats ON orders;
CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();
