import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { PerformanceService } from '@/services/performance.service';
import { PageHeader } from '@/components/common/PageHeader';
import { CarriersPerformanceTable } from '@/components/performance/CarriersPerformanceTable';
import { DateRangePicker } from '@/components/ui';
import type { PerformanceBreakdown } from '@/types/performance';

export function Carriers() {
  const { currentBusiness } = useBusiness();
  const [data, setData] = useState<PerformanceBreakdown[]>([]);
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
      const result = await PerformanceService.getCarrierBreakdown(currentBusiness.id, {
        date_from: dateFrom,
        date_to: dateTo,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load carrier performance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentBusiness) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600">لم يتم تحديد وورك سبيس</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="أداء شركات الشحن"
        description="تقييم أداء شركات الشحن حسب نسبة التسليم والإرجاع"
      />

      <div className="mb-6">
        <DateRangePicker
          startDate={dateFrom}
          endDate={dateTo}
          onStartDateChange={setDateFrom}
          onEndDateChange={setDateTo}
        />
      </div>

      <CarriersPerformanceTable data={data} isLoading={isLoading} />
    </>
  );
}
