import { ReactNode } from 'react';
import { Modal, Button } from '@/components/ui';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSave: () => void;
  isSaving: boolean;
  children: ReactNode;
}

export function EntityModal({
  isOpen,
  onClose,
  title,
  onSave,
  isSaving,
  children,
}: EntityModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {children}

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            إلغاء
          </Button>
          <Button variant="primary" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
