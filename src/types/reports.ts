export type ReportGroupBy = 'day' | 'week' | 'month';
export type ReportTab = 'overview' | 'financial' | 'performance' | 'products' | 'customers' | 'carriers' | 'employees' | 'cod';

export interface ReportFilters {
  date_from: string;
  date_to: string;
  group_by: ReportGroupBy;
  country_id?: string;
  carrier_id?: string;
  employee_id?: string;
  status_id?: string;
  product_id?: string;
  category_id?: string;
  customer_id?: string;
  city_id?: string;
  order_source?: string;
  collection_status?: string;
  has_tracking?: boolean;
  is_late?: boolean;
  is_repeat_customer?: boolean;
  include_ad_cost?: boolean;
}

export interface ReportSummary {
  total_orders: number;
  delivered_orders: number;
  return_orders: number;
  delivery_rate: number;
  gross_sales: number;
  net_profit: number;
  aov: number;
}

export interface ReportRow {
  period: string;
  period_label: string;
  total_orders: number;
  delivered_orders: number;
  return_orders: number;
  delivery_rate: number;
  gross_sales: number;
  net_profit: number;
  aov: number;
  date_from: string;
  date_to: string;
}

export interface ReportTableData {
  rows: ReportRow[];
  totals?: ReportRow;
}

export interface SavedReport {
  id: string;
  business_id: string;
  name: string;
  group_by: ReportGroupBy;
  filters_json: Partial<ReportFilters>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSavedReportRequest {
  name: string;
  group_by: ReportGroupBy;
  filters_json: Partial<ReportFilters>;
}

export interface AdvancedReportSummary extends ReportSummary {
  total_cost: number;
  total_cogs: number;
  total_shipping: number;
  total_ad_cost: number;
  total_cod_fees: number;
  net_profit_before_ads: number;
  profit_margin: number;
  average_order_cost: number;
  cost_to_revenue_ratio: number;
  new_customers: number;
  repeat_customers: number;
  pending_orders: number;
  active_orders: number;
  late_orders: number;
  average_delivery_time: number;
  first_attempt_success_rate: number;
  cod_collected: number;
  cod_pending: number;
  collection_rate: number;
}

export interface ProductPerformance {
  id: string;
  name: string;
  category_name?: string;
  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  revenue: number;
  profit: number;
  delivery_rate: number;
  return_rate: number;
  profit_margin: number;
  avg_price: number;
  avg_cost: number;
}

export interface CustomerPerformance {
  id: string;
  name: string;
  phone?: string;
  city_name?: string;
  total_orders: number;
  total_revenue: number;
  lifetime_value: number;
  avg_order_value: number;
  delivery_success_rate: number;
  last_order_date: string;
  is_repeat: boolean;
  first_order_date: string;
}

export interface CarrierPerformance {
  id: string;
  name: string;
  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  delivery_rate: number;
  return_rate: number;
  avg_delivery_time: number;
  total_shipping_cost: number;
  avg_shipping_cost: number;
}

export interface CityPerformance {
  id: string;
  name: string;
  country_name: string;
  total_orders: number;
  delivered_orders: number;
  delivery_rate: number;
  revenue: number;
  avg_shipping_cost: number;
}

export interface EmployeePerformance {
  id: string;
  name: string;
  total_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  confirmation_rate: number;
  delivery_rate: number;
  revenue: number;
  avg_order_value: number;
  pending_orders: number;
  late_orders: number;
  productivity: number;
}

export interface CODReport {
  total_pending: number;
  total_collected: number;
  total_partial: number;
  total_failed: number;
  collection_rate: number;
  avg_collection_time: number;
  pending_value: number;
  collected_value: number;
  cod_fees: number;
}

export interface StatusBreakdown {
  status_id: string;
  status_name: string;
  status_color: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface TimeAnalysis {
  avg_time_to_confirm: number;
  avg_time_to_ship: number;
  avg_time_to_deliver: number;
  avg_total_time: number;
  confirmed_same_day_rate: number;
  shipped_within_two_days_rate: number;
  delivered_within_week_rate: number;
}

export interface CancellationReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface ReturnReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface FinancialBreakdown {
  revenue: number;
  cogs: number;
  shipping_cost: number;
  ad_cost: number;
  cod_fees: number;
  gross_profit: number;
  net_profit: number;
  profit_margin: number;
  roas: number;
}
