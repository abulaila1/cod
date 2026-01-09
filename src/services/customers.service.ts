import { supabase } from './supabase';
import type { Customer, CustomerCreateInput } from '@/types/domain';

export class CustomersService {
  static async listCustomers(
    businessId: string,
    options: { search?: string; limit?: number; activeOnly?: boolean } = {}
  ): Promise<Customer[]> {
    let query = supabase
      .from('customers')
      .select('*, city:cities(id, name_ar, name_en)')
      .eq('business_id', businessId);

    if (options.activeOnly) {
      query = query.eq('is_active', true);
    }

    if (options.search) {
      const searchTerm = `%${options.search}%`;
      query = query.or(`name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
    }

    query = query.order('name', { ascending: true });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getCustomerById(customerId: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*, city:cities(id, name_ar, name_en)')
      .eq('id', customerId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async searchCustomers(
    businessId: string,
    searchTerm: string,
    limit: number = 10
  ): Promise<Customer[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const term = `%${searchTerm}%`;
    const { data, error } = await supabase
      .from('customers')
      .select('*, city:cities(id, name_ar, name_en)')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .or(`name.ilike.${term},phone.ilike.${term}`)
      .order('total_orders', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async createCustomer(
    businessId: string,
    input: CustomerCreateInput
  ): Promise<Customer> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_id: businessId,
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        city_id: input.city_id || null,
        address: input.address || null,
        notes: input.notes || null,
        created_by: user?.id || null,
      })
      .select('*, city:cities(id, name_ar, name_en)')
      .single();

    if (error) throw error;
    return data;
  }

  static async updateCustomer(
    businessId: string,
    customerId: string,
    input: Partial<CustomerCreateInput>
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .eq('business_id', businessId)
      .select('*, city:cities(id, name_ar, name_en)')
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteCustomer(businessId: string, customerId: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)
      .eq('business_id', businessId);

    if (error) throw error;
  }

  static async getCustomerByPhone(businessId: string, phone: string): Promise<Customer | null> {
    if (!phone) return null;

    const { data, error } = await supabase
      .from('customers')
      .select('*, city:cities(id, name_ar, name_en)')
      .eq('business_id', businessId)
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
