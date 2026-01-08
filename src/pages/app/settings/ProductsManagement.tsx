import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { ProductsService } from '@/services/products.service';
import { EntityPageLayout } from '@/components/entity/EntityPageLayout';
import { EntityTable, EntityColumn } from '@/components/entity/EntityTable';
import { EntityModal } from '@/components/entity/EntityModal';
import { ImportModal } from '@/components/entity/ImportModal';
import { Input } from '@/components/ui';
import type { Product } from '@/types/domain';

export function ProductsManagement() {
  const { currentBusiness } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name_ar: '',
    sku: '',
    cost: 0,
  });

  useEffect(() => {
    if (currentBusiness) {
      loadProducts();
    }
  }, [currentBusiness, searchValue]);

  const loadProducts = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const data = await ProductsService.list(currentBusiness.id, {
        search: searchValue || undefined,
      });
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ name_ar: '', sku: '', cost: 0 });
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setEditingProduct(product);
      setFormData({
        name_ar: product.name_ar,
        sku: product.sku || '',
        cost: product.cost,
      });
      setIsModalOpen(true);
    }
  };

  const handleSave = async () => {
    if (!currentBusiness) return;

    try {
      setIsSaving(true);

      if (editingProduct) {
        await ProductsService.update(currentBusiness.id, editingProduct.id, formData);
      } else {
        await ProductsService.create(currentBusiness.id, formData);
      }

      await loadProducts();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    if (!currentBusiness) return;

    try {
      await ProductsService.toggleActive(currentBusiness.id, id, !currentActive);
      await loadProducts();
    } catch (error) {
      console.error('Failed to toggle product status:', error);
    }
  };

  const handleExport = async () => {
    if (!currentBusiness) return;

    try {
      await ProductsService.exportCSV(currentBusiness.id, {
        search: searchValue || undefined,
      });
    } catch (error) {
      console.error('Failed to export products:', error);
    }
  };

  const handleImport = async (file: File) => {
    if (!currentBusiness) return { success: 0, errors: [] };

    const result = await ProductsService.importCSV(currentBusiness.id, file);
    await loadProducts();
    return result;
  };

  const columns: EntityColumn[] = [
    { key: 'name_ar', label: 'الاسم' },
    { key: 'sku', label: 'SKU' },
    {
      key: 'cost',
      label: 'التكلفة الأساسية',
      render: (value) => `${(value || 0).toFixed(2)} ج.م`,
    },
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
        title="المنتجات"
        description="إدارة المنتجات والتكاليف الأساسية"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={() => setIsImportOpen(true)}
      >
        <EntityTable
          columns={columns}
          data={products}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          isLoading={isLoading}
        />
      </EntityPageLayout>

      <EntityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'تعديل منتج' : 'إضافة منتج'}
        onSave={handleSave}
        isSaving={isSaving}
      >
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            اسم المنتج <span className="text-red-600">*</span>
          </label>
          <Input
            value={formData.name_ar}
            onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
            placeholder="مثال: منتج أ"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">SKU</label>
          <Input
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="مثال: PRD-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-2">
            التكلفة الأساسية <span className="text-red-600">*</span>
          </label>
          <Input
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            step="0.01"
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
