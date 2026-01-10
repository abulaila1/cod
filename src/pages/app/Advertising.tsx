import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { AdvertisingService } from '@/services/advertising.service';
import { AdCostAllocationService } from '@/services/ad-cost-allocation.service';
import { EntitiesService } from '@/services';
import { Plus, Target, CheckCircle, Clock, Edit2, Trash2, TrendingUp } from 'lucide-react';
import type { CampaignWithDetails, CreateCampaignInput, CampaignStats } from '@/types/advertising';
import type { Product } from '@/types/domain';

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook', color: 'bg-blue-500' },
  { value: 'instagram', label: 'Instagram', color: 'bg-pink-500' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-gray-800' },
  { value: 'google', label: 'Google', color: 'bg-red-500' },
  { value: 'snapchat', label: 'Snapchat', color: 'bg-yellow-400' },
  { value: 'twitter', label: 'Twitter', color: 'bg-sky-500' },
  { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-700' },
  { value: 'other', label: 'أخرى', color: 'bg-gray-500' },
];

interface ProductAllocation {
  product_id: string;
  allocation_percentage: number;
}

export function Advertising() {
  const { currentBusiness, formatCurrency } = useBusiness();
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignWithDetails | null>(null);
  const [isAllocating, setIsAllocating] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    campaign_date: new Date().toISOString().split('T')[0],
    platform: 'facebook',
    campaign_name: '',
    total_cost: '',
    notes: '',
    products: [] as ProductAllocation[],
  });

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [currentBusiness]);

  const loadData = async () => {
    if (!currentBusiness) return;

    setIsLoading(true);
    try {
      const [campaignsData, productsData, statsData] = await Promise.all([
        AdvertisingService.listCampaigns(currentBusiness.id),
        EntitiesService.getProducts(currentBusiness.id),
        AdvertisingService.getCampaignStats(currentBusiness.id),
      ]);

      setCampaigns(campaignsData);
      setProducts(productsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load advertising data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (campaign?: CampaignWithDetails) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        campaign_date: campaign.campaign_date,
        platform: campaign.platform,
        campaign_name: campaign.campaign_name || '',
        total_cost: campaign.total_cost.toString(),
        notes: campaign.notes || '',
        products: campaign.products?.map((p: any) => ({
          product_id: p.product_id,
          allocation_percentage: p.allocation_percentage,
        })) || [],
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        campaign_date: new Date().toISOString().split('T')[0],
        platform: 'facebook',
        campaign_name: '',
        total_cost: '',
        notes: '',
        products: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleAddProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { product_id: '', allocation_percentage: 0 }],
    });
  };

  const handleRemoveProduct = (index: number) => {
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index),
    });
  };

  const handleProductChange = (index: number, field: keyof ProductAllocation, value: any) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData({ ...formData, products: newProducts });
  };

  const totalPercentage = formData.products.reduce(
    (sum, p) => sum + (Number(p.allocation_percentage) || 0),
    0
  );

  const handleSubmit = async () => {
    if (!currentBusiness || !user) return;

    if (totalPercentage !== 100) {
      alert('مجموع نسب التوزيع يجب أن يساوي 100%');
      return;
    }

    try {
      const input: CreateCampaignInput = {
        campaign_date: formData.campaign_date,
        platform: formData.platform,
        campaign_name: formData.campaign_name || null,
        total_cost: Number(formData.total_cost),
        notes: formData.notes || null,
        products: formData.products.map((p) => ({
          product_id: p.product_id,
          allocation_percentage: Number(p.allocation_percentage),
        })),
      };

      if (editingCampaign) {
        await AdvertisingService.updateCampaign(editingCampaign.id, currentBusiness.id, input);
      } else {
        await AdvertisingService.createCampaign(currentBusiness.id, input, user.id);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save campaign:', error);
      alert('فشل حفظ الحملة');
    }
  };

  const handleAllocate = async (campaignId: string) => {
    if (!currentBusiness) return;

    if (!confirm('هل تريد توزيع تكاليف هذه الحملة على الطلبات؟')) return;

    setIsAllocating(campaignId);
    try {
      const result = await AdCostAllocationService.allocateCampaignCosts(
        campaignId,
        currentBusiness.id
      );

      if (result.success) {
        alert(
          `تم التوزيع بنجاح!\n` +
            `الطلبات المحدثة: ${result.orders_updated}\n` +
            `التكلفة الموزعة: ${formatCurrency(result.total_cost_allocated)}`
        );
        await loadData();
      } else {
        alert('فشل التوزيع: ' + (result.errors?.join(', ') || 'خطأ غير معروف'));
      }
    } catch (error) {
      console.error('Allocation failed:', error);
      alert('فشل توزيع التكاليف');
    } finally {
      setIsAllocating(null);
    }
  };

  const handleAllocateAll = async () => {
    if (!currentBusiness) return;

    if (!confirm('هل تريد توزيع جميع الحملات الغير موزعة؟')) return;

    setIsAllocating('all');
    try {
      const result = await AdCostAllocationService.allocateAllPendingCampaigns(
        currentBusiness.id
      );

      if (result.success) {
        alert(
          `تم التوزيع بنجاح!\n` +
            `الطلبات المحدثة: ${result.orders_updated}\n` +
            `التكلفة الموزعة: ${formatCurrency(result.total_cost_allocated)}`
        );
        await loadData();
      } else {
        alert('فشل التوزيع: ' + (result.errors?.join(', ') || 'خطأ غير معروف'));
      }
    } catch (error) {
      console.error('Allocation failed:', error);
      alert('فشل توزيع التكاليف');
    } finally {
      setIsAllocating(null);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!currentBusiness) return;

    if (!confirm('هل أنت متأكد من حذف هذه الحملة؟')) return;

    try {
      await AdvertisingService.deleteCampaign(campaignId, currentBusiness.id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      alert('فشل حذف الحملة');
    }
  };

  const getRoasColor = (roas: number) => {
    if (roas >= 2) return 'text-green-600';
    if (roas >= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPlatformBadge = (platform: string) => {
    const platformConfig = PLATFORMS.find((p) => p.value === platform);
    return (
      <Badge className={`${platformConfig?.color} text-white`}>
        {platformConfig?.label || platform}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="إدارة الإعلانات"
          subtitle="إدارة وتتبع حملاتك الإعلانية"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الإعلانات"
        subtitle="إدارة وتتبع حملاتك الإعلانية"
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleAllocateAll}
              variant="outline"
              disabled={isAllocating !== null}
            >
              {isAllocating === 'all' ? 'جاري التوزيع...' : 'توزيع الكل'}
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة حملة
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الإنفاق</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats?.total_spent || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ROAS</p>
              <p className={`text-2xl font-bold mt-1 ${getRoasColor(stats?.roas || 0)}`}>
                {(stats?.roas || 0).toFixed(2)}x
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الحملات الإعلانية</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.total_campaigns || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">الطلبات من الإعلانات</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.total_orders || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(stats?.total_revenue || 0)} إيرادات
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  المنصة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  اسم الحملة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  التكلفة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الطلبات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الإيرادات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  ROAS
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(campaign.campaign_date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4">{getPlatformBadge(campaign.platform)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {campaign.campaign_name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(campaign.total_cost)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {campaign.orders_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(campaign.revenue_generated || 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${getRoasColor(campaign.roas || 0)}`}>
                      {(campaign.roas || 0).toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {campaign.is_allocated ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 ml-1" />
                        تم التوزيع
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 ml-1" />
                        قيد الانتظار
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!campaign.is_allocated && (
                        <button
                          onClick={() => handleAllocate(campaign.id)}
                          disabled={isAllocating === campaign.id}
                          className="text-green-600 hover:text-green-700"
                          title="توزيع التكاليف"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(campaign)}
                        className="text-blue-600 hover:text-blue-700"
                        title="تعديل"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="text-red-600 hover:text-red-700"
                        title="حذف"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    لا توجد حملات إعلانية بعد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCampaign ? 'تعديل حملة إعلانية' : 'إضافة حملة إعلانية'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الحملة
              </label>
              <Input
                type="date"
                value={formData.campaign_date}
                onChange={(e) =>
                  setFormData({ ...formData, campaign_date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المنصة</label>
              <Select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم الحملة (اختياري)
            </label>
            <Input
              value={formData.campaign_name}
              onChange={(e) =>
                setFormData({ ...formData, campaign_name: e.target.value })
              }
              placeholder="مثال: حملة الربيع"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              التكلفة الإجمالية
            </label>
            <Input
              type="number"
              value={formData.total_cost}
              onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المنتجات المستهدفة
            </label>
            <p className="text-xs text-gray-500 mb-3">
              اختر المنتجات التي تستهدفها هذه الحملة وحدد نسبة التوزيع لكل منتج (يجب أن يكون المجموع 100%)
            </p>
            <div className="space-y-2">
              {formData.products.map((product, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Select
                    value={product.product_id}
                    onChange={(e) =>
                      handleProductChange(index, 'product_id', e.target.value)
                    }
                    className="flex-1"
                  >
                    <option value="">اختر منتج</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name_ar}
                      </option>
                    ))}
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={product.allocation_percentage}
                      onChange={(e) =>
                        handleProductChange(
                          index,
                          'allocation_percentage',
                          Number(e.target.value)
                        )
                      }
                      placeholder="0"
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-gray-600 font-medium">%</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleRemoveProduct(index)}
                    className="shrink-0"
                  >
                    حذف
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddProduct}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة منتج
              </Button>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">مجموع نسب التوزيع:</span>
                <span
                  className={`text-lg font-bold ${
                    totalPercentage === 100 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {totalPercentage}%
                  {totalPercentage === 100 && ' ✓'}
                  {totalPercentage !== 100 && totalPercentage !== 0 && (
                    <span className="text-xs mr-2 text-red-500">
                      (يجب أن يكون 100%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملاحظات (اختياري)
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit}>
              {editingCampaign ? 'تحديث' : 'إضافة'} الحملة
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
