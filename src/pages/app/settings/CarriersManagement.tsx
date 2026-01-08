import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { CarriersService } from '@/services/carriers.service';
import { EntityPageLayout } from '@/components/entity/EntityPageLayout';
import { EntityTable, EntityColumn } from '@/components/entity/EntityTable';
import { EntityModal } from '@/components/entity/EntityModal';
import { ImportModal } from '@/components/entity/ImportModal';
import { Input } from '@/components/ui';
import type { Carrier } from '@/types/domain';

export function CarriersManagement() {
  const { currentBusiness } = useBusiness();
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: '',
  });

  useEffect(() => {
    if (currentBusiness) {
      loadCarriers();
    }
  }, [currentBusiness, searchValue]);

  const loadCarriers = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const data = await CarriersService.list(currentBusiness.id, {
        search: searchValue || undefined,
      });
      setCarriers(data);
    } catch (error) {
      console.error('Failed to load carriers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCarrier(null);
    setFormData({ name_ar: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    const carrier = carriers.find((c) => c.id === id);
    if (carrier) {
      setEditingCarrier(carrier);
      setFormData({
        name_ar: carrier.name_ar,
      });
      setIsModalOpen(true);
    }
  };

  const handleSave = async () => {
    if (!currentBusiness) return;

    try {
      setIsSaving(true);

      if (editingCarrier) {
        await CarriersService.update(currentBusiness.id, editingCarrier.id, formData);
      } else {
        await CarriersService.create(currentBusiness.id, formData);
      }

      await loadCarriers();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save carrier:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (!currentBusiness) return;

    try {
      await CarriersService.toggleActive(currentBusiness.id, id, !currentActive);
      await loadCarriers();
    } catch (error) {
      console.error('Failed to toggle carrier status:', error);
    }
  };

  const handleExport = async () => {
    if (!currentBusiness) return;

    try {
      await CarriersService.exportCSV(currentBusiness.id, {
        search: searchValue || undefined,
      });
    } catch (error) {
      console.error('Failed to export carriers:', error);
    }
  };

  const handleImport = async (file: File) => {
    if (!currentBusiness) return { success: 0, errors: [] };

    const result = await CarriersService.importCSV(currentBusiness.id, file);
    await loadCarriers();
    return result;
  };

  const columns: EntityColumn[] = [{ key: 'name_ar', label: 'الاسم' }];

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
        title="شركات الشحن"
        description="إدارة شركات الشحن والتوصيل"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={() => setIsImportOpen(true)}
      >
        <EntityTable
          columns={columns}
          data={carriers}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
        />
      </EntityPageLayout>

      <EntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCarrier ? 'تعديل شركة شحن' : 'إضافة شركة شحن'}
        onSave={handleSave}
        isSaving={isSaving}
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            اسم شركة الشحن <span className="text-red-600">*</span>
          </label>
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="مثال: أرامكس"
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
