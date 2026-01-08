import { supabase } from './supabase';

const DEFAULT_STATUSES = [
  { key: 'new', label_ar: 'طلبات جديدة', sort_order: 1, is_final: false, counts_as_delivered: false, counts_as_return: false, counts_as_active: true },
  { key: 'confirmed', label_ar: 'مؤكدة', sort_order: 2, is_final: false, counts_as_delivered: false, counts_as_return: false, counts_as_active: true },
  { key: 'pending_discussion', label_ar: 'معلقة للمناقشة', sort_order: 3, is_final: false, counts_as_delivered: false, counts_as_return: false, counts_as_active: true },
  { key: 'delayed', label_ar: 'مؤجلة', sort_order: 4, is_final: false, counts_as_delivered: false, counts_as_return: false, counts_as_active: true },
  { key: 'preparing', label_ar: 'تحت التحضير', sort_order: 5, is_final: false, counts_as_delivered: false, counts_as_return: false, counts_as_active: true },
  { key: 'prepared', label_ar: 'تم التحضير', sort_order: 6, is_final: false, counts_as_delivered: false, counts_as_return: false, counts_as_active: true },
  { key: 'shipping', label_ar: 'في الشحن', sort_order: 7, is_final: false, counts_as_delivered: false, counts_as_return: false, counts_as_active: true },
  { key: 'delivered', label_ar: 'تم التوصيل', sort_order: 8, is_final: true, counts_as_delivered: true, counts_as_return: false, counts_as_active: false },
  { key: 'returned', label_ar: 'مرتجع', sort_order: 9, is_final: true, counts_as_delivered: false, counts_as_return: true, counts_as_active: false },
  { key: 'refused_at_delivery', label_ar: 'رفض عند الاستلام', sort_order: 10, is_final: true, counts_as_delivered: false, counts_as_return: true, counts_as_active: false },
  { key: 'warehouse_received', label_ar: 'استلام أمين المخزن', sort_order: 11, is_final: false, counts_as_delivered: false, counts_as_return: true, counts_as_active: false },
  { key: 'restocked', label_ar: 'إرجاع للرف', sort_order: 12, is_final: false, counts_as_delivered: false, counts_as_return: true, counts_as_active: false },
  { key: 'canceled', label_ar: 'ملغية', sort_order: 13, is_final: true, counts_as_delivered: false, counts_as_return: false, counts_as_active: false },
  { key: 'deleted', label_ar: 'محذوفة', sort_order: 14, is_final: true, counts_as_delivered: false, counts_as_return: false, counts_as_active: false },
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
