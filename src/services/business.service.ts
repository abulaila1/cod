import { supabase } from './supabase';
import type { Business } from '@/types/business';

export class BusinessService {
  static async getUserBusinesses(userId: string): Promise<Business[]> {
    const { data: memberships, error: membershipsError } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (membershipsError) throw membershipsError;

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const businessIds = memberships.map((m: { business_id: string }) => m.business_id);

    const { data, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        slug,
        created_by,
        created_at,
        updated_at
      `)
      .in('id', businessIds);

    if (error) throw error;
    return data || [];
  }

  static async getBusinessById(businessId: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async updateBusiness(businessId: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', businessId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteBusiness(businessId: string): Promise<void> {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId);

    if (error) throw error;
  }
}
