/*
  # Enhanced Employee Management System

  1. New Columns in employees table
    - `email` (text, unique per business) - Employee login email
    - `password_hash` (text) - Encrypted password for employee login
    - `salary` (numeric) - Base salary amount
    - `permissions` (jsonb) - Array of module permissions
    - `last_login_at` (timestamptz) - Last successful login timestamp

  2. New Tables
    - `employee_bonuses` - Track bonuses given to employees
      - `id` (uuid, primary key)
      - `business_id` (uuid, FK)
      - `employee_id` (uuid, FK)
      - `amount` (numeric)
      - `reason` (text)
      - `month` (text) - YYYY-MM format
      - `created_by` (uuid, FK to auth.users)
      - `created_at` (timestamptz)

    - `employee_logins` - Track login history
      - `id` (uuid, primary key)
      - `business_id` (uuid, FK)
      - `employee_id` (uuid, FK)
      - `login_at` (timestamptz)
      - `ip_address` (text)
      - `success` (boolean)

    - `employee_activity` - Track employee actions on orders
      - `id` (uuid, primary key)
      - `business_id` (uuid, FK)
      - `employee_id` (uuid, FK)
      - `order_id` (uuid, FK)
      - `action_type` (text) - 'confirmed', 'status_changed', etc.
      - `old_status_id` (uuid, nullable)
      - `new_status_id` (uuid, nullable)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all new tables
    - Add policies for business members only
*/

-- Add new columns to employees table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'email'
  ) THEN
    ALTER TABLE employees ADD COLUMN email text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE employees ADD COLUMN password_hash text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'salary'
  ) THEN
    ALTER TABLE employees ADD COLUMN salary numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE employees ADD COLUMN permissions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE employees ADD COLUMN last_login_at timestamptz;
  END IF;
END $$;

-- Create unique index on email per business
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_business_email 
ON employees(business_id, email) WHERE email IS NOT NULL;

-- Create employee_bonuses table
CREATE TABLE IF NOT EXISTS employee_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  reason text,
  month text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_bonuses_business ON employee_bonuses(business_id);
CREATE INDEX IF NOT EXISTS idx_employee_bonuses_employee ON employee_bonuses(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_bonuses_month ON employee_bonuses(month);

-- Create employee_logins table
CREATE TABLE IF NOT EXISTS employee_logins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  login_at timestamptz DEFAULT now(),
  ip_address text,
  success boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_employee_logins_employee ON employee_logins(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_logins_login_at ON employee_logins(login_at DESC);

-- Create employee_activity table
CREATE TABLE IF NOT EXISTS employee_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  old_status_id uuid REFERENCES statuses(id) ON DELETE SET NULL,
  new_status_id uuid REFERENCES statuses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_activity_employee ON employee_activity(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_activity_order ON employee_activity(order_id);
CREATE INDEX IF NOT EXISTS idx_employee_activity_created_at ON employee_activity(created_at DESC);

-- Enable RLS
ALTER TABLE employee_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_bonuses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_bonuses' AND policyname = 'Business members can view bonuses'
  ) THEN
    CREATE POLICY "Business members can view bonuses"
      ON employee_bonuses FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_bonuses.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_bonuses' AND policyname = 'Business members can insert bonuses'
  ) THEN
    CREATE POLICY "Business members can insert bonuses"
      ON employee_bonuses FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_bonuses.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_bonuses' AND policyname = 'Business members can update bonuses'
  ) THEN
    CREATE POLICY "Business members can update bonuses"
      ON employee_bonuses FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_bonuses.business_id
          AND business_members.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_bonuses.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_bonuses' AND policyname = 'Business members can delete bonuses'
  ) THEN
    CREATE POLICY "Business members can delete bonuses"
      ON employee_bonuses FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_bonuses.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS Policies for employee_logins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_logins' AND policyname = 'Business members can view logins'
  ) THEN
    CREATE POLICY "Business members can view logins"
      ON employee_logins FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_logins.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_logins' AND policyname = 'Business members can insert logins'
  ) THEN
    CREATE POLICY "Business members can insert logins"
      ON employee_logins FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_logins.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS Policies for employee_activity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_activity' AND policyname = 'Business members can view activity'
  ) THEN
    CREATE POLICY "Business members can view activity"
      ON employee_activity FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_activity.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_activity' AND policyname = 'Business members can insert activity'
  ) THEN
    CREATE POLICY "Business members can insert activity"
      ON employee_activity FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_members
          WHERE business_members.business_id = employee_activity.business_id
          AND business_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;
