import { supabase } from './supabase';
import type { Invitation, CreateInvitationInput } from '@/types/business';

export class InvitationService {
  static generateToken(): string {
    return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }

  static async createInvitation(
    input: CreateInvitationInput,
    createdBy: string
  ): Promise<Invitation> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        business_id: input.business_id,
        email: input.email.toLowerCase(),
        role: input.role,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getBusinessInvitations(businessId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('business_id', businessId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getInvitationByToken(token: string): Promise<Invitation | null> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      throw new Error('دعوة غير موجودة');
    }

    if (invitation.accepted_at) {
      throw new Error('تم قبول هذه الدعوة مسبقاً');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('انتهت صلاحية هذه الدعوة');
    }

    const { data: existingMember } = await supabase
      .from('business_members')
      .select('id')
      .eq('business_id', invitation.business_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      throw new Error('أنت عضو بالفعل في هذا الوورك سبيس');
    }

    const { error: memberError } = await supabase
      .from('business_members')
      .insert({
        business_id: invitation.business_id,
        user_id: userId,
        role: invitation.role,
        status: 'active',
      });

    if (memberError) throw memberError;

    const { error: updateError } = await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('token', token);

    if (updateError) throw updateError;
  }

  static async deleteInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) throw error;
  }

  static getInviteUrl(token: string): string {
    return `${window.location.origin}/invite/${token}`;
  }
}
