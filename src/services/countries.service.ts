import { supabase } from './supabase';
import { AuditService } from './audit.service';
import { exportToCSV } from '@/utils/csv';
import { exportToExcel } from '@/utils/excel';
import { parseImportFile } from '@/utils/file-parser';
import type { Country } from '@/types/domain';

export interface CountryFilters {
  search?: string;
  activeOnly?: boolean;
  sort?: 'name_ar' | 'created_at';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateCountryInput {
  name_ar: string;
  currency?: string;
}

export interface UpdateCountryInput {
  name_ar?: string;
  currency?: string;
}

export class CountriesService {
  static async list(businessId: string, filters: CountryFilters = {}): Promise<Country[]> {
    let query = supabase.from('countries').select('*').eq('business_id', businessId);

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

  static async create(businessId: string, input: CreateCountryInput): Promise<Country> {
    const { data, error } = await supabase
      .from('countries')
      .insert({
        business_id: businessId,
        name_ar: input.name_ar,
        currency: input.currency || null,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'countries',
      entity_id: data.id,
      action: 'create',
      changes: { created: data },
    });

    return data;
  }

  static async update(
    businessId: string,
    countryId: string,
    input: UpdateCountryInput
  ): Promise<Country> {
    const { data: before } = await supabase
      .from('countries')
      .select('*')
      .eq('id', countryId)
      .eq('business_id', businessId)
      .single();

    const { data, error } = await supabase
      .from('countries')
      .update(input)
      .eq('id', countryId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'countries',
      entity_id: countryId,
      action: 'update',
      changes: { before, after: data },
    });

    return data;
  }

  static async toggleActive(
    businessId: string,
    countryId: string,
    active: boolean
  ): Promise<Country> {
    const { data: before } = await supabase
      .from('countries')
      .select('*')
      .eq('id', countryId)
      .eq('business_id', businessId)
      .single();

    const { data, error } = await supabase
      .from('countries')
      .update({ active })
      .eq('id', countryId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'countries',
      entity_id: countryId,
      action: 'toggle_active',
      changes: { before, after: data },
    });

    return data;
  }

  static async exportCSV(businessId: string, filters: CountryFilters = {}): Promise<void> {
    const countries = await this.list(businessId, filters);

    const headers = [
      { key: 'name_ar', label: 'الاسم' },
      { key: 'currency', label: 'العملة' },
      { key: 'active', label: 'نشط' },
    ];

    const data = countries.map((c) => ({
      name_ar: c.name_ar,
      currency: c.currency || '',
      active: c.active ? 'نعم' : 'لا',
    }));

    exportToExcel(data, `countries-${Date.now()}.xlsx`, headers);
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
        const currency = cols[1] || null;

        if (!name_ar) {
          results.errors.push(`السطر ${i + 2}: اسم الدولة مطلوب`);
          continue;
        }

        await this.create(businessId, { name_ar, currency: currency || undefined });
        results.success++;
      } catch (error: any) {
        results.errors.push(`السطر ${i + 2}: ${error.message}`);
      }
    }

    await AuditService.log({
      business_id: businessId,
      entity_type: 'countries',
      entity_id: 'bulk',
      action: 'import',
      changes: { success: results.success, errors_count: results.errors.length },
    });

    return results;
  }
}
