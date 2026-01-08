import { supabase } from './supabase';
import { AuditService } from './audit.service';

export interface Country {
  id: string;
  business_id: string;
  name_ar: string;
  name_en?: string;
  code: string;
  currency: string;
  currency_symbol: string;
  shipping_cost: number;
  is_active: boolean;
  created_at?: string;
}

export interface City {
  id: string;
  business_id: string;
  country_id: string;
  name_ar: string;
  name_en?: string;
  shipping_cost: number;
  is_active: boolean;
  created_at?: string;
}

export interface CityFilters {
  search?: string;
  activeOnly?: boolean;
}

export class CountriesService {
  static async getCountry(businessId: string): Promise<Country | null> {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('business_id', businessId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createOrUpdateCountry(
    businessId: string,
    input: {
      name_ar: string;
      name_en?: string;
      code: string;
      currency: string;
      currency_symbol: string;
    }
  ): Promise<Country> {
    const existing = await this.getCountry(businessId);

    if (existing) {
      const { data, error } = await supabase
        .from('countries')
        .update({
          name_ar: input.name_ar,
          name_en: input.name_en || input.name_ar,
          code: input.code,
          currency: input.currency,
          currency_symbol: input.currency_symbol,
        })
        .eq('id', existing.id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (error) throw error;

      await AuditService.log({
        business_id: businessId,
        entity_type: 'countries',
        entity_id: data.id,
        action: 'update',
        changes: { before: existing, after: data },
      });

      return data;
    } else {
      const { data, error } = await supabase
        .from('countries')
        .insert({
          business_id: businessId,
          name_ar: input.name_ar,
          name_en: input.name_en || input.name_ar,
          code: input.code,
          currency: input.currency,
          currency_symbol: input.currency_symbol,
          is_active: true,
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
  }

  static async listCities(businessId: string, filters: CityFilters = {}): Promise<City[]> {
    const country = await this.getCountry(businessId);
    if (!country) return [];

    let query = supabase
      .from('cities')
      .select('*')
      .eq('business_id', businessId)
      .eq('country_id', country.id);

    if (filters.activeOnly) {
      query = query.eq('is_active', true);
    }

    if (filters.search) {
      query = query.or(`name_ar.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%`);
    }

    query = query.order('name_ar', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async createCity(
    businessId: string,
    input: {
      name_ar: string;
      name_en?: string;
      shipping_cost: number;
    }
  ): Promise<City> {
    const country = await this.getCountry(businessId);
    if (!country) throw new Error('يجب إعداد الدولة أولاً');

    const { data, error } = await supabase
      .from('cities')
      .insert({
        business_id: businessId,
        country_id: country.id,
        name_ar: input.name_ar,
        name_en: input.name_en || null,
        shipping_cost: input.shipping_cost || 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'cities',
      entity_id: data.id,
      action: 'create',
      changes: { created: data },
    });

    return data;
  }

  static async updateCity(
    businessId: string,
    cityId: string,
    input: {
      name_ar?: string;
      name_en?: string;
      shipping_cost?: number;
      is_active?: boolean;
    }
  ): Promise<City> {
    const { data: before } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .eq('business_id', businessId)
      .single();

    const { data, error } = await supabase
      .from('cities')
      .update(input)
      .eq('id', cityId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'cities',
      entity_id: cityId,
      action: 'update',
      changes: { before, after: data },
    });

    return data;
  }

  static async deleteCity(businessId: string, cityId: string): Promise<void> {
    const { data: before } = await supabase
      .from('cities')
      .select('*')
      .eq('id', cityId)
      .eq('business_id', businessId)
      .single();

    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', cityId)
      .eq('business_id', businessId);

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'cities',
      entity_id: cityId,
      action: 'delete',
      changes: { deleted: before },
    });
  }

  static async toggleCityActive(
    businessId: string,
    cityId: string,
    isActive: boolean
  ): Promise<City> {
    return this.updateCity(businessId, cityId, { is_active: isActive });
  }

  static async update(
    businessId: string,
    countryId: string,
    input: { shipping_cost?: number }
  ): Promise<Country> {
    const { data, error } = await supabase
      .from('countries')
      .update(input)
      .eq('id', countryId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
