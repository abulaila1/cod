/*
  # Enhanced Orders Module - Complete Schema Update

  1. New Columns in `orders` table:
    - `tracking_number` (text) - AWB tracking number from carrier
    - `cod_fees` (numeric) - Cash on delivery fees
    - `collected_amount` (numeric) - Amount actually collected on delivery
    - `collection_status` (text) - Status of COD collection (pending/collected/partial)
    - `city_id` (uuid) - Reference to cities table for detailed location
    - `order_source` (text) - Source of order (website/facebook/instagram/etc)
    - `callback_date` (timestamptz) - Scheduled callback date for follow-up
    - `cancellation_reason` (text) - Reason for order cancellation
    - `return_reason` (text) - Reason for order return (RTO)
    - `confirmed_at` (timestamptz) - When order was confirmed
    - `shipped_at` (timestamptz) - When order was shipped
    - `delivered_at` (timestamptz) - When order was delivered
    - `processing_status` (text) - Staff processing status

  2. New Table `order_locks`:
    - Tracks which orders are locked by which staff member
    - Auto-expires after 10 minutes

  3. Indexes:
    - Performance indexes for common queries

  4. Security:
    - RLS policies for new columns
*/

-- Add new columns to orders table
DO $$
BEGIN
  -- Tracking number (AWB)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN tracking_number text;
  END IF;

  -- COD fees
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cod_fees'
  ) THEN
    ALTER TABLE orders ADD COLUMN cod_fees numeric DEFAULT 0;
  END IF;

  -- Collected amount
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'collected_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN collected_amount numeric;
  END IF;

  -- Collection status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'collection_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN collection_status text DEFAULT 'pending' CHECK (collection_status IN ('pending', 'collected', 'partial', 'failed'));
  END IF;

  -- City ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN city_id uuid REFERENCES cities(id) ON DELETE SET NULL;
  END IF;

  -- Order source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_source'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_source text;
  END IF;

  -- Callback date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'callback_date'
  ) THEN
    ALTER TABLE orders ADD COLUMN callback_date timestamptz;
  END IF;

  -- Cancellation reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE orders ADD COLUMN cancellation_reason text;
  END IF;

  -- Return reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'return_reason'
  ) THEN
    ALTER TABLE orders ADD COLUMN return_reason text;
  END IF;

  -- Confirmed at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN confirmed_at timestamptz;
  END IF;

  -- Shipped at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipped_at timestamptz;
  END IF;

  -- Delivered at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivered_at timestamptz;
  END IF;

  -- Processing status for staff queue
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed'));
  END IF;
END $$;

