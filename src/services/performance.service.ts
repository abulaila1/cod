import { supabase } from './supabase';
import type { PerformanceBreakdown, ProductPerformance, PerformanceFilters } from '@/types/performance';

export class PerformanceService {
  static async getCountryBreakdown(
    businessId: string,
    filters: PerformanceFilters
  ): Promise<PerformanceBreakdown[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses!inner(counts_as_delivered, counts_as_return),
        country:countries!inner(id, name_ar)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    if (error) throw error;

    const breakdown = new Map<string, PerformanceBreakdown>();

    orders?.forEach((order: any) => {
      if (!order.country) return;

      const countryId = order.country.id;
      const countryName = order.country.name_ar;

      if (!breakdown.has(countryId)) {
        breakdown.set(countryId, {
          id: countryId,
          name: countryName,
          total_orders: 0,
          delivered_orders: 0,
          return_orders: 0,
          delivery_rate: 0,
          gross_sales: 0,
          net_profit: 0,
        });
      }

      const item = breakdown.get(countryId)!;
      item.total_orders++;
      item.gross_sales += order.revenue || 0;
      item.net_profit += order.profit || ((order.revenue || 0) - (order.cost || 0) - (order.shipping_cost || 0));

      if (order.status?.counts_as_delivered) {
        item.delivered_orders++;
      }
      if (order.status?.counts_as_return) {
        item.return_orders++;
      }
    });

    const result = Array.from(breakdown.values());
    result.forEach((item) => {
      item.delivery_rate = item.total_orders > 0 ? (item.delivered_orders / item.total_orders) * 100 : 0;
    });

    return result.sort((a, b) => b.net_profit - a.net_profit);
  }

  static async getCarrierBreakdown(
    businessId: string,
    filters: PerformanceFilters
  ): Promise<PerformanceBreakdown[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses!inner(counts_as_delivered, counts_as_return),
        carrier:carriers!inner(id, name_ar)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    if (error) throw error;

    const breakdown = new Map<string, PerformanceBreakdown>();

    orders?.forEach((order: any) => {
      if (!order.carrier) return;

      const carrierId = order.carrier.id;
      const carrierName = order.carrier.name_ar;

      if (!breakdown.has(carrierId)) {
        breakdown.set(carrierId, {
          id: carrierId,
          name: carrierName,
          total_orders: 0,
          delivered_orders: 0,
          return_orders: 0,
          delivery_rate: 0,
          gross_sales: 0,
          net_profit: 0,
        });
      }

      const item = breakdown.get(carrierId)!;
      item.total_orders++;
      item.gross_sales += order.revenue || 0;
      item.net_profit += order.profit || ((order.revenue || 0) - (order.cost || 0) - (order.shipping_cost || 0));

      if (order.status?.counts_as_delivered) {
        item.delivered_orders++;
      }
      if (order.status?.counts_as_return) {
        item.return_orders++;
      }
    });

    const result = Array.from(breakdown.values());
    result.forEach((item) => {
      item.delivery_rate = item.total_orders > 0 ? (item.delivered_orders / item.total_orders) * 100 : 0;
    });

    return result.sort((a, b) => b.delivery_rate - a.delivery_rate);
  }

  static async getEmployeeBreakdown(
    businessId: string,
    filters: PerformanceFilters
  ): Promise<PerformanceBreakdown[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses!inner(counts_as_delivered, counts_as_return),
        employee:employees!inner(id, name_ar)
      `
      )
      .eq('business_id', businessId)
      .gte('order_date', filters.date_from)
      .lte('order_date', filters.date_to);

    if (error) throw error;

    const breakdown = new Map<string, PerformanceBreakdown>();

    orders?.forEach((order: any) => {
      if (!order.employee) return;

      const employeeId = order.employee.id;
      const employeeName = order.employee.name_ar;

      if (!breakdown.has(employeeId)) {
        breakdown.set(employeeId, {
          id: employeeId,
          name: employeeName,
          total_orders: 0,
          delivered_orders: 0,
          return_orders: 0,
          delivery_rate: 0,
          gross_sales: 0,
          net_profit: 0,
        });
      }

      const item = breakdown.get(employeeId)!;
      item.total_orders++;
      item.gross_sales += order.revenue || 0;
      item.net_profit += order.profit || ((order.revenue || 0) - (order.cost || 0) - (order.shipping_cost || 0));

      if (order.status?.counts_as_delivered) {
        item.delivered_orders++;
      }
      if (order.status?.counts_as_return) {
        item.return_orders++;
      }
    });

    const result = Array.from(breakdown.values());
    result.forEach((item) => {
      item.delivery_rate = item.total_orders > 0 ? (item.delivered_orders / item.total_orders) * 100 : 0;
    });

    return result.sort((a, b) => b.total_orders - a.total_orders);
  }

  static async getProductBreakdown(
    businessId: string,
    filters: PerformanceFilters
  ): Promise<ProductPerformance[]> {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(
        `
        *,
        order:orders!inner(
          business_id,
          order_date,
          status_id,
          status:statuses!inner(counts_as_delivered, counts_as_return)
        ),
        product:products!inner(id, name_ar)
      `
      )
      .eq('order.business_id', businessId)
      .gte('order.order_date', filters.date_from)
      .lte('order.order_date', filters.date_to);

    if (error) {
      return [];
    }

    const breakdown = new Map<string, ProductPerformance>();

    orderItems?.forEach((item: any) => {
      const productId = item.product.id;
      const productName = item.product.name_ar;

      if (!breakdown.has(productId)) {
        breakdown.set(productId, {
          id: productId,
          name: productName,
          total_orders: 0,
          delivered_orders: 0,
          return_orders: 0,
          delivery_rate: 0,
          gross_sales: 0,
          net_profit: 0,
          total_items: 0,
        });
      }

      const product = breakdown.get(productId)!;
      product.total_items += item.quantity || 1;
      product.gross_sales += (item.unit_price || 0) * (item.quantity || 1);
      product.net_profit += ((item.unit_price || 0) - (item.unit_cost || 0)) * (item.quantity || 1);

      if (item.order.status?.counts_as_delivered) {
        product.delivered_orders++;
      }
      if (item.order.status?.counts_as_return) {
        product.return_orders++;
      }
      product.total_orders++;
    });

    const result = Array.from(breakdown.values());
    result.forEach((item) => {
      item.delivery_rate = item.total_orders > 0 ? (item.delivered_orders / item.total_orders) * 100 : 0;
    });

    return result.sort((a, b) => b.gross_sales - a.gross_sales);
  }
}
