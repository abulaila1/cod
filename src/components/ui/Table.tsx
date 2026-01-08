import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  children: ReactNode;
}

export function TableHeader({ children }: TableHeaderProps) {
  return (
    <thead className="bg-primary-50 border-b border-primary-200">
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody className="divide-y divide-primary-200">{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr
      className={`transition-base ${onClick ? 'cursor-pointer hover:bg-primary-50' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export function TableHead({ children, className = '' }: TableHeadProps) {
  return (
    <th className={`px-6 py-3 text-right text-xs font-semibold text-primary-700 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`px-6 py-4 text-sm text-primary-900 ${className}`}>
      {children}
    </td>
  );
}

interface TableEmptyProps {
  message: string;
  colSpan: number;
}

export function TableEmpty({ message, colSpan }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-primary-500">
        {message}
      </td>
    </tr>
  );
}

interface TableLoadingProps {
  colSpan: number;
}

export function TableLoading({ colSpan }: TableLoadingProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-600 mx-auto" />
      </td>
    </tr>
  );
}