-- Create order_locks table for staff cherry-picking system
CREATE TABLE IF NOT EXISTS order_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  locked_by uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  locked_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Enable RLS on order_locks
ALTER TABLE order_locks ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_locks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_locks' AND policyname = 'Users can view locks in their business'
  ) THEN
    CREATE POLICY "Users can view locks in their business"
      ON order_locks FOR SELECT
      TO authenticated
      USING (
        business_id IN (
          SELECT business_id FROM business_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_locks' AND policyname = 'Users can create locks in their business'
  ) THEN
    CREATE POLICY "Users can create locks in their business"
      ON order_locks FOR INSERT
      TO authenticated
      WITH CHECK (
        business_id IN (
          SELECT business_id FROM business_members WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_locks' AND policyname = 'Users can delete their own locks'
  ) THEN
    CREATE POLICY "Users can delete their own locks"
      ON order_locks FOR DELETE
      TO authenticated
      USING (
        business_id IN (
          SELECT business_id FROM business_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_city_id ON orders(city_id) WHERE city_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_collection_status ON orders(collection_status);
CREATE INDEX IF NOT EXISTS idx_orders_callback_date ON orders(callback_date) WHERE callback_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_processing_status ON orders(processing_status);
CREATE INDEX IF NOT EXISTS idx_order_locks_expires_at ON order_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_locks_order_id ON order_locks(order_id);

-- Function to auto-release expired locks
CREATE OR REPLACE FUNCTION release_expired_order_locks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM order_locks WHERE expires_at < now();
END;
$$;

-- Function to lock an order for processing
CREATE OR REPLACE FUNCTION lock_order_for_processing(
  p_business_id uuid,
  p_order_id uuid,
  p_employee_id uuid,
  p_duration_minutes int DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_lock order_locks%ROWTYPE;
  v_new_lock order_locks%ROWTYPE;
BEGIN
  -- First, clean up expired locks
  PERFORM release_expired_order_locks();

  -- Check if order is already locked
  SELECT * INTO v_existing_lock
  FROM order_locks
  WHERE order_id = p_order_id;

  IF FOUND THEN
    -- Return existing lock info
    RETURN jsonb_build_object(
      'success', false,
      'error', 'order_already_locked',
      'locked_by', v_existing_lock.locked_by,
      'expires_at', v_existing_lock.expires_at
    );
  END IF;

  -- Create new lock
  INSERT INTO order_locks (business_id, order_id, locked_by, expires_at)
  VALUES (
    p_business_id,
    p_order_id,
    p_employee_id,
    now() + (p_duration_minutes || ' minutes')::interval
  )
  RETURNING * INTO v_new_lock;

  -- Update order processing status
  UPDATE orders
  SET processing_status = 'processing',
      locked_by = p_employee_id,
      locked_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'lock_id', v_new_lock.id,
    'expires_at', v_new_lock.expires_at
  );
END;
$$;

-- Function to unlock an order
CREATE OR REPLACE FUNCTION unlock_order(
  p_order_id uuid,
  p_employee_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the lock (optionally verify employee)
  IF p_employee_id IS NOT NULL THEN
    DELETE FROM order_locks
    WHERE order_id = p_order_id AND locked_by = p_employee_id;
  ELSE
    DELETE FROM order_locks
    WHERE order_id = p_order_id;
  END IF;

  -- Update order processing status
  UPDATE orders
  SET processing_status = 'pending',
      locked_by = NULL,
      locked_at = NULL
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to get order statistics for dashboard
CREATE OR REPLACE FUNCTION get_order_statistics(p_business_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_count int;
  v_pending_value numeric;
  v_confirmation_rate numeric;
  v_late_orders_count int;
  v_total_today int;
  v_confirmed_today int;
BEGIN
  -- Count orders created today
  SELECT COUNT(*) INTO v_today_count
  FROM orders
  WHERE business_id = p_business_id
    AND DATE(created_at) = CURRENT_DATE;

  -- Calculate pending orders value (orders not yet delivered)
  SELECT COALESCE(SUM(revenue), 0) INTO v_pending_value
  FROM orders o
  JOIN statuses s ON o.status_id = s.id
  WHERE o.business_id = p_business_id
    AND s.is_final = false;

  -- Calculate confirmation rate for today
  SELECT COUNT(*) INTO v_total_today
  FROM orders
  WHERE business_id = p_business_id
    AND DATE(created_at) = CURRENT_DATE;

  SELECT COUNT(*) INTO v_confirmed_today
  FROM orders o
  JOIN statuses s ON o.status_id = s.id
  WHERE o.business_id = p_business_id
    AND DATE(created_at) = CURRENT_DATE
    AND (s.counts_as_delivered = true OR s.key IN ('confirmed', 'shipped', 'delivered'));

  IF v_total_today > 0 THEN
    v_confirmation_rate := (v_confirmed_today::numeric / v_total_today::numeric) * 100;
  ELSE
    v_confirmation_rate := 0;
  END IF;

  -- Count late orders (more than 5 days old and not delivered)
  SELECT COUNT(*) INTO v_late_orders_count
  FROM orders o
  JOIN statuses s ON o.status_id = s.id
  WHERE o.business_id = p_business_id
    AND o.created_at < (now() - interval '5 days')
    AND s.is_final = false
    AND s.counts_as_delivered = false;

  RETURN jsonb_build_object(
    'today_count', v_today_count,
    'pending_value', v_pending_value,
    'confirmation_rate', ROUND(v_confirmation_rate, 1),
    'late_orders_count', v_late_orders_count
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION lock_order_for_processing TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_order TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION release_expired_order_locks TO authenticated;