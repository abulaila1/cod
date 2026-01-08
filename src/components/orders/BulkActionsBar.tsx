import { useState } from 'react';
import { Button, Select, Modal } from '@/components/ui';
import type { Status } from '@/types/domain';
import { X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  statuses: Status[];
  onUpdateStatus: (statusId: string) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  statuses,
  onUpdateStatus,
  onClearSelection,
}: BulkActionsBarProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedStatusId, setSelectedStatusId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirmUpdate = async () => {
    if (!selectedStatusId) return;

    setIsUpdating(true);
    try {
      await onUpdateStatus(selectedStatusId);
      setIsConfirmOpen(false);
      setSelectedStatusId('');
    } catch (error) {
      console.error('Failed to update statuses:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-1/2 translate-x-1/2 bg-zinc-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 z-50 border border-zinc-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">تم تحديد {selectedCount} طلب</span>
          <button
            onClick={onClearSelection}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-zinc-700" />

        <div className="flex items-center gap-3">
          <Select
            value={selectedStatusId}
            onChange={(e) => setSelectedStatusId(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white text-sm"
          >
            <option value="">تغيير الحالة...</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name_ar}
              </option>
            ))}
          </Select>

          <Button
            onClick={() => setIsConfirmOpen(true)}
            disabled={!selectedStatusId}
            size="sm"
            variant="primary"
          >
            تطبيق
          </Button>
        </div>
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="تأكيد التحديث الجماعي"
      >
        <div className="space-y-4">
          <p className="text-zinc-600">
            هل أنت متأكد من تحديث حالة {selectedCount} طلب؟
          </p>

          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setIsConfirmOpen(false)}
              variant="outline"
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              variant="primary"
              disabled={isUpdating}
            >
              {isUpdating ? 'جاري التحديث...' : 'تأكيد'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
