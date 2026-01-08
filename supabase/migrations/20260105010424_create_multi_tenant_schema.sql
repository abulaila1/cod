/*
  # Multi-Tenant Schema for Businesses (Workspaces)

  ## Overview
  This migration creates the complete multi-tenant infrastructure for codmeta SaaS platform.
  It enables workspace/business isolation with proper data segregation and access control.

  ## New Tables
  
  ### 1. `businesses` (Workspaces)
    - `id` (uuid, primary key) - Unique business identifier
    - `name` (text) - Business/workspace name
    - `slug` (text, unique) - URL-friendly identifier
    - `created_by` (uuid, FK to auth.users) - Creator user ID
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. `business_members` (Workspace Members)
    - `id` (uuid, primary key) - Unique membership identifier
    - `business_id` (uuid, FK) - Reference to business
    - `user_id` (uuid, FK to auth.users) - Reference to user
    - `role` (text) - Member role: admin, manager, agent, viewer
    - `status` (text) - Membership status: active, suspended
    - `created_at` (timestamptz) - Membership creation time
    - **Unique constraint**: (business_id, user_id)
  
  ### 3. `invitations` (Workspace Invitations)
    - `id` (uuid, primary key) - Unique invitation identifier
    - `business_id` (uuid, FK) - Reference to business
    - `email` (text) - Invited user email
    - `role` (text) - Invited role
    - `token` (text, unique) - Secure invitation token
    - `expires_at` (timestamptz) - Expiration timestamp
    - `accepted_at` (timestamptz, nullable) - Acceptance timestamp
    - `created_by` (uuid, FK to auth.users) - Inviter user ID
    - `created_at` (timestamptz) - Invitation creation time
  
  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies enforce business-level data isolation
  - Only authenticated users can access their businesses
  - Role-based access control for sensitive operations
  
  ## Indexes
  - business_members: (business_id, user_id) for quick membership lookup
  - invitations: (token) for invite acceptance
  - invitations: (business_id, email) for duplicate prevention
*/

-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create business_members table
CREATE TABLE IF NOT EXISTS business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'agent', 'viewer')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'agent', 'viewer')),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_business_user ON business_members(business_id, user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_business_email ON invitations(business_id, email);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Users can view businesses they are members of"
  ON businesses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Users can create businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Business admins can update their business"
  ON businesses FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- RLS Policies for business_members
CREATE POLICY "Members can view their business members"
  ON business_members FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "System can create memberships"
  ON business_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Business admins can update memberships"
  ON business_members FOR UPDATE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Business admins can delete memberships"
  ON business_members FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- RLS Policies for invitations
CREATE POLICY "Members can view their business invitations"
  ON invitations FOR SELECT
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Business admins can create invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

CREATE POLICY "Business admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (
    business_id IN (
      SELECT business_id FROM business_members 
      WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for businesses updated_at
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();