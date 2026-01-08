import { Calendar } from 'lucide-react';
import { Button } from './Button';

interface DateRangePickerProps {
  label?: string;
  placeholder?: string;
}

export function DateRangePicker({ label, placeholder = 'اختر نطاق التاريخ' }: DateRangePickerProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary-900 mb-1.5">
          {label}
        </label>
      )}
      <Button variant="outline" className="w-full justify-start">
        <Calendar className="ml-2 h-4 w-4" />
        <span className="text-primary-500">{placeholder}</span>
      </Button>
    </div>
  );
}
