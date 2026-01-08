import { supabase } from './supabase';
import type { Status, CreateStatusInput, UpdateStatusInput } from '@/types/domain';

export class StatusService {
  static async getStatuses(businessId: string): Promise<Status[]> {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('business_id', businessId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getStatusById(statusId: string): Promise<Status | null> {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('id', statusId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createStatus(
    businessId: string,
    input: CreateStatusInput
  ): Promise<Status> {
    const { data, error } = await supabase
      .from('statuses')
      .insert({
        business_id: businessId,
        name_ar: input.name_ar,
        name_en: input.name_en || null,
        color: input.color || '#6B7280',
        is_default: input.is_default ?? false,
        display_order: input.display_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateStatus(
    statusId: string,
    input: UpdateStatusInput
  ): Promise<Status> {
    const { data, error } = await supabase
      .from('statuses')
      .update(input)
      .eq('id', statusId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteStatus(statusId: string): Promise<void> {
    const { error } = await supabase
      .from('statuses')
      .delete()
      .eq('id', statusId);

    if (error) throw error;
  }

  static async reorderStatuses(
    businessId: string,
    statusIds: string[]
  ): Promise<void> {
    const updates = statusIds.map((id, index) => ({
      id,
      display_order: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('statuses')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
        .eq('business_id', businessId);
    }
  }

  static async logStatusChange(
    businessId: string,
    userId: string,
    statusId: string,
    action: string,
    before: any,
    after: any
  ): Promise<void> {
    await supabase.from('audit_logs').insert({
      business_id: businessId,
      user_id: userId,
      entity_type: 'statuses',
      entity_id: statusId,
      action,
      before,
      after,
    });
  }
}
