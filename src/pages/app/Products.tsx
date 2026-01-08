import { useState, useEffect, useRef } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { ProductsService } from '@/services/products.service';
import type { Product, ProductCategory } from '@/types/domain';
import { Card, CardContent, Button, Input, Modal, Select, Badge } from '@/components/ui';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Upload,
  Download,
  Filter,
  Grid3X3,
  List,
  Tag,
  Image as ImageIcon,
  X,
  FolderPlus,
} from 'lucide-react';

const CATEGORY_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export function Products() {
  const { currentBusiness } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [productForm, setProductForm] = useState({
    name_ar: '',
    name_en: '',
    sku: '',
    price: 0,
    cost: 0,
    physical_stock: 0,
    category_id: '',
    image_url: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    name_ar: '',
    name_en: '',
    color: '#3B82F6',
  });

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [currentBusiness]);

  const loadData = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        ProductsService.list(currentBusiness.id, {
          search,
          category_id: categoryFilter || undefined,
          activeOnly: showActiveOnly ? true : undefined,
        }),
        ProductsService.listCategories(currentBusiness.id),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentBusiness) {
      const debounce = setTimeout(() => {
        loadData();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [search, categoryFilter, showActiveOnly]);

  const resetProductForm = () => {
    setProductForm({
      name_ar: '',
      name_en: '',
      sku: '',
      price: 0,
      cost: 0,
      physical_stock: 0,
      category_id: '',
      image_url: '',
    });
    setEditingProduct(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name_ar: '', name_en: '', color: '#3B82F6' });
    setEditingCategory(null);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name_ar: product.name_ar,
      name_en: product.name_en || '',
      sku: product.sku || '',
      price: product.price,
      cost: product.cost,
      physical_stock: product.physical_stock,
      category_id: product.category_id || '',
      image_url: product.image_url || '',
    });
    setShowProductModal(true);
  };

  const openEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name_ar: category.name_ar,
      name_en: category.name_en || '',
      color: category.color || '#3B82F6',
    });
    setShowCategoryModal(true);
  };

  const handleSaveProduct = async () => {
    if (!currentBusiness || !productForm.name_ar) return;

    try {
      if (editingProduct) {
        await ProductsService.update(currentBusiness.id, editingProduct.id, {
          name_ar: productForm.name_ar,
          name_en: productForm.name_en || undefined,
          sku: productForm.sku || undefined,
          price: productForm.price,
          cost: productForm.cost,
          physical_stock: productForm.physical_stock,
          category_id: productForm.category_id || null,
          image_url: productForm.image_url || null,
        });
      } else {
        await ProductsService.create(currentBusiness.id, {
          name_ar: productForm.name_ar,
          name_en: productForm.name_en,
          sku: productForm.sku,
          price: productForm.price,
          cost: productForm.cost,
          physical_stock: productForm.physical_stock,
          category_id: productForm.category_id || undefined,
          image_url: productForm.image_url,
        });
      }
      setShowProductModal(false);
      resetProductForm();
      loadData();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('فشل حفظ المنتج');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!currentBusiness) return;
    if (!confirm(`هل أنت متأكد من حذف "${product.name_ar}"؟`)) return;

    try {
      await ProductsService.delete(currentBusiness.id, product.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('فشل حذف المنتج');
    }
  };

  const handleSaveCategory = async () => {
    if (!currentBusiness || !categoryForm.name_ar) return;

    try {
      if (editingCategory) {
        await ProductsService.updateCategory(editingCategory.id, categoryForm);
      } else {
        await ProductsService.createCategory(currentBusiness.id, categoryForm);
      }
      setShowCategoryModal(false);
      resetCategoryForm();
      loadData();
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('فشل حفظ الفئة');
    }
  };

  const handleDeleteCategory = async (category: ProductCategory) => {
    if (!confirm(`هل أنت متأكد من حذف "${category.name_ar}"؟`)) return;

    try {
      await ProductsService.deleteCategory(category.id);
      loadData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('فشل حذف الفئة');
    }
  };

  const handleExport = async () => {
    if (!currentBusiness) return;
    try {
      await ProductsService.exportCSV(currentBusiness.id);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentBusiness || !e.target.files?.[0]) return;

    try {
      const result = await ProductsService.importCSV(currentBusiness.id, e.target.files[0]);
      alert(`تم استيراد ${result.success} منتج بنجاح${result.errors.length > 0 ? `\n${result.errors.length} أخطاء` : ''}`);
      loadData();
    } catch (error) {
      console.error('Failed to import:', error);
      alert('فشل استيراد المنتجات');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 0 }).format(amount);
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">المنتجات</h1>
          <p className="text-zinc-600 mt-1">إدارة المنتجات وفئاتها</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            استيراد
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetCategoryForm();
              setShowCategoryModal(true);
            }}
          >
            <FolderPlus className="h-4 w-4" />
            فئة جديدة
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              resetProductForm();
              setShowProductModal(true);
            }}
          >
            <Plus className="h-4 w-4" />
            منتج جديد
          </Button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              !categoryFilter
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            الكل ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter(p => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  categoryFilter === cat.id
                    ? 'text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
                style={categoryFilter === cat.id ? { backgroundColor: cat.color } : {}}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name_ar} ({count})
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditCategory(cat);
                  }}
                  className="ml-1 p-1 rounded hover:bg-black/10"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              </button>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="بحث بالاسم أو SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="rounded border-zinc-300"
                />
                النشطة فقط
              </label>

              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-zinc-100' : ''}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-zinc-100' : ''}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-zinc-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Package className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-950 mb-2">لا توجد منتجات</h3>
            <p className="text-zinc-600 mb-6">ابدأ بإضافة منتجاتك لإدارتها وربطها بالطلبات</p>
            <Button
              variant="accent"
              onClick={() => {
                resetProductForm();
                setShowProductModal(true);
              }}
            >
              <Plus className="h-4 w-4" />
              إضافة أول منتج
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-2xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all group ${
                !product.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="aspect-square bg-gradient-to-br from-zinc-100 to-zinc-50 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name_ar}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-zinc-300" />
                  </div>
                )}

                {product.category && (
                  <div
                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: product.category.color }}
                  >
                    {product.category.name_ar}
                  </div>
                )}

                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => openEditProduct(product)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-zinc-50"
                  >
                    <Edit2 className="h-4 w-4 text-zinc-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product)}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>

                {!product.is_active && (
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="default" size="sm">غير نشط</Badge>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-zinc-950 mb-1 truncate">{product.name_ar}</h3>
                {product.sku && (
                  <p className="text-xs text-zinc-500 mb-3 font-mono">SKU: {product.sku}</p>
                )}

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(product.price)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      التكلفة: {formatCurrency(product.cost)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={`text-lg font-semibold ${
                      product.physical_stock <= 0 ? 'text-red-500' :
                      product.physical_stock < 10 ? 'text-amber-500' : 'text-zinc-700'
                    }`}>
                      {product.physical_stock}
                    </p>
                    <p className="text-xs text-zinc-500">المخزون</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b">
                <tr>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-zinc-700">المنتج</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-zinc-700">SKU</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-zinc-700">الفئة</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-zinc-700">سعر البيع</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-zinc-700">التكلفة</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-zinc-700">المخزون</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-zinc-700">الحالة</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => (
                  <tr key={product.id} className={`hover:bg-zinc-50 ${!product.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-zinc-400" />
                          )}
                        </div>
                        <span className="font-medium text-zinc-950">{product.name_ar}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600 font-mono">
                      {product.sku || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {product.category ? (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: product.category.color }}
                        >
                          {product.category.name_ar}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {formatCurrency(product.cost)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${
                        product.physical_stock <= 0 ? 'text-red-500' :
                        product.physical_stock < 10 ? 'text-amber-500' : 'text-zinc-700'
                      }`}>
                        {product.physical_stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.is_active ? 'success' : 'default'} size="sm">
                        {product.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditProduct(product)}
                          className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showProductModal && (
        <Modal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            resetProductForm();
          }}
          title={editingProduct ? 'تعديل المنتج' : 'منتج جديد'}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="اسم المنتج *"
                placeholder="اسم المنتج بالعربية"
                value={productForm.name_ar}
                onChange={(e) => setProductForm({ ...productForm, name_ar: e.target.value })}
              />
              <Input
                label="الاسم بالإنجليزية"
                placeholder="Product name"
                value={productForm.name_en}
                onChange={(e) => setProductForm({ ...productForm, name_en: e.target.value })}
              />
            </div>

            <Input
              label="SKU (رمز المنتج)"
              placeholder="ABC-123"
              value={productForm.sku}
              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="سعر البيع *"
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="سعر التكلفة"
                type="number"
                min="0"
                step="0.01"
                value={productForm.cost}
                onChange={(e) => setProductForm({ ...productForm, cost: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="المخزون"
                type="number"
                min="0"
                value={productForm.physical_stock}
                onChange={(e) => setProductForm({ ...productForm, physical_stock: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">فئة المنتج</label>
              <Select
                value={productForm.category_id}
                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
              >
                <option value="">بدون فئة</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_ar}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">رابط صورة المنتج</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
              />
              {productForm.image_url && (
                <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden bg-zinc-100">
                  <img
                    src={productForm.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowProductModal(false);
                  resetProductForm();
                }}
              >
                إلغاء
              </Button>
              <Button
                variant="accent"
                onClick={handleSaveProduct}
                disabled={!productForm.name_ar}
              >
                {editingProduct ? 'حفظ التغييرات' : 'إضافة المنتج'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showCategoryModal && (
        <Modal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            resetCategoryForm();
          }}
          title={editingCategory ? 'تعديل الفئة' : 'فئة جديدة'}
        >
          <div className="space-y-4">
            <Input
              label="اسم الفئة *"
              placeholder="الملابس، الإلكترونيات..."
              value={categoryForm.name_ar}
              onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
            />
            <Input
              label="الاسم بالإنجليزية"
              placeholder="Category name"
              value={categoryForm.name_en}
              onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">اللون</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryForm({ ...categoryForm, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      categoryForm.color === color ? 'border-zinc-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              </div>
            </div>

            {editingCategory && (
              <button
                onClick={() => {
                  handleDeleteCategory(editingCategory);
                  setShowCategoryModal(false);
                  resetCategoryForm();
                }}
                className="text-red-500 text-sm hover:underline"
              >
                حذف هذه الفئة
              </button>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCategoryModal(false);
                  resetCategoryForm();
                }}
              >
                إلغاء
              </Button>
              <Button
                variant="accent"
                onClick={handleSaveCategory}
                disabled={!categoryForm.name_ar}
              >
                {editingCategory ? 'حفظ التغييرات' : 'إضافة الفئة'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
