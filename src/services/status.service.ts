import { supabase } from './supabase';
import type { Status, CreateStatusInput, UpdateStatusInput } from '@/types/domain';

export class StatusService {
  static async getStatuses(businessId: string): Promise<Status[]> {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true });

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
        key: input.key,
        label_ar: input.label_ar,
        sort_order: input.sort_order ?? 0,
        is_final: input.is_final ?? false,
        counts_as_delivered: input.counts_as_delivered ?? false,
        counts_as_return: input.counts_as_return ?? false,
        counts_as_active: input.counts_as_active ?? true,
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
      sort_order: index + 1,
    }));

    for (const update of updates) {
      await supabase
        .from('statuses')
        .update({ sort_order: update.sort_order })
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
