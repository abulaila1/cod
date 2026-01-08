import { supabase } from './supabase';
import type { BusinessMember, MemberRole, UpdateMemberRoleInput } from '@/types/business';

export class MembershipService {
  static async addMember(
    businessId: string,
    userId: string,
    role: MemberRole
  ): Promise<BusinessMember> {
    const { data, error } = await supabase
      .from('business_members')
      .insert({
        business_id: businessId,
        user_id: userId,
        role,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getBusinessMembers(businessId: string): Promise<BusinessMember[]> {
    const { data, error } = await supabase
      .from('business_members')
      .select(`
        id,
        business_id,
        user_id,
        role,
        status,
        created_at
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const membersWithUserInfo = await Promise.all(
      (data || []).map(async (member) => {
        const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
        return {
          ...member,
          user_email: userData?.user?.email || member.user_id,
          user_name: userData?.user?.user_metadata?.name || 'مستخدم',
        };
      })
    );

    return membersWithUserInfo;
  }

  static async getUserMembership(
    businessId: string,
    userId: string
  ): Promise<BusinessMember | null> {
    const { data, error } = await supabase
      .from('business_members')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async updateMemberRole(input: UpdateMemberRoleInput): Promise<BusinessMember> {
    const { data, error } = await supabase
      .from('business_members')
      .update({ role: input.role })
      .eq('id', input.member_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  static async isAdmin(businessId: string, userId: string): Promise<boolean> {
    const member = await this.getUserMembership(businessId, userId);
    return member?.role === 'admin';
  }
}
