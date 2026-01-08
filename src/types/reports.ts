export type ReportGroupBy = 'day' | 'week' | 'month';

export interface ReportFilters {
  date_from: string;
  date_to: string;
  group_by: ReportGroupBy;
  country_id?: string;
  carrier_id?: string;
  employee_id?: string;
  status_id?: string;
  product_id?: string;
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
