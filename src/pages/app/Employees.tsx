import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { EmployeesService, AVAILABLE_PERMISSIONS } from '@/services/employees.service';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '@/services/employees.service';
import { PerformanceService } from '@/services/performance.service';
import { PageHeader } from '@/components/common/PageHeader';
import { Button, Input, Modal } from '@/components/ui';
import {
  Plus,
  Search,
  Users,
  Mail,
  Briefcase,
  DollarSign,
  Shield,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  MoreVertical,
  User,
  Lock,
  ChevronLeft,
} from 'lucide-react';
import type { PerformanceBreakdown } from '@/types/performance';

interface EmployeeFormData {
  name_ar: string;
  name_en: string;
  email: string;
  password: string;
  salary: string;
  permissions: string[];
}

const initialFormData: EmployeeFormData = {
  name_ar: '',
  name_en: '',
  email: '',
  password: '',
  salary: '',
  permissions: [],
};

export function Employees() {
  const navigate = useNavigate();
  const { currentBusiness, formatCurrency } = useBusiness();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [currentBusiness]);

  const loadData = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const [employeesList, performance] = await Promise.all([
        EmployeesService.list(currentBusiness.id),
        PerformanceService.getEmployeeBreakdown(currentBusiness.id, {}),
      ]);
      setEmployees(employeesList);
      setPerformanceData(performance);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeePerformance = (employeeId: string) => {
    return performanceData.find(p => p.entity_id === employeeId);
  };

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name_ar: employee.name_ar,
        name_en: employee.name_en || '',
        email: employee.email || '',
        password: '',
        salary: employee.salary?.toString() || '',
        permissions: employee.permissions || [],
      });
    } else {
      setEditingEmployee(null);
      setFormData(initialFormData);
    }
    setShowPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    setFormData(initialFormData);
  };

  const handleTogglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleSave = async () => {
    if (!currentBusiness || !formData.name_ar.trim()) return;

    if (formData.permissions.length === 0) {
      alert('يجب اختيار صلاحية واحدة على الأقل');
      return;
    }

    try {
      setIsSaving(true);

      if (editingEmployee) {
        const updateInput: UpdateEmployeeInput = {
          name_ar: formData.name_ar,
          name_en: formData.name_en || undefined,
          email: formData.email || undefined,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          permissions: formData.permissions,
        };
        if (formData.password) {
          updateInput.password = formData.password;
        }
        await EmployeesService.update(currentBusiness.id, editingEmployee.id, updateInput);
      } else {
        const createInput: CreateEmployeeInput = {
          name_ar: formData.name_ar,
          name_en: formData.name_en || undefined,
          email: formData.email || undefined,
          password: formData.password || undefined,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          permissions: formData.permissions,
        };
        await EmployeesService.create(currentBusiness.id, createInput);
      }

      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error('Failed to save employee:', error);
      alert(error.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    if (!currentBusiness) return;

    try {
      await EmployeesService.toggleActive(currentBusiness.id, employee.id, !employee.is_active);
      loadData();
    } catch (error) {
      console.error('Failed to toggle employee status:', error);
    }
    setActiveMenu(null);
  };

  const handleDelete = async (employee: Employee) => {
    if (!currentBusiness) return;
    if (!confirm(`هل أنت متأكد من حذف "${employee.name_ar}"؟`)) return;

    try {
      await EmployeesService.delete(currentBusiness.id, employee.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete employee:', error);
    }
    setActiveMenu(null);
  };

  const filteredEmployees = employees.filter(e =>
    e.name_ar.toLowerCase().includes(search.toLowerCase()) ||
    e.name_en?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.is_active).length,
    totalSalary: employees.filter(e => e.is_active).reduce((sum, e) => sum + (e.salary || 0), 0),
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="إدارة الموظفين"
        description="إضافة وإدارة موظفي التأكيد مع الصلاحيات والرواتب"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">إجمالي الموظفين</p>
              <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">الموظفين النشطين</p>
              <p className="text-2xl font-bold text-zinc-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">إجمالي الرواتب</p>
              <p className="text-2xl font-bold text-zinc-900">{formatCurrency(stats.totalSalary)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="البحث عن موظف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
            <Plus className="w-5 h-5 ml-2" />
            إضافة موظف
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-zinc-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-zinc-200 rounded w-32 mb-2" />
                  <div className="h-4 bg-zinc-200 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">لا يوجد موظفين</h3>
          <p className="text-zinc-500 mb-4">ابدأ بإضافة موظفين لإدارة فريقك</p>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-5 h-5 ml-2" />
            إضافة موظف
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(employee => {
            const performance = getEmployeePerformance(employee.id);
            const deliveryRate = performance?.delivery_rate || 0;
            const confirmationRate = performance?.confirmation_rate || 0;

            return (
              <div
                key={employee.id}
                className="bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                        employee.is_active ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        {employee.name_ar.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900">{employee.name_ar}</h3>
                        {employee.name_en && (
                          <p className="text-sm text-zinc-500 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {employee.name_en}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === employee.id ? null : employee.id)}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-zinc-400" />
                      </button>

                      {activeMenu === employee.id && (
                        <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 min-w-[140px] z-10">
                          <button
                            onClick={() => {
                              handleOpenModal(employee);
                              setActiveMenu(null);
                            }}
                            className="w-full px-4 py-2 text-right text-sm hover:bg-zinc-50 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            تعديل
                          </button>
                          <button
                            onClick={() => handleToggleActive(employee)}
                            className="w-full px-4 py-2 text-right text-sm hover:bg-zinc-50 flex items-center gap-2"
                          >
                            {employee.is_active ? (
                              <>
                                <EyeOff className="w-4 h-4" />
                                تعطيل
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                تفعيل
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(employee)}
                            className="w-full px-4 py-2 text-right text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {employee.email && (
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Mail className="w-4 h-4 text-zinc-400" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <DollarSign className="w-4 h-4 text-zinc-400" />
                      <span>الراتب: {formatCurrency(employee.salary || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <Shield className="w-4 h-4 text-zinc-400" />
                      <span>{employee.permissions?.length || 0} صلاحيات</span>
                    </div>
                    {employee.last_login_at && (
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <span>آخر دخول: {new Date(employee.last_login_at).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-100">
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald-600">
                        {confirmationRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-zinc-500">نسبة التأكيد</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {deliveryRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-zinc-500">نسبة التسليم</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/app/employees/${employee.id}`)}
                  className="w-full py-3 border-t border-zinc-100 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  عرض التفاصيل والتحليلات
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingEmployee ? 'تعديل الموظف' : 'إضافة موظف جديد'}
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                <User className="w-4 h-4 inline ml-1" />
                اسم الموظف *
              </label>
              <Input
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                placeholder="أدخل اسم الموظف"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                <Briefcase className="w-4 h-4 inline ml-1" />
                الاسم بالإنجليزي
              </label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Employee Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                <Mail className="w-4 h-4 inline ml-1" />
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="employee@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                <Lock className="w-4 h-4 inline ml-1" />
                كلمة المرور {editingEmployee && '(اتركها فارغة للإبقاء على القديمة)'}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              <DollarSign className="w-4 h-4 inline ml-1" />
              الراتب الشهري
            </label>
            <Input
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-3">
              <Shield className="w-4 h-4 inline ml-1" />
              الصلاحيات في النظام * (اختر صلاحية واحدة على الأقل)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_PERMISSIONS.map(permission => (
                <label
                  key={permission.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.permissions.includes(permission.key)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.key)}
                    onChange={() => handleTogglePermission(permission.key)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-zinc-700">{permission.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <Button onClick={handleCloseModal} variant="secondary" className="flex-1">
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name_ar.trim() || formData.permissions.length === 0}
              className="flex-1"
            >
              {isSaving ? 'جاري الحفظ...' : editingEmployee ? 'حفظ التعديلات' : 'إضافة الموظف'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
