import { supabase } from './supabase';
import { BillingService } from './billing.service';

export interface UsageStatus {
  current_month_count: number;
  limit: number | null;
  remaining: number | null;
  percent_used: number;
  is_exceeded: boolean;
  month_label: string;
}

export class UsageService {
  static async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking super admin status:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Error checking super admin status:', err);
      return false;
    }
  }

  static async getBusinessOwnerId(businessId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('created_by')
        .eq('id', businessId)
        .maybeSingle();

      if (error || !data) {
        console.error('Error getting business owner:', error);
        return null;
      }

      return data.created_by;
    } catch (err) {
      console.error('Error getting business owner:', err);
      return null;
    }
  }
  static async getMonthlyOrdersCount(
    businessId: string,
    yearMonth?: string
  ): Promise<number> {
    const now = new Date();
    const year = yearMonth ? parseInt(yearMonth.split('-')[0]) : now.getFullYear();
    const month = yearMonth ? parseInt(yearMonth.split('-')[1]) : now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('order_date', startDate.toISOString())
      .lte('order_date', endDate.toISOString());

    if (error) throw error;

    return count || 0;
  }

  static async getUsageStatus(businessId: string): Promise<UsageStatus> {
    const now = new Date();
    const monthNames = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];

    const month_label = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const ownerId = await this.getBusinessOwnerId(businessId);
    const isSuperAdmin = ownerId ? await this.isSuperAdmin(ownerId) : false;

    let limit: number | null = null;

    if (!isSuperAdmin) {
      const billing = await BillingService.getBilling(businessId);
      limit = billing?.monthly_order_limit || null;
    }

    const current_month_count = await this.getMonthlyOrdersCount(businessId);

    const remaining = limit !== null ? Math.max(0, limit - current_month_count) : null;
    const percent_used = limit !== null ? Math.min(100, (current_month_count / limit) * 100) : 0;
    const is_exceeded = limit !== null ? current_month_count >= limit : false;

    return {
      current_month_count,
      limit,
      remaining,
      percent_used,
      is_exceeded,
      month_label,
    };
  }

  static async checkCanAddOrders(
    businessId: string,
    ordersToAdd: number
  ): Promise<{ allowed: boolean; message?: string }> {
    const ownerId = await this.getBusinessOwnerId(businessId);
    const isSuperAdmin = ownerId ? await this.isSuperAdmin(ownerId) : false;

    if (isSuperAdmin) {
      return { allowed: true };
    }

    const usage = await this.getUsageStatus(businessId);

    if (usage.limit === null) {
      return { allowed: true };
    }

    const futureCount = usage.current_month_count + ordersToAdd;

    if (futureCount > usage.limit) {
      return {
        allowed: false,
        message: 'لقد تجاوزت الحد الشهري لعدد الطلبات في خطتك الحالية. قم بالترقية لإضافة المزيد.',
      };
    }

    return { allowed: true };
  }
}
