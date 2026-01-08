import { supabase } from './supabase';
import { AuditService } from './audit.service';

export interface Carrier {
  id: string;
  business_id: string;
  name_ar: string;
  name_en?: string;
  tracking_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface CarrierCityPrice {
  id: string;
  business_id: string;
  carrier_id: string;
  city_id: string;
  shipping_cost: number;
  city?: {
    id: string;
    name_ar: string;
    name_en?: string;
    shipping_cost: number;
  };
}

export interface CarrierSettings {
  id: string;
  business_id: string;
  carrier_id: string;
  good_threshold: number;
  warning_threshold: number;
  good_color: string;
  warning_color: string;
  bad_color: string;
}

export interface CarrierAnalytics {
  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  in_transit_orders: number;
  delivery_rate: number;
  return_rate: number;
  total_revenue: number;
  total_shipping_cost: number;
  city_performance: CityPerformance[];
}

export interface CityPerformance {
  city_id: string;
  city_name: string;
  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  delivery_rate: number;
}

export interface CarrierFilters {
  search?: string;
  activeOnly?: boolean;
}

export class CarriersService {
  static async list(businessId: string, filters: CarrierFilters = {}): Promise<Carrier[]> {
    let query = supabase
      .from('carriers')
      .select('*')
      .eq('business_id', businessId);

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

  static async getById(businessId: string, carrierId: string): Promise<Carrier | null> {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', carrierId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create(
    businessId: string,
    input: { name_ar: string; name_en?: string; tracking_url?: string }
  ): Promise<Carrier> {
    const { data, error } = await supabase
      .from('carriers')
      .insert({
        business_id: businessId,
        name_ar: input.name_ar,
        name_en: input.name_en || input.name_ar,
        tracking_url: input.tracking_url || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await this.createDefaultSettings(businessId, data.id);

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
    input: { name_ar?: string; name_en?: string; tracking_url?: string; is_active?: boolean }
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

  static async delete(businessId: string, carrierId: string): Promise<void> {
    const { data: before } = await supabase
      .from('carriers')
      .select('*')
      .eq('id', carrierId)
      .eq('business_id', businessId)
      .single();

    const { error } = await supabase
      .from('carriers')
      .delete()
      .eq('id', carrierId)
      .eq('business_id', businessId);

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'carriers',
      entity_id: carrierId,
      action: 'delete',
      changes: { deleted: before },
    });
  }

  static async toggleActive(businessId: string, carrierId: string, isActive: boolean): Promise<Carrier> {
    return this.update(businessId, carrierId, { is_active: isActive });
  }

  static async getCityPrices(businessId: string, carrierId: string): Promise<CarrierCityPrice[]> {
    const { data, error } = await supabase
      .from('carrier_city_prices')
      .select(`
        *,
        city:cities(id, name_ar, name_en, shipping_cost)
      `)
      .eq('business_id', businessId)
      .eq('carrier_id', carrierId);

    if (error) throw error;
    return data || [];
  }

  static async setCityPrice(
    businessId: string,
    carrierId: string,
    cityId: string,
    shippingCost: number
  ): Promise<CarrierCityPrice> {
    const { data: existing } = await supabase
      .from('carrier_city_prices')
      .select('*')
      .eq('carrier_id', carrierId)
      .eq('city_id', cityId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('carrier_city_prices')
        .update({ shipping_cost: shippingCost })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('carrier_city_prices')
        .insert({
          business_id: businessId,
          carrier_id: carrierId,
          city_id: cityId,
          shipping_cost: shippingCost,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  static async removeCityPrice(businessId: string, carrierId: string, cityId: string): Promise<void> {
    const { error } = await supabase
      .from('carrier_city_prices')
      .delete()
      .eq('business_id', businessId)
      .eq('carrier_id', carrierId)
      .eq('city_id', cityId);

    if (error) throw error;
  }

  static async getSettings(businessId: string, carrierId: string): Promise<CarrierSettings | null> {
    const { data, error } = await supabase
      .from('carrier_settings')
      .select('*')
      .eq('business_id', businessId)
      .eq('carrier_id', carrierId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createDefaultSettings(businessId: string, carrierId: string): Promise<CarrierSettings> {
    const { data, error } = await supabase
      .from('carrier_settings')
      .insert({
        business_id: businessId,
        carrier_id: carrierId,
        good_threshold: 70,
        warning_threshold: 50,
        good_color: '#10B981',
        warning_color: '#F59E0B',
        bad_color: '#EF4444',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSettings(
    businessId: string,
    carrierId: string,
    input: {
      good_threshold?: number;
      warning_threshold?: number;
      good_color?: string;
      warning_color?: string;
      bad_color?: string;
    }
  ): Promise<CarrierSettings> {
    const existing = await this.getSettings(businessId, carrierId);

    if (existing) {
      const { data, error } = await supabase
        .from('carrier_settings')
        .update(input)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('carrier_settings')
        .insert({
          business_id: businessId,
          carrier_id: carrierId,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  static async getAnalytics(
    businessId: string,
    carrierId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<CarrierAnalytics> {
    let query = supabase
      .from('orders')
      .select(`
        id,
        status_id,
        revenue,
        shipping_cost,
        city_id,
        status:statuses(counts_as_delivered, counts_as_return, counts_as_active),
        city:cities(id, name_ar)
      `)
      .eq('business_id', businessId)
      .eq('carrier_id', carrierId);

    if (dateFrom) {
      query = query.gte('order_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('order_date', dateTo);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    const safeOrders = orders || [];

    const total_orders = safeOrders.length;
    const delivered_orders = safeOrders.filter(o => o.status?.counts_as_delivered).length;
    const returned_orders = safeOrders.filter(o => o.status?.counts_as_return).length;
    const in_transit_orders = safeOrders.filter(o => o.status?.counts_as_active).length;

    const delivery_rate = total_orders > 0 ? (delivered_orders / total_orders) * 100 : 0;
    const return_rate = total_orders > 0 ? (returned_orders / total_orders) * 100 : 0;

    const total_revenue = safeOrders.reduce((sum, o) => sum + (Number(o.revenue) || 0), 0);
    const total_shipping_cost = safeOrders.reduce((sum, o) => sum + (Number(o.shipping_cost) || 0), 0);

    const cityMap = new Map<string, CityPerformance>();

    safeOrders.forEach(order => {
      if (!order.city_id || !order.city) return;

      const cityId = order.city_id;
      const cityName = order.city.name_ar;

      if (!cityMap.has(cityId)) {
        cityMap.set(cityId, {
          city_id: cityId,
          city_name: cityName,
          total_orders: 0,
          delivered_orders: 0,
          returned_orders: 0,
          delivery_rate: 0,
        });
      }

      const cityPerf = cityMap.get(cityId)!;
      cityPerf.total_orders++;

      if (order.status?.counts_as_delivered) {
        cityPerf.delivered_orders++;
      }
      if (order.status?.counts_as_return) {
        cityPerf.returned_orders++;
      }
    });

    const city_performance = Array.from(cityMap.values()).map(city => ({
      ...city,
      delivery_rate: city.total_orders > 0 ? (city.delivered_orders / city.total_orders) * 100 : 0,
    }));

    city_performance.sort((a, b) => b.delivery_rate - a.delivery_rate);

    return {
      total_orders,
      delivered_orders,
      returned_orders,
      in_transit_orders,
      delivery_rate,
      return_rate,
      total_revenue,
      total_shipping_cost,
      city_performance,
    };
  }
}
