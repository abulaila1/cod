import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { useBusiness } from '@/contexts/BusinessContext';
import { CountriesService } from '@/services/countries.service';
import { EntityPageLayout } from '@/components/entity/EntityPageLayout';
import { EntityTable, EntityColumn } from '@/components/entity/EntityTable';
import { EntityModal } from '@/components/entity/EntityModal';
import { ImportModal } from '@/components/entity/ImportModal';
import { Input } from '@/components/ui';
import type { Country } from '@/types/domain';

export function CountriesManagement() {
  const { currentBusiness } = useBusiness();
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: '',
    currency: '',
  });

  useEffect(() => {
    if (currentBusiness) {
      loadCountries();
    }
  }, [currentBusiness, searchValue]);

  const loadCountries = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const data = await CountriesService.list(currentBusiness.id, {
        search: searchValue || undefined,
      });
      setCountries(data);
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCountry(null);
    setFormData({ name_ar: '', currency: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    const country = countries.find((c) => c.id === id);
    if (country) {
      setEditingCountry(country);
      setFormData({
        name_ar: country.name_ar,
        currency: country.currency || '',
      });
      setIsModalOpen(true);
    }
  };

  const handleSave = async () => {
    if (!currentBusiness) return;

    try {
      setIsSaving(true);

      if (editingCountry) {
        await CountriesService.update(currentBusiness.id, editingCountry.id, formData);
      } else {
        await CountriesService.create(currentBusiness.id, formData);
      }

      await loadCountries();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save country:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (!currentBusiness) return;

    try {
      await CountriesService.toggleActive(currentBusiness.id, id, !currentActive);
      await loadCountries();
    } catch (error) {
      console.error('Failed to toggle country status:', error);
    }
  };

  const handleExport = async () => {
    if (!currentBusiness) return;

    try {
      await CountriesService.exportCSV(currentBusiness.id, {
        search: searchValue || undefined,
      });
    } catch (error) {
      console.error('Failed to export countries:', error);
    }
  };

  const handleImport = async (file: File) => {
    if (!currentBusiness) return { success: 0, errors: [] };

    const result = await CountriesService.importCSV(currentBusiness.id, file);
    await loadCountries();
    return result;
  };

  const columns: EntityColumn[] = [
    { key: 'name_ar', label: 'الاسم' },
    { key: 'currency', label: 'العملة' },
  ];

  if (!currentBusiness) {
    return (
      <AppLayout pageTitle="إدارة الدول">
        <div className="text-center py-12">
          <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="إدارة الدول">
      <EntityPageLayout
        title="الدول والمناطق"
        description="إدارة الدول والمناطق الجغرافية"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={() => setIsImportOpen(true)}
      >
        <EntityTable
          columns={columns}
          data={countries}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
        />
      </EntityPageLayout>

      <EntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCountry ? 'تعديل دولة' : 'إضافة دولة'}
        onSave={handleSave}
        isSaving={isSaving}
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            اسم الدولة <span className="text-red-600">*</span>
          </label>
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="مثال: مصر"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">العملة</label>
          <Input
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            placeholder="مثال: EGP"
          />
        </div>
      </EntityModal>

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImport}
      />
    </AppLayout>
  );
}
