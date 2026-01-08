import { supabase } from './supabase';
import { UsageService } from './usage.service';
import { BillingService } from './billing.service';
import type {
  Order,
  OrderItem,
  OrderWithRelations,
  OrderFilters,
  OrderPagination,
  OrderSorting,
  OrderListResponse,
  OrderUpdatePatch,
  AuditLogWithUser,
} from '@/types/domain';

export class OrdersService {
  private static async ensureCanAddOrders(
    businessId: string,
    ordersToAdd: number
  ): Promise<void> {
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
    let query = supabase
      .from('orders')
      .select(
        `
        *,
        status:statuses!inner(id, key, label_ar, is_final, counts_as_delivered, counts_as_return, counts_as_active),
        country:countries!inner(id, name_ar, currency),
        carrier:carriers!inner(id, name_ar),
        employee:employees!inner(id, name_ar, role)
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

    if (filters.carrier_id) {
      query = query.eq('carrier_id', filters.carrier_id);
    }

    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }

    if (filters.status_id) {
      query = query.eq('status_id', filters.status_id);
    }

    if (filters.status_key) {
      query = query.eq('statuses.key', filters.status_key);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `id.ilike.${searchTerm},notes.ilike.${searchTerm}`
      );
    }

    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;

    query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });
    query = query.range(from, to);

    let { data, error, count } = await query;

    if (error) throw error;

    if (filters.product_id && data) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', filters.product_id);

      const orderIdsWithProduct = new Set(orderItems?.map((i) => i.order_id) || []);
      data = data.filter((order) => orderIdsWithProduct.has(order.id));
      count = data.length;
    }

    const { data: finalData, error: finalError, count: finalCount } = { data, error: null, count };

    const total_count = finalCount || 0;
    const page_count = Math.ceil(total_count / pagination.pageSize);

    return {
      rows: (finalData || []) as OrderWithRelations[],
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
        status:statuses!inner(id, key, label_ar, is_final, counts_as_delivered, counts_as_return, counts_as_active),
        country:countries!inner(id, name_ar, currency),
        carrier:carriers!inner(id, name_ar),
        employee:employees!inner(id, name_ar, role)
      `
      )
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;
    return data as OrderWithRelations | null;
  }

