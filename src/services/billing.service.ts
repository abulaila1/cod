import { supabase } from './supabase';
import { AuditService } from './audit.service';
import type { Billing, PlanType } from '../types/billing';
import { PLAN_CONFIG, WHATSAPP_NUMBER } from '../types/billing';

const PLAN_LIMITS: Record<PlanType, number | null> = {
  starter: 500,
  pro: 2000,
  elite: 5000,
  enterprise: null,
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
    businessId: string,
    plan: PlanType,
    receiptRef?: string
  ): Promise<Billing> {
    const planConfig = PLAN_CONFIG[plan];
    const planLimit = PLAN_LIMITS[plan];

    const { data: billingBefore } = await supabase
      .from('business_billing')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    const { data: billingData, error: billingError } = await supabase
      .from('business_billing')
      .update({
        plan,
        lifetime_price_usd: planConfig.price,
        monthly_order_limit: planLimit,
        notes: receiptRef ? `Manual Payment - Receipt: ${receiptRef}` : 'Manual Payment - Pending Verification',
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)
      .select()
      .single();

    if (billingError) throw billingError;

    const { error: businessError } = await supabase
      .from('businesses')
      .update({
        manual_payment_status: 'pending',
        plan_type: `${plan}_pending`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (businessError) throw businessError;

    await AuditService.log({
      business_id: businessId,
      entity_type: 'billing',
      entity_id: billingData.id,
      action: 'manual_payment_submitted',
      changes: {
        before: this.extractBillingFields(billingBefore),
        after: this.extractBillingFields(billingData),
        receipt_ref: receiptRef,
      },
    });

    return billingData;
  }

  static async setPlan(businessId: string, plan: PlanType): Promise<Billing> {
    const planConfig = PLAN_CONFIG[plan];
    const planLimit = PLAN_LIMITS[plan];

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
        monthly_order_limit: planLimit,
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

  static generateWhatsAppLink(plan: string, amount: number, workspaceName: string, receiptRef?: string): string {
    const message = encodeURIComponent(
      `مرحباً، أود الاشتراك في خطة ${plan}\n` +
      `المبلغ: $${amount}\n` +
      `اسم المتجر: ${workspaceName}\n` +
      (receiptRef ? `رقم الحوالة: ${receiptRef}\n` : '') +
      `أرفقت إيصال الدفع.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }
}
