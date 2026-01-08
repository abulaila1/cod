import { supabase } from './supabase';
import { AuditService } from './audit.service';
import { exportToCSV } from '@/utils/csv';
import { exportToExcel } from '@/utils/excel';
import { parseImportFile } from '@/utils/file-parser';
import type { Carrier } from '@/types/domain';

export interface CarrierFilters {
  search?: string;
  activeOnly?: boolean;
  sort?: 'name_ar' | 'created_at';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateCarrierInput {
  name_ar: string;
}

export interface UpdateCarrierInput {
  name_ar?: string;
}

export class CarriersService {
  static async list(businessId: string, filters: CarrierFilters = {}): Promise<Carrier[]> {
    let query = supabase.from('carriers').select('*').eq('business_id', businessId);

    if (filters.activeOnly !== undefined) {
      query = query.eq('active', filters.activeOnly);
    }

    if (filters.search) {
      query = query.ilike('name_ar', `%${filters.search}%`);
    }

    const sortField = filters.sort || 'created_at';
    const sortDir = filters.sortDirection || 'desc';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  static async create(businessId: string, input: CreateCarrierInput): Promise<Carrier> {
    const { data, error } = await supabase
      .from('carriers')
      .insert({
        business_id: businessId,
        name_ar: input.name_ar,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'carriers',
      entity_id: data.id,
      action: 'create',
      changes: { created: data },
    });

    return data;
  }

  static async update(
    businessId: string,
    carrierId: string,
    input: UpdateCarrierInput
  ): Promise<Carrier> {
    const { data: before } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', carrierId)
      .eq('business_id', businessId)
      .single();

    const { data, error } = await supabase
      .from('carriers')
      .update(input)
      .eq('id', carrierId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'carriers',
      entity_id: carrierId,
      action: 'update',
      changes: { before, after: data },
    });

    return data;
  }

  static async toggleActive(
    businessId: string,
    carrierId: string,
    active: boolean
  ): Promise<Carrier> {
    const { data: before } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', carrierId)
      .eq('business_id', businessId)
      .single();

    const { data, error } = await supabase
      .from('carriers')
      .update({ active })
      .eq('id', carrierId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'carriers',
      entity_id: carrierId,
      action: 'toggle_active',
      changes: { before, after: data },
    });

    return data;
  }

  static async exportCSV(businessId: string, filters: CarrierFilters = {}): Promise<void> {
    const carriers = await this.list(businessId, filters);

    const headers = [
      { key: 'name_ar', label: 'الاسم' },
      { key: 'active', label: 'نشط' },
    ];

    const data = carriers.map((c) => ({
      name_ar: c.name_ar,
      active: c.active ? 'نعم' : 'لا',
    }));

    exportToExcel(data, `carriers-${Date.now()}.xlsx`, headers);
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

        if (!name_ar) {
          results.errors.push(`السطر ${i + 2}: اسم شركة الشحن مطلوب`);
          continue;
        }

        await this.create(businessId, { name_ar });
        results.success++;
      } catch (error: any) {
        results.errors.push(`السطر ${i + 2}: ${error.message}`);
      }
    }

    await AuditService.log({
      business_id: businessId,
      entity_type: 'carriers',
      entity_id: 'bulk',
      action: 'import',
      changes: { success: results.success, errors_count: results.errors.length },
    });

    return results;
  }
}
