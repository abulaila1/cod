import { Card, Button, Badge } from '@/components/ui';
import { Edit2, Power } from 'lucide-react';

export interface EntityColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface EntityTableProps {
  columns: EntityColumn[];
  data: any[];
  onEdit: (id: string) => void;
  onToggleActive: (id: string, currentActive: boolean) => void;
  isLoading?: boolean;
}

export function EntityTable({
  columns,
  data,
  onEdit,
  onToggleActive,
  isLoading,
}: EntityTableProps) {
  if (isLoading) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-zinc-600">جاري التحميل...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-right text-xs font-medium text-zinc-600"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                الحالة
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-600">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="px-6 py-12 text-center text-zinc-500"
                >
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-zinc-950">
                      {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <Badge variant={row.active ? 'success' : 'secondary'}>
                      {row.active ? 'نشط' : 'معطل'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(row.id)}>
                        <Edit2 className="h-4 w-4 ml-2" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        variant={row.active ? 'outline' : 'primary'}
                        onClick={() => onToggleActive(row.id, row.active)}
                      >
                        <Power className="h-4 w-4 ml-2" />
                        {row.active ? 'تعطيل' : 'تفعيل'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
