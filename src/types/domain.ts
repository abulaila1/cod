export interface Status {
  id: string;
  business_id?: string;
  name_ar: string;
  name_en?: string;
  color?: string;
  is_default?: boolean;
  display_order?: number;
  created_at?: string;
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

export interface ProductCategory {
  id: string;
  business_id: string;
  name_ar: string;
  name_en?: string | null;
  color?: string;
  display_order?: number;
  created_at?: string;
}

export interface Product {
  id: string;
  business_id: string;
  name_ar: string;
  name_en?: string | null;
  sku: string | null;
  price: number;
  cost: number;
  category_id?: string | null;
  category?: ProductCategory | null;
  image_url?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at?: string;
  physical_stock: number;
  reserved_stock: number;
}

export interface Order {
  id: string;
  business_id: string;
  order_number: string | null;
  order_date: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  country_id: string;
  carrier_id: string;
  employee_id: string;
  status_id: string;
  revenue: number;
  cost: number;
  shipping_cost: number;
  profit: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  locked_by: string | null;
  locked_at: string | null;
}

export interface OrderItem {
  id: string;
  business_id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: any;
  created_at: string;
}

export interface CreateStatusInput {
  name_ar: string;
  name_en?: string;
  color?: string;
  is_default?: boolean;
  display_order?: number;
}

export interface UpdateStatusInput {
  name_ar?: string;
  name_en?: string;
  color?: string;
  is_default?: boolean;
  display_order?: number;
}

export interface OrderWithRelations extends Order {
  status: Status | null;
  country: Country | null;
  carrier: Carrier | null;
  employee: Employee | null;
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
  cost?: number;
  shipping_cost?: number;
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
