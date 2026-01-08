import { supabase } from './supabase';

export interface AuditLogInput {
  business_id: string;
  entity_type: 'products' | 'countries' | 'carriers' | 'employees' | 'statuses' | 'orders' | 'business';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'toggle_active' | 'import' | 'status_change' | 'lock' | 'unlock';
  changes?: any;
}

export class AuditService {
  static async log(input: AuditLogInput): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('audit_logs').insert({
      business_id: input.business_id,
      user_id: userData.user?.id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      changes: input.changes || null,
    });

    if (error) {
      console.error('Failed to log audit:', error);
    }
  }
}
