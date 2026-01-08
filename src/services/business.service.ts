import { supabase } from './supabase';
import type { Business, ManualPaymentStatus } from '../types/business';

export interface AdminWorkspace extends Business {
  billing?: {
    status: string;
    plan: string;
    is_trial: boolean;
  } | null;
  owner_email?: string;
  total_orders?: number;
}

export interface AdminStats {
  total_workspaces: number;
  pending_payments: number;
  active_lifetime_deals: number;
  total_orders: number;
}

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

  static async getAllWorkspacesForAdmin(): Promise<AdminWorkspace[]> {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        billing:business_billing(status, plan, is_trial)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const workspaces: AdminWorkspace[] = (data || []).map((b: any) => ({
      ...b,
      billing: b.billing?.[0] || null,
    }));

    return workspaces;
  }

  static async getAdminStats(): Promise<AdminStats> {
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('id, manual_payment_status, is_lifetime_deal');

    if (bizError) throw bizError;

    const { count: ordersCount, error: ordersError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true });

    if (ordersError) throw ordersError;

    const stats: AdminStats = {
      total_workspaces: businesses?.length || 0,
      pending_payments: businesses?.filter(b => b.manual_payment_status === 'pending').length || 0,
      active_lifetime_deals: businesses?.filter(b => b.is_lifetime_deal).length || 0,
      total_orders: ordersCount || 0,
    };

    return stats;
  }

  static async approveLifetimeDeal(businessId: string): Promise<Business> {
    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .update({
        manual_payment_status: 'verified' as ManualPaymentStatus,
        is_lifetime_deal: true,
        plan_type: 'lifetime',
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (bizError) throw bizError;

    const { error: billingError } = await supabase
      .from('business_billing')
      .update({
        status: 'active',
        plan: 'lifetime',
        is_trial: false,
        trial_ends_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId);

    if (billingError) throw billingError;

    return bizData;
  }

  static async rejectPayment(businessId: string): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        manual_payment_status: 'rejected' as ManualPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWorkspaceLimit(businessId: string, maxOrdersLimit: number | null): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        max_orders_limit: maxOrdersLimit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async setPendingPayment(businessId: string): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        manual_payment_status: 'pending' as ManualPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
