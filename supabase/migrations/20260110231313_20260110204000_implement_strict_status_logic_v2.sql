/*
  # Implement Strict Status Logic System (v2)
  
  ## Overview
  This migration implements a comprehensive status management system with strict validation rules
  to ensure data integrity and accurate reporting calculations.
  
  ## 1. New Columns Added to `statuses` Table
    - `key` (text, nullable) - Optional unique identifier for programmatic reference
    - `is_system_default` (boolean, default false) - Protects system statuses from deletion/modification
    - `status_type` (text, nullable) - Categorizes status: 'delivered', 'returned', 'active', 'canceled'
    - `sort_order` (integer, default 0) - Controls display order
    
    Note: The following columns already exist from previous migrations:
    - counts_as_delivered, counts_as_return, counts_as_active, is_final
  
  ## 2. Database Functions
    - `ensure_default_statuses(p_business_id uuid)` - Creates 14 default statuses for new businesses
    - `count_statuses_by_type(p_business_id uuid, p_type text)` - Counts statuses by type
    - `can_delete_status(p_status_id uuid)` - Validates if status can be safely deleted
    - `migrate_existing_statuses(p_business_id uuid)` - Migrates old status data to new structure
  
  ## 3. Database Triggers
    - `prevent_system_status_deletion` - Blocks deletion of system default statuses
    - `prevent_system_status_type_change` - Blocks type changes on system statuses
    - `prevent_last_status_deletion` - Ensures at least one status of each critical type exists
  
  ## 4. Data Migration
    - Automatically maps existing statuses to new structure based on name_ar
    - Preserves custom statuses
    - Adds missing default statuses
  
  ## 5. Security (RLS)
    - All existing RLS policies remain in effect
    - New columns follow same security model
  
  ## Important Notes
    - System default statuses cannot be deleted
    - System default statuses cannot have their logical properties changed
    - System default statuses CAN have their name and color changed
    - At least one status of each type (delivered, returned, active) must exist
    - Custom statuses can be fully modified or deleted
*/

-- =====================================================
-- STEP 1: Add New Columns to statuses Table
-- =====================================================

