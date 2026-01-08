import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { EmployeesService, AVAILABLE_PERMISSIONS } from '@/services/employees.service';
import type { Employee, EmployeeBonus, EmployeeLogin, EmployeeAnalytics } from '@/services/employees.service';
import { PerformanceService } from '@/services/performance.service';
import { PageHeader } from '@/components/common/PageHeader';
import { Button, Input, Modal } from '@/components/ui';
import {
  ArrowRight,
  User,
  Mail,
  Briefcase,
  DollarSign,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Award,
  Gift,
  Plus,
  Trash2,
  Calendar,
  Activity,
  Package,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import type { PerformanceBreakdown } from '@/types/performance';

export function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBusiness, formatCurrency } = useBusiness();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const [bonuses, setBonuses] = useState<EmployeeBonus[]>([]);
  const [loginHistory, setLoginHistory] = useState<EmployeeLogin[]>([]);
  const [performance, setPerformance] = useState<PerformanceBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [isSavingBonus, setIsSavingBonus] = useState(false);

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    if (currentBusiness && id) {
      loadData();
    }
  }, [currentBusiness, id, dateFrom, dateTo]);

  const loadData = async () => {
    if (!currentBusiness || !id) return;

    try {
      setIsLoading(true);

      const [emp, anal, bon, logins, perf] = await Promise.all([
        EmployeesService.getById(currentBusiness.id, id),
        EmployeesService.getAnalytics(currentBusiness.id, id, dateFrom, dateTo),
        EmployeesService.getBonuses(currentBusiness.id, id),
        EmployeesService.getLoginHistory(currentBusiness.id, id, 10),
        PerformanceService.getEmployeeBreakdown(currentBusiness.id, { date_from: dateFrom, date_to: dateTo }),
      ]);

      setEmployee(emp);
      setAnalytics(anal);
      setBonuses(bon);
      setLoginHistory(logins);
      setPerformance(perf.find(p => p.entity_id === id) || null);
    } catch (error) {
      console.error('Failed to load employee details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBonus = async () => {
    if (!currentBusiness || !id || !bonusAmount) return;

    try {
      setIsSavingBonus(true);
      await EmployeesService.addBonus(
        currentBusiness.id,
        id,
        parseFloat(bonusAmount),
        bonusReason
      );
      setShowBonusModal(false);
      setBonusAmount('');
      setBonusReason('');
      loadData();
    } catch (error) {
      console.error('Failed to add bonus:', error);
    } finally {
      setIsSavingBonus(false);
    }
  };

  const handleDeleteBonus = async (bonusId: string) => {
    if (!currentBusiness) return;
    if (!confirm('هل أنت متأكد من حذف هذه المكافأة؟')) return;

    try {
      await EmployeesService.deleteBonus(currentBusiness.id, bonusId);
      loadData();
    } catch (error) {
      console.error('Failed to delete bonus:', error);
    }
  };

  const totalBonuses = bonuses.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalCompensation = (employee?.salary || 0) + totalBonuses;

  const lastLogin = loginHistory.find(l => l.success);

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-zinc-200 rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">الموظف غير موجود</p>
        <Button onClick={() => navigate('/app/employees')} className="mt-4">
          العودة للموظفين
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/app/employees')}
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{employee.name_ar}</h1>
          <p className="text-zinc-500">{employee.role || 'موظف'}</p>
        </div>
        <div className={`mr-auto px-3 py-1 rounded-full text-sm font-medium ${
          employee.active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'
        }`}>
          {employee.active ? 'نشط' : 'غير نشط'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            معلومات الموظف
          </h3>
          <div className="space-y-3">
            {employee.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-600">{employee.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-600">الراتب: {formatCurrency(employee.salary || 0)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Gift className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-600">المكافآت: {formatCurrency(totalBonuses)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Award className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-600">الإجمالي: {formatCurrency(totalCompensation)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            آخر تسجيل دخول
          </h3>
          {lastLogin ? (
            <div className="space-y-2">
              <div className="text-2xl font-bold text-zinc-900">
                {new Date(lastLogin.login_at).toLocaleDateString('ar-SA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              <div className="text-lg text-zinc-600">
                {new Date(lastLogin.login_at).toLocaleTimeString('ar-SA', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="w-4 h-4" />
                دخول ناجح
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-center py-4">
              لم يتم تسجيل أي دخول بعد
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            الصلاحيات ({employee.permissions?.length || 0})
          </h3>
          <div className="flex flex-wrap gap-2">
            {employee.permissions?.length ? (
              employee.permissions.map(p => {
                const perm = AVAILABLE_PERMISSIONS.find(ap => ap.key === p);
                return (
                  <span
                    key={p}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {perm?.label || p}
                  </span>
                );
              })
            ) : (
              <span className="text-zinc-500">لا توجد صلاحيات</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h3 className="font-semibold text-zinc-900">تحليلات الأداء</h3>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-lg text-sm"
            />
            <span className="text-zinc-500">إلى</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-zinc-300 rounded-lg text-sm"
            />
            <button
              onClick={loadData}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-zinc-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <Package className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{performance?.total || 0}</span>
          </div>
          <p className="text-blue-100">إجمالي الطلبات</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{performance?.delivered || 0}</span>
          </div>
          <p className="text-emerald-100">تم التسليم</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <XCircle className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{performance?.returned || 0}</span>
          </div>
          <p className="text-red-100">مرتجع</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{(performance?.delivery_rate || 0).toFixed(0)}%</span>
          </div>
          <p className="text-amber-100">نسبة التسليم</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            توزيع الطلبات حسب الحالة
          </h3>
          {analytics?.orders_by_status?.length ? (
            <div className="space-y-3">
              {analytics.orders_by_status.map(status => {
                const total = analytics.total_orders_processed || 1;
                const percentage = (status.count / total) * 100;
                return (
                  <div key={status.status_id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-600">{status.status_name}</span>
                      <span className="text-sm font-medium text-zinc-900">{status.count}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-8">
              لا توجد بيانات
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            النشاط اليومي
          </h3>
          {analytics?.activity_by_day?.length ? (
            <div className="space-y-2">
              {analytics.activity_by_day.slice(-7).map(day => {
                const maxCount = Math.max(...analytics.activity_by_day.map(d => d.count));
                const percentage = (day.count / (maxCount || 1)) * 100;
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-20">
                      {new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 h-6 bg-zinc-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded transition-all flex items-center justify-end px-2"
                        style={{ width: `${Math.max(percentage, 10)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{day.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-8">
              لا يوجد نشاط مسجل
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600" />
              المكافآت
            </h3>
            <Button size="sm" onClick={() => setShowBonusModal(true)}>
              <Plus className="w-4 h-4 ml-1" />
              إضافة مكافأة
            </Button>
          </div>

          {bonuses.length ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {bonuses.map(bonus => (
                <div
                  key={bonus.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100"
                >
                  <div>
                    <div className="font-semibold text-amber-700">
                      +{formatCurrency(bonus.amount)}
                    </div>
                    {bonus.reason && (
                      <div className="text-sm text-amber-600">{bonus.reason}</div>
                    )}
                    <div className="text-xs text-amber-500 mt-1">
                      {new Date(bonus.created_at).toLocaleDateString('ar-SA')} - {bonus.month}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBonus(bonus.id)}
                    className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-8">
              لا توجد مكافآت مسجلة
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            سجل تسجيل الدخول
          </h3>

          {loginHistory.length ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {loginHistory.map(login => (
                <div
                  key={login.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    login.success ? 'bg-emerald-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {login.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className={`text-sm font-medium ${
                        login.success ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {login.success ? 'دخول ناجح' : 'محاولة فاشلة'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(login.login_at).toLocaleDateString('ar-SA')} - {' '}
                        {new Date(login.login_at).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-zinc-500 py-8">
              لا يوجد سجل دخول
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showBonusModal}
        onClose={() => setShowBonusModal(false)}
        title="إضافة مكافأة"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              قيمة المكافأة *
            </label>
            <Input
              type="number"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              سبب المكافأة
            </label>
            <Input
              value={bonusReason}
              onChange={(e) => setBonusReason(e.target.value)}
              placeholder="مثال: أداء متميز"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <Button
              variant="secondary"
              onClick={() => setShowBonusModal(false)}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleAddBonus}
              disabled={isSavingBonus || !bonusAmount}
              className="flex-1"
            >
              {isSavingBonus ? 'جاري الإضافة...' : 'إضافة المكافأة'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
