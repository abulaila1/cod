import { useState } from 'react';
import { Button, Select, Modal } from '@/components/ui';
import type { Status, Carrier, Employee } from '@/types/domain';
import { X, Truck, Users, FileDown, Printer, CheckCircle } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  statuses: Status[];
  carriers: Carrier[];
  employees: Employee[];
  onUpdateStatus: (statusId: string) => Promise<void>;
  onAssignCarrier: (carrierId: string) => Promise<void>;
  onAssignEmployee: (employeeId: string) => Promise<void>;
  onExportSelected: (format: 'csv' | 'carrier') => Promise<void>;
  onPrintSelected: () => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  statuses,
  carriers,
  employees,
  onUpdateStatus,
  onAssignCarrier,
  onAssignEmployee,
  onExportSelected,
  onPrintSelected,
  onClearSelection,
}: BulkActionsBarProps) {
  const [activeModal, setActiveModal] = useState<'status' | 'carrier' | 'employee' | 'export' | null>(null);
  const [selectedValue, setSelectedValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirm = async () => {
    if (!selectedValue) return;

    setIsUpdating(true);
    try {
      switch (activeModal) {
        case 'status':
          await onUpdateStatus(selectedValue);
          break;
        case 'carrier':
          await onAssignCarrier(selectedValue);
          break;
        case 'employee':
          await onAssignEmployee(selectedValue);
          break;
        case 'export':
          await onExportSelected(selectedValue as 'csv' | 'carrier');
          break;
      }
      setActiveModal(null);
      setSelectedValue('');
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = async () => {
    setIsUpdating(true);
    try {
      await onPrintSelected();
    } catch (error) {
      console.error('Failed to print:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getModalConfig = () => {
    switch (activeModal) {
      case 'status':
        return {
          title: 'تغيير الحالة',
          description: `سيتم تغيير حالة ${selectedCount} طلب`,
          options: statuses.map(s => ({ value: s.id, label: s.name_ar })),
          placeholder: 'اختر الحالة الجديدة',
        };
      case 'carrier':
        return {
          title: 'إسناد شركة شحن',
          description: `سيتم إسناد ${selectedCount} طلب لشركة الشحن`,
          options: carriers.map(c => ({ value: c.id, label: c.name_ar })),
          placeholder: 'اختر شركة الشحن',
        };
      case 'employee':
        return {
          title: 'إسناد موظف',
          description: `سيتم إسناد ${selectedCount} طلب للموظف`,
          options: employees.map(e => ({ value: e.id, label: e.name_ar })),
          placeholder: 'اختر الموظف',
        };
      case 'export':
        return {
          title: 'تصدير الطلبات',
          description: `سيتم تصدير ${selectedCount} طلب`,
          options: [
            { value: 'csv', label: 'تصدير CSV كامل' },
            { value: 'carrier', label: 'تصدير لشركة الشحن' },
          ],
          placeholder: 'اختر صيغة التصدير',
        };
      default:
        return null;
    }
  };

  const modalConfig = getModalConfig();

  return (
    <>
      <div className="fixed bottom-6 right-1/2 translate-x-1/2 bg-zinc-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3 z-50 border border-zinc-700">
        <div className="flex items-center gap-2 pl-3 border-l border-zinc-700">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <CheckCircle className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">{selectedCount} طلب محدد</span>
          <button
            onClick={onClearSelection}
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setActiveModal('status');
              setSelectedValue('');
            }}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            تغيير الحالة
          </Button>

          <Button
            onClick={() => {
              setActiveModal('carrier');
              setSelectedValue('');
            }}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            <Truck className="h-4 w-4 ml-1" />
            شركة الشحن
          </Button>

          <Button
            onClick={() => {
              setActiveModal('employee');
              setSelectedValue('');
            }}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            <Users className="h-4 w-4 ml-1" />
            الموظف
          </Button>

          <div className="w-px h-6 bg-zinc-700" />

          <Button
            onClick={() => {
              setActiveModal('export');
              setSelectedValue('');
            }}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
          >
            <FileDown className="h-4 w-4 ml-1" />
            تصدير
          </Button>

          <Button
            onClick={handlePrint}
            size="sm"
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            disabled={isUpdating}
          >
            <Printer className="h-4 w-4 ml-1" />
            طباعة
          </Button>
        </div>
      </div>

      {modalConfig && (
        <Modal
          isOpen={activeModal !== null}
          onClose={() => {
            setActiveModal(null);
            setSelectedValue('');
          }}
          title={modalConfig.title}
        >
          <div className="space-y-4">
            <p className="text-zinc-600">{modalConfig.description}</p>

            <Select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
            >
              <option value="">{modalConfig.placeholder}</option>
              {modalConfig.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedValue('');
                }}
                variant="outline"
                disabled={isUpdating}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleConfirm}
                variant="primary"
                disabled={!selectedValue || isUpdating}
              >
                {isUpdating ? 'جاري التنفيذ...' : 'تأكيد'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
