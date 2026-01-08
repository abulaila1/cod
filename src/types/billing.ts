export type PlanType = 'starter' | 'growth' | 'pro';
export type BillingStatus = 'inactive' | 'active' | 'trial';

export interface Billing {
  id: string;
  business_id: string;
  plan: PlanType;
  status: BillingStatus;
  activated_at: string | null;
  lifetime_price_usd: number;
  monthly_order_limit: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_trial: boolean;
  trial_ends_at: string | null;
}

export interface PlanDetails {
  key: PlanType;
  name: string;
  price: number;
  limit: number | null;
  features: string[];
  recommended?: boolean;
}

export const PLAN_CONFIG: Record<PlanType, Omit<PlanDetails, 'key'>> = {
  starter: {
    name: 'Starter',
    price: 25,
    limit: 1000,
    features: [
      'حتى 1000 طلب شهريًا',
      'تقارير أساسية',
      'دعم فني عبر البريد',
      'مدى الحياة'
    ],
  },
  growth: {
    name: 'Growth',
    price: 35,
    limit: 3000,
    features: [
      'حتى 3000 طلب شهريًا',
      'تقارير متقدمة',
      'دعم فني ذو أولوية',
      'مدى الحياة'
    ],
    recommended: true,
  },
  pro: {
    name: 'Pro',
    price: 50,
    limit: null,
    features: [
      'طلبات غير محدودة',
      'تقارير وتحليلات شاملة',
      'دعم فني متواصل',
      'مدى الحياة'
    ],
  },
};
