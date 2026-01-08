import { supabase } from './supabase';
import { AuditService } from './audit.service';
import { exportToCSV } from '@/utils/csv';
import type { Employee } from '@/types/domain';

export interface EmployeeFilters {
  search?: string;
  activeOnly?: boolean;
  sort?: 'name_ar' | 'created_at';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateEmployeeInput {
  name_ar: string;
  role?: string;
}

export interface UpdateEmployeeInput {
  name_ar?: string;
  role?: string;
}

export class EmployeesService {
  static async list(businessId: string, filters: EmployeeFilters = {}): Promise<Employee[]> {
    let query = supabase.from('employees').select('*').eq('business_id', businessId);

    if (filters.activeOnly !== undefined) {
      query = query.eq('active', filters.activeOnly);
    }

    if (filters.search) {
      query = query.or(`name_ar.ilike.%${filters.search}%,role.ilike.%${filters.search}%`);
    }

    const sortField = filters.sort || 'created_at';
    const sortDir = filters.sortDirection || 'desc';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  static async create(businessId: string, input: CreateEmployeeInput): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        business_id: businessId,
        name_ar: input.name_ar,
        role: input.role || null,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'employees',
      entity_id: data.id,
      action: 'create',
      after: data,
    });

    return data;
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

    const { data, error } = await supabase
      .from('employees')
      .update(input)
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
      before,
      after: data,
    });

    return data;
  }

  static async toggleActive(
    businessId: string,
    employeeId: string,
    active: boolean
  ): Promise<Employee> {
    const { data: before } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single();

    const { data, error } = await supabase
      .from('employees')
      .update({ active })
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'employees',
      entity_id: employeeId,
      action: 'toggle_active',
      before,
      after: data,
    });

    return data;
  }

  static async exportCSV(businessId: string, filters: EmployeeFilters = {}): Promise<void> {
    const employees = await this.list(businessId, filters);

    const headers = [
      { key: 'name_ar', label: 'الاسم' },
      { key: 'role', label: 'الدور' },
      { key: 'active', label: 'نشط' },
    ];

    const data = employees.map((e) => ({
      name_ar: e.name_ar,
      role: e.role || '',
      active: e.active ? 'نعم' : 'لا',
    }));

    exportToCSV(data, `employees-${Date.now()}.csv`, headers);
  }

  static async importCSV(
    businessId: string,
    file: File
  ): Promise<{ success: number; errors: string[] }> {
    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('الملف فارغ أو لا يحتوي على بيانات');
    }

    const results = { success: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

        if (cols.length < 1) continue;

        const name_ar = cols[0];
        const role = cols[1] || null;

        if (!name_ar) {
          results.errors.push(`السطر ${i + 1}: اسم الموظف مطلوب`);
          continue;
        }

        await this.create(businessId, { name_ar, role: role || undefined });
        results.success++;
      } catch (error: any) {
        results.errors.push(`السطر ${i + 1}: ${error.message}`);
      }
    }

    await AuditService.log({
      business_id: businessId,
      entity_type: 'employees',
      entity_id: 'bulk',
      action: 'import',
      after: { success: results.success, errors_count: results.errors.length },
    });

    return results;
  }
}
