import { supabase } from './supabase';
import type { Status, CreateStatusInput, UpdateStatusInput, StatusValidationResult } from '@/types/domain';

export class StatusService {
  static async getStatuses(businessId: string): Promise<Status[]> {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getSystemStatuses(businessId: string): Promise<Status[]> {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_system_default', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getCustomStatuses(businessId: string): Promise<Status[]> {
    const { data, error } = await supabase
      .from('statuses')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_system_default', false)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getStatusesByType(
    businessId: string,
    type: 'delivered' | 'returned' | 'active' | 'canceled'
  ): Promise<Status[]> {
    let query = supabase
      .from('statuses')
      .select('*')
      .eq('business_id', businessId);

    switch (type) {
      case 'delivered':
        query = query.eq('counts_as_delivered', true);
        break;
      case 'returned':
        query = query.eq('counts_as_return', true);
        break;
      case 'active':
        query = query.eq('counts_as_active', true);
        break;
      case 'canceled':
        query = query.eq('status_type', 'canceled');
        break;
    }

    const { data, error } = await query.order('sort_order', { ascending: true });

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
    const validation = await this.validateStatusBeforeCreate(businessId, input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const { data, error } = await supabase
      .from('statuses')
      .insert({
        business_id: businessId,
        key: input.key || null,
        name_ar: input.name_ar,
        name_en: input.name_en || null,
        color: input.color || '#64748b',
        is_default: input.is_default ?? false,
        display_order: input.display_order ?? 0,
        sort_order: input.sort_order ?? 0,
        counts_as_delivered: input.counts_as_delivered ?? false,
        counts_as_return: input.counts_as_return ?? false,
        counts_as_active: input.counts_as_active ?? true,
        is_final: input.is_final ?? false,
        is_system_default: input.is_system_default ?? false,
        status_type: input.status_type || null,
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
    const status = await this.getStatusById(statusId);
    if (!status) {
      throw new Error('الحالة غير موجودة');
    }

    const validation = await this.validateStatusBeforeUpdate(status, input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

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
    const validation = await this.canDeleteStatus(statusId);
    if (!validation.canDelete) {
      throw new Error(validation.reason || 'لا يمكن حذف هذه الحالة');
    }

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

  static async validateStatusBeforeCreate(
    businessId: string,
    input: CreateStatusInput
  ): Promise<StatusValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.name_ar || input.name_ar.trim() === '') {
      errors.push('يجب إدخال اسم الحالة بالعربية');
    }

    if (input.counts_as_delivered && input.counts_as_return) {
      errors.push('لا يمكن أن تكون الحالة "تسليم" و "مرتجع" في نفس الوقت');
    }

    if (input.counts_as_delivered && input.counts_as_active) {
      warnings.push('عادة ما تكون حالة التسليم نهائية وليست نشطة');
    }

    if (input.key) {
      const existing = await supabase
        .from('statuses')
        .select('id')
        .eq('business_id', businessId)
        .eq('key', input.key)
        .maybeSingle();

      if (existing.data) {
        errors.push('يوجد حالة أخرى بنفس المفتاح');
      }
    }

    return {
      isValid: errors.length === 0,
      canDelete: false,
      errors,
      warnings,
    };
  }

  static async validateStatusBeforeUpdate(
    currentStatus: Status,
    input: UpdateStatusInput
  ): Promise<StatusValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (currentStatus.is_system_default) {
      const logicalFieldsChanged =
        (input.counts_as_delivered !== undefined &&
          input.counts_as_delivered !== currentStatus.counts_as_delivered) ||
        (input.counts_as_return !== undefined &&
          input.counts_as_return !== currentStatus.counts_as_return) ||
        (input.counts_as_active !== undefined &&
          input.counts_as_active !== currentStatus.counts_as_active) ||
        (input.is_final !== undefined && input.is_final !== currentStatus.is_final) ||
        (input.status_type !== undefined && input.status_type !== currentStatus.status_type);

      if (logicalFieldsChanged) {
        errors.push('لا يمكن تغيير خصائص الحالات الافتراضية. يمكنك فقط تغيير الاسم واللون');
      }
    }

    if (input.name_ar !== undefined && input.name_ar.trim() === '') {
      errors.push('يجب إدخال اسم الحالة بالعربية');
    }

    const newCountsAsDelivered = input.counts_as_delivered ?? currentStatus.counts_as_delivered;
    const newCountsAsReturn = input.counts_as_return ?? currentStatus.counts_as_return;

    if (newCountsAsDelivered && newCountsAsReturn) {
      errors.push('لا يمكن أن تكون الحالة "تسليم" و "مرتجع" في نفس الوقت');
    }

    return {
      isValid: errors.length === 0,
      canDelete: false,
      errors,
      warnings,
    };
  }

  static async canDeleteStatus(statusId: string): Promise<StatusValidationResult> {
    const { data, error } = await supabase.rpc('can_delete_status', {
      p_status_id: statusId,
    });

    if (error) {
      return {
        isValid: false,
        canDelete: false,
        errors: ['حدث خطأ أثناء التحقق من إمكانية الحذف'],
        warnings: [],
        reason: error.message,
      };
    }

    return {
      isValid: data?.can_delete ?? false,
      canDelete: data?.can_delete ?? false,
      errors: data?.can_delete ? [] : [data?.reason || 'لا يمكن حذف هذه الحالة'],
      warnings: [],
      reason: data?.reason,
    };
  }

  static async repairMissingStatuses(businessId: string): Promise<void> {
    const { error } = await supabase.rpc('ensure_default_statuses', {
      p_business_id: businessId,
    });

    if (error) {
      console.error('Failed to repair missing statuses:', error);
      throw error;
    }
  }
}
