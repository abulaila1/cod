export interface PerformanceBreakdown {
  id: string;
  name: string;
  total_orders: number;
  delivered_orders: number;
  return_orders: number;
  delivery_rate: number;
  gross_sales: number;
  net_profit: number;
}

export interface ProductPerformance extends PerformanceBreakdown {
  total_items: number;
}

export interface PerformanceFilters {
  date_from: string;
  date_to: string;
  country_id?: string;
  carrier_id?: string;
  employee_id?: string;
}
