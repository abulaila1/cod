import { supabase } from './supabase';
import type {
  ReportFilters,
  AdvancedReportSummary,
  ProductPerformance,
  CustomerPerformance,
  CarrierPerformance,
  CityPerformance,
  EmployeePerformance,
  CODReport,
  StatusBreakdown,
  TimeAnalysis,
  CancellationReason,
  ReturnReason,
  FinancialBreakdown,
} from '@/types/reports';

export class AdvancedReportsService {
  static async getAdvancedSummary(
    businessId: string,
    filters: ReportFilters
  ): Promise<AdvancedReportSummary> {
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses!inner(counts_as_delivered, counts_as_return, counts_as_active, is_final),
        customer:customers(id)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    if (filters.country_id) query = query.eq('country_id', filters.country_id);
    if (filters.carrier_id) query = query.eq('carrier_id', filters.carrier_id);
    if (filters.employee_id) query = query.eq('employee_id', filters.employee_id);
    if (filters.status_id) query = query.eq('status_id', filters.status_id);
    if (filters.city_id) query = query.eq('city_id', filters.city_id);
    if (filters.collection_status) query = query.eq('collection_status', filters.collection_status);

    const { data: orders, error } = await query;
    if (error) throw error;

    const summary: AdvancedReportSummary = {
      total_orders: 0,
      delivered_orders: 0,
      return_orders: 0,
      pending_orders: 0,
      active_orders: 0,
      late_orders: 0,
      delivery_rate: 0,
      gross_sales: 0,
      net_profit: 0,
      net_profit_before_ads: 0,
      aov: 0,
      total_cost: 0,
      total_cogs: 0,
      total_shipping: 0,
      total_ad_cost: 0,
      total_cod_fees: 0,
      profit_margin: 0,
      average_order_cost: 0,
      cost_to_revenue_ratio: 0,
      new_customers: 0,
      repeat_customers: 0,
      average_delivery_time: 0,
      first_attempt_success_rate: 0,
      cod_collected: 0,
      cod_pending: 0,
      collection_rate: 0,
    };

    const customerIds = new Set();
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    (orders || []).forEach((order: any) => {
      summary.total_orders++;
      summary.gross_sales += order.revenue || 0;
      summary.total_cogs += order.cogs || 0;
      summary.total_shipping += order.shipping_cost || 0;
      summary.total_ad_cost += order.ad_cost || 0;
      summary.total_cod_fees += order.cod_fees || 0;

      if (order.status?.counts_as_delivered) {
        summary.delivered_orders++;
      }
      if (order.status?.counts_as_return) {
        summary.return_orders++;
      }
      if (order.status?.counts_as_active) {
        summary.active_orders++;
      }
      if (!order.status?.is_final) {
        summary.pending_orders++;
      }

      if (new Date(order.created_at) < fiveDaysAgo && !order.status?.is_final && !order.status?.counts_as_delivered) {
        summary.late_orders++;
      }

      if (order.customer?.id) {
        customerIds.add(order.customer.id);
      }

      if (order.collection_status === 'collected') {
        summary.cod_collected += order.collected_amount || order.revenue || 0;
      } else if (order.collection_status === 'pending') {
        summary.cod_pending += order.revenue || 0;
      }
    });

    summary.total_cost = summary.total_cogs + summary.total_shipping + summary.total_cod_fees;
    summary.net_profit_before_ads = summary.gross_sales - summary.total_cost;
    summary.net_profit = summary.net_profit_before_ads - summary.total_ad_cost;
    summary.delivery_rate = summary.total_orders > 0 ? (summary.delivered_orders / summary.total_orders) * 100 : 0;
    summary.aov = summary.delivered_orders > 0 ? summary.gross_sales / summary.delivered_orders : 0;
    summary.profit_margin = summary.gross_sales > 0 ? (summary.net_profit / summary.gross_sales) * 100 : 0;
    summary.average_order_cost = summary.total_orders > 0 ? summary.total_cost / summary.total_orders : 0;
    summary.cost_to_revenue_ratio = summary.gross_sales > 0 ? (summary.total_cost / summary.gross_sales) * 100 : 0;
    summary.collection_rate = (summary.cod_collected + summary.cod_pending) > 0
      ? (summary.cod_collected / (summary.cod_collected + summary.cod_pending)) * 100
      : 0;

    if (customerIds.size > 0) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, total_orders')
        .in('id', Array.from(customerIds))
        .eq('business_id', businessId);

      customers?.forEach((customer: any) => {
        if (customer.total_orders === 1) {
          summary.new_customers++;
        } else {
          summary.repeat_customers++;
        }
      });
    }

