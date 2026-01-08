import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, Button, Badge, Modal, Input } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { BillingService } from '@/services/billing.service';
import { UsageService } from '@/services/usage.service';
import {
  Check,
  CreditCard,
  Clock,
  AlertTriangle,
  Zap,
  Crown,
  Building2,
  Rocket,
  MessageCircle,
  Copy,
  CheckCircle,
  Percent,
  ExternalLink,
  Banknote,
  ArrowRight,
} from 'lucide-react';
import type { Billing, PlanType, PlanDetails } from '@/types/billing';
import type { UsageStatus } from '@/services/usage.service';
import { PLAN_CONFIG, BANK_DETAILS } from '@/types/billing';

const PLANS: PlanDetails[] = [
  { key: 'starter', ...PLAN_CONFIG.starter },
  { key: 'pro', ...PLAN_CONFIG.pro },
  { key: 'elite', ...PLAN_CONFIG.elite },
  { key: 'enterprise', ...PLAN_CONFIG.enterprise },
];

const PLAN_ICONS: Record<PlanType, React.ReactNode> = {
  starter: <Rocket className="h-6 w-6" />,
  pro: <Zap className="h-6 w-6" />,
  elite: <Crown className="h-6 w-6" />,
  enterprise: <Building2 className="h-6 w-6" />,
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function Billing() {
  const { currentBusiness, currentMember } = useBusiness();
  const { user } = useAuth();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [receiptRef, setReceiptRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const canManage = currentMember?.role === 'admin' || currentMember?.role === 'manager';

  const loadBillingData = useCallback(async () => {
    if (!currentBusiness || !user) return;

    try {
      setIsLoading(true);
      const [billingData, usageData, discountEligible] = await Promise.all([
        BillingService.getBilling(currentBusiness.id),
        UsageService.getUsageStatus(currentBusiness.id),
        BillingService.checkDiscountEligibility(user.id),
      ]);

      setBilling(billingData);
      setUsage(usageData);
      setHasDiscount(discountEligible);

      if (billingData) {
        const remaining = BillingService.getTrialTimeRemaining(billingData);
        setTimeRemaining(remaining);
      }
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness, user]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1000) {
          clearInterval(interval);
          loadBillingData();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, loadBillingData]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openPaymentModal = (plan: PlanDetails) => {
    setSelectedPlan(plan);
    setReceiptRef('');
    setPaymentSuccess(false);
    setIsPaymentModalOpen(true);
  };

  const handleStripePayment = () => {
    if (!selectedPlan) return;
    window.open(selectedPlan.stripeLink, '_blank');
  };

  const handleWhatsAppClick = () => {
    if (!selectedPlan || !currentBusiness) return;
    const finalPrice = hasDiscount
      ? BillingService.getDiscountedPrice(selectedPlan.price)
      : selectedPlan.price;
    const link = BillingService.generateWhatsAppLink(
      selectedPlan.nameAr,
      finalPrice,
      currentBusiness.name,
      receiptRef || undefined
    );
    window.open(link, '_blank');
  };

  const handleSubmitManualPayment = async () => {
    if (!currentBusiness || !selectedPlan) return;

    try {
      setIsProcessing(true);
      await BillingService.submitManualPayment(
        currentBusiness.id,
        selectedPlan.key,
        receiptRef.trim() || undefined
      );
      setPaymentSuccess(true);
      await loadBillingData();
    } catch (error) {
      console.error('Failed to submit manual payment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPrice = (plan: PlanDetails): { original: number; final: number } => {
    const original = plan.price;
    const final = hasDiscount ? BillingService.getDiscountedPrice(original) : original;
    return { original, final };
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد مساحة العمل</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
        <p className="mt-4 text-zinc-600">جاري التحميل...</p>
      </div>
    );
  }

  const isTrialActive = billing && BillingService.isTrialActive(billing);
  const isTrialExpired = billing && BillingService.isTrialExpired(billing);
  const isPendingPayment = (currentBusiness as any)?.manual_payment_status === 'pending';

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="الاشتراك والفوترة"
        description="اختر الخطة المناسبة لك واستمتع بالوصول مدى الحياة"
      />

      {isTrialActive && timeRemaining !== null && timeRemaining > 0 && (
        <div className="mb-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Clock className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">التجربة المجانية نشطة</h3>
                <p className="text-white/90">استكشف جميع الميزات قبل انتهاء الوقت</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold tracking-wider bg-white/20 px-6 py-3 rounded-xl">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-white/80 mt-2">الوقت المتبقي</p>
            </div>
          </div>
        </div>
      )}

      {isTrialExpired && !isPendingPayment && (
        <div className="mb-8 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">انتهت التجربة المجانية</h3>
                <p className="text-white/90">اشترك الآن للاستمرار في استخدام النظام</p>
              </div>
            </div>
            {canManage && (
              <Button
                variant="outline"
                className="bg-white text-red-600 border-white hover:bg-red-50"
                onClick={() => openPaymentModal(PLANS.find(p => p.popular) || PLANS[0])}
              >
                اشترك الآن
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
            )}
          </div>
        </div>
      )}

      {isPendingPayment && (
        <div className="mb-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Clock className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">في انتظار تأكيد الدفع</h3>
              <p className="text-white/90">سيتم تفعيل حسابك خلال 24 ساعة بعد التحقق من الدفع</p>
            </div>
          </div>
        </div>
      )}

      {hasDiscount && (
        <div className="mb-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <Percent className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">خصم 50% لمتاجرك الإضافية!</h3>
              <p className="text-white/90">كونك تملك أكثر من متجر، تحصل على خصم خاص على جميع الخطط</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {PLANS.map((plan) => {
          const { original, final } = getPrice(plan);
          const isCurrentPlan = billing?.plan === plan.key;
          const isPro = plan.popular;

          return (
            <Card
              key={plan.key}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                isPro ? 'ring-2 ring-emerald-500 scale-[1.02]' : ''
              } ${isCurrentPlan ? 'bg-emerald-50' : ''}`}
            >
              {isPro && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-2 text-sm font-semibold">
                  الأكثر شعبية
                </div>
              )}
              <CardContent className={isPro ? 'pt-12' : ''}>
                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 rounded-2xl mb-4 ${
                    isPro ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {PLAN_ICONS[plan.key]}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-1">{plan.nameAr}</h3>
                  <p className="text-sm text-zinc-500">{plan.name}</p>
                </div>

                <div className="text-center mb-6">
                  {hasDiscount && (
                    <div className="text-zinc-400 line-through text-lg mb-1">${original}</div>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-bold ${isPro ? 'text-emerald-600' : 'text-zinc-900'}`}>
                      ${final}
                    </span>
                    <span className="text-zinc-500 text-sm">/ مدى الحياة</span>
                  </div>
                  {hasDiscount && (
                    <Badge variant="success" className="mt-2">وفر ${original - final}</Badge>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  {plan.featuresAr.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        isPro ? 'text-emerald-500' : 'text-zinc-400'
                      }`} />
                      <span className="text-sm text-zinc-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {canManage && !isCurrentPlan && (
                  <Button
                    variant="primary"
                    className={`w-full ${
                      isPro
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                        : ''
                    }`}
                    onClick={() => openPaymentModal(plan)}
                  >
                    اشترك الآن
                  </Button>
                )}

                {isCurrentPlan && (
                  <div className="text-center py-3 bg-emerald-100 rounded-xl">
                    <span className="text-emerald-700 font-semibold flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      خطتك الحالية
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {usage && (
        <Card className="mb-8">
          <CardContent>
            <h3 className="text-lg font-semibold text-zinc-900 mb-4">استخدامك هذا الشهر</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-600">
                {usage.current_month_count.toLocaleString('ar-EG')} /{' '}
                {usage.limit !== null ? usage.limit.toLocaleString('ar-EG') : 'غير محدود'} طلب
              </span>
              <span className="text-sm font-medium text-zinc-900">
                {usage.limit !== null ? `${Math.round(usage.percent_used)}%` : '-'}
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  usage.is_exceeded
                    ? 'bg-red-500'
                    : usage.percent_used > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, usage.percent_used)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={paymentSuccess ? 'تم إرسال طلب الاشتراك' : `الترقية إلى خطة ${selectedPlan?.nameAr || ''}`}
      >
        {paymentSuccess ? (
          <div className="text-center py-8">
            <div className="inline-flex p-4 bg-emerald-100 rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">شكراً لك!</h3>
            <p className="text-zinc-600 mb-6">
              تم استلام طلبك وسيتم تفعيل حسابك خلال 24 ساعة بعد التحقق من الدفع.
            </p>
            <Button variant="primary" onClick={() => setIsPaymentModalOpen(false)}>
              حسناً
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {selectedPlan && (
              <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 rounded-xl p-4 border border-zinc-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-600">الخطة المختارة</span>
                  <span className="font-bold text-zinc-900">{selectedPlan.nameAr}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">المبلغ المطلوب</span>
                  <div className="text-left">
                    {hasDiscount && (
                      <span className="text-zinc-400 line-through text-sm ml-2">
                        ${selectedPlan.price}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-emerald-600">
                      ${hasDiscount ? BillingService.getDiscountedPrice(selectedPlan.price) : selectedPlan.price}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                الدفع بالبطاقة (Stripe)
              </h4>
              <Button
                variant="primary"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-4 text-lg"
                onClick={handleStripePayment}
              >
                <CreditCard className="h-5 w-5 ml-2" />
                ادفع بالبطاقة الائتمانية
                <ExternalLink className="h-4 w-4 mr-2" />
              </Button>
              <p className="text-xs text-zinc-500 text-center mt-2">
                دفع آمن ومشفر عبر Stripe - يتم التفعيل فوراً
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-zinc-500">أو</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                الدفع عبر التحويل البنكي
              </h4>

              <div className="bg-zinc-50 rounded-xl p-4 mb-4 space-y-3">
                <p className="text-sm text-zinc-600 mb-3">
                  حوّل المبلغ إلى حسابنا البنكي، ثم أكد التحويل
                </p>

                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-zinc-200">
                  <div>
                    <span className="text-xs text-zinc-500 block">البنك</span>
                    <span className="font-medium text-zinc-900">{BANK_DETAILS.bankNameAr}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(BANK_DETAILS.bankName, 'bank')}
                    className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    {copiedField === 'bank' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-zinc-200">
                  <div>
                    <span className="text-xs text-zinc-500 block">اسم الحساب</span>
                    <span className="font-medium text-zinc-900">{BANK_DETAILS.accountName}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(BANK_DETAILS.accountName, 'name')}
                    className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    {copiedField === 'name' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-zinc-200">
                  <div>
                    <span className="text-xs text-zinc-500 block">IBAN</span>
                    <span className="font-medium font-mono text-sm text-zinc-900">{BANK_DETAILS.iban}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(BANK_DETAILS.iban, 'iban')}
                    className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    {copiedField === 'iban' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mb-3 border-green-500 text-green-600 hover:bg-green-50"
                onClick={handleWhatsAppClick}
              >
                <MessageCircle className="h-5 w-5 ml-2" />
                إرسال إثبات الدفع عبر واتساب
              </Button>

              <div className="space-y-3">
                <Input
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                  placeholder="رقم الحوالة / اسم المحوّل (اختياري)"
                />
                <Button
                  variant="primary"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmitManualPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    'جاري الإرسال...'
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 ml-2" />
                      لقد قمت بالتحويل
                    </>
                  )}
                </Button>
              </div>
            </div>

            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="w-full text-center text-sm text-zinc-500 hover:text-zinc-700 py-2"
            >
              إلغاء
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
