/*
  # Domain Schema for CODMeta Multi-Tenant SaaS

  ## Overview
  Complete domain schema with multi-tenant isolation for order management system.
  All tables include business_id for data segregation with proper RLS policies.

  ## New Tables

  ### 1. `statuses` (Order Status Management)
    - `id` (uuid, primary key) - Unique status identifier
    - `business_id` (uuid, FK) - Business reference for multi-tenancy
    - `key` (text) - Status key (new, confirmed, delivered, etc.)
    - `label_ar` (text) - Arabic label for display
    - `sort_order` (int) - Display order
    - `is_final` (boolean) - Whether this is a final status
    - `counts_as_delivered` (boolean) - Count as successful delivery
    - `counts_as_return` (boolean) - Count as return/failed
    - `counts_as_active` (boolean) - Count as active order
    - `created_at` (timestamptz)
    - **Unique constraint**: (business_id, key)

  ### 2. `countries` (Delivery Countries)
    - `id` (uuid, primary key)
    - `business_id` (uuid, FK)
    - `name_ar` (text) - Arabic country name
    - `currency` (text, nullable) - Currency code
    - `active` (boolean) - Active flag
    - `created_at` (timestamptz)
    - **Unique constraint**: (business_id, name_ar)

  ### 3. `carriers` (Shipping Carriers)
    - `id` (uuid, primary key)
    - `business_id` (uuid, FK)
    - `name_ar` (text) - Arabic carrier name
    - `active` (boolean) - Active flag
    - `created_at` (timestamptz)
    - **Unique constraint**: (business_id, name_ar)

  ### 4. `employees` (Team Members)
    - `id` (uuid, primary key)
    - `business_id` (uuid, FK)
    - `name_ar` (text) - Arabic employee name
    - `role` (text, nullable) - Employee role
    - `active` (boolean) - Active flag
    - `created_at` (timestamptz)

  ### 5. `products` (Product Catalog)
    - `id` (uuid, primary key)
    - `business_id` (uuid, FK)
    - `name_ar` (text) - Arabic product name
    - `sku` (text, nullable) - Stock Keeping Unit
    - `base_cogs` (numeric) - Base Cost of Goods Sold
    - `active` (boolean) - Active flag
    - `created_at` (timestamptz)
    - **Unique constraint**: (business_id, sku) where sku IS NOT NULL

  ### 6. `orders` (Order Management)
    - `id` (uuid, primary key)
    - `business_id` (uuid, FK)
    - `order_date` (timestamptz) - Order creation date
    - `country_id` (uuid, FK countries)
    - `carrier_id` (uuid, FK carriers)
    - `employee_id` (uuid, FK employees)
    - `status_id` (uuid, FK statuses)
    - `revenue` (numeric) - Order revenue
    - `cogs` (numeric) - Cost of goods sold
    - `shipping_cost` (numeric) - Shipping cost
    - `ad_cost` (numeric, nullable) - Advertising cost
    - `notes` (text, nullable) - Order notes
    - `created_at` (timestamptz)

  ### 7. `order_items` (Order Line Items)
    - `id` (uuid, primary key)
    - `business_id` (uuid, FK)
    - `order_id` (uuid, FK orders)
    - `product_id` (uuid, FK products)
    - `qty` (int) - Quantity
    - `item_price` (numeric) - Item price
    - `item_cogs` (numeric) - Item COGS
    - `created_at` (timestamptz)

  ### 8. `audit_logs` (Activity Tracking)
    - `id` (uuid, primary key)
    - `business_id` (uuid, FK)
    - `user_id` (uuid, FK auth.users)
    - `entity_type` (text) - Entity type (orders, products, etc.)
    - `entity_id` (uuid) - Entity identifier
    - `action` (text) - Action performed
    - `before` (jsonb, nullable) - State before change
    - `after` (jsonb, nullable) - State after change
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access data from businesses they are members of
  - All policies check business_members table for authorization

  ## Indexes
  - Foreign key indexes for performance
  - Business_id indexes on all tables
  - Composite indexes for common queries
*/

