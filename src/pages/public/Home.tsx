import { PublicLayout } from '@/components/layout';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Truck,
  Globe,
  FileDown,
  UserPlus,
  Upload,
  BarChart3,
  Check,
  ChevronDown,
  Zap,
  Shield,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
    </PublicLayout>
  );
}

function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="bg-gradient-to-b from-zinc-50 to-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>منصة احترافية لإدارة طلبات COD</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-zinc-950 mb-6 leading-tight tracking-tight">
            حوّل طلباتك إلى
            <br />
            <span className="text-emerald-600">نظام احترافي</span>
          </h1>

          <p className="text-xl lg:text-2xl text-zinc-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            تابع، راقب، احسب، وقيّم كل جوانب أعمالك من مكان واحد
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link to="/app/dashboard">
                <Button variant="accent" size="lg" className="w-full sm:w-auto text-lg">
                  انتقل إلى لوحة التحكم
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth/register">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto text-lg">
                    ابدأ مجاناً
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg">
                    تسجيل الدخول
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <span>بدون بطاقة ائتمان</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <span>إعداد في دقائق</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              <span>دعم عربي كامل</span>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <div className="bg-white rounded-2xl shadow-soft-xl overflow-hidden border border-zinc-200">
            <div className="bg-zinc-950 px-6 py-4 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <span className="text-white text-sm font-medium">لوحة التحكم - codmeta</span>
            </div>

            <div className="bg-gradient-to-br from-zinc-50 to-emerald-50/30 p-8 lg:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-xl shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-zinc-600 font-medium">إجمالي الطلبات</span>
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <LayoutDashboard className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-zinc-950 mb-2">2,547</p>
                  <p className="text-sm text-emerald-600 font-medium">↑ 12% هذا الشهر</p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-zinc-600 font-medium">نسبة التسليم</span>
                    <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-sky-600" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-zinc-950 mb-2">87%</p>
                  <p className="text-sm text-emerald-600 font-medium">↑ 5% تحسن</p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-zinc-600 font-medium">الأرباح</span>
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-zinc-950 mb-2">$45,200</p>
                  <p className="text-sm text-emerald-600 font-medium">↑ 18% نمو</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: LayoutDashboard,
      title: 'لوحة تحكم ذكية',
      description: 'مؤشرات أداء واضحة ومباشرة في الوقت الفعلي',
      color: 'emerald',
    },
    {
      icon: Package,
      title: 'إدارة الطلبات',
      description: 'فلاتر متقدمة وتعديل سريع لجميع الطلبات',
      color: 'sky',
    },
    {
      icon: TrendingUp,
      title: 'تحليل المنتجات',
      description: 'اكتشف أكثر منتجاتك مبيعاً ونسب الأداء',
      color: 'amber',
    },
    {
      icon: Truck,
      title: 'أداء الشحن',
      description: 'قارن شركات الشحن واختر الأفضل',
      color: 'rose',
    },
    {
      icon: Globe,
      title: 'التحليل الجغرافي',
      description: 'حلل طلباتك حسب الدول والمناطق',
      color: 'violet',
    },
    {
      icon: FileDown,
      title: 'تصدير التقارير',
      description: 'صدّر بياناتك بصيغة CSV بنقرة واحدة',
      color: 'zinc',
    },
  ];

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    sky: 'bg-sky-100 text-sky-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
    violet: 'bg-violet-100 text-violet-600',
    zinc: 'bg-zinc-100 text-zinc-600',
  };

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-zinc-950 mb-4">
            كل ما تحتاجه في مكان واحد
          </h2>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            أدوات قوية لإدارة أعمال COD باحترافية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} hover>
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-xl ${colorClasses[feature.color]} flex items-center justify-center mb-6`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-950 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: UserPlus,
      title: 'أنشئ حساب',
      description: 'سجل مجاناً في دقائق معدودة',
    },
    {
      icon: Upload,
      title: 'ارفع بياناتك',
      description: 'استورد طلباتك من Excel أو CSV',
    },
    {
      icon: BarChart3,
      title: 'راقب الأداء',
      description: 'تابع مؤشراتك واتخذ قرارات ذكية',
    },
  ];

  return (
    <section className="py-20 lg:py-32 bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-zinc-950 mb-4">
            ابدأ في 3 خطوات
          </h2>
          <p className="text-xl text-zinc-600">
            بسيط، سريع، واحترافي
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <Card hover>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-soft-lg">
                      {index + 1}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                      <Icon className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-950 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-zinc-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: 'ابدأ',
      price: 25,
      limit: 'أقل من 1000 طلب شهرياً',
      badge: 'للمبتدئين',
      plan: 'starter',
    },
    {
      name: 'نمو',
      price: 35,
      limit: 'من 1000 إلى 3000 طلب',
      badge: 'الأكثر شعبية',
      plan: 'growth',
      popular: true,
    },
    {
      name: 'احتراف',
      price: 50,
      limit: 'أكثر من 3000 طلب',
      badge: 'للشركات',
      plan: 'pro',
    },
  ];

  const features = [
    'جميع موديولات المنصة',
    'تصدير CSV',
    'صلاحيات المستخدمين',
    'سجل التعديلات',
    'دعم فني متواصل',
  ];

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            <span>أسعار مدى الحياة</span>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-full text-base font-semibold mb-6 shadow-soft-lg">
            <Clock className="h-5 w-5" />
            <span>تجربة مجانية 24 ساعة بدون بطاقة لجميع الحسابات الجديدة</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-zinc-950 mb-4">
            خطة واحدة، دفعة واحدة
          </h2>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            ادفع مرة واحدة واستخدم المنصة مدى الحياة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-sm font-medium">
                    {plan.badge}
                  </div>
                </div>
              )}

              <Card
                hover
                className={`h-full ${
                  plan.popular ? 'ring-2 ring-emerald-500 shadow-soft-xl' : ''
                }`}
              >
                <CardContent className="p-8">
                  {!plan.popular && (
                    <div className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-xs font-medium inline-block mb-4">
                      {plan.badge}
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-zinc-950 mb-4 mt-2">
                    {plan.name}
                  </h3>

                  <div className="mb-6">
                    <span className="text-5xl font-bold text-zinc-950">${plan.price}</span>
                    <span className="text-zinc-600 text-lg mr-2">لمرة واحدة</span>
                  </div>

                  <p className="text-sm text-zinc-600 mb-8 pb-6 border-b border-zinc-200">
                    {plan.limit}
                  </p>

                  <ul className="space-y-4 mb-8">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-700">
                        <Check className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={`/auth/register?plan=${plan.plan}`}>
                    <Button
                      variant={plan.popular ? 'accent' : 'outline'}
                      className="w-full"
                      size="lg"
                    >
                      ابدأ التجربة
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'هل المنصة بديلة للأكسل؟',
      answer: 'نعم تماماً. المنصة توفر لك واجهة احترافية مع تحليلات متقدمة وأمان أعلى من الملفات التقليدية.',
    },
    {
      question: 'كيف أحوّل بياناتي من Excel؟',
      answer: 'يمكنك استيراد بياناتك بسهولة عبر رفع ملف CSV. العملية تستغرق دقائق معدودة.',
    },
    {
      question: 'هل يمكن إضافة موظفين؟',
      answer: 'نعم، يمكنك إضافة عدد غير محدود من الموظفين مع صلاحيات مخصصة لكل واحد.',
    },
    {
      question: 'هل يوجد نظام صلاحيات؟',
      answer: 'نعم، نظام صلاحيات متقدم يتيح لك التحكم الكامل في الوصول والتعديلات.',
    },
    {
      question: 'هل يمكن التصدير إلى Excel؟',
      answer: 'بالتأكيد، يمكنك تصدير جميع البيانات والتقارير إلى ملفات CSV في أي وقت.',
    },
    {
      question: 'هل الأسعار فعلاً مدى الحياة؟',
      answer: 'نعم، تدفع مرة واحدة فقط وتستخدم المنصة مدى الحياة بدون رسوم شهرية.',
    },
  ];

  return (
    <section className="py-20 lg:py-32 bg-zinc-50">
      <div className="max-w-3xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-zinc-950 mb-4">
            أسئلة شائعة
          </h2>
          <p className="text-xl text-zinc-600">
            إجابات واضحة على أكثر الأسئلة شيوعاً
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-right hover:bg-zinc-50 transition-smooth rounded-xl"
              >
                <h3 className="text-lg font-semibold text-zinc-950 flex-1 text-right">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`h-5 w-5 text-zinc-500 transition-smooth flex-shrink-0 mr-4 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-zinc-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const { user } = useAuth();

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-zinc-950 to-zinc-900">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
          جاهز للبدء؟
        </h2>
        <p className="text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
          انضم لمئات التجار الذين حولوا إدارة طلباتهم إلى تجربة احترافية
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          {user ? (
            <Link to="/app/dashboard">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-100 text-lg"
              >
                انتقل إلى لوحة التحكم
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-zinc-950 hover:bg-zinc-100 text-lg"
                >
                  إنشاء حساب مجاني
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-2 border-white text-white hover:bg-white/10 text-lg"
                >
                  تسجيل الدخول
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-12 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <span>آمن ومشفر</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            <span>إعداد سريع</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-500" />
            <span>دعم مباشر</span>
          </div>
        </div>
      </div>
    </section>
  );
}
