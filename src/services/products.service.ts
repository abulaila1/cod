import { supabase } from './supabase';
import { AuditService } from './audit.service';
import { exportToCSV } from '@/utils/csv';
import { exportToExcel } from '@/utils/excel';
import { parseImportFile } from '@/utils/file-parser';
import type { Product } from '@/types/domain';

export interface ProductFilters {
  search?: string;
  activeOnly?: boolean;
  sort?: 'name' | 'created_at';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateProductInput {
  name_ar: string;
  sku?: string;
  base_cogs: number;
}

export interface UpdateProductInput {
  name_ar?: string;
  sku?: string;
  base_cogs?: number;
}

export class ProductsService {
  static async list(businessId: string, filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase.from('products').select('*').eq('business_id', businessId);

    if (filters.activeOnly !== undefined) {
      query = query.eq('active', filters.activeOnly);
    }

    if (filters.search) {
      query = query.or(`name_ar.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const sortField = filters.sort || 'created_at';
    const sortDir = filters.sortDirection || 'desc';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  static async create(businessId: string, input: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        business_id: businessId,
        name_ar: input.name_ar,
        sku: input.sku || null,
        base_cogs: input.base_cogs,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'products',
      entity_id: data.id,
      action: 'create',
      after: data,
    });

    return data;
  }

  static async update(
    businessId: string,
    productId: string,
    input: UpdateProductInput
  ): Promise<Product> {
    const { data: before } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('business_id', businessId)
      .single();

    const { data, error } = await supabase
      .from('products')
      .update(input)
      .eq('id', productId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'products',
      entity_id: productId,
      action: 'update',
      before,
      after: data,
    });

    return data;
  }

  static async toggleActive(
    businessId: string,
    productId: string,
    active: boolean
  ): Promise<Product> {
    const { data: before } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('business_id', businessId)
      .single();

    const { data, error } = await supabase
      .from('products')
      .update({ active })
      .eq('id', productId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'products',
      entity_id: productId,
      action: 'toggle_active',
      before,
      after: data,
    });

    return data;
  }

  static async exportCSV(businessId: string, filters: ProductFilters = {}): Promise<void> {
    const products = await this.list(businessId, filters);

    const headers = [
      { key: 'name_ar', label: 'الاسم' },
      { key: 'sku', label: 'SKU' },
      { key: 'base_cogs', label: 'التكلفة الأساسية' },
      { key: 'active', label: 'نشط' },
    ];

    const data = products.map((p) => ({
      name_ar: p.name_ar,
      sku: p.sku || '',
      base_cogs: p.base_cogs,
      active: p.active ? 'نعم' : 'لا',
    }));

    exportToExcel(data, `products-${Date.now()}.xlsx`, headers);
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

        if (cols.length < 2) continue;

        const name_ar = cols[0];
        const sku = cols[1] || null;
        const base_cogs = parseFloat(cols[2]) || 0;

        if (!name_ar) {
          results.errors.push(`السطر ${i + 2}: اسم المنتج مطلوب`);
          continue;
        }

        await this.create(businessId, { name_ar, sku: sku || undefined, base_cogs });
        results.success++;
      } catch (error: any) {
        results.errors.push(`السطر ${i + 2}: ${error.message}`);
      }
    }

    await AuditService.log({
      business_id: businessId,
      entity_type: 'products',
      entity_id: 'bulk',
      action: 'import',
      after: { success: results.success, errors_count: results.errors.length },
    });

    return results;
  }
}
