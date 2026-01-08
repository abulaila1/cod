/*
  # Add settings column to businesses table

  ## Summary
  The Onboarding page is attempting to store currency and country preferences
  in a `settings` JSONB column, but this column is missing from the businesses table.
  
  ## Changes
  1. Add `settings` column to businesses table
     - Type: JSONB (allows flexible storage of configuration)
     - Default: Empty object `{}`
     - Nullable: Yes (for backward compatibility)
  
  2. Expected settings structure:
     ```json
     {
       "currency": "USD",
       "country": "SA"
     }
     ```
  
  ## Impact
  - Fixes: "Could not find the 'settings' column" error in Onboarding
  - Allows workspace creation to complete successfully
  - Enables storage of business-specific preferences
*/

-- Add settings column to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN businesses.settings IS 'Business configuration settings (currency, country, etc.)';
