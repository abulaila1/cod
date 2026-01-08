import { supabase } from './supabase';
import { AuditService } from './audit.service';
import type { Billing, PlanType } from '../types/billing';
import { PLAN_CONFIG } from '../types/billing';

const PLAN_MAPPING: Record<PlanType, { limit: number | null; price: number }> = {
  starter: { limit: 500, price: 25 },
  pro: { limit: 2000, price: 35 },
  elite: { limit: 5000, price: 50 },
  enterprise: { limit: null, price: 100 },
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

  static isPlanActive(billing: Billing | null, businessStatus?: string, manualPaymentStatus?: string): boolean {
    if (!billing) return false;
    if (billing.status === 'active') return true;
    if (this.isTrialActive(billing)) return true;
    if (manualPaymentStatus === 'pending') return true;
    return false;
  }

  static shouldBlockAccess(billing: Billing | null, manualPaymentStatus?: string): boolean {
    if (!billing) return true;
    if (billing.status === 'active') return false;
    if (this.isTrialActive(billing)) return false;
    if (manualPaymentStatus === 'pending') return false;
    return true;
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

  static async checkDiscountEligibility(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_discount_eligibility', {
      user_id_param: userId,
    });

    if (error) {
      console.error('Error checking discount eligibility:', error);
      return false;
    }

    return data === true;
  }

  static async submitManualPayment(
    workspaceId: string,
    planName: string,
    amount: number,
    receiptRef: string
  ): Promise<void> {
    const { error } = await supabase.rpc('submit_manual_payment', {
      workspace_id: workspaceId,
      plan_name: planName,
      amount,
      receipt_ref: receiptRef,
    });

    if (error) throw error;
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

  static getDiscountedPrice(originalPrice: number): number {
    return Math.round(originalPrice * 0.5);
  }

  static formatWhatsAppMessage(plan: string, amount: number, workspaceName: string): string {
    return encodeURIComponent(
      `مرحباً، أود الاشتراك في خطة ${plan}\n` +
      `المبلغ: $${amount}\n` +
      `اسم المتجر: ${workspaceName}\n` +
      `أرفقت إيصال الدفع.`
    );
  }
}
