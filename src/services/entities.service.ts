import { supabase } from './supabase';
import type { Country, Carrier, Employee, Product } from '@/types/domain';

export class EntitiesService {
  static async getCountries(businessId: string): Promise<Country[]> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('business_id', businessId)
      .order('name_ar', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getCarriers(businessId: string): Promise<Carrier[]> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('business_id', businessId)
      .order('name_ar', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getEmployees(businessId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('business_id', businessId)
      .order('name_ar', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getProducts(businessId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('name_ar', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
