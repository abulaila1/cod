import { supabase } from './supabase';
import { AuditService } from './audit.service';
import { exportToExcel } from '@/utils/excel';
import { parseImportFile } from '@/utils/file-parser';

export interface Employee {
  id: string;
  business_id: string;
  name_ar: string;
  name_en: string | null;
  email: string | null;
  salary: number;
  permissions: string[];
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface EmployeeBonus {
  id: string;
  business_id: string;
  employee_id: string;
  amount: number;
  reason: string | null;
  month: string;
  created_by: string | null;
  created_at: string;
}

export interface EmployeeLogin {
  id: string;
  business_id: string;
  employee_id: string;
  login_at: string;
  ip_address: string | null;
  success: boolean;
}

export interface EmployeeActivity {
  id: string;
  business_id: string;
  employee_id: string;
  order_id: string | null;
  action_type: string;
  old_status_id: string | null;
  new_status_id: string | null;
  created_at: string;
}

export interface EmployeeAnalytics {
  total_orders_confirmed: number;
  total_orders_processed: number;
  total_status_changes: number;
  orders_by_status: { status_id: string; status_name: string; count: number }[];
  activity_by_day: { date: string; count: number }[];
  confirmation_rate: number;
  delivery_rate: number;
}

export interface EmployeeFilters {
  search?: string;
  activeOnly?: boolean;
  sort?: 'name_ar' | 'created_at' | 'salary';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateEmployeeInput {
  name_ar: string;
  name_en?: string;
  email?: string;
  password?: string;
  salary?: number;
  permissions?: string[];
}

export interface UpdateEmployeeInput {
  name_ar?: string;
  name_en?: string;
  email?: string;
  password?: string;
  salary?: number;
  permissions?: string[];
  is_active?: boolean;
}

export const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard' },
  { key: 'orders', label: 'الطلبات', icon: 'ShoppingCart' },
  { key: 'products', label: 'المنتجات', icon: 'Package' },
  { key: 'carriers', label: 'شركات الشحن', icon: 'Truck' },
  { key: 'countries', label: 'الدول والمدن', icon: 'Globe' },
  { key: 'employees', label: 'الموظفين', icon: 'Users' },
  { key: 'reports', label: 'التقارير', icon: 'BarChart3' },
  { key: 'settings', label: 'الإعدادات', icon: 'Settings' },
  { key: 'statuses', label: 'حالات الطلبات', icon: 'Tag' },
];

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(16) + '_' + password.length;
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export class EmployeesService {
  static async list(businessId: string, filters: EmployeeFilters = {}): Promise<Employee[]> {
    let query = supabase
      .from('employees')
      .select('*')
      .eq('business_id', businessId);

    if (filters.activeOnly !== undefined) {
      query = query.eq('is_active', filters.activeOnly);
    }

    if (filters.search) {
      query = query.or(`name_ar.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const sortField = filters.sort || 'created_at';
    const sortDir = filters.sortDirection || 'desc';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(e => ({
      ...e,
      permissions: e.permissions || [],
      salary: e.salary || 0,
      active: e.is_active,
    }));
  }

  static async getById(businessId: string, employeeId: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      permissions: data.permissions || [],
      salary: data.salary || 0,
      active: data.is_active,
    };
  }

  static async create(businessId: string, input: CreateEmployeeInput): Promise<Employee> {
    const insertData: Record<string, unknown> = {
      business_id: businessId,
      name_ar: input.name_ar,
      name_en: input.name_en || input.name_ar,
      email: input.email || null,
      salary: input.salary || 0,
      permissions: input.permissions || [],
      is_active: true,
    };

    if (input.password) {
      insertData.password_hash = hashPassword(input.password);
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'employees',
      entity_id: data.id,
      action: 'create',
      changes: { created: { ...data, password_hash: undefined } },
    });

    return {
      ...data,
      permissions: data.permissions || [],
      salary: data.salary || 0,
      active: data.is_active,
    };
  }

  static async update(
    businessId: string,
    employeeId: string,
    input: UpdateEmployeeInput
  ): Promise<Employee> {
    const { data: before } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single();

    const updateData: Record<string, unknown> = {};
    if (input.name_ar !== undefined) updateData.name_ar = input.name_ar;
    if (input.name_en !== undefined) updateData.name_en = input.name_en;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.salary !== undefined) updateData.salary = input.salary;
    if (input.permissions !== undefined) updateData.permissions = input.permissions;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;
    if (input.password) {
      updateData.password_hash = hashPassword(input.password);
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'employees',
      entity_id: employeeId,
      action: 'update',
      changes: { before: { ...before, password_hash: undefined }, after: { ...data, password_hash: undefined } },
    });

    return {
      ...data,
      permissions: data.permissions || [],
      salary: data.salary || 0,
      active: data.is_active,
    };
  }

  static async toggleActive(
    businessId: string,
    employeeId: string,
    isActive: boolean
  ): Promise<Employee> {
    return this.update(businessId, employeeId, { is_active: isActive });
  }

  static async delete(businessId: string, employeeId: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId)
      .eq('business_id', businessId);

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'employees',
      entity_id: employeeId,
      action: 'delete',
      changes: { deleted: true },
    });
  }

  static async verifyLogin(
    businessId: string,
    email: string,
    password: string
  ): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('business_id', businessId)
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;

    if (!data.password_hash || !verifyPassword(password, data.password_hash)) {
      await supabase.from('employee_logins').insert({
        business_id: businessId,
        employee_id: data.id,
        success: false,
      });
      return null;
    }

    await supabase.from('employee_logins').insert({
      business_id: businessId,
      employee_id: data.id,
      success: true,
    });

    await supabase
      .from('employees')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.id);

    return {
      ...data,
      permissions: data.permissions || [],
      salary: data.salary || 0,
      active: data.is_active,
      last_login_at: new Date().toISOString(),
    };
  }

  static async getLoginHistory(
    businessId: string,
    employeeId: string,
    limit: number = 10
  ): Promise<EmployeeLogin[]> {
    const { data, error } = await supabase
      .from('employee_logins')
      .select('*')
      .eq('business_id', businessId)
      .eq('employee_id', employeeId)
      .order('login_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getLastSuccessfulLogin(
    businessId: string,
    employeeId: string
  ): Promise<EmployeeLogin | null> {
    const { data, error } = await supabase
      .from('employee_logins')
      .select('*')
      .eq('business_id', businessId)
      .eq('employee_id', employeeId)
      .eq('success', true)
      .order('login_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async addBonus(
    businessId: string,
    employeeId: string,
    amount: number,
    reason: string,
    month?: string
  ): Promise<EmployeeBonus> {
    const bonusMonth = month || new Date().toISOString().slice(0, 7);

    const { data, error } = await supabase
      .from('employee_bonuses')
      .insert({
        business_id: businessId,
        employee_id: employeeId,
        amount,
        reason,
        month: bonusMonth,
      })
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'employee_bonuses',
      entity_id: data.id,
      action: 'create',
      changes: { bonus: data },
    });

    return data;
  }

  static async getBonuses(
    businessId: string,
    employeeId: string,
    month?: string
  ): Promise<EmployeeBonus[]> {
    let query = supabase
      .from('employee_bonuses')
      .select('*')
      .eq('business_id', businessId)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (month) {
      query = query.eq('month', month);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getTotalBonuses(
    businessId: string,
    employeeId: string,
    month?: string
  ): Promise<number> {
    const bonuses = await this.getBonuses(businessId, employeeId, month);
    return bonuses.reduce((sum, b) => sum + (b.amount || 0), 0);
  }

  static async deleteBonus(businessId: string, bonusId: string): Promise<void> {
    const { error } = await supabase
      .from('employee_bonuses')
      .delete()
      .eq('id', bonusId)
      .eq('business_id', businessId);

    if (error) throw error;
  }

  static async logActivity(
    businessId: string,
    employeeId: string,
    orderId: string | null,
    actionType: string,
    oldStatusId?: string,
    newStatusId?: string
  ): Promise<void> {
    const { error } = await supabase.from('employee_activity').insert({
      business_id: businessId,
      employee_id: employeeId,
      order_id: orderId,
      action_type: actionType,
      old_status_id: oldStatusId || null,
      new_status_id: newStatusId || null,
    });

    if (error) throw error;
  }

  static async getAnalytics(
    businessId: string,
    employeeId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<EmployeeAnalytics> {
    let activityQuery = supabase
      .from('employee_activity')
      .select('*')
      .eq('business_id', businessId)
      .eq('employee_id', employeeId);

    if (dateFrom) {
      activityQuery = activityQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      activityQuery = activityQuery.lte('created_at', dateTo + 'T23:59:59');
    }

    const { data: activities, error: actError } = await activityQuery;
    if (actError) throw actError;

    const activityList = activities || [];

    const confirmedOrders = activityList.filter(a => a.action_type === 'confirmed');
    const statusChanges = activityList.filter(a => a.action_type === 'status_changed');

    let ordersQuery = supabase
      .from('orders')
      .select('id, status_id, statuses!inner(name_ar, is_final, is_delivered)')
      .eq('business_id', businessId)
      .eq('employee_id', employeeId);

    if (dateFrom) {
      ordersQuery = ordersQuery.gte('order_date', dateFrom);
    }
    if (dateTo) {
      ordersQuery = ordersQuery.lte('order_date', dateTo);
    }

    const { data: orders, error: ordError } = await ordersQuery;
    if (ordError) throw ordError;

    const ordersList = orders || [];
    const totalOrders = ordersList.length;
    const deliveredOrders = ordersList.filter((o: any) => o.statuses?.is_delivered).length;

    const statusCounts: Record<string, { name: string; count: number }> = {};
    ordersList.forEach((o: any) => {
      const statusId = o.status_id;
      const statusName = o.statuses?.name_ar || 'غير معروف';
      if (!statusCounts[statusId]) {
        statusCounts[statusId] = { name: statusName, count: 0 };
      }
      statusCounts[statusId].count++;
    });

    const activityByDay: Record<string, number> = {};
    activityList.forEach(a => {
      const date = a.created_at.split('T')[0];
      activityByDay[date] = (activityByDay[date] || 0) + 1;
    });

    return {
      total_orders_confirmed: confirmedOrders.length,
      total_orders_processed: totalOrders,
      total_status_changes: statusChanges.length,
      orders_by_status: Object.entries(statusCounts).map(([status_id, { name, count }]) => ({
        status_id,
        status_name: name,
        count,
      })),
      activity_by_day: Object.entries(activityByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      confirmation_rate: totalOrders > 0 ? (confirmedOrders.length / totalOrders) * 100 : 0,
      delivery_rate: totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0,
    };
  }

  static async exportCSV(businessId: string, filters: EmployeeFilters = {}): Promise<void> {
    const employees = await this.list(businessId, filters);

    const headers = [
      { key: 'name_ar', label: 'الاسم' },
      { key: 'name_en', label: 'الاسم بالانجليزي' },
      { key: 'email', label: 'البريد الإلكتروني' },
      { key: 'salary', label: 'الراتب' },
      { key: 'is_active', label: 'نشط' },
    ];

    const data = employees.map((e) => ({
      name_ar: e.name_ar,
      name_en: e.name_en || '',
      email: e.email || '',
      salary: e.salary,
      is_active: e.is_active ? 'نعم' : 'لا',
    }));

    exportToExcel(data, `employees-${Date.now()}.xlsx`, headers);
  }

  static async importCSV(
    businessId: string,
    file: File
  ): Promise<{ success: number; errors: string[] }> {
    const parsed = await parseImportFile(file);

    const results = { success: 0, errors: [] as string[] };

    for (let i = 0; i < parsed.dataRows.length; i++) {
      try {
        const cols = parsed.dataRows[i];

        if (cols.length < 1) continue;

        const name_ar = cols[0];
        const role = cols[1] || null;

        if (!name_ar) {
          results.errors.push(`السطر ${i + 2}: اسم الموظف مطلوب`);
          continue;
        }

        await this.create(businessId, { name_ar, role: role || undefined });
        results.success++;
      } catch (error: any) {
        results.errors.push(`السطر ${i + 2}: ${error.message}`);
      }
    }

    await AuditService.log({
      business_id: businessId,
      entity_type: 'employees',
      entity_id: 'bulk',
      action: 'import',
      changes: { success: results.success, errors_count: results.errors.length },
    });

    return results;
  }
}
