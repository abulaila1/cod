/*
  # Add Free Plan to Billing System

  1. Changes
    - Updates the plan check constraint on business_billing to include 'free' plan
    - Also adds 'elite' and 'enterprise' plans for future use
    - Sets default plan to 'free' instead of 'starter'
    - Updates monthly_order_limit default to 50 for free plan

  2. Notes
    - Existing 'starter' plans remain unchanged
    - New businesses will default to 'free' plan
*/

ALTER TABLE business_billing
DROP CONSTRAINT IF EXISTS business_billing_plan_check;

ALTER TABLE business_billing
ADD CONSTRAINT business_billing_plan_check
CHECK (plan = ANY (ARRAY['free'::text, 'starter'::text, 'growth'::text, 'pro'::text, 'elite'::text, 'enterprise'::text]));

ALTER TABLE business_billing
ALTER COLUMN plan SET DEFAULT 'free'::text;

ALTER TABLE business_billing
ALTER COLUMN monthly_order_limit SET DEFAULT 50;