import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { PerformanceService } from '@/services/performance.service';
import { PerformanceLayout } from '@/components/performance/PerformanceLayout';
import { RankingTable } from '@/components/performance/RankingTable';
import type { PerformanceBreakdown } from '@/types/performance';
import { Card, CardContent } from '@/components/ui';

export function Employees() {
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
      const result = await PerformanceService.getEmployeeBreakdown(currentBusiness.id, {
        date_from: dateFrom,
        date_to: dateTo,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load employee breakdown:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentBusiness) {
    return (
      <PerformanceLayout
        title="أداء الموظفين"
        description="تحليل الأداء حسب الموظف"
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
      title="أداء الموظفين"
      description="تحليل الأداء حسب الموظف"
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
      ) : (
        <RankingTable
          data={data}
          type="employee"
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}
    </PerformanceLayout>
  );
}
