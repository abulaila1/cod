import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-40 bg-white border-b border-primary-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <div>
                <h1 className="text-xl font-bold text-primary-900">codmeta</h1>
                <p className="text-xs text-primary-600">سي او دي ميتا</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {isHomePage && (
                <>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-sm text-primary-700 hover:text-primary-900 transition-base"
                  >
                    الميزات
                  </button>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="text-sm text-primary-700 hover:text-primary-900 transition-base"
                  >
                    كيف تعمل
                  </button>
                  <button
                    onClick={() => scrollToSection('pricing')}
                    className="text-sm text-primary-700 hover:text-primary-900 transition-base"
                  >
                    الأسعار
                  </button>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="text-sm text-primary-700 hover:text-primary-900 transition-base"
                  >
                    الأسئلة الشائعة
                  </button>
                </>
              )}
              <Link
                to="/auth/login"
                className="text-sm text-primary-700 hover:text-primary-900 transition-base"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/auth/register"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-900 rounded-lg hover:bg-primary-800 transition-base focus-ring"
              >
                إنشاء حساب
              </Link>
            </nav>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-primary-700 hover:text-primary-900 transition-base focus-ring rounded p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-primary-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              {isHomePage && (
                <>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="block w-full text-right text-sm text-primary-700 hover:text-primary-900 transition-base py-2"
                  >
                    الميزات
                  </button>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="block w-full text-right text-sm text-primary-700 hover:text-primary-900 transition-base py-2"
                  >
                    كيف تعمل
                  </button>
                  <button
                    onClick={() => scrollToSection('pricing')}
                    className="block w-full text-right text-sm text-primary-700 hover:text-primary-900 transition-base py-2"
                  >
                    الأسعار
                  </button>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="block w-full text-right text-sm text-primary-700 hover:text-primary-900 transition-base py-2"
                  >
                    الأسئلة الشائعة
                  </button>
                </>
              )}
              <Link
                to="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm text-primary-700 hover:text-primary-900 transition-base py-2"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-white bg-primary-900 rounded-lg hover:bg-primary-800 transition-base text-center"
              >
                إنشاء حساب
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-primary-200 bg-primary-50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-primary-900">codmeta</h2>
                <p className="text-xs text-primary-600">سي او دي ميتا</p>
              </div>
              <p className="text-sm text-primary-600 leading-relaxed">
                منصة احترافية لإدارة طلبات الدفع عند الاستلام. تتبع طلباتك، راقب الأداء، واتخذ قرارات مبنية على البيانات.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary-900 mb-4">روابط سريعة</h3>
              <ul className="space-y-2">
                {isHomePage && (
                  <>
                    <li>
                      <button
                        onClick={() => scrollToSection('features')}
                        className="text-sm text-primary-600 hover:text-primary-900 transition-base"
                      >
                        الميزات
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => scrollToSection('pricing')}
                        className="text-sm text-primary-600 hover:text-primary-900 transition-base"
                      >
                        الأسعار
                      </button>
                    </li>
                  </>
                )}
                <li>
                  <Link
                    to="/auth/register"
                    className="text-sm text-primary-600 hover:text-primary-900 transition-base"
                  >
                    إنشاء حساب
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-primary-900 mb-4">تواصل معنا</h3>
              <p className="text-sm text-primary-600">
                support@codmeta.com
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-primary-200">
            <p className="text-center text-sm text-primary-600">
              © 2024 codmeta. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
