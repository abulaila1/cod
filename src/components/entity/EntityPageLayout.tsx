import { ReactNode } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, Input, Button } from '@/components/ui';
import { Search, Plus, Download, Upload } from 'lucide-react';

interface EntityPageLayoutProps {
  title: string;
  description: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  children: ReactNode;
}

export function EntityPageLayout({
  title,
  description,
  searchValue,
  onSearchChange,
  onAdd,
  onExport,
  onImport,
  children,
}: EntityPageLayoutProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />

      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="بحث..."
                className="pr-10"
              />
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Button variant="outline" onClick={onImport}>
                <Upload className="ml-2 h-4 w-4" />
                استيراد
              </Button>
              <Button variant="outline" onClick={onExport}>
                <Download className="ml-2 h-4 w-4" />
                تصدير
              </Button>
              <Button variant="primary" onClick={onAdd}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
