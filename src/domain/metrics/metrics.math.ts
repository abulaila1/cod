import type { OrderMetrics } from './types';

export function calculateDeliveryRate(delivered: number, total: number): number {
  if (total === 0) return 0;
  return (delivered / total) * 100;
}

export function calculateReturnRate(returns: number, total: number): number {
  if (total === 0) return 0;
  return (returns / total) * 100;
}

export function calculateNetProfit(
  revenue: number,
  cogs: number,
  shippingCost: number,
  adCost: number,
  includeAdCost: boolean
): number {
  const adCostValue = includeAdCost ? (adCost || 0) : 0;
  return revenue - cogs - shippingCost - adCostValue;
}

export function calculateAOV(
  grossSales: number,
  orderCount: number
): number {
  if (orderCount === 0) return 0;
  return grossSales / orderCount;
}

export function aggregateOrderMetrics(orders: OrderMetrics[], includeAdCost: boolean = true) {
  let totalOrders = 0;
  let deliveredOrders = 0;
  let returnOrders = 0;
  let activeOrders = 0;
  let grossSales = 0;
  let totalCogs = 0;
  let totalShippingCost = 0;
  let totalAdCost = 0;
  let netProfit = 0;

  for (const order of orders) {
    totalOrders++;

    if (order.counts_as_delivered) {
      deliveredOrders++;
    }

    if (order.counts_as_return) {
      returnOrders++;
    }

    if (order.counts_as_active) {
      activeOrders++;
    }

    grossSales += order.revenue;
    totalCogs += order.cogs;
    totalShippingCost += order.shipping_cost;
    totalAdCost += order.ad_cost || 0;

    netProfit += calculateNetProfit(
      order.revenue,
      order.cogs,
      order.shipping_cost,
      order.ad_cost || 0,
      includeAdCost
    );
  }

  return {
    totalOrders,
    deliveredOrders,
    returnOrders,
    activeOrders,
    grossSales,
    totalCogs,
    totalShippingCost,
    totalAdCost: includeAdCost ? totalAdCost : 0,
    netProfit,
  };
}

export const MetricsMath = {
  calculateDeliveryRate,
  calculateReturnRate,
  calculateNetProfit,
  calculateAOV,
  aggregateOrderMetrics,
};
