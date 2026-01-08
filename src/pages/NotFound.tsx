import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Home, ArrowRight } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-primary-900 mb-2">
          الصفحة غير موجودة
        </h2>
        <p className="text-primary-600 mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/">
            <Button variant="primary">
              <Home className="ml-2 h-4 w-4" />
              العودة للرئيسية
            </Button>
          </Link>
          <Link to="/app/dashboard">
            <Button variant="outline">
              <ArrowRight className="ml-2 h-4 w-4" />
              لوحة التحكم
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
