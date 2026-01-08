import { AlertCircle } from 'lucide-react';

export function ConfigurationError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-900" dir="rtl">
              إعدادات الاتصال غير مكتملة
            </h1>
            <p className="text-lg text-slate-600" dir="rtl">
              يرجى ضبط متغيرات Supabase في بيئة الإنتاج.
            </p>
          </div>

          <div className="w-full space-y-4">
            <div className="bg-slate-50 rounded-lg p-6 text-left space-y-3 border border-slate-200">
              <p className="text-sm font-semibold text-slate-700">Required Configuration:</p>
              <ul className="space-y-2 text-sm text-slate-600 font-mono">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✕</span>
                  <span>SUPABASE_URL</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✕</span>
                  <span>SUPABASE_ANON_KEY</span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 text-left space-y-3 border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">Configuration Options:</p>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <p className="font-semibold">Option 1: Environment Variables</p>
                  <p className="text-xs mt-1 text-blue-700">Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting platform</p>
                </div>
                <div>
                  <p className="font-semibold">Option 2: Runtime Config</p>
                  <p className="text-xs mt-1 text-blue-700">Edit /public/config.js with your Supabase credentials</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-500 space-y-2">
            <p>Check the browser console for more details.</p>
            <p>After configuring, rebuild and redeploy the application.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
