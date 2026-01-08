/*
  # Remove Loose INSERT Policy on Businesses Table

  1. Security Hardening
    - Drops the permissive INSERT policy "Authenticated users can create businesses"
    - Workspace creation is now handled exclusively via `create_workspace_v2` RPC function
    - This ensures proper validation and atomic operations through the secure RPC endpoint
  
  2. Changes
    - Remove direct INSERT permission from authenticated users
    - All workspace creation must go through the RPC function which is SECURITY DEFINER
  
  3. Impact
    - Eliminates the RLS security warning about unrestricted access
    - Enforces stricter security by preventing direct table inserts
    - Maintains functionality through the secure RPC function
*/

-- Drop the loose INSERT policy that allows direct inserts
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON public.businesses;
