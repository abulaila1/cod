import { supabase } from './supabase';

const DEFAULT_STATUSES = [
  {
    key: 'new',
    name_ar: 'طلبات جديدة',
    name_en: 'new',
    sort_order: 1,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
    is_system_default: true,
    status_type: 'active' as const,
    color: '#3b82f6',
  },
  {
    key: 'confirmed',
    name_ar: 'مؤكدة',
    name_en: 'confirmed',
    sort_order: 2,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
    is_system_default: true,
    status_type: 'active' as const,
    color: '#10b981',
  },
  {
    key: 'pending_discussion',
    name_ar: 'معلقة للمناقشة',
    name_en: 'pending_discussion',
    sort_order: 3,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
    is_system_default: true,
    status_type: 'active' as const,
    color: '#f59e0b',
  },
  {
    key: 'delayed',
    name_ar: 'مؤجلة',
    name_en: 'delayed',
    sort_order: 4,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
    is_system_default: true,
    status_type: 'active' as const,
    color: '#ef4444',
  },
  {
    key: 'preparing',
    name_ar: 'تحت التحضير',
    name_en: 'preparing',
    sort_order: 5,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
    is_system_default: true,
    status_type: 'active' as const,
    color: '#8b5cf6',
  },
  {
    key: 'prepared',
    name_ar: 'تم التحضير',
    name_en: 'prepared',
    sort_order: 6,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
    is_system_default: true,
    status_type: 'active' as const,
    color: '#06b6d4',
  },
  {
    key: 'shipping',
    name_ar: 'في الشحن',
    name_en: 'shipping',
    sort_order: 7,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
    is_system_default: true,
    status_type: 'active' as const,
    color: '#14b8a6',
  },
  {
    key: 'delivered',
    name_ar: 'تم التوصيل',
    name_en: 'delivered',
    sort_order: 8,
    is_final: true,
    counts_as_delivered: true,
    counts_as_return: false,
    counts_as_active: false,
    is_system_default: true,
    status_type: 'delivered' as const,
    color: '#22c55e',
  },
  {
    key: 'returned',
    name_ar: 'مرتجع',
    name_en: 'returned',
    sort_order: 9,
    is_final: true,
    counts_as_delivered: false,
    counts_as_return: true,
    counts_as_active: false,
    is_system_default: true,
    status_type: 'returned' as const,
    color: '#f97316',
  },
  {
    key: 'refused_at_delivery',
    name_ar: 'رفض عند الاستلام',
    name_en: 'refused_at_delivery',
    sort_order: 10,
    is_final: true,
    counts_as_delivered: false,
    counts_as_return: true,
    counts_as_active: false,
    is_system_default: true,
    status_type: 'returned' as const,
    color: '#dc2626',
  },
  {
    key: 'warehouse_received',
    name_ar: 'استلام أمين المخزن',
    name_en: 'warehouse_received',
    sort_order: 11,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: true,
    counts_as_active: false,
    is_system_default: true,
    status_type: 'returned' as const,
    color: '#ea580c',
  },
  {
    key: 'restocked',
    name_ar: 'إرجاع للرف',
    name_en: 'restocked',
    sort_order: 12,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: true,
    counts_as_active: false,
    is_system_default: true,
    status_type: 'returned' as const,
    color: '#c2410c',
  },
  {
    key: 'canceled',
    name_ar: 'ملغية',
    name_en: 'canceled',
    sort_order: 13,
    is_final: true,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: false,
    is_system_default: true,
    status_type: 'canceled' as const,
    color: '#64748b',
  },
  {
    key: 'deleted',
    name_ar: 'محذوفة',
    name_en: 'deleted',
    sort_order: 14,
    is_final: true,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: false,
    is_system_default: true,
    status_type: 'canceled' as const,
    color: '#475569',
  },
];

export class SeedService {
  static async seedBusinessDefaults(businessId: string): Promise<void> {
    if (import.meta.env.DEV) {
      console.log('[SeedService] Starting seed for business:', businessId);
    }

    try {
      const statusesData = DEFAULT_STATUSES.map(status => ({
        ...status,
        business_id: businessId,
      }));

      if (import.meta.env.DEV) {
        console.log('[SeedService] Inserting', statusesData.length, 'statuses');
      }

      const { error: statusError } = await supabase
        .from('statuses')
        .insert(statusesData);

      if (statusError) {
        console.error('[SeedService] Failed to insert statuses:', statusError);
        throw statusError;
      }

      if (import.meta.env.DEV) {
        console.log('[SeedService] Inserting default country');
      }

      const { error: countryError } = await supabase
        .from('countries')
        .insert({
          business_id: businessId,
          name_ar: 'مصر',
          currency: 'EGP',
          active: true,
        });

      if (countryError) {
        console.error('[SeedService] Failed to insert country:', countryError);
        throw countryError;
      }

      if (import.meta.env.DEV) {
        console.log('[SeedService] Inserting default carrier');
      }

      const { error: carrierError } = await supabase
        .from('carriers')
        .insert({
          business_id: businessId,
          name_ar: 'شركة شحن افتراضية',
          active: true,
        });

      if (carrierError) {
        console.error('[SeedService] Failed to insert carrier:', carrierError);
        throw carrierError;
      }

      if (import.meta.env.DEV) {
        console.log('[SeedService] Seed completed successfully');
      }
    } catch (error) {
      console.error('[SeedService] Failed to seed business defaults:', error);
      throw error;
    }
  }
}
