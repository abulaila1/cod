import { supabase } from './supabase';
import { AuditService } from './audit.service';
import { exportToExcel } from '@/utils/excel';
import { parseImportFile } from '@/utils/file-parser';
import type { Product, ProductCategory } from '@/types/domain';

export interface ProductFilters {
  search?: string;
  activeOnly?: boolean;
  category_id?: string;
  sort?: 'name' | 'created_at' | 'price' | 'stock';
  sortDirection?: 'asc' | 'desc';
}

export interface CreateProductInput {
  name_ar: string;
  name_en?: string;
  sku?: string;
  price: number;
  cost: number;
  category_id?: string;
  image_url?: string;
  physical_stock?: number;
}

export interface UpdateProductInput {
  name_ar?: string;
  name_en?: string;
  sku?: string;
  price?: number;
  cost?: number;
  category_id?: string | null;
  image_url?: string | null;
  physical_stock?: number;
  is_active?: boolean;
}

export class ProductsService {
  static async list(businessId: string, filters: ProductFilters = {}): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name_ar, name_en, color)
      `)
      .eq('business_id', businessId);

    if (filters.activeOnly !== undefined) {
      query = query.eq('is_active', filters.activeOnly);
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters.search) {
      query = query.or(`name_ar.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const sortField = filters.sort === 'name' ? 'name_ar' :
                      filters.sort === 'stock' ? 'physical_stock' :
                      filters.sort || 'created_at';
    const sortDir = filters.sortDirection || 'desc';
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  }

  static async getById(productId: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(id, name_ar, name_en, color)
      `)
      .eq('id', productId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getBySku(businessId: string, sku: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .eq('sku', sku)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create(businessId: string, input: CreateProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        business_id: businessId,
        name_ar: input.name_ar,
        name_en: input.name_en || '',
        sku: input.sku || null,
        price: input.price || 0,
        cost: input.cost || 0,
        category_id: input.category_id || null,
        image_url: input.image_url || null,
        physical_stock: input.physical_stock || 0,
        is_active: true,
      })
      .select(`
        *,
        category:product_categories(id, name_ar, name_en, color)
      `)
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'products',
      entity_id: data.id,
      action: 'create',
      changes: { created: data },
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
      .select(`
        *,
        category:product_categories(id, name_ar, name_en, color)
      `)
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'products',
      entity_id: productId,
      action: 'update',
      changes: { before, after: data },
    });

    return data;
  }

  static async delete(businessId: string, productId: string): Promise<void> {
    const { data: before } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('business_id', businessId)
      .single();

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('business_id', businessId);

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'products',
      entity_id: productId,
      action: 'delete',
      changes: { deleted: before },
    });
  }

  static async toggleActive(
    businessId: string,
    productId: string,
    active: boolean
  ): Promise<Product> {
    return this.update(businessId, productId, { is_active: active });
  }

  static async listCategories(businessId: string): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('business_id', businessId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createCategory(
    businessId: string,
    input: { name_ar: string; name_en?: string; color?: string }
  ): Promise<ProductCategory> {
    const { data: existing } = await supabase
      .from('product_categories')
      .select('display_order')
      .eq('business_id', businessId)
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder = (existing?.display_order || 0) + 1;

    const { data, error } = await supabase
      .from('product_categories')
      .insert({
        business_id: businessId,
        name_ar: input.name_ar,
        name_en: input.name_en || null,
        color: input.color || '#3B82F6',
        display_order: nextOrder,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCategory(
    categoryId: string,
    input: { name_ar?: string; name_en?: string; color?: string }
  ): Promise<ProductCategory> {
    const { data, error } = await supabase
      .from('product_categories')
      .update(input)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  }

  static async exportCSV(businessId: string, filters: ProductFilters = {}): Promise<void> {
    const products = await this.list(businessId, filters);

    const headers = [
      { key: 'name_ar', label: 'الاسم' },
      { key: 'sku', label: 'SKU' },
      { key: 'price', label: 'سعر البيع' },
      { key: 'cost', label: 'سعر التكلفة' },
      { key: 'physical_stock', label: 'المخزون' },
      { key: 'category', label: 'الفئة' },
      { key: 'is_active', label: 'نشط' },
    ];

    const data = products.map((p) => ({
      name_ar: p.name_ar,
      sku: p.sku || '',
      price: p.price,
      cost: p.cost,
      physical_stock: p.physical_stock,
      category: p.category?.name_ar || '',
      is_active: p.is_active ? 'نعم' : 'لا',
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
        const price = parseFloat(cols[2]) || 0;
        const cost = parseFloat(cols[3]) || 0;
        const physical_stock = parseInt(cols[4]) || 0;

        if (!name_ar) {
          results.errors.push(`السطر ${i + 2}: اسم المنتج مطلوب`);
          continue;
        }

        await this.create(businessId, {
          name_ar,
          sku: sku || undefined,
          price,
          cost,
          physical_stock,
        });
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
      changes: { success: results.success, errors_count: results.errors.length },
    });

    return results;
  }
}
