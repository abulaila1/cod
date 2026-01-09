/*
  # Fix Order Statistics Function

  1. Changes
    - Remove reference to non-existent `key` column in statuses table
    - Add explicit table prefix for ambiguous `created_at` reference

  2. Notes
    - The original function used `s.key` which doesn't exist
    - The original function had ambiguous `created_at` reference in JOIN queries
*/

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
  SELECT COUNT(*) INTO v_today_count
  FROM orders
  WHERE business_id = p_business_id
    AND DATE(created_at) = CURRENT_DATE;

  SELECT COALESCE(SUM(o.revenue), 0) INTO v_pending_value
  FROM orders o
  LEFT JOIN statuses s ON o.status_id = s.id
  WHERE o.business_id = p_business_id
    AND (s.is_final IS NULL OR s.is_final = false);

  SELECT COUNT(*) INTO v_total_today
  FROM orders
  WHERE business_id = p_business_id
    AND DATE(created_at) = CURRENT_DATE;

  SELECT COUNT(*) INTO v_confirmed_today
  FROM orders o
  LEFT JOIN statuses s ON o.status_id = s.id
  WHERE o.business_id = p_business_id
    AND DATE(o.created_at) = CURRENT_DATE
    AND (s.counts_as_delivered = true);

  IF v_total_today > 0 THEN
    v_confirmation_rate := (v_confirmed_today::numeric / v_total_today::numeric) * 100;
  ELSE
    v_confirmation_rate := 0;
  END IF;

  SELECT COUNT(*) INTO v_late_orders_count
  FROM orders o
  LEFT JOIN statuses s ON o.status_id = s.id
  WHERE o.business_id = p_business_id
    AND o.created_at < (now() - interval '5 days')
    AND (s.is_final IS NULL OR s.is_final = false)
    AND (s.counts_as_delivered IS NULL OR s.counts_as_delivered = false);

  RETURN jsonb_build_object(
    'today_count', v_today_count,
    'pending_value', v_pending_value,
    'confirmation_rate', ROUND(v_confirmation_rate, 1),
    'late_orders_count', v_late_orders_count
  );
END;
$$;
