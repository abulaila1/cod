import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { EmployeesService } from '@/services/employees.service';
import { EntityPageLayout } from '@/components/entity/EntityPageLayout';
import { EntityTable, EntityColumn } from '@/components/entity/EntityTable';
import { EntityModal } from '@/components/entity/EntityModal';
import { ImportModal } from '@/components/entity/ImportModal';
import { Input } from '@/components/ui';
import type { Employee } from '@/types/domain';

export function EmployeesManagement() {
  const { currentBusiness } = useBusiness();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: '',
    role: '',
  });

  useEffect(() => {
    if (currentBusiness) {
      loadEmployees();
    }
  }, [currentBusiness, searchValue]);

  const loadEmployees = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const data = await EmployeesService.list(currentBusiness.id, {
        search: searchValue || undefined,
      });
      setEmployees(data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({ name_ar: '', role: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    const employee = employees.find((e) => e.id === id);
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name_ar: employee.name_ar,
        role: employee.role || '',
      });
      setIsModalOpen(true);
    }
  };

  const handleSave = async () => {
    if (!currentBusiness) return;

    try {
      setIsSaving(true);

      if (editingEmployee) {
        await EmployeesService.update(currentBusiness.id, editingEmployee.id, formData);
      } else {
        await EmployeesService.create(currentBusiness.id, formData);
      }

      await loadEmployees();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save employee:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (!currentBusiness) return;

    try {
      await EmployeesService.toggleActive(currentBusiness.id, id, !currentActive);
      await loadEmployees();
    } catch (error) {
      console.error('Failed to toggle employee status:', error);
    }
  };

  const handleExport = async () => {
    if (!currentBusiness) return;

    try {
      await EmployeesService.exportCSV(currentBusiness.id, {
        search: searchValue || undefined,
      });
    } catch (error) {
      console.error('Failed to export employees:', error);
    }
  };

  const handleImport = async (file: File) => {
    if (!currentBusiness) return { success: 0, errors: [] };

    const result = await EmployeesService.importCSV(currentBusiness.id, file);
    await loadEmployees();
    return result;
  };

  const columns: EntityColumn[] = [
    { key: 'name_ar', label: 'الاسم' },
    { key: 'role', label: 'الدور' },
  ];

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
      <EntityPageLayout
        title="الموظفين"
        description="إدارة الموظفين والمسؤولين عن الطلبات"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={() => setIsImportOpen(true)}
      >
        <EntityTable
          columns={columns}
          data={employees}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
        />
      </EntityPageLayout>

      <EntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'تعديل موظف' : 'إضافة موظف'}
        onSave={handleSave}
        isSaving={isSaving}
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            اسم الموظف <span className="text-red-600">*</span>
          </label>
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="مثال: أحمد محمد"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">الدور</label>
          <Input
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="مثال: موظف مبيعات"
          />
        </div>
      </EntityModal>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />
    </>
  );
}
