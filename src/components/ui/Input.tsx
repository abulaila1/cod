import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 border rounded-xl text-base bg-white
            transition-smooth focus-ring
            ${error
              ? 'border-red-300 focus:border-red-500'
              : 'border-zinc-200 focus:border-emerald-500'
            }
            disabled:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-500
            placeholder:text-zinc-400
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-zinc-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
