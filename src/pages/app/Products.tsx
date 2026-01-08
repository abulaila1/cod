import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { PerformanceService } from '@/services/performance.service';
import { PerformanceLayout } from '@/components/performance/PerformanceLayout';
import { RankingTable } from '@/components/performance/RankingTable';
import type { ProductPerformance } from '@/types/performance';
import { Card, CardContent } from '@/components/ui';
import { PackageOpen } from 'lucide-react';

export function Products() {
  const { currentBusiness } = useBusiness();
  const [data, setData] = useState<ProductPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    if (currentBusiness) {
      loadData();
    }
  }, [currentBusiness, dateFrom, dateTo]);

  const loadData = async () => {
    if (!currentBusiness) return;

    try {
      setIsLoading(true);
      const result = await PerformanceService.getProductBreakdown(currentBusiness.id, {
        date_from: dateFrom,
        date_to: dateTo,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load product breakdown:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentBusiness) {
    return (
      <PerformanceLayout
        title="أداء المنتجات"
        description="تحليل الأداء حسب المنتج"
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      >
        <div className="text-center py-12">
          <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
        </div>
      </PerformanceLayout>
    );
  }

  return (
    <PerformanceLayout
      title="أداء المنتجات"
      description="تحليل الأداء حسب المنتج"
      dateFrom={dateFrom}
      dateTo={dateTo}
      onDateFromChange={setDateFrom}
      onDateToChange={setDateTo}
    >
      {isLoading ? (
        <Card>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-100 animate-pulse rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <PackageOpen className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-950 mb-2">لا توجد بيانات منتجات</h3>
            <p className="text-zinc-600">
              تحتاج إلى استيراد عناصر الطلبات (order_items) لتفعيل أداء المنتجات
            </p>
          </CardContent>
        </Card>
      ) : (
        <RankingTable
          data={data}
          type="product"
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}
    </PerformanceLayout>
  );
}
