import { supabase } from './supabase';

export interface PlatformSettings {
  whatsapp_number: string;
  whatsapp_cta_text: string;
  whatsapp_message: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  whatsapp_number: '966500000000',
  whatsapp_cta_text: 'تواصل معنا عبر واتساب',
  whatsapp_message: 'مرحباً، أريد الاشتراك في خطة {plan} بسعر ${price}',
};

export const PlatformService = {
  async getSettings(): Promise<PlatformSettings> {
    const { data, error } = await supabase.rpc('get_platform_settings');

    if (error || !data) {
      console.error('Failed to fetch platform settings:', error);
      return DEFAULT_SETTINGS;
    }

    const settings = { ...DEFAULT_SETTINGS };
    for (const row of data) {
      if (row.key in settings) {
        (settings as Record<string, string>)[row.key] = row.value;
      }
    }

    return settings;
  },

  async updateSetting(key: keyof PlatformSettings, value: string): Promise<boolean> {
    const { error } = await supabase.rpc('update_platform_setting', {
      p_key: key,
      p_value: value,
    });

    if (error) {
      console.error('Failed to update platform setting:', error);
      return false;
    }

    return true;
  },

  async getAllSettingsForAdmin(): Promise<Array<{ key: string; value: string; description: string }>> {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value, description')
      .order('key');

    if (error) {
      console.error('Failed to fetch all settings:', error);
      return [];
    }

    return data || [];
  },

  formatWhatsAppUrl(number: string, message: string): string {
    const cleanNumber = number.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  },

  formatMessage(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  },
};
