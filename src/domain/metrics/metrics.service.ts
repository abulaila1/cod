import { supabase } from '@/services/supabase';
import { MetricsMath } from './metrics.math';
import type {
  MetricsFilters,
  KPIs,
  TimeSeriesDataPoint,
  Breakdowns,
  CountryBreakdown,
  CarrierBreakdown,
  EmployeeBreakdown,
  ProductBreakdown,
  OrderMetrics,
} from './types';

export class MetricsService {
  static async getKpis(businessId: string, filters: MetricsFilters): Promise<KPIs> {
    const orders = await this.fetchOrdersWithMetrics(businessId, filters);
    const includeAdCost = filters.include_ad_cost ?? true;

    const aggregated = MetricsMath.aggregateOrderMetrics(orders, includeAdCost);

    const denominator = filters.delivered_denominator === 'delivered'
      ? aggregated.deliveredOrders
      : aggregated.totalOrders;

    return {
      total_orders: aggregated.totalOrders,
      delivered_orders: aggregated.deliveredOrders,
      return_orders: aggregated.returnOrders,
      active_orders: aggregated.activeOrders,
      delivery_rate: MetricsMath.calculateDeliveryRate(
        aggregated.deliveredOrders,
        aggregated.totalOrders
      ),
      return_rate: MetricsMath.calculateReturnRate(
        aggregated.returnOrders,
        aggregated.totalOrders
      ),
      gross_sales: aggregated.grossSales,
      total_cogs: aggregated.totalCogs,
      total_shipping_cost: aggregated.totalShippingCost,
      total_ad_cost: aggregated.totalAdCost,
      net_profit: aggregated.netProfit,
      aov: MetricsMath.calculateAOV(aggregated.grossSales, denominator),
      last_updated_at: new Date().toISOString(),
    };
  }

  static async getTimeSeries(
    businessId: string,
    filters: MetricsFilters,
    bucket: 'day' = 'day'
  ): Promise<TimeSeriesDataPoint[]> {
    const orders = await this.fetchOrdersWithMetrics(businessId, filters);
    const includeAdCost = filters.include_ad_cost ?? true;

    const groupedByDate = new Map<string, OrderMetrics[]>();

    for (const order of orders) {
      const dateKey = order.order_date.split('T')[0];
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey)!.push(order);
    }

    const timeSeries: TimeSeriesDataPoint[] = [];

    for (const [date, dayOrders] of groupedByDate.entries()) {
      const aggregated = MetricsMath.aggregateOrderMetrics(dayOrders, includeAdCost);

      timeSeries.push({
        date,
        total_orders: aggregated.totalOrders,
        delivered_orders: aggregated.deliveredOrders,
        return_orders: aggregated.returnOrders,
        gross_sales: aggregated.grossSales,
        net_profit: aggregated.netProfit,
      });
    }

