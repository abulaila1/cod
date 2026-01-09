import { supabase } from './supabase';
import { UsageService } from './usage.service';
import { BillingService } from './billing.service';
import {
  validateImportData,
  parseCSVLine,
  detectCSVDelimiter,
  type RowValidationError,
} from '@/utils/order-import';
import type {
  Order,
  OrderWithRelations,
  OrderFilters,
  OrderPagination,
  OrderSorting,
  OrderListResponse,
  OrderUpdatePatch,
  OrderCreateInput,
  OrderStatistics,
  AuditLogWithUser,
  BulkTrackingUpdate,
  BulkDeliveryUpdate,
  OrderItemWithProduct,
} from '@/types/domain';

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ rowNumber: number; errors: RowValidationError[] }>;
  headerErrors: string[];
  productsCreated: string[];
}

export interface BulkUpdateResult {
  success: number;
  failed: number;
  errors: string[];
}

export class OrdersService {
  static async testConnection(businessId: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const { data, error, count } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .eq('business_id', businessId);

      if (error) {
        return { success: false, count: 0, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (err) {
      return { success: false, count: 0, error: String(err) };
    }
  }

  private static async ensureCanAddOrders(
    businessId: string,
    ordersToAdd: number
  ): Promise<void> {
    const ownerId = await UsageService.getBusinessOwnerId(businessId);
    const isSuperAdmin = ownerId ? await UsageService.isSuperAdmin(ownerId) : false;

    if (isSuperAdmin) {
      return;
    }

    const billing = await BillingService.getBilling(businessId);

    if (billing?.is_trial && BillingService.isTrialExpired(billing)) {
      throw new Error('انتهت فترة التجربة المجانية. يرجى الاشتراك لتكملة استخدام النظام.');
    }

    const usageCheck = await UsageService.checkCanAddOrders(businessId, ordersToAdd);

    if (!usageCheck.allowed) {
      throw new Error(
        usageCheck.message || 'لقد تجاوزت الحد الشهري لعدد الطلبات في خطتك الحالية. قم بالترقية لإضافة المزيد.'
      );
    }
  }

  static async listOrders(
    businessId: string,
    filters: OrderFilters = {},
    pagination: OrderPagination = { page: 1, pageSize: 25 },
    sorting: OrderSorting = { field: 'order_date', direction: 'desc' }
  ): Promise<OrderListResponse> {
    if (!businessId) {
      return { rows: [], total_count: 0, page_count: 0 };
    }

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses(id, name_ar, name_en, color, is_default, counts_as_delivered, counts_as_return),
        country:countries(id, name_ar, currency),
        city:cities(id, name_ar, name_en, shipping_cost),
        carrier:carriers(id, name_ar, name_en, tracking_url),
        employee:employees(id, name_ar, name_en)
      `,
        { count: 'exact' }
      )
      .eq('business_id', businessId);

    if (filters.date_from) {
      query = query.gte('order_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('order_date', filters.date_to);
    }

    if (filters.country_id) {
      query = query.eq('country_id', filters.country_id);
    }

    if (filters.city_id) {
      query = query.eq('city_id', filters.city_id);
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

    if (filters.status_ids && filters.status_ids.length > 0) {
      query = query.in('status_id', filters.status_ids);
    }

    if (filters.collection_status) {
      query = query.eq('collection_status', filters.collection_status);
    }

    if (filters.has_tracking === true) {
      query = query.not('tracking_number', 'is', null);
    } else if (filters.has_tracking === false) {
      query = query.is('tracking_number', null);
    }

    if (filters.order_source) {
      query = query.eq('order_source', filters.order_source);
    }

    if (filters.processing_status) {
      query = query.eq('processing_status', filters.processing_status);
    }

    if (filters.is_late && filters.late_days) {
      const lateCutoff = new Date();
      lateCutoff.setDate(lateCutoff.getDate() - filters.late_days);
      query = query.lt('created_at', lateCutoff.toISOString());
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `order_number.ilike.${searchTerm},customer_name.ilike.${searchTerm},customer_phone.ilike.${searchTerm},tracking_number.ilike.${searchTerm},notes.ilike.${searchTerm}`
      );
    }

    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;

    query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Orders query error:', error);
      return { rows: [], total_count: 0, page_count: 0 };
    }

    let filteredData = data || [];
    let filteredCount = count || 0;

    if (filters.product_id && filteredData.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', filters.product_id);

      const orderIdsWithProduct = new Set(orderItems?.map((i) => i.order_id) || []);
      filteredData = filteredData.filter((order) => orderIdsWithProduct.has(order.id));
      filteredCount = filteredData.length;
    }

    const total_count = filteredCount;
    const page_count = Math.ceil(total_count / pagination.pageSize);

    return {
      rows: filteredData as OrderWithRelations[],
      total_count,
      page_count,
    };
  }

  static async getOrderById(orderId: string): Promise<OrderWithRelations | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses(id, name_ar, name_en, color, is_default, counts_as_delivered, counts_as_return),
        country:countries(id, name_ar, currency),
        city:cities(id, name_ar, name_en, shipping_cost),
        carrier:carriers(id, name_ar, name_en, tracking_url),
        employee:employees(id, name_ar, name_en)
      `
      )
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;
    return data as OrderWithRelations | null;
  }

  static async getOrderItems(orderId: string): Promise<OrderItemWithProduct[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select(
        `
        *,
        product:products(id, name_ar, name_en, sku, price, cost, image_url, physical_stock, reserved_stock)
      `
      )
      .eq('order_id', orderId);

    if (error) throw error;
    return (data || []) as OrderItemWithProduct[];
  }

  static async getOrderAuditLogs(orderId: string): Promise<AuditLogWithUser[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'orders')
      .eq('entity_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AuditLogWithUser[];
  }

  static async getOrderStatistics(businessId: string): Promise<OrderStatistics> {
    const { data, error } = await supabase.rpc('get_order_statistics', {
      p_business_id: businessId
    });

    if (error) {
      console.error('Failed to get statistics:', error);
      return {
        today_count: 0,
        pending_value: 0,
        confirmation_rate: 0,
        late_orders_count: 0
      };
    }

    return data as OrderStatistics;
  }

  static async updateOrderStatus(
    businessId: string,
    orderId: string,
    statusId: string,
    userId: string,
    note?: string
  ): Promise<void> {
    const orderBefore = await this.getOrderById(orderId);

    if (!orderBefore) {
      throw new Error('Order not found');
    }

    const { data: newStatus } = await supabase
      .from('statuses')
      .select('key, counts_as_delivered')
      .eq('id', statusId)
      .maybeSingle();

    const updateData: Record<string, unknown> = { status_id: statusId };

    if (newStatus?.key === 'confirmed' || newStatus?.counts_as_delivered) {
      updateData.confirmed_at = new Date().toISOString();
    }
    if (newStatus?.key === 'shipped') {
      updateData.shipped_at = new Date().toISOString();
    }
    if (newStatus?.key === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('business_id', businessId);

    if (updateError) throw updateError;

    const orderAfter = await this.getOrderById(orderId);

    await supabase.from('audit_logs').insert({
      business_id: businessId,
      user_id: userId,
      entity_type: 'orders',
      entity_id: orderId,
      action: 'status_change',
      before: {
        status_id: orderBefore.status_id,
        status_label: orderBefore.status?.name_ar,
        note,
      },
      after: {
        status_id: orderAfter?.status_id,
        status_label: orderAfter?.status?.name_ar,
      },
    });
  }

  static async updateOrderFields(
    businessId: string,
    orderId: string,
    patch: OrderUpdatePatch,
    userId: string
  ): Promise<void> {
    const orderBefore = await this.getOrderById(orderId);

    if (!orderBefore) {
      throw new Error('Order not found');
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(patch)
      .eq('id', orderId)
      .eq('business_id', businessId);

    if (updateError) throw updateError;

    const orderAfter = await this.getOrderById(orderId);

    await supabase.from('audit_logs').insert({
      business_id: businessId,
      user_id: userId,
      entity_type: 'orders',
      entity_id: orderId,
      action: 'update',
      before: this.extractPatchFields(orderBefore, patch),
      after: this.extractPatchFields(orderAfter!, patch),
    });
  }

  private static extractPatchFields(order: OrderWithRelations, patch: OrderUpdatePatch): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    if (patch.revenue !== undefined) result.revenue = order.revenue;
    if (patch.cost !== undefined) result.cost = order.cost;
    if (patch.shipping_cost !== undefined) result.shipping_cost = order.shipping_cost;
    if (patch.cod_fees !== undefined) result.cod_fees = order.cod_fees;
    if (patch.collected_amount !== undefined) result.collected_amount = order.collected_amount;
    if (patch.collection_status !== undefined) result.collection_status = order.collection_status;
    if (patch.notes !== undefined) result.notes = order.notes;
    if (patch.tracking_number !== undefined) result.tracking_number = order.tracking_number;
    if (patch.customer_name !== undefined) result.customer_name = order.customer_name;
    if (patch.customer_phone !== undefined) result.customer_phone = order.customer_phone;
    if (patch.customer_address !== undefined) result.customer_address = order.customer_address;
    if (patch.country_id !== undefined) {
      result.country_id = order.country_id;
      result.country_name = order.country?.name_ar || null;
    }
    if (patch.city_id !== undefined) {
      result.city_id = order.city_id;
      result.city_name = order.city?.name_ar || null;
    }
    if (patch.carrier_id !== undefined) {
      result.carrier_id = order.carrier_id;
      result.carrier_name = order.carrier?.name_ar || null;
    }
    if (patch.employee_id !== undefined) {
      result.employee_id = order.employee_id;
      result.employee_name = order.employee?.name_ar || null;
    }

    return result;
  }

  static async bulkUpdateStatus(
    businessId: string,
    orderIds: string[],
    statusId: string,
    userId: string
  ): Promise<void> {
    for (const orderId of orderIds) {
      try {
        await this.updateOrderStatus(businessId, orderId, statusId, userId);
      } catch (error) {
        console.error(`Failed to update order ${orderId}:`, error);
      }
    }
  }

  static async bulkAssignCarrier(
    businessId: string,
    orderIds: string[],
    carrierId: string,
    userId: string
  ): Promise<BulkUpdateResult> {
    let success = 0;
    const errors: string[] = [];

    for (const orderId of orderIds) {
      try {
        await this.updateOrderFields(businessId, orderId, { carrier_id: carrierId }, userId);
        success++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`فشل تحديث الطلب ${orderId.substring(0, 8)}: ${message}`);
      }
    }

    return { success, failed: orderIds.length - success, errors };
  }

  static async bulkAssignEmployee(
    businessId: string,
    orderIds: string[],
    employeeId: string,
    userId: string
  ): Promise<BulkUpdateResult> {
    let success = 0;
    const errors: string[] = [];

    for (const orderId of orderIds) {
      try {
        await this.updateOrderFields(businessId, orderId, { employee_id: employeeId }, userId);
        success++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`فشل تحديث الطلب ${orderId.substring(0, 8)}: ${message}`);
      }
    }

    return { success, failed: orderIds.length - success, errors };
  }

