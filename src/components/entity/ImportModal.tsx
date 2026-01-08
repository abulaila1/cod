import { useState, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import {
  Upload,
  AlertCircle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  Package,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';

interface RowError {
  rowNumber: number;
  errors: Array<{
    rowNumber: number;
    column: string;
    message: string;
    value?: string;
  }>;
}

interface DetailedImportResult {
  success: number;
  failed: number;
  errors: RowError[];
  headerErrors: string[];
  productsCreated: string[];
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<{ success: number; errors: string[] } | DetailedImportResult>;
  onDownloadTemplate?: () => void;
  templateAvailable?: boolean;
}

function isDetailedResult(result: any): result is DetailedImportResult {
  return 'headerErrors' in result && 'productsCreated' in result;
}

export function ImportModal({
  isOpen,
  onClose,
  onImport,
  onDownloadTemplate,
  templateAvailable = false
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<DetailedImportResult | null>(null);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    try {
      const importResult = await onImport(file);

      if (isDetailedResult(importResult)) {
        setResult(importResult);
      } else {
        setResult({
          success: importResult.success,
          failed: importResult.errors.length,
          errors: importResult.errors.map((err, idx) => ({
            rowNumber: idx + 2,
            errors: [{ rowNumber: idx + 2, column: 'Unknown', message: err }],
          })),
          headerErrors: [],
          productsCreated: [],
        });
      }

      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setResult({
        success: 0,
        failed: 0,
        errors: [],
        headerErrors: [error.message],
        productsCreated: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setShowAllErrors(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const totalErrors = result ? result.headerErrors.length + result.errors.length : 0;
  const displayedErrors = showAllErrors ? result?.errors : result?.errors.slice(0, 5);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="استيراد الطلبات">
      <div className="space-y-4">
        {templateAvailable && onDownloadTemplate && !result && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-950 mb-1">
                  القالب الرسمي للاستيراد
                </p>
                <p className="text-xs text-blue-700 mb-3">
                  استخدم القالب لضمان توافق البيانات. الأعمدة المطلوبة: اسم العميل، الهاتف، المنتج، الكمية، السعر
                </p>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={onDownloadTemplate}
                  type="button"
                >
                  <Download className="ml-2 h-4 w-4" />
                  تحميل القالب
                </Button>
              </div>
            </div>
          </div>
        )}

        {!result && (
          <div className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center hover:border-zinc-400 transition-colors">
            <Upload className="h-12 w-12 mx-auto text-zinc-400 mb-3" />
            <p className="text-sm font-medium text-zinc-700 mb-1">اختر ملف Excel أو CSV</p>
            <p className="text-xs text-zinc-500 mb-4">يدعم: .xlsx, .xls, .csv</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} type="button">
                اختيار ملف
              </Button>
            </label>
            {file && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-700 bg-emerald-50 py-2 px-4 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.headerErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-950 mb-2">
                      خطأ في هيكل الملف
                    </p>
                    <ul className="space-y-1">
                      {result.headerErrors.map((error, index) => (
                        <li key={index} className="text-xs text-red-700">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700">{result.success}</p>
                    <p className="text-xs text-emerald-600">طلب تم استيراده</p>
                  </div>
                </div>
              </div>

              <div className={`border rounded-xl p-4 ${
                result.failed > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    result.failed > 0 ? 'bg-red-100' : 'bg-zinc-100'
                  }`}>
                    {result.failed > 0 ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${
                      result.failed > 0 ? 'text-red-700' : 'text-zinc-400'
                    }`}>{result.failed}</p>
                    <p className={`text-xs ${
                      result.failed > 0 ? 'text-red-600' : 'text-zinc-400'
                    }`}>صف فشل</p>
                  </div>
                </div>
              </div>
            </div>

            {result.productsCreated.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-950 mb-1">
                      منتجات جديدة تم إنشاؤها ({result.productsCreated.length})
                    </p>
                    <p className="text-xs text-amber-700 mb-2">
                      هذه المنتجات لم تكن موجودة وتم إنشاؤها تلقائياً. يمكنك تعديلها من صفحة المنتجات.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {result.productsCreated.slice(0, 5).map((product, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-xs text-amber-800"
                        >
                          {product}
                        </span>
                      ))}
                      {result.productsCreated.length > 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-xs text-amber-800">
                          +{result.productsCreated.length - 5} أخرى
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-zinc-700">
                        تفاصيل الأخطاء ({result.errors.length} صف)
                      </span>
                    </div>
                    {result.errors.length > 5 && (
                      <button
                        onClick={() => setShowAllErrors(!showAllErrors)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        {showAllErrors ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            إخفاء
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            عرض الكل
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-right text-zinc-600 font-medium">الصف</th>
                        <th className="px-3 py-2 text-right text-zinc-600 font-medium">العمود</th>
                        <th className="px-3 py-2 text-right text-zinc-600 font-medium">الخطأ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {displayedErrors?.map((row, rowIdx) =>
                        row.errors.map((error, errIdx) => (
                          <tr key={`${rowIdx}-${errIdx}`} className="hover:bg-zinc-50">
                            <td className="px-3 py-2 text-zinc-500">{error.rowNumber}</td>
                            <td className="px-3 py-2 text-zinc-700 font-medium">{error.column}</td>
                            <td className="px-3 py-2 text-red-600">
                              {error.message}
                              {error.value && (
                                <span className="text-zinc-400 mr-1">({error.value})</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
          <Button variant="outline" onClick={handleClose}>
            {result ? 'إغلاق' : 'إلغاء'}
          </Button>
          {!result && (
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={!file || isImporting}
            >
              {isImporting ? 'جاري الاستيراد...' : 'استيراد'}
            </Button>
          )}
          {result && result.success > 0 && (
            <Button
              variant="primary"
              onClick={handleClose}
            >
              تم
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
