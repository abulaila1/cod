import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, className = '', children, ...props }, ref) => {
    const safeOptions = options || [];
    const hasOptions = safeOptions.length > 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-primary-900 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full px-3 py-2 border rounded-lg text-base appearance-none
              transition-base focus-ring
              ${error
                ? 'border-red-500 focus:border-red-500'
                : 'border-primary-200 focus:border-accent-500'
              }
              disabled:bg-primary-50 disabled:cursor-not-allowed
              bg-white
              ${className}
            `}
            {...props}
          >
            {hasOptions ? (
              safeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-primary-500">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
