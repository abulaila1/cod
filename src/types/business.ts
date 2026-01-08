export type MemberRole = 'admin' | 'manager' | 'agent' | 'viewer';
export type MemberStatus = 'active' | 'suspended';

export interface Business {
  id: string;
  name: string;
  slug: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface Invitation {
  id: string;
  business_id: string;
  email: string;
  role: MemberRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CreateBusinessInput {
  name: string;
  slug?: string;
}

export interface CreateInvitationInput {
  business_id: string;
  email: string;
  role: MemberRole;
}

export interface UpdateMemberRoleInput {
  member_id: string;
  role: MemberRole;
}
