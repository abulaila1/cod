import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Button, Input, Modal, Badge } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { StatusService } from '@/services';
import type { Status, CreateStatusInput, UpdateStatusInput, StatusValidationResult } from '@/types/domain';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Lock, CheckCircle, XCircle, Clock, AlertTriangle, Info } from 'lucide-react';

const DEFAULT_COLORS = [
  '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'
];

interface StatusFormData extends CreateStatusInput {
  counts_as_delivered: boolean;
  counts_as_return: boolean;
  counts_as_active: boolean;
  is_final: boolean;
}

export function Statuses() {
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const [formData, setFormData] = useState<StatusFormData>({
    name_ar: '',
    name_en: '',
    color: '#6B7280',
    is_default: false,
    display_order: 0,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
    is_final: false,
  });

  useEffect(() => {
    if (currentBusiness) {
      loadStatuses();
    }
  }, [currentBusiness]);

  const loadStatuses = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const data = await StatusService.getStatuses(currentBusiness.id);
      setStatuses(data);
    } catch (error) {
      console.error('Failed to load statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (isUpdate: boolean = false): boolean => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!formData.name_ar.trim()) {
      errors.push('يجب إدخال اسم الحالة بالعربية');
    }

    if (formData.counts_as_delivered && formData.counts_as_return) {
      errors.push('لا يمكن أن تكون الحالة "تسليم" و "مرتجع" في نفس الوقت');
    }

    if (formData.counts_as_delivered && formData.counts_as_active) {
      warnings.push('عادة ما تكون حالة التسليم نهائية وليست نشطة');
    }

    if (isUpdate && selectedStatus?.is_system_default) {
      if (
        formData.counts_as_delivered !== selectedStatus.counts_as_delivered ||
        formData.counts_as_return !== selectedStatus.counts_as_return ||
        formData.counts_as_active !== selectedStatus.counts_as_active ||
        formData.is_final !== selectedStatus.is_final
      ) {
        errors.push('لا يمكن تغيير خصائص الحالات الافتراضية. يمكنك فقط تغيير الاسم واللون');
      }
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);
    return errors.length === 0;
  };

  const handleCreate = async () => {
    if (!currentBusiness || !user) return;
    if (!validateForm()) return;

    try {
      const maxOrder = Math.max(...statuses.map(s => s.sort_order || s.display_order || 0), 0);
      const newStatus = await StatusService.createStatus(currentBusiness.id, {
        ...formData,
        sort_order: maxOrder + 1,
        display_order: maxOrder + 1,
      });

      await StatusService.logStatusChange(
        currentBusiness.id,
        user.id,
        newStatus.id,
        'create',
        null,
        newStatus
      );

      setShowCreateModal(false);
      resetForm();
      loadStatuses();
    } catch (error: any) {
      console.error('Failed to create status:', error);
      alert(error.message || 'فشل إنشاء الحالة');
    }
  };

  const handleUpdate = async () => {
    if (!selectedStatus || !currentBusiness || !user) return;
    if (!validateForm(true)) return;

    try {
      const before = { ...selectedStatus };
      const updateData: UpdateStatusInput = {
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        color: formData.color,
        is_default: formData.is_default,
      };

      if (!selectedStatus.is_system_default) {
        updateData.counts_as_delivered = formData.counts_as_delivered;
        updateData.counts_as_return = formData.counts_as_return;
        updateData.counts_as_active = formData.counts_as_active;
        updateData.is_final = formData.is_final;
      }

      const updatedStatus = await StatusService.updateStatus(selectedStatus.id, updateData);

      await StatusService.logStatusChange(
        currentBusiness.id,
        user.id,
        selectedStatus.id,
        'update',
        before,
        updatedStatus
      );

      setShowEditModal(false);
      setSelectedStatus(null);
      resetForm();
      loadStatuses();
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert(error.message || 'فشل تحديث الحالة');
    }
  };

  const handleDelete = async (status: Status) => {
    if (!currentBusiness || !user) return;

    try {
      const validation: StatusValidationResult = await StatusService.canDeleteStatus(status.id);

      if (!validation.canDelete) {
        alert(validation.reason || 'لا يمكن حذف هذه الحالة');
        return;
      }

      if (!confirm(`هل أنت متأكد من حذف الحالة "${status.name_ar}"؟`)) return;

      await StatusService.deleteStatus(status.id);

      await StatusService.logStatusChange(
        currentBusiness.id,
        user.id,
        status.id,
        'delete',
        status,
        null
      );

      loadStatuses();
    } catch (error: any) {
      console.error('Failed to delete status:', error);
      alert(error.message || 'فشل حذف الحالة');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !currentBusiness) return;

    const newStatuses = [...statuses];
    [newStatuses[index - 1], newStatuses[index]] = [newStatuses[index], newStatuses[index - 1]];

    try {
      await StatusService.reorderStatuses(
        currentBusiness.id,
        newStatuses.map(s => s.id)
      );
      setStatuses(newStatuses);
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === statuses.length - 1 || !currentBusiness) return;

    const newStatuses = [...statuses];
    [newStatuses[index], newStatuses[index + 1]] = [newStatuses[index + 1], newStatuses[index]];

    try {
      await StatusService.reorderStatuses(
        currentBusiness.id,
        newStatuses.map(s => s.id)
      );
      setStatuses(newStatuses);
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  };

  const openEditModal = (status: Status) => {
    setSelectedStatus(status);
    setFormData({
      name_ar: status.name_ar,
      name_en: status.name_en || '',
      color: status.color || '#6B7280',
      is_default: status.is_default || false,
      display_order: status.display_order || 0,
      counts_as_delivered: status.counts_as_delivered,
      counts_as_return: status.counts_as_return,
      counts_as_active: status.counts_as_active,
      is_final: status.is_final,
    });
    setValidationErrors([]);
    setValidationWarnings([]);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name_ar: '',
      name_en: '',
      color: '#6B7280',
      is_default: false,
      display_order: 0,
      counts_as_delivered: false,
      counts_as_return: false,
      counts_as_active: true,
      is_final: false,
    });
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  const getStatusTypeBadges = (status: Status) => {
    const badges = [];
    if (status.counts_as_delivered) {
      badges.push(
        <Badge key="delivered" variant="success" size="sm" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          تسليم ناجح
        </Badge>
      );
    }
    if (status.counts_as_return) {
      badges.push(
        <Badge key="returned" variant="error" size="sm" className="gap-1">
          <XCircle className="h-3 w-3" />
          مرتجع
        </Badge>
      );
    }
    if (status.counts_as_active) {
      badges.push(
        <Badge key="active" variant="warning" size="sm" className="gap-1">
          <Clock className="h-3 w-3" />
          نشط
        </Badge>
      );
    }
    if (status.is_final) {
      badges.push(
        <Badge key="final" variant="default" size="sm" className="gap-1">
          نهائي
        </Badge>
      );
    }
    return badges;
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
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-zinc-950">حالات الطلب</h3>
            <p className="text-sm text-zinc-600 mt-1">إدارة حالات الطلبات وتأثيرها على التقارير</p>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="h-4 w-4" />
            إضافة حالة
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">نظام الحالات الذكي:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>الحالات الافتراضية محمية من الحذف ولا يمكن تغيير خصائصها المنطقية</li>
                  <li>يمكنك تغيير اسم ولون الحالات الافتراضية فقط</li>
                  <li>لا يمكن حذف آخر حالة من أي نوع (تسليم، مرتجع، نشط)</li>
                  <li>الحالات تؤثر مباشرة على حسابات التقارير والإيرادات</li>
                </ul>
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="text-zinc-600 text-center py-8">جاري التحميل...</p>
          ) : statuses.length === 0 ? (
            <p className="text-zinc-600 text-center py-8">لا توجد حالات</p>
          ) : (
            <div className="space-y-2">
              {statuses.map((status, index) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-smooth"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-zinc-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
                      >
                        <ArrowUp className="h-3 w-3 text-zinc-600" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === statuses.length - 1}
                        className="p-1 hover:bg-zinc-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-smooth"
                      >
                        <ArrowDown className="h-3 w-3 text-zinc-600" />
                      </button>
                    </div>

                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.color || '#6B7280' }}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-zinc-950">{status.name_ar}</h4>
                        {status.name_en && (
                          <span className="text-xs text-zinc-500">({status.name_en})</span>
                        )}
                        {status.is_system_default && (
                          <Lock className="h-4 w-4 text-zinc-400" title="حالة افتراضية محمية" />
                        )}
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {getStatusTypeBadges(status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(status)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-smooth"
                      title="تعديل"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(status)}
                      className={`p-2 rounded-lg transition-smooth ${
                        status.is_system_default
                          ? 'text-zinc-300 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      disabled={status.is_system_default}
                      title={status.is_system_default ? 'لا يمكن حذف الحالات الافتراضية' : 'حذف'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="إضافة حالة جديدة"
        >
          <div className="space-y-4">
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900 mb-1">يوجد أخطاء:</p>
                <ul className="text-sm text-red-800 space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-900 mb-1">تنبيهات:</p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {validationWarnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <Input
              label="الاسم بالعربية *"
              placeholder="مثال: قيد المعالجة"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            />
            <Input
              label="الاسم بالإنجليزية (اختياري)"
              placeholder="e.g., Processing"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">اللون</label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-zinc-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-zinc-700 mb-3">خصائص الحالة:</label>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-zinc-50 rounded">
                  <input
                    type="checkbox"
                    checked={formData.counts_as_delivered}
                    onChange={(e) => {
                      setFormData({ ...formData, counts_as_delivered: e.target.checked });
                      setTimeout(() => validateForm(), 0);
                    }}
                    className="w-4 h-4 rounded border-zinc-300 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-zinc-900">تُحتسب كتسليم ناجح</span>
                    <p className="text-xs text-zinc-600">الطلبات بهذه الحالة تظهر في تقارير الطلبات المسلمة والإيرادات</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-zinc-50 rounded">
                  <input
                    type="checkbox"
                    checked={formData.counts_as_return}
                    onChange={(e) => {
                      setFormData({ ...formData, counts_as_return: e.target.checked });
                      setTimeout(() => validateForm(), 0);
                    }}
                    className="w-4 h-4 rounded border-zinc-300 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-zinc-900">تُحتسب كمرتجع</span>
                    <p className="text-xs text-zinc-600">الطلبات بهذه الحالة تظهر في تقارير المرتجعات</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-zinc-50 rounded">
                  <input
                    type="checkbox"
                    checked={formData.counts_as_active}
                    onChange={(e) => setFormData({ ...formData, counts_as_active: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-zinc-900">حالة نشطة</span>
                    <p className="text-xs text-zinc-600">الطلبات بهذه الحالة تعتبر قيد المعالجة</p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-zinc-50 rounded">
                  <input
                    type="checkbox"
                    checked={formData.is_final}
                    onChange={(e) => setFormData({ ...formData, is_final: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-300 mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-zinc-900">حالة نهائية</span>
                    <p className="text-xs text-zinc-600">الطلبات بهذه الحالة لا تحتاج إجراءات إضافية</p>
                  </div>
                </label>
              </div>
            </div>

            <Button
              variant="accent"
              className="w-full"
              onClick={handleCreate}
              disabled={!formData.name_ar || validationErrors.length > 0}
            >
              إنشاء
            </Button>
          </div>
        </Modal>
      )}

      {showEditModal && selectedStatus && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStatus(null);
            resetForm();
          }}
          title={`تعديل الحالة: ${selectedStatus.name_ar}`}
        >
          <div className="space-y-4">
            {selectedStatus.is_system_default && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium">حالة افتراضية محمية</p>
                  <p className="mt-1">يمكنك تغيير الاسم واللون فقط. الخصائص المنطقية لا يمكن تعديلها.</p>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900 mb-1">يوجد أخطاء:</p>
                <ul className="text-sm text-red-800 space-y-1">
                  {validationErrors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validationWarnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-900 mb-1">تنبيهات:</p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  {validationWarnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <Input
              label="الاسم بالعربية"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            />
            <Input
              label="الاسم بالإنجليزية (اختياري)"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">اللون</label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-zinc-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              </div>
            </div>

            {!selectedStatus.is_system_default && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-zinc-700 mb-3">خصائص الحالة:</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-zinc-50 rounded">
                    <input
                      type="checkbox"
                      checked={formData.counts_as_delivered}
                      onChange={(e) => {
                        setFormData({ ...formData, counts_as_delivered: e.target.checked });
                        setTimeout(() => validateForm(true), 0);
                      }}
                      className="w-4 h-4 rounded border-zinc-300 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-900">تُحتسب كتسليم ناجح</span>
                      <p className="text-xs text-zinc-600">الطلبات بهذه الحالة تظهر في تقارير الطلبات المسلمة والإيرادات</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-zinc-50 rounded">
                    <input
                      type="checkbox"
                      checked={formData.counts_as_return}
                      onChange={(e) => {
                        setFormData({ ...formData, counts_as_return: e.target.checked });
                        setTimeout(() => validateForm(true), 0);
                      }}
                      className="w-4 h-4 rounded border-zinc-300 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-900">تُحتسب كمرتجع</span>
                      <p className="text-xs text-zinc-600">الطلبات بهذه الحالة تظهر في تقارير المرتجعات</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-zinc-50 rounded">
                    <input
                      type="checkbox"
                      checked={formData.counts_as_active}
                      onChange={(e) => setFormData({ ...formData, counts_as_active: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-300 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-900">حالة نشطة</span>
                      <p className="text-xs text-zinc-600">الطلبات بهذه الحالة تعتبر قيد المعالجة</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-2 hover:bg-zinc-50 rounded">
                    <input
                      type="checkbox"
                      checked={formData.is_final}
                      onChange={(e) => setFormData({ ...formData, is_final: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-300 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-zinc-900">حالة نهائية</span>
                      <p className="text-xs text-zinc-600">الطلبات بهذه الحالة لا تحتاج إجراءات إضافية</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <Button
              variant="accent"
              className="w-full"
              onClick={handleUpdate}
              disabled={!formData.name_ar || validationErrors.length > 0}
            >
              حفظ التغييرات
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
