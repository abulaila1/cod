import { Button, Card, CardContent, Input } from '@/components/ui';
import { Search, Filter, Download, Upload } from 'lucide-react';

interface OrdersToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFiltersClick: () => void;
  onExportCsv: () => void;
  onImportCsv: () => void;
}

export function OrdersToolbar({
  searchTerm,
  onSearchChange,
  onFiltersClick,
  onExportCsv,
  onImportCsv,
}: OrdersToolbarProps) {

  return (
    <>
      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="ابحث عن طلب..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onFiltersClick}>
                <Filter className="ml-2 h-4 w-4" />
                فلاتر
              </Button>
              <Button variant="outline" onClick={onExportCsv}>
                <Download className="ml-2 h-4 w-4" />
                تصدير
              </Button>
              <Button variant="outline" onClick={onImportCsv}>
                <Upload className="ml-2 h-4 w-4" />
                استيراد
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