  static async getOrderItems(orderId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select(
        `
        *,
        product:products!inner(id, name_ar, sku)
      `
      )
      .eq('order_id', orderId);

    if (error) throw error;
    return data || [];
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

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status_id: statusId })
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
        status_label: orderBefore.status.label_ar,
        note,
      },
      after: {
        status_id: orderAfter?.status_id,
        status_label: orderAfter?.status.label_ar,
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

  private static extractPatchFields(order: OrderWithRelations, patch: OrderUpdatePatch): any {
    const result: any = {};

    if (patch.revenue !== undefined) result.revenue = order.revenue;
    if (patch.cost !== undefined) result.cost = order.cost;
    if (patch.shipping_cost !== undefined) result.shipping_cost = order.shipping_cost;
    if (patch.notes !== undefined) result.notes = order.notes;
    if (patch.country_id !== undefined) {
      result.country_id = order.country_id;
      result.country_name = order.country.name_ar;
    }
    if (patch.carrier_id !== undefined) {
      result.carrier_id = order.carrier_id;
      result.carrier_name = order.carrier.name_ar;
    }
    if (patch.employee_id !== undefined) {
      result.employee_id = order.employee_id;
      result.employee_name = order.employee.name_ar;
    }

    return result;
  }

  static async bulkUpdateStatus(
    businessId: string,
    orderIds: string[],
    statusId: string,
    userId: string
  ): Promise<void> {
    const ordersBefore = await Promise.all(
      orderIds.map((id) => this.getOrderById(id))
    );

    for (const orderId of orderIds) {
      const orderBefore = ordersBefore.find((o) => o?.id === orderId);

      if (!orderBefore) continue;

      const { error: updateError } = await supabase
        .from('orders')
        .update({ status_id: statusId })
        .eq('id', orderId)
        .eq('business_id', businessId);

      if (updateError) {
        console.error(`Failed to update order ${orderId}:`, updateError);
        continue;
      }

      const orderAfter = await this.getOrderById(orderId);

      await supabase.from('audit_logs').insert({
        business_id: businessId,
        user_id: userId,
        entity_type: 'orders',
        entity_id: orderId,
        action: 'bulk_status_change',
        before: {
          status_id: orderBefore.status_id,
          status_label: orderBefore.status.label_ar,
        },
        after: {
          status_id: orderAfter?.status_id,
          status_label: orderAfter?.status.label_ar,
        },
      });
    }
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
      'الحالة',
      'الدولة',
      'شركة الشحن',
      'الموظف',
      'الإيراد',
      'التكلفة',
      'الشحن',
      'الربح الصافي',
      'ملاحظات',
    ];

    const rows = response.rows.map((order) => [
      order.id.substring(0, 8),
      new Date(order.order_date).toLocaleDateString('ar-EG'),
      order.status.label_ar,
      order.country.name_ar,
      order.carrier.name_ar,
      order.employee.name_ar,
      order.revenue.toFixed(2),
      order.cost.toFixed(2),
      order.shipping_cost.toFixed(2),
      order.profit.toFixed(2),
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

  static async importOrdersCsv(
    businessId: string,
    userId: string,
    csvContent: string
  ): Promise<{ success: number; errors: string[] }> {
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('ملف CSV فارغ أو غير صحيح');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const dataLines = lines.slice(1);

    await this.ensureCanAddOrders(businessId, dataLines.length);

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const values = this.parseCSVLine(dataLines[i]);

        const orderData: any = {
          business_id: businessId,
          order_date: new Date().toISOString().split('T')[0],
          revenue: 0,
          cost: 0,
          shipping_cost: 0,
        };

        let customerName = '';
        let phoneNumber = '';
        let governorate = '';
        let cityAddress = '';
        let productName = '';
        let quantity = 1;
        let price = 0;
        let notes = '';

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = values[j]?.trim() || '';

          if (header === 'customer name') {
            customerName = value;
          } else if (header === 'phone number') {
            phoneNumber = value;
          } else if (header === 'governorate') {
            governorate = value;
          } else if (header === 'city/address') {
            cityAddress = value;
          } else if (header === 'product name') {
            productName = value;
          } else if (header === 'quantity') {
            quantity = parseInt(value) || 1;
          } else if (header === 'price') {
            price = parseFloat(value) || 0;
          } else if (header === 'notes') {
            notes = value;
          }
        }

        if (!customerName) {
          errors.push(`الصف ${i + 2}: اسم العميل مطلوب`);
          continue;
        }

        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        orderData.order_number = `ORD-${timestamp}-${random}`;
        orderData.customer_name = customerName;
        orderData.customer_phone = phoneNumber || null;
        orderData.customer_address = [governorate, cityAddress].filter(Boolean).join(' - ') || null;
        orderData.revenue = price * quantity;
        orderData.notes = [
          `المنتج: ${productName}`,
          `الكمية: ${quantity}`,
          notes ? `ملاحظات: ${notes}` : '',
        ]
          .filter(Boolean)
          .join(' | ') || null;

        const { error } = await supabase.from('orders').insert(orderData);

        if (error) {
          errors.push(`الصف ${i + 2}: ${error.message}`);
        } else {
          success++;
        }
      } catch (err: any) {
        errors.push(`الصف ${i + 2}: ${err.message}`);
      }
    }

    return { success, errors };
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  static async createOrderMinimal(
    businessId: string,
    orderData: {
      order_date: string;
      customer_name: string;
      customer_phone?: string;
      customer_address?: string;
      country_id?: string;
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
        carrier_id: orderData.carrier_id || null,
        employee_id: orderData.employee_id || null,
        status_id: orderData.status_id || null,
        revenue: orderData.revenue || 0,
        cost: orderData.cost || 0,
        shipping_cost: orderData.shipping_cost || 0,
        notes: orderData.notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    return data as Order;
  }
}
