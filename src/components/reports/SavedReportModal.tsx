import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';

interface SavedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function SavedReportModal({ isOpen, onClose, onSave }: SavedReportModalProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave(name.trim());
      setName('');
      onClose();
    } catch (error) {
      console.error('Failed to save report:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="حفظ التقرير">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            اسم التقرير
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: تقرير المبيعات الشهري"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
