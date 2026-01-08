/*
  # Remove Illegal import.meta from SQL Functions

  ## Problem
  Runtime error: "cross-database references are not implemented: import.meta.env.dev"
  
  Cause: businesses_set_created_by() function contained JavaScript/Vite runtime code
  `IF import.meta.env.DEV THEN` which is ILLEGAL in PostgreSQL/Supabase SQL.

  ## Solution
  Drop and recreate businesses_set_created_by() function WITHOUT any import.meta references.
  Use ONLY PostgreSQL-native constructs (auth.uid(), NEW.*, RAISE NOTICE).

  ## Changes
  1. Drop problematic function
  2. Recreate clean function without import.meta
  3. Trigger remains unchanged (BEFORE INSERT)
  4. Remove conditional debug logging (or use plain RAISE NOTICE)
*/

-- =====================================================
-- STEP 1: Drop existing function
-- =====================================================

DROP FUNCTION IF EXISTS businesses_set_created_by() CASCADE;

-- =====================================================
-- STEP 2: Recreate clean function WITHOUT import.meta
-- =====================================================

CREATE OR REPLACE FUNCTION businesses_set_created_by()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is authenticated
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Not authenticated - cannot create business';
  END IF;

  -- ALWAYS force created_by to auth.uid() (ignore any provided value)
  NEW.created_by := (SELECT auth.uid());

  -- Simple debug log (no conditional logic, always runs)
  -- PostgreSQL will log this at NOTICE level
  RAISE NOTICE 'Business created_by set to: %', NEW.created_by;

  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 3: Recreate trigger (in case it was dropped)
-- =====================================================

DROP TRIGGER IF EXISTS trg_businesses_set_created_by ON public.businesses;

CREATE TRIGGER trg_businesses_set_created_by
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION businesses_set_created_by();

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  func_definition text;
BEGIN
  -- Get function definition
  SELECT pg_get_functiondef(oid) INTO func_definition
  FROM pg_proc
  WHERE proname = 'businesses_set_created_by';

  -- Check for illegal strings
  IF func_definition ILIKE '%import.meta%' THEN
    RAISE EXCEPTION 'Function still contains import.meta!';
  END IF;

  IF func_definition ILIKE '%import_meta%' THEN
    RAISE EXCEPTION 'Function still contains import_meta!';
  END IF;

  IF func_definition ILIKE '%env.dev%' THEN
    RAISE EXCEPTION 'Function still contains env.dev!';
  END IF;

  RAISE NOTICE '✅ Function cleaned successfully';
  RAISE NOTICE '✅ No import.meta references found';
  RAISE NOTICE '✅ Trigger recreated';
  RAISE NOTICE '✅ Ready for production';
END;
$$;