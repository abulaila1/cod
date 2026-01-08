import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Button, Input, Modal, Badge } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { StatusService } from '@/services';
import type { Status, CreateStatusInput, UpdateStatusInput } from '@/types/domain';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Star } from 'lucide-react';

const DEFAULT_COLORS = [
  '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'
];

export function Statuses() {
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

  const [formData, setFormData] = useState<CreateStatusInput>({
    name_ar: '',
    name_en: '',
    color: '#6B7280',
    is_default: false,
    display_order: 0,
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

  const handleCreate = async () => {
    if (!currentBusiness || !user) return;

    try {
      const maxOrder = Math.max(...statuses.map(s => s.display_order || 0), 0);
      const newStatus = await StatusService.createStatus(currentBusiness.id, {
        ...formData,
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
    } catch (error) {
      console.error('Failed to create status:', error);
      alert('فشل إنشاء الحالة');
    }
  };

  const handleUpdate = async () => {
    if (!selectedStatus || !currentBusiness || !user) return;

    try {
      const before = { ...selectedStatus };
      const updateData: UpdateStatusInput = {
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        color: formData.color,
        is_default: formData.is_default,
      };

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
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('فشل تحديث الحالة');
    }
  };

  const handleDelete = async (status: Status) => {
    if (!confirm(`هل أنت متأكد من حذف الحالة "${status.name_ar}"؟`)) return;
    if (!currentBusiness || !user) return;

    try {
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
    } catch (error) {
      console.error('Failed to delete status:', error);
      alert('فشل حذف الحالة');
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
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name_ar: '',
      name_en: '',
      color: '#6B7280',
      is_default: false,
      display_order: 0,
    });
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

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-zinc-950">حالات الطلب</h3>
            <p className="text-sm text-zinc-600 mt-1">إدارة حالات الطلبات المختلفة</p>
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
                      </div>
                      <div className="flex gap-2 mt-2">
                        {status.is_default && (
                          <Badge variant="success" size="sm">
                            <Star className="h-3 w-3 inline ml-1" />
                            افتراضية
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(status)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-smooth"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(status)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
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
            <Input
              label="الاسم بالعربية"
              placeholder="طلبات جديدة"
              value={formData.name_ar}
              onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            />
            <Input
              label="الاسم بالإنجليزية (اختياري)"
              placeholder="New Orders"
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

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-900">حالة افتراضية للطلبات الجديدة</span>
            </label>

            <Button
              variant="accent"
              className="w-full"
              onClick={handleCreate}
              disabled={!formData.name_ar}
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
          title="تعديل الحالة"
        >
          <div className="space-y-4">
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

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300"
              />
              <span className="text-sm text-zinc-900">حالة افتراضية للطلبات الجديدة</span>
            </label>

            <Button
              variant="accent"
              className="w-full"
              onClick={handleUpdate}
              disabled={!formData.name_ar}
            >
              حفظ التغييرات
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