    return timeSeries.sort((a, b) => a.date.localeCompare(b.date));
  }

  static async getBreakdowns(
    businessId: string,
    filters: MetricsFilters
  ): Promise<Breakdowns> {
    const [byCountry, byCarrier, byEmployee, byProduct] = await Promise.all([
      this.getCountryBreakdown(businessId, filters),
      this.getCarrierBreakdown(businessId, filters),
      this.getEmployeeBreakdown(businessId, filters),
      this.getProductBreakdown(businessId, filters),
    ]);

    return {
      by_country: byCountry,
      by_carrier: byCarrier,
      by_employee: byEmployee,
      by_product: byProduct,
    };
  }

  private static async getCountryBreakdown(
    businessId: string,
    filters: MetricsFilters
  ): Promise<CountryBreakdown[]> {
    const orders = await this.fetchOrdersWithMetrics(businessId, filters);
    const includeAdCost = filters.include_ad_cost ?? true;

    const groupedByCountry = new Map<string, { name: string; orders: OrderMetrics[] }>();

    for (const order of orders) {
      if (!groupedByCountry.has(order.country_id)) {
        groupedByCountry.set(order.country_id, {
          name: order.country_name,
          orders: [],
        });
      }
      groupedByCountry.get(order.country_id)!.orders.push(order);
    }

    const breakdown: CountryBreakdown[] = [];

    for (const [countryId, { name, orders: countryOrders }] of groupedByCountry.entries()) {
      const aggregated = MetricsMath.aggregateOrderMetrics(countryOrders, includeAdCost);

      breakdown.push({
        country_id: countryId,
        name_ar: name,
        total: aggregated.totalOrders,
        delivered: aggregated.deliveredOrders,
        returns: aggregated.returnOrders,
        delivery_rate: MetricsMath.calculateDeliveryRate(
          aggregated.deliveredOrders,
          aggregated.totalOrders
        ),
        net_profit: aggregated.netProfit,
      });
    }

    return breakdown.sort((a, b) => b.total - a.total);
  }

  private static async getCarrierBreakdown(
    businessId: string,
    filters: MetricsFilters
  ): Promise<CarrierBreakdown[]> {
    const orders = await this.fetchOrdersWithMetrics(businessId, filters);
    const includeAdCost = filters.include_ad_cost ?? true;

    const groupedByCarrier = new Map<string, { name: string; orders: OrderMetrics[] }>();

    for (const order of orders) {
      if (!groupedByCarrier.has(order.carrier_id)) {
        groupedByCarrier.set(order.carrier_id, {
          name: order.carrier_name,
          orders: [],
        });
      }
      groupedByCarrier.get(order.carrier_id)!.orders.push(order);
    }

    const breakdown: CarrierBreakdown[] = [];

    for (const [carrierId, { name, orders: carrierOrders }] of groupedByCarrier.entries()) {
      const aggregated = MetricsMath.aggregateOrderMetrics(carrierOrders, includeAdCost);

      breakdown.push({
        carrier_id: carrierId,
        name_ar: name,
        total: aggregated.totalOrders,
        delivered: aggregated.deliveredOrders,
        returns: aggregated.returnOrders,
        delivery_rate: MetricsMath.calculateDeliveryRate(
          aggregated.deliveredOrders,
          aggregated.totalOrders
        ),
        net_profit: aggregated.netProfit,
      });
    }

    return breakdown.sort((a, b) => b.total - a.total);
  }

  private static async getEmployeeBreakdown(
    businessId: string,
    filters: MetricsFilters
  ): Promise<EmployeeBreakdown[]> {
    const orders = await this.fetchOrdersWithMetrics(businessId, filters);
    const includeAdCost = filters.include_ad_cost ?? true;

    const groupedByEmployee = new Map<string, { name: string; orders: OrderMetrics[] }>();

    for (const order of orders) {
      if (!groupedByEmployee.has(order.employee_id)) {
        groupedByEmployee.set(order.employee_id, {
          name: order.employee_name,
          orders: [],
        });
      }
      groupedByEmployee.get(order.employee_id)!.orders.push(order);
    }

    const breakdown: EmployeeBreakdown[] = [];

    for (const [employeeId, { name, orders: employeeOrders }] of groupedByEmployee.entries()) {
      const aggregated = MetricsMath.aggregateOrderMetrics(employeeOrders, includeAdCost);

      breakdown.push({
        employee_id: employeeId,
        name_ar: name,
        total: aggregated.totalOrders,
        delivered: aggregated.deliveredOrders,
        returns: aggregated.returnOrders,
        delivery_rate: MetricsMath.calculateDeliveryRate(
          aggregated.deliveredOrders,
          aggregated.totalOrders
        ),
        net_profit: aggregated.netProfit,
      });
    }

    return breakdown.sort((a, b) => b.total - a.total);
  }

  private static async getProductBreakdown(
    businessId: string,
    filters: MetricsFilters
  ): Promise<ProductBreakdown[]> {
    let query = supabase
      .from('order_items')
      .select(`
        id,
        product_id,
        qty,
        item_price,
        item_cogs,
        products!inner(name_ar),
        orders!inner(
          order_date,
          status_id,
          statuses!inner(
            counts_as_delivered,
            counts_as_return
          )
        )
      `)
      .eq('business_id', businessId)
      .gte('orders.order_date', filters.date_from)
      .lte('orders.order_date', filters.date_to);

    const { data, error } = await query;

    if (error) throw error;

    const groupedByProduct = new Map<string, {
      name: string;
      items: Array<{
        qty: number;
        revenue: number;
        cogs: number;
        delivered: boolean;
        returned: boolean;
      }>;
    }>();

    for (const item of data || []) {
      const productId = item.product_id;
      if (!groupedByProduct.has(productId)) {
        groupedByProduct.set(productId, {
          name: item.products.name_ar,
          items: [],
        });
      }

      groupedByProduct.get(productId)!.items.push({
        qty: item.qty,
        revenue: item.item_price * item.qty,
        cogs: item.item_cogs * item.qty,
        delivered: item.orders.statuses.counts_as_delivered,
        returned: item.orders.statuses.counts_as_return,
      });
    }

    const breakdown: ProductBreakdown[] = [];

    for (const [productId, { name, items }] of groupedByProduct.entries()) {
      const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
      const totalOrders = items.length;
      const delivered = items.filter(i => i.delivered).length;
      const returns = items.filter(i => i.returned).length;
      const revenue = items.reduce((sum, i) => sum + i.revenue, 0);
      const totalCogs = items.reduce((sum, i) => sum + i.cogs, 0);
      const profit = revenue - totalCogs;

      breakdown.push({
        product_id: productId,
        name_ar: name,
        total_items: totalItems,
        total_orders: totalOrders,
        delivered,
        returns,
        revenue,
        profit,
        delivery_rate: totalOrders > 0 ? (delivered / totalOrders) * 100 : 0,
      });
    }

    return breakdown.sort((a, b) => b.profit - a.profit);
  }

  static async getStatusDistribution(
    businessId: string,
    filters: MetricsFilters
  ): Promise<Array<{ status_key: string; label_ar: string; count: number; percentage: number }>> {
    let query = supabase
      .from('orders')
      .select(`
        status_id,
        statuses!inner(key, label_ar)
      `)
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

    const { data, error } = await query;

    if (error) throw error;

    const statusCounts = new Map<string, { key: string; label: string; count: number }>();

    for (const order of data || []) {
      const statusKey = order.statuses.key;
      const statusLabel = order.statuses.label_ar;

      if (!statusCounts.has(statusKey)) {
        statusCounts.set(statusKey, {
          key: statusKey,
          label: statusLabel,
          count: 0,
        });
      }

      statusCounts.get(statusKey)!.count++;
    }

    const total = data?.length || 0;

    return Array.from(statusCounts.values())
      .map(({ key, label, count }) => ({
        status_key: key,
        label_ar: label,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private static async fetchOrdersWithMetrics(
    businessId: string,
    filters: MetricsFilters
  ): Promise<Array<OrderMetrics & { order_date: string; country_id: string; country_name: string; carrier_id: string; carrier_name: string; employee_id: string; employee_name: string }>> {
    let query = supabase
      .from('orders')
      .select(`
        id,
        order_date,
        revenue,
        cogs,
        shipping_cost,
        ad_cost,
        country_id,
        countries!inner(name_ar),
        carrier_id,
        carriers!inner(name_ar),
        employee_id,
        employees!inner(name_ar),
        status_id,
        statuses!inner(
          counts_as_delivered,
          counts_as_return,
          counts_as_active,
          is_final,
          key
        )
      `)
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

    if (filters.status_key) {
      query = query.eq('statuses.key', filters.status_key);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((row: any) => ({
      order_date: row.order_date,
      revenue: row.revenue || 0,
      cogs: row.cogs || 0,
      shipping_cost: row.shipping_cost || 0,
      ad_cost: row.ad_cost || 0,
      counts_as_delivered: row.statuses.counts_as_delivered,
      counts_as_return: row.statuses.counts_as_return,
      counts_as_active: row.statuses.counts_as_active,
      is_final: row.statuses.is_final,
      country_id: row.country_id,
      country_name: row.countries.name_ar,
      carrier_id: row.carrier_id,
      carrier_name: row.carriers.name_ar,
      employee_id: row.employee_id,
      employee_name: row.employees.name_ar,
    }));
  }
}
