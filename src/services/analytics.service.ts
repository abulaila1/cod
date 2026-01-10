import { supabase } from './supabase';

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  netProfit: number;
  deliveredOrders: number;
  returnedOrders: number;
  activeOrders: number;
  deliveryRate: number;
  returnRate: number;
  averageOrderValue: number;
  pendingOrders: number;
}

export interface TrendData {
  current: number;
  previous: number;
  percentChange: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface DailyData {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  deliveryRate: number;
}

export interface CarrierStat {
  id: string;
  name: string;
  totalOrders: number;
  deliveredOrders: number;
  deliveryRate: number;
}

export interface RecentOrder {
  id: string;
  tracking_number: string;
  customer_name: string;
  revenue: number;
  status_name: string;
  status_color: string;
  created_at: string;
}

export interface PeriodRange {
  from: string;
  to: string;
}

export class AnalyticsService {
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private static getNextDay(dateStr: string): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return this.formatDate(date);
  }

  static getDateRange(period: string): PeriodRange {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const formatDate = this.formatDate;

    switch (period) {
      case 'today': {
        const dateStr = formatDate(today);
        return { from: dateStr, to: dateStr };
      }
      case 'yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = formatDate(yesterday);
        return { from: dateStr, to: dateStr };
      }
      case 'last7days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 6);
        return {
          from: formatDate(from),
          to: formatDate(today)
        };
      }
      case 'last30days': {
        const from = new Date(today);
        from.setDate(from.getDate() - 29);
        return {
          from: formatDate(from),
          to: formatDate(today)
        };
      }
      case 'thisMonth': {
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          from: formatDate(from),
          to: formatDate(today)
        };
      }
      case 'lastMonth': {
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const to = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          from: formatDate(from),
          to: formatDate(to)
        };
      }
      default: {
        const from = new Date(today);
        from.setDate(from.getDate() - 29);
        return {
          from: formatDate(from),
          to: formatDate(today)
        };
      }
    }
  }

  static getPreviousPeriodRange(period: string): PeriodRange {
    const current = this.getDateRange(period);
    const currentFrom = new Date(current.from);
    const currentTo = new Date(current.to);
    const daysDiff = Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const prevTo = new Date(currentFrom);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - daysDiff + 1);

    return {
      from: this.formatDate(prevFrom),
      to: this.formatDate(prevTo)
    };
  }

  static async getDashboardStats(
    businessId: string,
    dateRange: PeriodRange
  ): Promise<DashboardStats> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        revenue,
        cost,
        shipping_cost,
        profit,
        status:statuses(counts_as_delivered, counts_as_return, counts_as_active)
      `)
      .eq('business_id', businessId)
      .gte('order_date', dateRange.from)
      .lt('order_date', this.getNextDay(dateRange.to));

    if (error) throw error;

    const safeOrders = orders || [];
    const totalOrders = safeOrders.length;

    let deliveredOrders = 0;
    let returnedOrders = 0;
    let activeOrders = 0;
    let totalRevenue = 0;
    let netProfit = 0;

    safeOrders.forEach((order: any) => {
      const revenue = Number(order.revenue) || 0;
      const cost = Number(order.cost) || 0;
      const shipping = Number(order.shipping_cost) || 0;
      const profit = Number(order.profit) || (revenue - cost - shipping);

      totalRevenue += revenue;
      netProfit += profit;

      if (order.status?.counts_as_delivered) deliveredOrders++;
      else if (order.status?.counts_as_return) returnedOrders++;
      else if (order.status?.counts_as_active) activeOrders++;
    });

    const pendingOrders = totalOrders - deliveredOrders - returnedOrders;
    const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
    const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      totalRevenue,
      netProfit,
      deliveredOrders,
      returnedOrders,
      activeOrders,
      deliveryRate,
      returnRate,
      averageOrderValue,
      pendingOrders
    };
  }

  static calculateTrend(current: number, previous: number): TrendData {
    const percentChange = previous > 0
      ? ((current - previous) / previous) * 100
      : current > 0 ? 100 : 0;

    return {
      current,
      previous,
      percentChange,
      trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral'
    };
  }

  static async getDailyData(
    businessId: string,
    dateRange: PeriodRange
  ): Promise<DailyData[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_date, revenue, cost, shipping_cost, profit')
      .eq('business_id', businessId)
      .gte('order_date', dateRange.from)
      .lt('order_date', this.getNextDay(dateRange.to))
      .order('order_date', { ascending: true });

    if (error) throw error;

    const grouped: Record<string, DailyData> = {};

    orders?.forEach((order: any) => {
      const date = order.order_date;
      if (!grouped[date]) {
        grouped[date] = { date, revenue: 0, profit: 0, orders: 0 };
      }
      grouped[date].revenue += Number(order.revenue) || 0;
      grouped[date].profit += Number(order.profit) ||
        ((Number(order.revenue) || 0) - (Number(order.cost) || 0) - (Number(order.shipping_cost) || 0));
      grouped[date].orders++;
    });

    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    const result: DailyData[] = [];

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push(grouped[dateStr] || { date: dateStr, revenue: 0, profit: 0, orders: 0 });
    }

    return result;
  }

  static async getTopProducts(
    businessId: string,
    dateRange: PeriodRange,
    limit: number = 5
  ): Promise<TopProduct[]> {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        product:products!inner(id, name_ar),
        order:orders!inner(
          business_id,
          order_date,
          status:statuses(counts_as_delivered)
        )
      `)
      .eq('order.business_id', businessId)
      .gte('order.order_date', dateRange.from)
      .lt('order.order_date', this.getNextDay(dateRange.to));

    if (error) return [];

    const products = new Map<string, {
      id: string;
      name: string;
      totalSold: number;
      revenue: number;
      delivered: number;
      total: number;
    }>();

    orderItems?.forEach((item: any) => {
      const productId = item.product.id;
      const productName = item.product.name_ar;

      if (!products.has(productId)) {
        products.set(productId, {
          id: productId,
          name: productName,
          totalSold: 0,
          revenue: 0,
          delivered: 0,
          total: 0
        });
      }

      const p = products.get(productId)!;
      p.totalSold += item.quantity || 1;
      p.revenue += (item.unit_price || 0) * (item.quantity || 1);
      p.total++;
      if (item.order.status?.counts_as_delivered) p.delivered++;
    });

    return Array.from(products.values())
      .map(p => ({
        id: p.id,
        name: p.name,
        totalSold: p.totalSold,
        revenue: p.revenue,
        deliveryRate: p.total > 0 ? (p.delivered / p.total) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  static async getCarrierStats(
    businessId: string,
    dateRange: PeriodRange
  ): Promise<CarrierStat[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        carrier:carriers!inner(id, name_ar),
        status:statuses(counts_as_delivered)
      `)
      .eq('business_id', businessId)
      .gte('order_date', dateRange.from)
      .lt('order_date', this.getNextDay(dateRange.to));

    if (error) return [];

    const carriers = new Map<string, CarrierStat & { delivered: number }>();

    orders?.forEach((order: any) => {
      if (!order.carrier) return;

      const carrierId = order.carrier.id;
      const carrierName = order.carrier.name_ar;

      if (!carriers.has(carrierId)) {
        carriers.set(carrierId, {
          id: carrierId,
          name: carrierName,
          totalOrders: 0,
          deliveredOrders: 0,
          deliveryRate: 0,
          delivered: 0
        });
      }

      const c = carriers.get(carrierId)!;
      c.totalOrders++;
      if (order.status?.counts_as_delivered) c.delivered++;
    });

    return Array.from(carriers.values())
      .map(c => ({
        id: c.id,
        name: c.name,
        totalOrders: c.totalOrders,
        deliveredOrders: c.delivered,
        deliveryRate: c.totalOrders > 0 ? (c.delivered / c.totalOrders) * 100 : 0
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }

  static async getRecentOrders(
    businessId: string,
    limit: number = 5
  ): Promise<RecentOrder[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        tracking_number,
        customer_name,
        revenue,
        created_at,
        status:statuses(name_ar, color)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];

    return (orders || []).map((order: any) => ({
      id: order.id,
      tracking_number: order.tracking_number || '-',
      customer_name: order.customer_name || 'غير محدد',
      revenue: Number(order.revenue) || 0,
      status_name: order.status?.name_ar || 'غير محدد',
      status_color: order.status?.color || '#6B7280',
      created_at: order.created_at
    }));
  }

  static async getStatusBreakdown(
    businessId: string,
    dateRange: PeriodRange
  ): Promise<{ name: string; value: number; color: string }[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        status:statuses!inner(id, name_ar, color, counts_as_delivered, counts_as_return, counts_as_active)
      `)
      .eq('business_id', businessId)
      .gte('order_date', dateRange.from)
      .lt('order_date', this.getNextDay(dateRange.to));

    if (error) return [];

    const statusCounts = new Map<string, { name: string; count: number; color: string }>();

    orders?.forEach((order: any) => {
      const statusId = order.status.id;
      const statusName = order.status.name_ar;
      const statusColor = order.status.color || '#6B7280';

      if (!statusCounts.has(statusId)) {
        statusCounts.set(statusId, { name: statusName, count: 0, color: statusColor });
      }
      statusCounts.get(statusId)!.count++;
    });

    return Array.from(statusCounts.values())
      .map(s => ({ name: s.name, value: s.count, color: s.color }))
      .sort((a, b) => b.value - a.value);
  }
}