    return summary;
  }

  static async getProductsPerformance(
    businessId: string,
    filters: ReportFilters
  ): Promise<ProductPerformance[]> {
    let query = supabase
      .from('order_items')
      .select(
        `
        *,
        order:orders!inner(
          business_id,
          order_date,
          revenue,
          status:statuses(counts_as_delivered, counts_as_return)
        ),
        product:products!inner(name_ar, category:product_categories(name_ar))
      `
      )
      .eq('order.business_id', businessId)
      .gte('order.order_date', filters.date_from)
      .lte('order.order_date', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;

    const productMap = new Map<string, ProductPerformance>();

    (data || []).forEach((item: any) => {
      const product_id = item.product_id;
      const product_name = item.product?.name_ar || 'غير معروف';
      const category_name = item.product?.category?.name_ar;

      if (!productMap.has(product_id)) {
        productMap.set(product_id, {
          id: product_id,
          name: product_name,
          category_name,
          total_orders: 0,
          delivered_orders: 0,
          returned_orders: 0,
          revenue: 0,
          profit: 0,
          delivery_rate: 0,
          return_rate: 0,
          profit_margin: 0,
          avg_price: 0,
          avg_cost: 0,
        });
      }

      const perf = productMap.get(product_id)!;
      perf.total_orders += item.qty || 1;
      perf.revenue += item.item_price * (item.qty || 1);
      perf.profit += (item.item_price - item.item_cogs) * (item.qty || 1);

      if (item.order?.status?.counts_as_delivered) {
        perf.delivered_orders += item.qty || 1;
      }
      if (item.order?.status?.counts_as_return) {
        perf.returned_orders += item.qty || 1;
      }
    });

    const result = Array.from(productMap.values()).map((perf) => {
      perf.delivery_rate = perf.total_orders > 0 ? (perf.delivered_orders / perf.total_orders) * 100 : 0;
      perf.return_rate = perf.total_orders > 0 ? (perf.returned_orders / perf.total_orders) * 100 : 0;
      perf.profit_margin = perf.revenue > 0 ? (perf.profit / perf.revenue) * 100 : 0;
      perf.avg_price = perf.total_orders > 0 ? perf.revenue / perf.total_orders : 0;
      perf.avg_cost = perf.total_orders > 0 ? (perf.revenue - perf.profit) / perf.total_orders : 0;
      return perf;
    });

    return result.sort((a, b) => b.revenue - a.revenue);
  }

  static async getCustomersPerformance(
    businessId: string,
    filters: ReportFilters
  ): Promise<CustomerPerformance[]> {
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        customer:customers!inner(id, name, phone),
        city:cities(name_ar),
        status:statuses(counts_as_delivered)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to)
      .not('customer_id', 'is', null);

    const { data, error } = await query;
    if (error) throw error;

    const customerMap = new Map<string, CustomerPerformance>();

    (data || []).forEach((order: any) => {
      const customer_id = order.customer?.id;
      if (!customer_id) return;

      if (!customerMap.has(customer_id)) {
        customerMap.set(customer_id, {
          id: customer_id,
          name: order.customer?.name || 'غير معروف',
          phone: order.customer?.phone,
          city_name: order.city?.name_ar,
          total_orders: 0,
          total_revenue: 0,
          lifetime_value: 0,
          avg_order_value: 0,
          delivery_success_rate: 0,
          last_order_date: order.order_date,
          first_order_date: order.order_date,
          is_repeat: false,
        });
      }

      const perf = customerMap.get(customer_id)!;
      perf.total_orders++;
      perf.total_revenue += order.revenue || 0;

      if (order.order_date > perf.last_order_date) {
        perf.last_order_date = order.order_date;
      }
      if (order.order_date < perf.first_order_date) {
        perf.first_order_date = order.order_date;
      }
    });

    const { data: allCustomers } = await supabase
      .from('customers')
      .select('id, total_orders')
      .in('id', Array.from(customerMap.keys()))
      .eq('business_id', businessId);

    const result = Array.from(customerMap.values()).map((perf) => {
      perf.avg_order_value = perf.total_orders > 0 ? perf.total_revenue / perf.total_orders : 0;
      perf.lifetime_value = perf.total_revenue;

      const customerData = allCustomers?.find((c: any) => c.id === perf.id);
      perf.is_repeat = (customerData?.total_orders || 0) > 1;

      return perf;
    });

    return result.sort((a, b) => b.lifetime_value - a.lifetime_value);
  }

  static async getCarriersPerformance(
    businessId: string,
    filters: ReportFilters
  ): Promise<CarrierPerformance[]> {
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        carrier:carriers!inner(id, name_ar),
        status:statuses(counts_as_delivered, counts_as_return)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to)
      .not('carrier_id', 'is', null);

    const { data, error } = await query;
    if (error) throw error;

    const carrierMap = new Map<string, CarrierPerformance>();

    (data || []).forEach((order: any) => {
      const carrier_id = order.carrier?.id;
      if (!carrier_id) return;

      if (!carrierMap.has(carrier_id)) {
        carrierMap.set(carrier_id, {
          id: carrier_id,
          name: order.carrier?.name_ar || 'غير معروف',
          total_orders: 0,
          delivered_orders: 0,
          returned_orders: 0,
          delivery_rate: 0,
          return_rate: 0,
          avg_delivery_time: 0,
          total_shipping_cost: 0,
          avg_shipping_cost: 0,
        });
      }

      const perf = carrierMap.get(carrier_id)!;
      perf.total_orders++;
      perf.total_shipping_cost += order.shipping_cost || 0;

      if (order.status?.counts_as_delivered) {
        perf.delivered_orders++;
      }
      if (order.status?.counts_as_return) {
        perf.returned_orders++;
      }
    });

    const result = Array.from(carrierMap.values()).map((perf) => {
      perf.delivery_rate = perf.total_orders > 0 ? (perf.delivered_orders / perf.total_orders) * 100 : 0;
      perf.return_rate = perf.total_orders > 0 ? (perf.returned_orders / perf.total_orders) * 100 : 0;
      perf.avg_shipping_cost = perf.total_orders > 0 ? perf.total_shipping_cost / perf.total_orders : 0;
      return perf;
    });

    return result.sort((a, b) => b.total_orders - a.total_orders);
  }

  static async getCitiesPerformance(
    businessId: string,
    filters: ReportFilters
  ): Promise<CityPerformance[]> {
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        city:cities!inner(id, name_ar, country:countries(name_ar)),
        status:statuses(counts_as_delivered)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to)
      .not('city_id', 'is', null);

    const { data, error } = await query;
    if (error) throw error;

    const cityMap = new Map<string, CityPerformance>();

    (data || []).forEach((order: any) => {
      const city_id = order.city?.id;
      if (!city_id) return;

      if (!cityMap.has(city_id)) {
        cityMap.set(city_id, {
          id: city_id,
          name: order.city?.name_ar || 'غير معروف',
          country_name: order.city?.country?.name_ar || '',
          total_orders: 0,
          delivered_orders: 0,
          delivery_rate: 0,
          revenue: 0,
          avg_shipping_cost: 0,
        });
      }

      const perf = cityMap.get(city_id)!;
      perf.total_orders++;
      perf.revenue += order.revenue || 0;

      if (order.status?.counts_as_delivered) {
        perf.delivered_orders++;
      }
    });

    const result = Array.from(cityMap.values()).map((perf) => {
      perf.delivery_rate = perf.total_orders > 0 ? (perf.delivered_orders / perf.total_orders) * 100 : 0;
      return perf;
    });

    return result.sort((a, b) => b.total_orders - a.total_orders);
  }

  static async getEmployeesPerformance(
    businessId: string,
    filters: ReportFilters
  ): Promise<EmployeePerformance[]> {
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        employee:employees!inner(id, name_ar),
        status:statuses(counts_as_delivered, is_final)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to)
      .not('employee_id', 'is', null);

    const { data, error } = await query;
    if (error) throw error;

    const employeeMap = new Map<string, EmployeePerformance>();
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    (data || []).forEach((order: any) => {
      const employee_id = order.employee?.id;
      if (!employee_id) return;

      if (!employeeMap.has(employee_id)) {
        employeeMap.set(employee_id, {
          id: employee_id,
          name: order.employee?.name_ar || 'غير معروف',
          total_orders: 0,
          confirmed_orders: 0,
          delivered_orders: 0,
          confirmation_rate: 0,
          delivery_rate: 0,
          revenue: 0,
          avg_order_value: 0,
          pending_orders: 0,
          late_orders: 0,
          productivity: 0,
        });
      }

      const perf = employeeMap.get(employee_id)!;
      perf.total_orders++;
      perf.revenue += order.revenue || 0;

      if (order.confirmed_at) {
        perf.confirmed_orders++;
      }
      if (order.status?.counts_as_delivered) {
        perf.delivered_orders++;
      }
      if (!order.status?.is_final) {
        perf.pending_orders++;
      }
      if (new Date(order.created_at) < fiveDaysAgo && !order.status?.is_final) {
        perf.late_orders++;
      }
    });

    const result = Array.from(employeeMap.values()).map((perf) => {
      perf.confirmation_rate = perf.total_orders > 0 ? (perf.confirmed_orders / perf.total_orders) * 100 : 0;
      perf.delivery_rate = perf.total_orders > 0 ? (perf.delivered_orders / perf.total_orders) * 100 : 0;
      perf.avg_order_value = perf.total_orders > 0 ? perf.revenue / perf.total_orders : 0;
      perf.productivity = perf.total_orders;
      return perf;
    });

    return result.sort((a, b) => b.productivity - a.productivity);
  }

  static async getCODReport(
    businessId: string,
    filters: ReportFilters
  ): Promise<CODReport> {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;

    const report: CODReport = {
      total_pending: 0,
      total_collected: 0,
      total_partial: 0,
      total_failed: 0,
      collection_rate: 0,
      avg_collection_time: 0,
      pending_value: 0,
      collected_value: 0,
      cod_fees: 0,
    };

    (data || []).forEach((order: any) => {
      report.cod_fees += order.cod_fees || 0;

      if (order.collection_status === 'pending') {
        report.total_pending++;
        report.pending_value += order.revenue || 0;
      } else if (order.collection_status === 'collected') {
        report.total_collected++;
        report.collected_value += order.collected_amount || order.revenue || 0;
      } else if (order.collection_status === 'partial') {
        report.total_partial++;
        report.collected_value += order.collected_amount || 0;
        report.pending_value += (order.revenue || 0) - (order.collected_amount || 0);
      } else if (order.collection_status === 'failed') {
        report.total_failed++;
      }
    });

    const total = report.total_pending + report.total_collected + report.total_partial + report.total_failed;
    report.collection_rate = total > 0 ? (report.total_collected / total) * 100 : 0;

    return report;
  }

  static async getStatusBreakdown(
    businessId: string,
    filters: ReportFilters
  ): Promise<StatusBreakdown[]> {
    let query = supabase
      .from('orders')
      .select(
        `
        revenue,
        status:statuses!inner(id, label_ar, color)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;

    const statusMap = new Map<string, StatusBreakdown>();
    let totalOrders = 0;

    (data || []).forEach((order: any) => {
      totalOrders++;
      const status_id = order.status?.id;
      if (!status_id) return;

      if (!statusMap.has(status_id)) {
        statusMap.set(status_id, {
          status_id,
          status_name: order.status?.label_ar || 'غير معروف',
          status_color: order.status?.color || '#gray',
          count: 0,
          percentage: 0,
          revenue: 0,
        });
      }

      const breakdown = statusMap.get(status_id)!;
      breakdown.count++;
      breakdown.revenue += order.revenue || 0;
    });

    const result = Array.from(statusMap.values()).map((breakdown) => {
      breakdown.percentage = totalOrders > 0 ? (breakdown.count / totalOrders) * 100 : 0;
      return breakdown;
    });

    return result.sort((a, b) => b.count - a.count);
  }

  static async getFinancialBreakdown(
    businessId: string,
    filters: ReportFilters
  ): Promise<FinancialBreakdown> {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    const { data, error } = await query;
    if (error) throw error;

    const breakdown: FinancialBreakdown = {
      revenue: 0,
      cogs: 0,
      shipping_cost: 0,
      ad_cost: 0,
      cod_fees: 0,
      gross_profit: 0,
      net_profit: 0,
      profit_margin: 0,
      roas: 0,
    };

    (data || []).forEach((order: any) => {
      breakdown.revenue += order.revenue || 0;
      breakdown.cogs += order.cogs || 0;
      breakdown.shipping_cost += order.shipping_cost || 0;
      breakdown.ad_cost += order.ad_cost || 0;
      breakdown.cod_fees += order.cod_fees || 0;
    });

    breakdown.gross_profit = breakdown.revenue - breakdown.cogs;
    breakdown.net_profit = breakdown.gross_profit - breakdown.shipping_cost - breakdown.cod_fees - breakdown.ad_cost;
    breakdown.profit_margin = breakdown.revenue > 0 ? (breakdown.net_profit / breakdown.revenue) * 100 : 0;
    breakdown.roas = breakdown.ad_cost > 0 ? breakdown.revenue / breakdown.ad_cost : 0;

    return breakdown;
  }
}
