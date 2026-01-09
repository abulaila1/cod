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
  name_en?: string | null;
  tracking_url?: string | null;
  active: boolean;
  created_at: string;
}

export interface City {
  id: string;
  business_id: string;
  country_id: string;
  name_ar: string;
  name_en?: string | null;
  shipping_cost: number;
  is_active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  business_id: string;
  name_ar: string;
  name_en: string | null;
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

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city_id: string | null;
  city?: City | null;
  address: string | null;
  notes: string | null;
  total_orders: number;
  total_revenue: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreateInput {
  name: string;
  phone?: string;
  email?: string;
  city_id?: string;
  address?: string;
  notes?: string;
}

export interface Order {
  id: string;
  business_id: string;
  order_number: string | null;
  order_date: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  country_id: string;
  city_id: string | null;
  carrier_id: string;
  employee_id: string;
  status_id: string;
  revenue: number;
  cost: number;
  shipping_cost: number;
  cod_fees: number;
  collected_amount: number | null;
  collection_status: 'pending' | 'collected' | 'partial' | 'failed';
  profit: number;
  notes: string | null;
  tracking_number: string | null;
  order_source: string | null;
  callback_date: string | null;
  cancellation_reason: string | null;
  return_reason: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  processing_status: 'pending' | 'processing' | 'completed';
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
  city: City | null;
  carrier: Carrier | null;
  employee: Employee | null;
  customer?: Customer | null;
  lock?: OrderLock | null;
  items?: OrderItemWithProduct[];
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product | null;
}

export interface OrderLock {
  id: string;
  business_id: string;
  order_id: string;
  locked_by: string;
  locked_at: string;
  expires_at: string;
  employee?: Employee | null;
}

export interface OrderStatistics {
  today_count: number;
  pending_value: number;
  confirmation_rate: number;
  late_orders_count: number;
}

export interface OrderFilters {
  date_from?: string;
  date_to?: string;
  country_id?: string;
  city_id?: string;
  carrier_id?: string;
  employee_id?: string;
  status_id?: string;
  status_ids?: string[];
  status_key?: string;
  product_id?: string;
  search?: string;
  collection_status?: string;
  has_tracking?: boolean;
  is_late?: boolean;
  late_days?: number;
  order_source?: string;
  processing_status?: string;
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
  cod_fees?: number;
  collected_amount?: number;
  collection_status?: 'pending' | 'collected' | 'partial' | 'failed';
  notes?: string;
  country_id?: string;
  city_id?: string;
  carrier_id?: string;
  employee_id?: string;
  tracking_number?: string;
  order_source?: string;
  callback_date?: string;
  cancellation_reason?: string;
  return_reason?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
}

export interface OrderCreateInput {
  order_date: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  country_id?: string;
  city_id?: string;
  carrier_id?: string;
  employee_id?: string;
  status_id?: string;
  order_source?: string;
  notes?: string;
  shipping_cost?: number;
  cod_fees?: number;
  items: OrderItemInput[];
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface BulkTrackingUpdate {
  order_id?: string;
  order_number?: string;
  tracking_number: string;
}

export interface BulkDeliveryUpdate {
  tracking_number?: string;
  order_id?: string;
  status: 'delivered' | 'returned';
  collected_amount?: number;
  return_reason?: string;
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
