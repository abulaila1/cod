import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl font-bold text-primary-900">codmeta</h1>
            <p className="text-sm text-primary-600">سي او دي ميتا</p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-6 md:p-8">
          {children}
        </div>

        <p className="text-center text-sm text-primary-600 mt-6">
          © 2024 codmeta. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
