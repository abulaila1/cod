export type PlanType = 'starter' | 'pro' | 'elite' | 'enterprise';
export type BillingStatus = 'inactive' | 'active' | 'trial';
export type ManualPaymentStatus = 'none' | 'pending' | 'verified' | 'rejected';

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
  nameAr: string;
  price: number;
  limit: number | null;
  features: string[];
  featuresAr: string[];
  stripeLink: string;
  recommended?: boolean;
  popular?: boolean;
}

export const PLAN_CONFIG: Record<PlanType, Omit<PlanDetails, 'key'>> = {
  starter: {
    name: 'Starter',
    nameAr: 'المبتدئ',
    price: 25,
    limit: 500,
    features: [
      'Up to 500 orders/month',
      'Basic reports',
      'Email support',
      'Lifetime access'
    ],
    featuresAr: [
      'حتى 500 طلب شهرياً',
      'تقارير أساسية',
      'دعم عبر البريد',
      'وصول مدى الحياة'
    ],
    stripeLink: 'https://buy.stripe.com/test_starter_plan',
  },
  pro: {
    name: 'Pro',
    nameAr: 'المحترف',
    price: 35,
    limit: 2000,
    features: [
      'Up to 2,000 orders/month',
      'Advanced analytics',
      'Priority support',
      'Lifetime access'
    ],
    featuresAr: [
      'حتى 2,000 طلب شهرياً',
      'تحليلات متقدمة',
      'دعم ذو أولوية',
      'وصول مدى الحياة'
    ],
    stripeLink: 'https://buy.stripe.com/test_pro_plan',
    recommended: true,
    popular: true,
  },
  elite: {
    name: 'Elite',
    nameAr: 'النخبة',
    price: 50,
    limit: 5000,
    features: [
      'Up to 5,000 orders/month',
      'Full analytics suite',
      '24/7 priority support',
      'Lifetime access'
    ],
    featuresAr: [
      'حتى 5,000 طلب شهرياً',
      'جميع التحليلات',
      'دعم على مدار الساعة',
      'وصول مدى الحياة'
    ],
    stripeLink: 'https://buy.stripe.com/test_elite_plan',
  },
  enterprise: {
    name: 'Enterprise',
    nameAr: 'المؤسسات',
    price: 100,
    limit: null,
    features: [
      'Unlimited orders',
      'Custom integrations',
      'Dedicated account manager',
      'Lifetime access'
    ],
    featuresAr: [
      'طلبات غير محدودة',
      'تكاملات مخصصة',
      'مدير حساب مخصص',
      'وصول مدى الحياة'
    ],
    stripeLink: 'https://buy.stripe.com/test_enterprise_plan',
  },
};

export const WHATSAPP_NUMBER = '966500000000';
export const BANK_DETAILS = {
  bankName: 'Al Rajhi Bank',
  bankNameAr: 'مصرف الراجحي',
  accountName: 'Company Name',
  accountNumber: '1234567890',
  iban: 'SA0000000000000000000000',
};
