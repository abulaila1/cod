import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import type { SavedReport } from '@/types/reports';
import { FileText, Trash2, ChevronDown } from 'lucide-react';

interface SavedReportsDropdownProps {
  reports: SavedReport[];
  onSelect: (report: SavedReport) => void;
  onDelete: (reportId: string) => void;
  canDelete: boolean;
}

export function SavedReportsDropdown({
  reports,
  onSelect,
  onDelete,
  canDelete,
}: SavedReportsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (reports.length === 0) return null;

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)}>
        <FileText className="ml-2 h-4 w-4" />
        التقارير المحفوظة
        <ChevronDown className="mr-2 h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute left-0 top-full mt-2 w-80 max-h-96 overflow-auto z-20 shadow-xl">
            <div className="p-2">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between px-3 py-2 hover:bg-zinc-50 rounded-lg cursor-pointer group"
                >
                  <div
                    className="flex-1"
                    onClick={() => {
                      onSelect(report);
                      setIsOpen(false);
                    }}
                  >
                    <p className="text-sm font-medium text-zinc-950">
                      {report.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {report.group_by === 'day' && 'يومي'}
                      {report.group_by === 'week' && 'أسبوعي'}
                      {report.group_by === 'month' && 'شهري'}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(report.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
