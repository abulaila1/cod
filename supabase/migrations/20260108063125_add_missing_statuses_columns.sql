/*
  # Add Missing Columns to Statuses Table

  1. New Columns
    - `counts_as_delivered` (boolean) - Count as successful delivery
    - `counts_as_return` (boolean) - Count as return/failed
    - `counts_as_active` (boolean) - Count as active order
    - `is_delivered` (boolean) - Indicates final delivered status
    - `is_final` (boolean) - Indicates this is a final status

  2. Purpose
    - These columns are required for performance calculations
    - They help categorize orders by their status type
*/

-- Add counts_as_delivered column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'statuses' AND column_name = 'counts_as_delivered'
  ) THEN
    ALTER TABLE statuses ADD COLUMN counts_as_delivered boolean DEFAULT false;
  END IF;
END $$;

-- Add counts_as_return column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'statuses' AND column_name = 'counts_as_return'
  ) THEN
    ALTER TABLE statuses ADD COLUMN counts_as_return boolean DEFAULT false;
  END IF;
END $$;

-- Add counts_as_active column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'statuses' AND column_name = 'counts_as_active'
  ) THEN
    ALTER TABLE statuses ADD COLUMN counts_as_active boolean DEFAULT true;
  END IF;
END $$;

-- Add is_delivered column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'statuses' AND column_name = 'is_delivered'
  ) THEN
    ALTER TABLE statuses ADD COLUMN is_delivered boolean DEFAULT false;
  END IF;
END $$;

-- Add is_final column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'statuses' AND column_name = 'is_final'
  ) THEN
    ALTER TABLE statuses ADD COLUMN is_final boolean DEFAULT false;
  END IF;
END $$;
