import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, Button, Badge, Modal } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { BillingService } from '@/services/billing.service';
import { UsageService } from '@/services/usage.service';
import { Check, CreditCard, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import type { Billing, PlanType, PlanDetails } from '@/types/billing';
import type { UsageStatus } from '@/services/usage.service';
import { PLAN_CONFIG } from '@/types/billing';
import { TrialCountdown } from '@/components/billing/TrialCountdown';

const PLANS: PlanDetails[] = [
  { key: 'starter', ...PLAN_CONFIG.starter },
  { key: 'growth', ...PLAN_CONFIG.growth },
  { key: 'pro', ...PLAN_CONFIG.pro },
];

export function Billing() {
  const { currentBusiness, currentMember } = useBusiness();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canManage = currentMember?.role === 'admin' || currentMember?.role === 'manager';

  useEffect(() => {
    if (currentBusiness) {
      loadBillingData();
    }
  }, [currentBusiness]);

  const loadBillingData = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const [billingData, usageData] = await Promise.all([
        BillingService.getBilling(currentBusiness.id),
        UsageService.getUsageStatus(currentBusiness.id),
      ]);

      setBilling(billingData);
      setUsage(usageData);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!currentBusiness) return;

    try {
      setIsProcessing(true);
      await BillingService.activate(currentBusiness.id);
      await loadBillingData();
      setIsActivateModalOpen(false);
    } catch (error) {
      console.error('Failed to activate:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeactivate = async () => {
    if (!currentBusiness) return;

    try {
      setIsProcessing(true);
      await BillingService.deactivate(currentBusiness.id);
      await loadBillingData();
      setIsDeactivateModalOpen(false);
    } catch (error) {
      console.error('Failed to deactivate:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePlan = async () => {
    if (!currentBusiness || !selectedPlan) return;

    try {
      setIsProcessing(true);
      await BillingService.setPlan(currentBusiness.id, selectedPlan);
      await loadBillingData();
      setIsChangePlanModalOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Failed to change plan:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!currentBusiness) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
        </div>
      </>
    );
  }

  if (isLoading || !billing || !usage) {
    return (
      <>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-zinc-600">جاري التحميل...</p>
        </div>
      </>
    );
  }

  const currentPlanDetails = PLANS.find((p) => p.key === billing.plan);
  const isTrialActive = BillingService.isTrialActive(billing);
  const isTrialExpired = BillingService.isTrialExpired(billing);

  return (
    <>
      <PageHeader
        title="الفوترة والخطة"
        description="إدارة خطة الاشتراك واستخدام الطلبات الشهري"
      />

      {isTrialActive && billing.trial_ends_at && (
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-blue-950">
                    التجربة المجانية نشطة
                  </h3>
                  <Badge variant="primary" className="bg-blue-600">
                    تجربة مجانية
                  </Badge>
                </div>
                <p className="text-sm text-blue-800 mb-4">
                  لديك 24 ساعة لتجربة النظام مجاناً بدون بطاقة. استكشف جميع الميزات!
                </p>
                <TrialCountdown
                  trialEndsAt={billing.trial_ends_at}
                  onExpired={() => loadBillingData()}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isTrialExpired && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-950 mb-2">
                  انتهت فترة التجربة المجانية
                </h3>
                <p className="text-sm text-red-800 mb-4">
                  انتهت فترة التجربة المجانية. الرجاء الاشتراك لتكملة الاستخدام. يمكنك
                  الاطلاع على التقارير والبيانات الحالية، ولكن لا يمكنك إضافة طلبات جديدة.
                </p>
                {canManage && (
                  <Button
                    variant="primary"
                    onClick={() => setIsActivateModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    اشترك الآن
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950">خطتك الحالية</h3>
                  <p className="text-sm text-zinc-600">
                    {currentPlanDetails?.name} - ${billing.lifetime_price_usd} مدى الحياة
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  billing.status === 'active'
                    ? 'success'
                    : billing.status === 'trial'
                    ? 'primary'
                    : 'secondary'
                }
              >
                {billing.status === 'active'
                  ? 'نشط'
                  : billing.status === 'trial'
                  ? 'تجربة مجانية'
                  : 'غير نشط'}
              </Badge>
            </div>

            <div className="space-y-2 mb-6">
              {currentPlanDetails?.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-zinc-700">
                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {canManage && (
              <div className="flex gap-2">
                {billing.status === 'inactive' || billing.status === 'trial' ? (
                  <Button
                    variant="primary"
                    onClick={() => setIsActivateModalOpen(true)}
                    className="flex-1"
                  >
                    {billing.status === 'trial' ? 'اشترك الآن' : 'تفعيل الاشتراك'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsDeactivateModalOpen(true)}
                    className="flex-1"
                  >
                    إلغاء التفعيل
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsChangePlanModalOpen(true)}
                  className="flex-1"
                >
                  تغيير الخطة
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-green-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">استخدام هذا الشهر</h3>
                <p className="text-sm text-zinc-600">{usage.month_label}</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-zinc-700">
                  {usage.current_month_count.toLocaleString('ar-EG')} /{' '}
                  {usage.limit !== null
                    ? usage.limit.toLocaleString('ar-EG')
                    : 'غير محدود'}{' '}
                  طلب
                </span>
                <span className="text-sm text-zinc-600">
                  {usage.limit !== null ? `${usage.percent_used.toFixed(0)}%` : ''}
                </span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    usage.is_exceeded
                      ? 'bg-red-600'
                      : usage.percent_used > 80
                      ? 'bg-orange-500'
                      : 'bg-green-600'
                  }`}
                  style={{
                    width: `${Math.min(100, usage.percent_used)}%`,
                  }}
                ></div>
              </div>
            </div>

            {usage.remaining !== null && (
              <p className="text-sm text-zinc-700 mb-4">
                متبقي: {usage.remaining.toLocaleString('ar-EG')} طلب
              </p>
            )}

            {usage.percent_used > 80 && !usage.is_exceeded && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-950">تحذير</p>
                  <p className="text-xs text-orange-700">
                    أنت على وشك الوصول إلى حد الطلبات الشهري. قم بالترقية لتجنب الانقطاع.
                  </p>
                </div>
              </div>
            )}

            {usage.is_exceeded && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-950">تجاوزت الحد</p>
                  <p className="text-xs text-red-700">
                    لقد تجاوزت الحد الشهري لعدد الطلبات. قم بالترقية لإضافة المزيد.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-950 mb-4">الخطط المتاحة</h2>
        {billing.status === 'trial' && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>نصيحة:</strong> يمكنك اختيار الخطة المناسبة الآن، وسيتم تفعيلها تلقائياً بعد إتمام عملية الدفع.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.key}
              className={`relative ${
                plan.recommended ? 'ring-2 ring-blue-600' : ''
              } ${billing.plan === plan.key ? 'bg-blue-50' : ''}`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary" className="px-3 py-1">
                    الأكثر شعبية
                  </Badge>
                </div>
              )}
              <CardContent>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-zinc-950 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-zinc-950">${plan.price}</span>
                    <span className="text-sm text-zinc-600">مدى الحياة</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-zinc-700">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {canManage && billing.plan !== plan.key && (
                  <Button
                    variant={plan.recommended ? 'primary' : 'outline'}
                    onClick={() => {
                      setSelectedPlan(plan.key);
                      setIsChangePlanModalOpen(true);
                    }}
                    className="w-full"
                  >
                    اختيار الخطة
                  </Button>
                )}

                {billing.plan === plan.key && (
                  <div className="text-center py-2 text-sm font-medium text-blue-600">
                    الخطة الحالية
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {!isTrialActive && (
        <Card className="bg-blue-50">
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-950 mb-1">ملاحظة مهمة</p>
                <p className="text-sm text-blue-800">
                  الدفع يتم يدويًا حاليًا. بعد اختيار الخطة والدفع، سيتم تفعيل اشتراكك من الإدارة. يرجى التواصل معنا لإتمام عملية الدفع.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={isActivateModalOpen}
        onClose={() => setIsActivateModalOpen(false)}
        title={billing.status === 'trial' ? 'تحويل التجربة إلى اشتراك' : 'تفعيل الاشتراك'}
      >
        <div className="space-y-4">
          <p className="text-zinc-700">
            {billing.status === 'trial'
              ? 'سيتم تحويل حسابك من التجربة المجانية إلى اشتراك نشط. تأكد من أن الدفع قد تم بنجاح.'
              : 'هل أنت متأكد من تفعيل الاشتراك؟ تأكد من أن الدفع قد تم بنجاح.'}
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
            <Button variant="outline" onClick={() => setIsActivateModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleActivate} disabled={isProcessing}>
              {isProcessing ? 'جاري التفعيل...' : 'تفعيل الاشتراك'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        title="إلغاء التفعيل"
      >
        <div className="space-y-4">
          <p className="text-zinc-700">
            هل أنت متأكد من إلغاء تفعيل الاشتراك؟ سيتم إيقاف جميع الخدمات.
          </p>
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
            <Button variant="outline" onClick={() => setIsDeactivateModalOpen(false)}>
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleDeactivate} disabled={isProcessing}>
              {isProcessing ? 'جاري الإلغاء...' : 'إلغاء التفعيل'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isChangePlanModalOpen}
        onClose={() => {
          setIsChangePlanModalOpen(false);
          setSelectedPlan(null);
        }}
        title="تغيير الخطة"
      >
        <div className="space-y-4">
          {selectedPlan && (
            <>
              <p className="text-zinc-700">
                هل تريد تغيير الخطة إلى{' '}
                <span className="font-semibold">
                  {PLANS.find((p) => p.key === selectedPlan)?.name}
                </span>
                ؟
              </p>
              <div className="p-4 bg-zinc-50 rounded-lg">
                <p className="text-sm text-zinc-600 mb-2">تفاصيل الخطة الجديدة:</p>
                <ul className="space-y-1">
                  {PLANS.find((p) => p.key === selectedPlan)?.features.map((feature, index) => (
                    <li key={index} className="text-sm text-zinc-700 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
            <Button
              variant="outline"
              onClick={() => {
                setIsChangePlanModalOpen(false);
                setSelectedPlan(null);
              }}
            >
              إلغاء
            </Button>
            <Button variant="primary" onClick={handleChangePlan} disabled={isProcessing}>
              {isProcessing ? 'جاري التغيير...' : 'تأكيد التغيير'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
