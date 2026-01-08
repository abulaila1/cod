/*
  # Lifetime Deal & Cash On Delivery (COD) Workflow Schema

  ## Overview
  This migration adds support for lifetime deal business model and strict COD workflow with staff locking and inventory management.

  ## Changes

  ### 1. Businesses Table - Lifetime Deal Support
  - `plan_type` (text): Type of subscription plan ('monthly', 'annual', 'lifetime')
  - `is_lifetime_deal` (boolean): Flag for lifetime deal customers
  - `manual_payment_status` (text): Manual payment verification status
  - `max_orders_limit` (integer): Custom order limit override for manual plans

  ### 2. Orders Table - Staff Locking System
  - `locked_by` (uuid): Which staff member has locked this order for editing
  - `locked_at` (timestamptz): When the order was locked
  - Index on `locked_by` for performance

  ### 3. Products Table - Inventory Management
  - `physical_stock` (integer): Total physical inventory
  - `reserved_stock` (integer): Stock reserved for pending orders
  - Note: `stock` column represents available stock (physical - reserved)

  ### 4. Audit Logs Table - Security & Compliance
  - Update existing audit_logs table structure
  - Add missing indexes for performance
  - Add RLS policies for workspace isolation

  ## Security Notes
  - All new columns have safe defaults
  - Audit logs are protected with RLS
  - Foreign key constraints maintain referential integrity
*/

-- ================================================
-- 1. UPDATE BUSINESSES TABLE FOR LIFETIME DEALS
-- ================================================

-- Add plan_type column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE businesses ADD COLUMN plan_type text DEFAULT 'monthly' NOT NULL;
  END IF;
END $$;

-- Add is_lifetime_deal column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'is_lifetime_deal'
  ) THEN
    ALTER TABLE businesses ADD COLUMN is_lifetime_deal boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add manual_payment_status column with check constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'manual_payment_status'
  ) THEN
    ALTER TABLE businesses ADD COLUMN manual_payment_status text DEFAULT 'none' NOT NULL;
  END IF;
END $$;

-- Add check constraint for manual_payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'businesses_manual_payment_status_check'
  ) THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_manual_payment_status_check
      CHECK (manual_payment_status IN ('none', 'pending', 'verified', 'rejected'));
  END IF;
END $$;

-- Add max_orders_limit column (nullable for custom limits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'max_orders_limit'
  ) THEN
    ALTER TABLE businesses ADD COLUMN max_orders_limit integer;
  END IF;
END $$;

-- ================================================
-- 2. UPDATE ORDERS TABLE FOR STAFF LOCKING
-- ================================================

-- Add locked_by column (FK to auth.users)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'locked_by'
  ) THEN
    ALTER TABLE orders ADD COLUMN locked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add locked_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'locked_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN locked_at timestamptz;
  END IF;
END $$;

-- Create index on locked_by for performance
CREATE INDEX IF NOT EXISTS idx_orders_locked_by ON orders(locked_by);

-- ================================================
-- 3. UPDATE PRODUCTS TABLE FOR INVENTORY TRACKING
-- ================================================

-- Add physical_stock column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'physical_stock'
  ) THEN
    ALTER TABLE products ADD COLUMN physical_stock integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Add reserved_stock column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'reserved_stock'
  ) THEN
    ALTER TABLE products ADD COLUMN reserved_stock integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- ================================================
-- 4. UPDATE AUDIT LOGS TABLE & ADD RLS POLICIES
-- ================================================

-- Ensure audit_logs has proper indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view audit logs for their workspaces" ON audit_logs;
DROP POLICY IF EXISTS "Users can create audit logs for their workspaces" ON audit_logs;

-- Enable RLS on audit_logs (no-op if already enabled)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view audit logs for their own workspaces
CREATE POLICY "Users can view audit logs for their workspaces"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id 
      FROM business_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert audit logs for their own workspaces
CREATE POLICY "Users can create audit logs for their workspaces"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id 
      FROM business_members 
      WHERE user_id = auth.uid()
    )
  );

-- ================================================
-- COMMENTS FOR DOCUMENTATION
-- ================================================

COMMENT ON COLUMN businesses.plan_type IS 'Type of subscription plan: monthly, annual, or lifetime';
COMMENT ON COLUMN businesses.is_lifetime_deal IS 'Flag indicating if this is a lifetime deal customer';
COMMENT ON COLUMN businesses.manual_payment_status IS 'Manual payment verification status: none, pending, verified, rejected';
COMMENT ON COLUMN businesses.max_orders_limit IS 'Custom order limit override (null = use plan default)';

COMMENT ON COLUMN orders.locked_by IS 'User ID of staff member who has locked this order for editing';
COMMENT ON COLUMN orders.locked_at IS 'Timestamp when the order was locked';

COMMENT ON COLUMN products.physical_stock IS 'Total physical inventory available';
COMMENT ON COLUMN products.reserved_stock IS 'Stock reserved for pending/processing orders';

COMMENT ON TABLE audit_logs IS 'Audit trail for all critical entity changes (orders, products, etc.)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity being logged';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: created, updated, deleted, status_changed, etc.';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object containing the changes made';