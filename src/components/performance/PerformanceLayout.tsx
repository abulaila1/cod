import { ReactNode } from 'react';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui';
import { DateRangePicker } from '@/components/ui';

interface PerformanceLayoutProps {
  title: string;
  description: string;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  children: ReactNode;
}

export function PerformanceLayout({
  title,
  description,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  children,
}: PerformanceLayoutProps) {
  return (
    <AppLayout pageTitle={title}>
      <PageHeader
        title={title}
        description={description}
      />

      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-zinc-700">الفترة الزمنية:</label>
            <DateRangePicker
              startDate={dateFrom}
              endDate={dateTo}
              onStartDateChange={onDateFromChange}
              onEndDateChange={onDateToChange}
            />
          </div>
        </CardContent>
      </Card>

      {children}
    </AppLayout>
  );
}
