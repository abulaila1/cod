import { supabase } from './supabase';
import { AuditService } from './audit.service';
import type { Billing, PlanType, PLAN_CONFIG } from '@/types/billing';

const PLAN_MAPPING: Record<PlanType, { limit: number | null; price: number }> = {
  starter: { limit: 1000, price: 25 },
  growth: { limit: 3000, price: 35 },
  pro: { limit: null, price: 50 },
};

export class BillingService {
  static isTrialActive(billing: Billing | null): boolean {
    if (!billing || !billing.is_trial || !billing.trial_ends_at) {
      return false;
    }
    return new Date(billing.trial_ends_at) > new Date();
  }

  static isTrialExpired(billing: Billing | null): boolean {
    if (!billing || !billing.is_trial || !billing.trial_ends_at) {
      return false;
    }
    return new Date(billing.trial_ends_at) <= new Date();
  }

  static getTrialTimeRemaining(billing: Billing | null): number | null {
    if (!billing || !billing.is_trial || !billing.trial_ends_at) {
      return null;
    }
    const now = new Date();
    const endsAt = new Date(billing.trial_ends_at);
    const diffMs = endsAt.getTime() - now.getTime();
    return diffMs > 0 ? diffMs : 0;
  }

  private static extractBillingFields(billing: Billing | null) {
    if (!billing) return null;
    return {
      plan: billing.plan,
      status: billing.status,
      monthly_order_limit: billing.monthly_order_limit,
      lifetime_price_usd: billing.lifetime_price_usd,
      activated_at: billing.activated_at,
      is_trial: billing.is_trial,
      trial_ends_at: billing.trial_ends_at,
    };
  }

  static async getBilling(businessId: string): Promise<Billing | null> {
    const { data, error } = await supabase
      .from('business_billing')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  static async setPlan(businessId: string, plan: PlanType): Promise<Billing> {
    const planConfig = PLAN_MAPPING[plan];

    const { data: before } = await supabase
      .from('business_billing')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('business_billing')
      .update({
        plan,
        lifetime_price_usd: planConfig.price,
        monthly_order_limit: planConfig.limit,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'business',
      entity_id: data.id,
      action: 'update',
      changes: { before: this.extractBillingFields(before), after: this.extractBillingFields(data) },
    });

    return data;
  }

  static async activate(businessId: string): Promise<Billing> {
    const { data: before } = await supabase
      .from('business_billing')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    const wasTrial = before?.is_trial || false;

    const { data, error } = await supabase
      .from('business_billing')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_trial: false,
        trial_ends_at: null,
      })
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'business',
      entity_id: data.id,
      action: 'update',
      changes: { before: this.extractBillingFields(before), after: this.extractBillingFields(data), wasTrial },
    });

    return data;
  }

  static async deactivate(businessId: string): Promise<Billing> {
    const { data: before } = await supabase
      .from('business_billing')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    const { data, error } = await supabase
      .from('business_billing')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'business',
      entity_id: data.id,
      action: 'update',
      changes: { before: this.extractBillingFields(before), after: this.extractBillingFields(data) },
    });

    return data;
  }
}
