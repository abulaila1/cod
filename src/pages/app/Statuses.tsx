import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, Button, Input, Modal, Badge } from '@/components/ui';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { StatusService } from '@/services';
import type { Status, CreateStatusInput, UpdateStatusInput } from '@/types/domain';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, ArrowUp, ArrowDown } from 'lucide-react';

export function Statuses() {
  const { currentBusiness } = useBusiness();
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);

  const [formData, setFormData] = useState<CreateStatusInput>({
    key: '',
    label_ar: '',
    sort_order: 0,
    is_final: false,
    counts_as_delivered: false,
    counts_as_return: false,
    counts_as_active: true,
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
      const maxSortOrder = Math.max(...statuses.map(s => s.sort_order), 0);
      const newStatus = await StatusService.createStatus(currentBusiness.id, {
        ...formData,
        sort_order: maxSortOrder + 1,
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
        label_ar: formData.label_ar,
        is_final: formData.is_final,
        counts_as_delivered: formData.counts_as_delivered,
        counts_as_return: formData.counts_as_return,
        counts_as_active: formData.counts_as_active,
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
    if (!confirm(`هل أنت متأكد من حذف الحالة "${status.label_ar}"؟`)) return;
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
      key: status.key,
      label_ar: status.label_ar,
      sort_order: status.sort_order,
      is_final: status.is_final,
      counts_as_delivered: status.counts_as_delivered,
      counts_as_return: status.counts_as_return,
      counts_as_active: status.counts_as_active,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      key: '',
      label_ar: '',
      sort_order: 0,
      is_final: false,
      counts_as_delivered: false,
      counts_as_return: false,
      counts_as_active: true,
    });
  };

  if (!currentBusiness) {
    return (
      <AppLayout pageTitle="حالات الطلب">
        <div className="text-center py-12">
          <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="حالات الطلب">
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

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-zinc-950">{status.label_ar}</h4>
                        <code className="text-xs bg-zinc-200 px-2 py-1 rounded">
                          {status.key}
                        </code>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {status.is_final && (
                          <Badge variant="default" size="sm">نهائية</Badge>
                        )}
                        {status.counts_as_delivered && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="h-3 w-3 inline ml-1" />
                            موصّلة
                          </Badge>
                        )}
                        {status.counts_as_return && (
                          <Badge variant="danger" size="sm">
                            <XCircle className="h-3 w-3 inline ml-1" />
                            مرتجعة
                          </Badge>
                        )}
                        {status.counts_as_active && (
                          <Badge variant="default" size="sm">نشطة</Badge>
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
              label="المفتاح (key)"
              placeholder="new, confirmed, delivered..."
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            />
            <Input
              label="الاسم بالعربية"
              placeholder="طلبات جديدة"
              value={formData.label_ar}
              onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_final}
                  onChange={(e) => setFormData({ ...formData, is_final: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-900">حالة نهائية</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.counts_as_delivered}
                  onChange={(e) => setFormData({ ...formData, counts_as_delivered: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-900">تُحسب كموصّلة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.counts_as_return}
                  onChange={(e) => setFormData({ ...formData, counts_as_return: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-900">تُحسب كمرتجعة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.counts_as_active}
                  onChange={(e) => setFormData({ ...formData, counts_as_active: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-900">تُحسب كنشطة</span>
              </label>
            </div>

            <Button
              variant="accent"
              className="w-full"
              onClick={handleCreate}
              disabled={!formData.key || !formData.label_ar}
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
            <div className="bg-zinc-50 p-3 rounded-lg">
              <p className="text-sm text-zinc-600">المفتاح:</p>
              <code className="text-sm font-medium text-zinc-950">{selectedStatus.key}</code>
            </div>

            <Input
              label="الاسم بالعربية"
              value={formData.label_ar}
              onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
            />

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_final}
                  onChange={(e) => setFormData({ ...formData, is_final: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-900">حالة نهائية</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.counts_as_delivered}
                  onChange={(e) => setFormData({ ...formData, counts_as_delivered: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-900">تُحسب كموصّلة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.counts_as_return}
                  onChange={(e) => setFormData({ ...formData, counts_as_return: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-900">تُحسب كمرتجعة</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.counts_as_active}
                  onChange={(e) => setFormData({ ...formData, counts_as_active: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-300"
                />
                <span className="text-sm text-zinc-900">تُحسب كنشطة</span>
              </label>
            </div>

            <Button
              variant="accent"
              className="w-full"
              onClick={handleUpdate}
              disabled={!formData.label_ar}
            >
              حفظ التغييرات
            </Button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