DO $$
BEGIN
  -- Add key column (optional, for programmatic reference)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'statuses' AND column_name = 'key'
  ) THEN
    ALTER TABLE statuses ADD COLUMN key text;
    CREATE INDEX IF NOT EXISTS idx_statuses_key ON statuses(business_id, key) WHERE key IS NOT NULL;
  END IF;

  -- Make sure counts_as_delivered has proper NOT NULL constraint
  ALTER TABLE statuses ALTER COLUMN counts_as_delivered SET DEFAULT false;
  ALTER TABLE statuses ALTER COLUMN counts_as_delivered SET NOT NULL;
  
  -- Make sure counts_as_return has proper NOT NULL constraint
  ALTER TABLE statuses ALTER COLUMN counts_as_return SET DEFAULT false;
  ALTER TABLE statuses ALTER COLUMN counts_as_return SET NOT NULL;
  
  -- Make sure counts_as_active has proper NOT NULL constraint
  ALTER TABLE statuses ALTER COLUMN counts_as_active SET DEFAULT true;
  ALTER TABLE statuses ALTER COLUMN counts_as_active SET NOT NULL;
  
  -- Make sure is_final has proper NOT NULL constraint
  ALTER TABLE statuses ALTER COLUMN is_final SET DEFAULT false;
  ALTER TABLE statuses ALTER COLUMN is_final SET NOT NULL;

  -- Add system protection column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'statuses' AND column_name = 'is_system_default'
  ) THEN
    ALTER TABLE statuses ADD COLUMN is_system_default boolean DEFAULT false NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_statuses_system ON statuses(business_id, is_system_default);
  END IF;

  -- Add status_type column for categorization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'statuses' AND column_name = 'status_type'
  ) THEN
    ALTER TABLE statuses ADD COLUMN status_type text;
    CREATE INDEX IF NOT EXISTS idx_statuses_type ON statuses(business_id, status_type) WHERE status_type IS NOT NULL;
  END IF;

  -- Add sort_order column (reuse display_order if exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'statuses' AND column_name = 'sort_order'
  ) THEN
    -- Check if display_order exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'statuses' AND column_name = 'display_order'
    ) THEN
      -- Use display_order values
      ALTER TABLE statuses ADD COLUMN sort_order integer;
      UPDATE statuses SET sort_order = COALESCE(display_order, 0);
      ALTER TABLE statuses ALTER COLUMN sort_order SET DEFAULT 0;
      ALTER TABLE statuses ALTER COLUMN sort_order SET NOT NULL;
    ELSE
      ALTER TABLE statuses ADD COLUMN sort_order integer DEFAULT 0 NOT NULL;
    END IF;
  END IF;
  
  -- Make name_en nullable (it shouldn't be required)
  ALTER TABLE statuses ALTER COLUMN name_en DROP NOT NULL;
  
  -- Make color nullable with a default
  ALTER TABLE statuses ALTER COLUMN color DROP NOT NULL;
  ALTER TABLE statuses ALTER COLUMN color SET DEFAULT '#64748b';
END $$;

-- =====================================================
-- STEP 2: Create Validation Functions
-- =====================================================

-- Function: Count statuses by type
CREATE OR REPLACE FUNCTION count_statuses_by_type(
  p_business_id uuid,
  p_type text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_type = 'delivered' THEN
    SELECT COUNT(*) INTO v_count
    FROM statuses
    WHERE business_id = p_business_id AND counts_as_delivered = true;
  ELSIF p_type = 'returned' THEN
    SELECT COUNT(*) INTO v_count
    FROM statuses
    WHERE business_id = p_business_id AND counts_as_return = true;
  ELSIF p_type = 'active' THEN
    SELECT COUNT(*) INTO v_count
    FROM statuses
    WHERE business_id = p_business_id AND counts_as_active = true;
  ELSE
    v_count := 0;
  END IF;
  
  RETURN v_count;
END;
$$;

-- Function: Check if status can be deleted
CREATE OR REPLACE FUNCTION can_delete_status(p_status_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status RECORD;
  v_count integer;
  v_result jsonb;
BEGIN
  -- Get status details
  SELECT * INTO v_status
  FROM statuses
  WHERE id = p_status_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_delete', false,
      'reason', 'الحالة غير موجودة'
    );
  END IF;
  
  -- Check if system default
  IF v_status.is_system_default THEN
    RETURN jsonb_build_object(
      'can_delete', false,
      'reason', 'لا يمكن حذف الحالات الافتراضية للنظام'
    );
  END IF;
  
  -- Check if last delivered status
  IF v_status.counts_as_delivered THEN
    SELECT count_statuses_by_type(v_status.business_id, 'delivered') INTO v_count;
    IF v_count <= 1 THEN
      RETURN jsonb_build_object(
        'can_delete', false,
        'reason', 'لا يمكن حذف آخر حالة من نوع "تم التوصيل"'
      );
    END IF;
  END IF;
  
  -- Check if last returned status
  IF v_status.counts_as_return THEN
    SELECT count_statuses_by_type(v_status.business_id, 'returned') INTO v_count;
    IF v_count <= 1 THEN
      RETURN jsonb_build_object(
        'can_delete', false,
        'reason', 'لا يمكن حذف آخر حالة من نوع "مرتجع"'
      );
    END IF;
  END IF;
  
  -- Check if last active status
  IF v_status.counts_as_active THEN
    SELECT count_statuses_by_type(v_status.business_id, 'active') INTO v_count;
    IF v_count <= 1 THEN
      RETURN jsonb_build_object(
        'can_delete', false,
        'reason', 'لا يمكن حذف آخر حالة من نوع "نشط"'
      );
    END IF;
  END IF;
  
  -- All checks passed
  RETURN jsonb_build_object(
    'can_delete', true,
    'reason', null
  );
END;
$$;

-- =====================================================
-- STEP 3: Create Triggers for Safety Locks
-- =====================================================

-- Trigger function: Prevent system status deletion
CREATE OR REPLACE FUNCTION prevent_system_status_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_system_default THEN
    RAISE EXCEPTION 'لا يمكن حذف الحالات الافتراضية للنظام';
  END IF;
  RETURN OLD;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_prevent_system_status_deletion ON statuses;
CREATE TRIGGER trg_prevent_system_status_deletion
  BEFORE DELETE ON statuses
  FOR EACH ROW
  EXECUTE FUNCTION prevent_system_status_deletion();

-- Trigger function: Prevent system status type change
CREATE OR REPLACE FUNCTION prevent_system_status_type_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_system_default AND (
    OLD.counts_as_delivered != NEW.counts_as_delivered OR
    OLD.counts_as_return != NEW.counts_as_return OR
    OLD.counts_as_active != NEW.counts_as_active OR
    OLD.is_final != NEW.is_final OR
    COALESCE(OLD.status_type, '') != COALESCE(NEW.status_type, '') OR
    OLD.is_system_default != NEW.is_system_default
  ) THEN
    RAISE EXCEPTION 'لا يمكن تغيير خصائص الحالات الافتراضية. يمكنك فقط تغيير الاسم واللون';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_prevent_system_status_type_change ON statuses;
CREATE TRIGGER trg_prevent_system_status_type_change
  BEFORE UPDATE ON statuses
  FOR EACH ROW
  EXECUTE FUNCTION prevent_system_status_type_change();

-- Trigger function: Prevent last status deletion
CREATE OR REPLACE FUNCTION prevent_last_status_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Check delivered
  IF OLD.counts_as_delivered THEN
    SELECT count_statuses_by_type(OLD.business_id, 'delivered') INTO v_count;
    IF v_count <= 1 THEN
      RAISE EXCEPTION 'لا يمكن حذف آخر حالة من نوع "تم التوصيل". يجب أن تحتفظ بحالة واحدة على الأقل من هذا النوع';
    END IF;
  END IF;
  
  -- Check returned
  IF OLD.counts_as_return THEN
    SELECT count_statuses_by_type(OLD.business_id, 'returned') INTO v_count;
    IF v_count <= 1 THEN
      RAISE EXCEPTION 'لا يمكن حذف آخر حالة من نوع "مرتجع". يجب أن تحتفظ بحالة واحدة على الأقل من هذا النوع';
    END IF;
  END IF;
  
  -- Check active
  IF OLD.counts_as_active THEN
    SELECT count_statuses_by_type(OLD.business_id, 'active') INTO v_count;
    IF v_count <= 1 THEN
      RAISE EXCEPTION 'لا يمكن حذف آخر حالة نشطة. يجب أن تحتفظ بحالة واحدة على الأقل من هذا النوع';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_prevent_last_status_deletion ON statuses;
CREATE TRIGGER trg_prevent_last_status_deletion
  BEFORE DELETE ON statuses
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_status_deletion();

-- =====================================================
-- STEP 4: Create Default Statuses Function
-- =====================================================

CREATE OR REPLACE FUNCTION ensure_default_statuses(p_business_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default statuses if they don't exist
  INSERT INTO statuses (
    business_id, key, name_ar, name_en, sort_order, is_final,
    counts_as_delivered, counts_as_return, counts_as_active,
    is_system_default, status_type, color
  )
  SELECT 
    p_business_id,
    s.key,
    s.name_ar,
    s.key,
    s.sort_order,
    s.is_final,
    s.counts_as_delivered,
    s.counts_as_return,
    s.counts_as_active,
    true,
    s.status_type,
    s.color
  FROM (VALUES
    ('new', 'طلبات جديدة', 1, false, false, false, true, 'active', '#3b82f6'),
    ('confirmed', 'مؤكدة', 2, false, false, false, true, 'active', '#10b981'),
    ('pending_discussion', 'معلقة للمناقشة', 3, false, false, false, true, 'active', '#f59e0b'),
    ('delayed', 'مؤجلة', 4, false, false, false, true, 'active', '#ef4444'),
    ('preparing', 'تحت التحضير', 5, false, false, false, true, 'active', '#8b5cf6'),
    ('prepared', 'تم التحضير', 6, false, false, false, true, 'active', '#06b6d4'),
    ('shipping', 'في الشحن', 7, false, false, false, true, 'active', '#14b8a6'),
    ('delivered', 'تم التوصيل', 8, true, true, false, false, 'delivered', '#22c55e'),
    ('returned', 'مرتجع', 9, true, false, true, false, 'returned', '#f97316'),
    ('refused_at_delivery', 'رفض عند الاستلام', 10, true, false, true, false, 'returned', '#dc2626'),
    ('warehouse_received', 'استلام أمين المخزن', 11, false, false, true, false, 'returned', '#ea580c'),
    ('restocked', 'إرجاع للرف', 12, false, false, true, false, 'returned', '#c2410c'),
    ('canceled', 'ملغية', 13, true, false, false, false, 'canceled', '#64748b'),
    ('deleted', 'محذوفة', 14, true, false, false, false, 'canceled', '#475569')
  ) AS s(key, name_ar, sort_order, is_final, counts_as_delivered, counts_as_return, counts_as_active, status_type, color)
  WHERE NOT EXISTS (
    SELECT 1 FROM statuses 
    WHERE business_id = p_business_id 
    AND (key = s.key OR name_ar = s.name_ar)
  )
  ON CONFLICT DO NOTHING;
END;
$$;

-- =====================================================
-- STEP 5: Data Migration Function
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_existing_statuses(p_business_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated integer := 0;
  v_created integer := 0;
  v_result jsonb;
BEGIN
  -- Map existing statuses to system defaults based on name_ar
  UPDATE statuses SET
    key = CASE 
      WHEN name_ar IN ('طلبات جديدة', 'new') THEN 'new'
      WHEN name_ar IN ('مؤكدة', 'confirmed') THEN 'confirmed'
      WHEN name_ar IN ('معلقة للمناقشة', 'pending_discussion') THEN 'pending_discussion'
      WHEN name_ar IN ('مؤجلة', 'delayed') THEN 'delayed'
      WHEN name_ar IN ('تحت التحضير', 'preparing') THEN 'preparing'
      WHEN name_ar IN ('تم التحضير', 'prepared') THEN 'prepared'
      WHEN name_ar IN ('في الشحن', 'shipping') THEN 'shipping'
      WHEN name_ar IN ('تم التوصيل', 'delivered') THEN 'delivered'
      WHEN name_ar IN ('مرتجع', 'returned') THEN 'returned'
      WHEN name_ar IN ('رفض عند الاستلام', 'refused_at_delivery') THEN 'refused_at_delivery'
      WHEN name_ar IN ('استلام أمين المخزن', 'warehouse_received') THEN 'warehouse_received'
      WHEN name_ar IN ('إرجاع للرف', 'restocked') THEN 'restocked'
      WHEN name_ar IN ('ملغية', 'canceled') THEN 'canceled'
      WHEN name_ar IN ('محذوفة', 'deleted') THEN 'deleted'
      ELSE key
    END,
    counts_as_delivered = CASE 
      WHEN name_ar IN ('تم التوصيل', 'delivered') THEN true
      ELSE COALESCE(counts_as_delivered, false)
    END,
    counts_as_return = CASE 
      WHEN name_ar IN ('مرتجع', 'returned', 'رفض عند الاستلام', 'refused_at_delivery', 
                        'استلام أمين المخزن', 'warehouse_received', 'إرجاع للرف', 'restocked') THEN true
      ELSE COALESCE(counts_as_return, false)
    END,
    counts_as_active = CASE 
      WHEN name_ar IN ('طلبات جديدة', 'new', 'مؤكدة', 'confirmed', 'معلقة للمناقشة', 
                        'pending_discussion', 'مؤجلة', 'delayed', 'تحت التحضير', 'preparing',
                        'تم التحضير', 'prepared', 'في الشحن', 'shipping') THEN true
      ELSE COALESCE(counts_as_active, false)
    END,
    is_final = CASE 
      WHEN name_ar IN ('تم التوصيل', 'delivered', 'مرتجع', 'returned', 
                        'رفض عند الاستلام', 'refused_at_delivery', 'ملغية', 'canceled', 
                        'محذوفة', 'deleted') THEN true
      ELSE COALESCE(is_final, false)
    END,
    is_system_default = CASE 
      WHEN name_ar IN ('طلبات جديدة', 'مؤكدة', 'معلقة للمناقشة', 'مؤجلة', 'تحت التحضير',
                        'تم التحضير', 'في الشحن', 'تم التوصيل', 'مرتجع', 'رفض عند الاستلام',
                        'استلام أمين المخزن', 'إرجاع للرف', 'ملغية', 'محذوفة',
                        'new', 'confirmed', 'pending_discussion', 'delayed', 'preparing',
                        'prepared', 'shipping', 'delivered', 'returned', 'refused_at_delivery',
                        'warehouse_received', 'restocked', 'canceled', 'deleted') THEN true
      ELSE false
    END,
    status_type = CASE 
      WHEN name_ar IN ('تم التوصيل', 'delivered') THEN 'delivered'
      WHEN name_ar IN ('مرتجع', 'returned', 'رفض عند الاستلام', 'refused_at_delivery',
                        'استلام أمين المخزن', 'warehouse_received', 'إرجاع للرف', 'restocked') THEN 'returned'
      WHEN name_ar IN ('طلبات جديدة', 'new', 'مؤكدة', 'confirmed', 'معلقة للمناقشة',
                        'pending_discussion', 'مؤجلة', 'delayed', 'تحت التحضير', 'preparing',
                        'تم التحضير', 'prepared', 'في الشحن', 'shipping') THEN 'active'
      WHEN name_ar IN ('ملغية', 'canceled', 'محذوفة', 'deleted') THEN 'canceled'
      ELSE status_type
    END
  WHERE business_id = p_business_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  -- Add missing default statuses
  PERFORM ensure_default_statuses(p_business_id);
  
  -- Count newly created
  SELECT COUNT(*) INTO v_created
  FROM statuses
  WHERE business_id = p_business_id
  AND is_system_default = true
  AND created_at > NOW() - INTERVAL '1 minute';
  
  v_result := jsonb_build_object(
    'updated', v_updated,
    'created', v_created,
    'business_id', p_business_id
  );
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- STEP 6: Apply Migration to All Existing Businesses
-- =====================================================

DO $$
DECLARE
  v_business RECORD;
  v_result jsonb;
  v_total_updated integer := 0;
  v_total_created integer := 0;
BEGIN
  FOR v_business IN SELECT DISTINCT business_id FROM statuses
  LOOP
    SELECT migrate_existing_statuses(v_business.business_id) INTO v_result;
    v_total_updated := v_total_updated + (v_result->>'updated')::integer;
    v_total_created := v_total_created + (v_result->>'created')::integer;
  END LOOP;
  
  RAISE NOTICE 'Migration complete: % statuses updated, % statuses created', v_total_updated, v_total_created;
END $$;

-- =====================================================
-- STEP 7: Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION count_statuses_by_type(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION can_delete_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_default_statuses(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_existing_statuses(uuid) TO authenticated;