import { supabase } from './supabase';
import type {
  ReportFilters,
  ReportSummary,
  ReportTableData,
  ReportRow,
  SavedReport,
  CreateSavedReportRequest,
} from '@/types/reports';

export class ReportsService {
  static async getSummary(
    businessId: string,
    filters: ReportFilters
  ): Promise<ReportSummary> {
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses!inner(counts_as_delivered, counts_as_return)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    if (filters.country_id) {
      query = query.eq('country_id', filters.country_id);
    }
    if (filters.carrier_id) {
      query = query.eq('carrier_id', filters.carrier_id);
    }
    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }
    if (filters.status_id) {
      query = query.eq('status_id', filters.status_id);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    let filteredOrders = orders || [];

    if (filters.product_id) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', filters.product_id);

      const orderIdsWithProduct = new Set(orderItems?.map((i) => i.order_id) || []);
      filteredOrders = filteredOrders.filter((o) => orderIdsWithProduct.has(o.id));
    }

    const summary: ReportSummary = {
      total_orders: 0,
      delivered_orders: 0,
      return_orders: 0,
      delivery_rate: 0,
      gross_sales: 0,
      net_profit: 0,
      aov: 0,
    };

    filteredOrders.forEach((order: any) => {
      summary.total_orders++;
      summary.gross_sales += order.revenue || 0;

      summary.net_profit += order.profit || ((order.revenue || 0) - (order.cost || 0) - (order.shipping_cost || 0));

      if (order.status.counts_as_delivered) {
        summary.delivered_orders++;
      }
      if (order.status.counts_as_return) {
        summary.return_orders++;
      }
    });

    summary.delivery_rate =
      summary.total_orders > 0 ? (summary.delivered_orders / summary.total_orders) * 100 : 0;

    summary.aov = summary.delivered_orders > 0 ? summary.gross_sales / summary.delivered_orders : 0;

    return summary;
  }

  static async getTableData(
    businessId: string,
    filters: ReportFilters
  ): Promise<ReportTableData> {
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses!inner(counts_as_delivered, counts_as_return)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    if (filters.country_id) {
      query = query.eq('country_id', filters.country_id);
    }
    if (filters.carrier_id) {
      query = query.eq('carrier_id', filters.carrier_id);
    }
    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }
    if (filters.status_id) {
      query = query.eq('status_id', filters.status_id);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    let filteredOrders = orders || [];

    if (filters.product_id) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', filters.product_id);

      const orderIdsWithProduct = new Set(orderItems?.map((i) => i.order_id) || []);
      filteredOrders = filteredOrders.filter((o) => orderIdsWithProduct.has(o.id));
    }

    const grouped = this.groupOrders(filteredOrders, filters.group_by);

    return {
      rows: grouped,
    };
  }

  private static groupOrders(
    orders: any[],
    groupBy: 'day' | 'week' | 'month'
  ): ReportRow[] {
    const groups = new Map<string, ReportRow>();

    orders.forEach((order: any) => {
      const orderDate = new Date(order.order_date);
      let period = '';
      let periodLabel = '';
      let dateFrom = '';
      let dateTo = '';

      if (groupBy === 'day') {
        period = order.order_date.split('T')[0];
        periodLabel = new Date(period).toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        dateFrom = period;
        dateTo = period;
      } else if (groupBy === 'week') {
        const weekNum = this.getWeekNumber(orderDate);
        period = `${orderDate.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        periodLabel = `الأسبوع ${weekNum} - ${orderDate.getFullYear()}`;
        const weekStart = this.getDateOfWeek(weekNum, orderDate.getFullYear());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        dateFrom = weekStart.toISOString().split('T')[0];
        dateTo = weekEnd.toISOString().split('T')[0];
      } else {
        period = `${orderDate.getFullYear()}-${(orderDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        periodLabel = new Date(period + '-01').toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
        });
        dateFrom = period + '-01';
        const lastDay = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0).getDate();
        dateTo = `${period}-${lastDay.toString().padStart(2, '0')}`;
      }

      if (!groups.has(period)) {
        groups.set(period, {
          period,
          period_label: periodLabel,
          total_orders: 0,
          delivered_orders: 0,
          return_orders: 0,
          delivery_rate: 0,
          gross_sales: 0,
          net_profit: 0,
          aov: 0,
          date_from: dateFrom,
          date_to: dateTo,
        });
      }

      const row = groups.get(period)!;
      row.total_orders++;
      row.gross_sales += order.revenue || 0;

      row.net_profit += order.profit || ((order.revenue || 0) - (order.cost || 0) - (order.shipping_cost || 0));

      if (order.status.counts_as_delivered) {
        row.delivered_orders++;
      }
      if (order.status.counts_as_return) {
        row.return_orders++;
      }
    });

    const rows = Array.from(groups.values());

    rows.forEach((row) => {
      row.delivery_rate = row.total_orders > 0 ? (row.delivered_orders / row.total_orders) * 100 : 0;
      row.aov = row.delivered_orders > 0 ? row.gross_sales / row.delivered_orders : 0;
    });

    return rows.sort((a, b) => a.period.localeCompare(b.period));
  }

  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private static getDateOfWeek(week: number, year: number): Date {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const isoWeekStart = simple;
    if (dow <= 4) isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return isoWeekStart;
  }

  static async getSavedReports(businessId: string): Promise<SavedReport[]> {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  }

  static async createSavedReport(
    businessId: string,
    request: CreateSavedReportRequest
  ): Promise<SavedReport> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('saved_reports')
      .insert({
        business_id: businessId,
        name: request.name,
        group_by: request.group_by,
        filters_json: request.filters_json,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  static async deleteSavedReport(reportId: string): Promise<void> {
    const { error } = await supabase.from('saved_reports').delete().eq('id', reportId);

    if (error) throw error;
  }
}