-- Create statuses table
CREATE TABLE IF NOT EXISTS statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  key text NOT NULL,
  label_ar text NOT NULL,
  sort_order int DEFAULT 0,
  is_final boolean DEFAULT false,
  counts_as_delivered boolean DEFAULT false,
  counts_as_return boolean DEFAULT false,
  counts_as_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, key)
);

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name_ar text NOT NULL,
  currency text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, name_ar)
);

-- Create carriers table
CREATE TABLE IF NOT EXISTS carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name_ar text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, name_ar)
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name_ar text NOT NULL,
  role text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name_ar text NOT NULL,
  sku text,
  base_cogs numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_business_sku 
  ON products(business_id, sku) WHERE sku IS NOT NULL;

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  order_date timestamptz DEFAULT now(),
  country_id uuid REFERENCES countries(id) ON DELETE RESTRICT,
  carrier_id uuid REFERENCES carriers(id) ON DELETE RESTRICT,
  employee_id uuid REFERENCES employees(id) ON DELETE RESTRICT,
  status_id uuid REFERENCES statuses(id) ON DELETE RESTRICT,
  revenue numeric DEFAULT 0,
  cogs numeric DEFAULT 0,
  shipping_cost numeric DEFAULT 0,
  ad_cost numeric,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  qty int NOT NULL DEFAULT 1,
  item_price numeric DEFAULT 0,
  item_cogs numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  before jsonb,
  after jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_statuses_business_id ON statuses(business_id);
CREATE INDEX IF NOT EXISTS idx_statuses_sort_order ON statuses(business_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_countries_business_id ON countries(business_id);
CREATE INDEX IF NOT EXISTS idx_carriers_business_id ON carriers(business_id);
CREATE INDEX IF NOT EXISTS idx_employees_business_id ON employees(business_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);

CREATE INDEX IF NOT EXISTS idx_orders_business_id ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(business_id, order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status_id ON orders(status_id);
CREATE INDEX IF NOT EXISTS idx_orders_country_id ON orders(country_id);
CREATE INDEX IF NOT EXISTS idx_orders_carrier_id ON orders(carrier_id);
CREATE INDEX IF NOT EXISTS idx_orders_employee_id ON orders(employee_id);

CREATE INDEX IF NOT EXISTS idx_order_items_business_id ON order_items(business_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Enable Row Level Security
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for statuses
CREATE POLICY "Users can view statuses in their businesses"
  ON statuses FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert statuses in their businesses"
  ON statuses FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update statuses in their businesses"
  ON statuses FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete statuses in their businesses"
  ON statuses FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for countries
CREATE POLICY "Users can view countries in their businesses"
  ON countries FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert countries in their businesses"
  ON countries FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update countries in their businesses"
  ON countries FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete countries in their businesses"
  ON countries FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for carriers
CREATE POLICY "Users can view carriers in their businesses"
  ON carriers FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert carriers in their businesses"
  ON carriers FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update carriers in their businesses"
  ON carriers FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete carriers in their businesses"
  ON carriers FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for employees
CREATE POLICY "Users can view employees in their businesses"
  ON employees FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert employees in their businesses"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update employees in their businesses"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete employees in their businesses"
  ON employees FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for products
CREATE POLICY "Users can view products in their businesses"
  ON products FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert products in their businesses"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update products in their businesses"
  ON products FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete products in their businesses"
  ON products FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for orders
CREATE POLICY "Users can view orders in their businesses"
  ON orders FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert orders in their businesses"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update orders in their businesses"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete orders in their businesses"
  ON orders FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Users can view order_items in their businesses"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert order_items in their businesses"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can update order_items in their businesses"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can delete order_items in their businesses"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Users can view audit_logs in their businesses"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can insert audit_logs in their businesses"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );