export interface Status {
  id: string;
  business_id: string;
  key: string;
  label_ar: string;
  sort_order: number;
  is_final: boolean;
  counts_as_delivered: boolean;
  counts_as_return: boolean;
  counts_as_active: boolean;
  created_at: string;
}

export interface Country {
  id: string;
  business_id: string;
  name_ar: string;
  currency: string | null;
  active: boolean;
  created_at: string;
}

export interface Carrier {
  id: string;
  business_id: string;
  name_ar: string;
  active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  business_id: string;
  name_ar: string;
  role: string | null;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name_ar: string;
  sku: string | null;
  base_cogs: number;
  active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  order_date: string;
  country_id: string;
  carrier_id: string;
  employee_id: string;
  status_id: string;
  revenue: number;
  cogs: number;
  shipping_cost: number;
  ad_cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  business_id: string;
  order_id: string;
  product_id: string;
  qty: number;
  item_price: number;
  item_cogs: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  before: any;
  after: any;
  created_at: string;
}

export interface CreateStatusInput {
  key: string;
  label_ar: string;
  sort_order?: number;
  is_final?: boolean;
  counts_as_delivered?: boolean;
  counts_as_return?: boolean;
  counts_as_active?: boolean;
}

export interface UpdateStatusInput {
  label_ar?: string;
  sort_order?: number;
  is_final?: boolean;
  counts_as_delivered?: boolean;
  counts_as_return?: boolean;
  counts_as_active?: boolean;
}

export interface OrderWithRelations extends Order {
  status: Status;
  country: Country;
  carrier: Carrier;
  employee: Employee;
}

export interface OrderFilters {
  date_from?: string;
  date_to?: string;
  country_id?: string;
  carrier_id?: string;
  employee_id?: string;
  status_id?: string;
  status_key?: string;
  product_id?: string;
  search?: string;
}

export interface OrderPagination {
  page: number;
  pageSize: number;
}

export interface OrderSorting {
  field: string;
  direction: 'asc' | 'desc';
}

export interface OrderListResponse {
  rows: OrderWithRelations[];
  total_count: number;
  page_count: number;
}

export interface OrderUpdatePatch {
  revenue?: number;
  cogs?: number;
  shipping_cost?: number;
  ad_cost?: number;
  notes?: string;
  country_id?: string;
  carrier_id?: string;
  employee_id?: string;
}

export interface AuditLogWithUser extends AuditLog {
  user?: {
    email: string;
  };
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

export interface CountryBreakdown {
  country_id: string;
  name_ar: string;
  total: number;
  delivered: number;
  returns: number;
  delivery_rate: number;
  net_profit: number;
}
