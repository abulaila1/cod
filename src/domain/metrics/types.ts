export interface MetricsFilters {
  date_from: string;
  date_to: string;
  country_id?: string;
  carrier_id?: string;
  employee_id?: string;
  product_id?: string;
  status_key?: string;
  status_id?: string;
  include_ad_cost?: boolean;
  delivered_denominator?: 'delivered' | 'total';
}

export interface KPIs {
  total_orders: number;
  delivered_orders: number;
  return_orders: number;
  active_orders: number;
  delivery_rate: number;
  return_rate: number;
  gross_sales: number;
  total_cogs: number;
  total_shipping_cost: number;
  total_ad_cost: number;
  net_profit: number;
  aov: number;
  last_updated_at: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  total_orders: number;
  delivered_orders: number;
  return_orders: number;
  gross_sales: number;
  net_profit: number;
}

export interface CountryBreakdown {
  country_id: string;
  name_ar: string;
  total: number;
  delivered: number;
  returns: number;
  delivery_rate: number;
  net_profit: number;
}

export interface CarrierBreakdown {
  carrier_id: string;
  name_ar: string;
  total: number;
  delivered: number;
  returns: number;
  delivery_rate: number;
  net_profit: number;
}

export interface EmployeeBreakdown {
  employee_id: string;
  name_ar: string;
  total: number;
  delivered: number;
  returns: number;
  delivery_rate: number;
  net_profit: number;
}

export interface ProductBreakdown {
  product_id: string;
  name_ar: string;
  total_items: number;
  total_orders: number;
  delivered: number;
  returns: number;
  revenue: number;
  profit: number;
  delivery_rate: number;
}

export interface Breakdowns {
  by_country: CountryBreakdown[];
  by_carrier: CarrierBreakdown[];
  by_employee: EmployeeBreakdown[];
  by_product: ProductBreakdown[];
}

export interface OrderMetrics {
  revenue: number;
  cogs: number;
  shipping_cost: number;
  ad_cost: number;
  counts_as_delivered: boolean;
  counts_as_return: boolean;
  counts_as_active: boolean;
  is_final: boolean;
}