  static async bulkUpdateTrackingNumbers(
    businessId: string,
    updates: BulkTrackingUpdate[],
    userId: string
  ): Promise<BulkUpdateResult> {
    let success = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        let orderId = update.order_id;

        if (!orderId && update.order_number) {
          const { data } = await supabase
            .from('orders')
            .select('id')
            .eq('business_id', businessId)
            .eq('order_number', update.order_number)
            .maybeSingle();

          orderId = data?.id;
        }

        if (!orderId) {
          errors.push(`الطلب "${update.order_number || update.order_id}" غير موجود`);
          continue;
        }

        await this.updateOrderFields(
          businessId,
          orderId,
          { tracking_number: update.tracking_number },
          userId
        );
        success++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`فشل تحديث رقم التتبع: ${message}`);
      }
    }

    return { success, failed: updates.length - success, errors };
  }

  static async bulkUpdateDeliveryStatus(
    businessId: string,
    updates: BulkDeliveryUpdate[],
    userId: string
  ): Promise<BulkUpdateResult> {
    let success = 0;
    const errors: string[] = [];

    const { data: statuses } = await supabase
      .from('statuses')
      .select('id, key')
      .eq('business_id', businessId);

    const deliveredStatus = statuses?.find(s => s.key === 'delivered');
    const returnedStatus = statuses?.find(s => s.key === 'returned' || s.key === 'rto');

    for (const update of updates) {
      try {
        let orderId = update.order_id;

        if (!orderId && update.tracking_number) {
          const { data } = await supabase
            .from('orders')
            .select('id')
            .eq('business_id', businessId)
            .eq('tracking_number', update.tracking_number)
            .maybeSingle();

          orderId = data?.id;
        }

        if (!orderId) {
          errors.push(`الطلب برقم التتبع "${update.tracking_number}" غير موجود`);
          continue;
        }

        const patch: OrderUpdatePatch = {};

        if (update.status === 'delivered') {
          if (deliveredStatus) {
            await this.updateOrderStatus(businessId, orderId, deliveredStatus.id, userId);
          }
          if (update.collected_amount !== undefined) {
            patch.collected_amount = update.collected_amount;
            patch.collection_status = 'collected';
          }
        } else if (update.status === 'returned') {
          if (returnedStatus) {
            await this.updateOrderStatus(businessId, orderId, returnedStatus.id, userId);
          }
          if (update.return_reason) {
            patch.return_reason = update.return_reason;
          }
          patch.collection_status = 'failed';
        }

        if (Object.keys(patch).length > 0) {
          await this.updateOrderFields(businessId, orderId, patch, userId);
        }

        success++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`فشل تحديث حالة التسليم: ${message}`);
      }
    }

    return { success, failed: updates.length - success, errors };
  }

  static async lockOrder(
    businessId: string,
    orderId: string,
    employeeId: string
  ): Promise<{ success: boolean; error?: string; expires_at?: string }> {
    const { data, error } = await supabase.rpc('lock_order_for_processing', {
      p_business_id: businessId,
      p_order_id: orderId,
      p_employee_id: employeeId,
      p_duration_minutes: 10
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    return { success: true, expires_at: data.expires_at };
  }

  static async unlockOrder(orderId: string, employeeId?: string): Promise<void> {
    await supabase.rpc('unlock_order', {
      p_order_id: orderId,
      p_employee_id: employeeId || null
    });
  }

  static async getUnlockedOrders(
    businessId: string,
    filters: OrderFilters = {}
  ): Promise<OrderWithRelations[]> {
    const response = await this.listOrders(
      businessId,
      { ...filters, processing_status: 'pending' },
      { page: 1, pageSize: 100 },
      { field: 'created_at', direction: 'asc' }
    );

    return response.rows;
  }

  static async createOrder(
    businessId: string,
    input: OrderCreateInput,
    userId: string
  ): Promise<Order> {
    await this.ensureCanAddOrders(businessId, 1);

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    let totalRevenue = 0;
    let totalCost = 0;

    for (const item of input.items) {
      const { data: product } = await supabase
        .from('products')
        .select('cost')
        .eq('id', item.product_id)
        .maybeSingle();

      totalRevenue += item.unit_price * item.quantity;
      totalCost += (product?.cost || 0) * item.quantity;
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        business_id: businessId,
        order_number: `ORD-${timestamp}-${random}`,
        order_date: input.order_date,
        customer_id: input.customer_id || null,
        customer_name: input.customer_name,
        customer_phone: input.customer_phone || null,
        customer_address: input.customer_address || null,
        country_id: input.country_id || null,
        city_id: input.city_id || null,
        carrier_id: input.carrier_id || null,
        employee_id: input.employee_id || null,
        status_id: input.status_id || null,
        order_source: input.order_source || null,
        notes: input.notes || null,
        revenue: totalRevenue,
        cost: totalCost,
        shipping_cost: input.shipping_cost || 0,
        cod_fees: input.cod_fees || 0,
        created_by: userId,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    for (const item of input.items) {
      const { data: product } = await supabase
        .from('products')
        .select('cost')
        .eq('id', item.product_id)
        .maybeSingle();

      await supabase.from('order_items').insert({
        order_id: order.id,
        business_id: businessId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: product?.cost || 0,
      });
    }

    return order as Order;
  }

  static async duplicateOrder(
    businessId: string,
    orderId: string,
    userId: string
  ): Promise<Order> {
    const original = await this.getOrderById(orderId);
    if (!original) throw new Error('Order not found');

    const items = await this.getOrderItems(orderId);

    return this.createOrder(businessId, {
      order_date: new Date().toISOString().split('T')[0],
      customer_name: original.customer_name || '',
      customer_phone: original.customer_phone || undefined,
      customer_address: original.customer_address || undefined,
      country_id: original.country_id || undefined,
      city_id: original.city_id || undefined,
      carrier_id: original.carrier_id || undefined,
      order_source: original.order_source || undefined,
      notes: `نسخة من الطلب #${original.order_number}`,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    }, userId);
  }

  static async exportOrdersCsv(
    businessId: string,
    filters: OrderFilters = {}
  ): Promise<string> {
    const response = await this.listOrders(
      businessId,
      filters,
      { page: 1, pageSize: 10000 },
      { field: 'order_date', direction: 'desc' }
    );

    const headers = [
      'رقم الطلب',
      'التاريخ',
      'اسم العميل',
      'رقم الهاتف',
      'الدولة',
      'المدينة',
      'العنوان',
      'الحالة',
      'شركة الشحن',
      'رقم التتبع',
      'الموظف',
      'الإيراد',
      'التكلفة',
      'الشحن',
      'رسوم COD',
      'المبلغ المحصل',
      'الربح الصافي',
      'ملاحظات',
    ];

    const rows = response.rows.map((order) => [
      order.order_number || order.id.substring(0, 8),
      new Date(order.order_date).toLocaleDateString('ar-EG'),
      order.customer_name || '',
      order.customer_phone || '',
      order.country?.name_ar || '',
      order.city?.name_ar || '',
      order.customer_address || '',
      order.status?.name_ar || '',
      order.carrier?.name_ar || '',
      order.tracking_number || '',
      order.employee?.name_ar || '',
      order.revenue?.toFixed(2) || '0',
      order.cost?.toFixed(2) || '0',
      order.shipping_cost?.toFixed(2) || '0',
      order.cod_fees?.toFixed(2) || '0',
      order.collected_amount?.toFixed(2) || '',
      (order.profit || (order.revenue - order.cost - order.shipping_cost - (order.cod_fees || 0))).toFixed(2),
      order.notes || '',
    ]);

    const csvContent = [
      '\ufeff' + headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  static async exportForCarrier(
    businessId: string,
    orderIds: string[],
    carrierFormat: 'aramex' | 'smsa' | 'dhl' | 'generic' = 'generic'
  ): Promise<string> {
    const orders: OrderWithRelations[] = [];

    for (const id of orderIds) {
      const order = await this.getOrderById(id);
      if (order) orders.push(order);
    }

    let headers: string[];
    let mapRow: (order: OrderWithRelations) => string[];

    switch (carrierFormat) {
      case 'aramex':
        headers = ['Order ID', 'Consignee Name', 'Phone', 'Address', 'City', 'Country', 'COD Amount', 'Weight'];
        mapRow = (order) => [
          order.order_number || order.id.substring(0, 8),
          order.customer_name || '',
          order.customer_phone || '',
          order.customer_address || '',
          order.city?.name_ar || '',
          order.country?.name_ar || '',
          order.revenue?.toString() || '0',
          '0.5',
        ];
        break;
      case 'smsa':
        headers = ['Reference', 'Name', 'Mobile', 'Address Line 1', 'City', 'COD'];
        mapRow = (order) => [
          order.order_number || order.id.substring(0, 8),
          order.customer_name || '',
          order.customer_phone || '',
          order.customer_address || '',
          order.city?.name_ar || '',
          order.revenue?.toString() || '0',
        ];
        break;
      default:
        headers = ['Order Number', 'Customer Name', 'Phone', 'Address', 'City', 'COD Amount'];
        mapRow = (order) => [
          order.order_number || order.id.substring(0, 8),
          order.customer_name || '',
          order.customer_phone || '',
          order.customer_address || '',
          order.city?.name_ar || '',
          order.revenue?.toString() || '0',
        ];
    }

    const csvContent = [
      '\ufeff' + headers.join(','),
      ...orders.map((order) =>
        mapRow(order).map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  static async importOrdersStrict(
    businessId: string,
    userId: string,
    csvContent: string
  ): Promise<ImportResult> {
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      return {
        success: 0,
        failed: 0,
        errors: [],
        headerErrors: ['الملف فارغ أو لا يحتوي على بيانات'],
        productsCreated: [],
      };
    }

    const delimiter = detectCSVDelimiter(lines[0]);
    const headers = parseCSVLine(lines[0], delimiter).map(h => h.replace(/^"|"$/g, ''));
    const dataRows = lines.slice(1).map(line => parseCSVLine(line, delimiter).map(v => v.replace(/^"|"$/g, '')));

    const validation = validateImportData(headers, dataRows);

    if (!validation.headerValidation.isValid) {
      return {
        success: 0,
        failed: validation.totalRows,
        errors: [],
        headerErrors: validation.headerValidation.missingRequired.map(
          col => `العمود المطلوب غير موجود: ${col}`
        ),
        productsCreated: [],
      };
    }

    if (validation.validRows.length === 0) {
      return {
        success: 0,
        failed: validation.invalidRows.length,
        errors: validation.invalidRows,
        headerErrors: [],
        productsCreated: [],
      };
    }

    await this.ensureCanAddOrders(businessId, validation.validRows.length);

    const skuCache = new Map<string, { id: string; cost: number }>();
    const productsCreated: string[] = [];
    let success = 0;
    const insertErrors: Array<{ rowNumber: number; errors: RowValidationError[] }> = [];

    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, sku, cost')
      .eq('business_id', businessId)
      .not('sku', 'is', null);

    if (existingProducts) {
      for (const product of existingProducts) {
        if (product.sku) {
          skuCache.set(product.sku.toLowerCase().trim(), { id: product.id, cost: product.cost || 0 });
        }
      }
    }

    const { data: defaultStatus } = await supabase
      .from('statuses')
      .select('id')
      .eq('business_id', businessId)
      .order('is_default', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    for (const row of validation.validRows) {
      try {
        const skuKey = row.sku.toLowerCase().trim();
        const productData = skuCache.get(skuKey);

        if (!productData) {
          insertErrors.push({
            rowNumber: row.rowNumber,
            errors: [{
              rowNumber: row.rowNumber,
              column: 'SKU',
              message: `المنتج برمز "${row.sku}" غير موجود. يجب إضافة المنتج أولاً من صفحة المنتجات.`,
            }],
          });
          continue;
        }

        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderNumber = row.order_number || `ORD-${timestamp}-${random}`;

        const productCost = productData.cost * row.quantity;

        const orderData = {
          business_id: businessId,
          order_number: orderNumber,
          order_date: row.date || new Date().toISOString().split('T')[0],
          customer_name: row.customer_name,
          customer_phone: row.phone,
          customer_address: [row.city, row.address].filter(Boolean).join(' - ') || null,
          status_id: defaultStatus?.id || null,
          revenue: row.price * row.quantity,
          cost: productCost,
          shipping_cost: 0,
          cod_fees: 0,
          notes: row.notes || null,
        };

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id')
          .single();

        if (orderError) {
          insertErrors.push({
            rowNumber: row.rowNumber,
            errors: [{
              rowNumber: row.rowNumber,
              column: 'Database',
              message: orderError.message,
            }],
          });
          continue;
        }

        if (order) {
          await supabase.from('order_items').insert({
            order_id: order.id,
            business_id: businessId,
            product_id: productData.id,
            quantity: row.quantity,
            unit_price: row.price,
            unit_cost: productData.cost,
          });
        }

        success++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'خطأ غير معروف';
        insertErrors.push({
          rowNumber: row.rowNumber,
          errors: [{
            rowNumber: row.rowNumber,
            column: 'System',
            message,
          }],
        });
      }
    }

    return {
      success,
      failed: validation.invalidRows.length + insertErrors.length,
      errors: [...validation.invalidRows, ...insertErrors],
      headerErrors: [],
      productsCreated: [...new Set(productsCreated)],
    };
  }

  static async importOrdersCsv(
    businessId: string,
    userId: string,
    csvContent: string
  ): Promise<{ success: number; errors: string[] }> {
    const result = await this.importOrdersStrict(businessId, userId, csvContent);

    const errors: string[] = [
      ...result.headerErrors,
      ...result.errors.flatMap(e =>
        e.errors.map(err => `الصف ${err.rowNumber}: ${err.message}${err.value ? ` (${err.value})` : ''}`)
      ),
    ];

    return {
      success: result.success,
      errors,
    };
  }

  static async createOrderMinimal(
    businessId: string,
    orderData: {
      order_date: string;
      customer_name: string;
      customer_phone?: string;
      customer_address?: string;
      country_id?: string;
      city_id?: string;
      carrier_id?: string;
      employee_id?: string;
      status_id?: string;
      revenue?: number;
      cost?: number;
      shipping_cost?: number;
      notes?: string;
    }
  ): Promise<Order> {
    await this.ensureCanAddOrders(businessId, 1);

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    const { data, error } = await supabase
      .from('orders')
      .insert({
        business_id: businessId,
        order_number: `ORD-${timestamp}-${random}`,
        order_date: orderData.order_date,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone || null,
        customer_address: orderData.customer_address || null,
        country_id: orderData.country_id || null,
        city_id: orderData.city_id || null,
        carrier_id: orderData.carrier_id || null,
        employee_id: orderData.employee_id || null,
        status_id: orderData.status_id || null,
        revenue: orderData.revenue || 0,
        cost: orderData.cost || 0,
        shipping_cost: orderData.shipping_cost || 0,
        cod_fees: 0,
        notes: orderData.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return data as Order;
  }
}
