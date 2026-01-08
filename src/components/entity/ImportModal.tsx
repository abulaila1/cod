import { useState, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { Upload, AlertCircle, CheckCircle, Download } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<{ success: number; errors: string[] }>;
  onDownloadTemplate?: () => void;
  templateAvailable?: boolean;
}

export function ImportModal({ isOpen, onClose, onImport, onDownloadTemplate, templateAvailable = false }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);
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
      setResult(importResult);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setResult({ success: 0, errors: [error.message] });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="استيراد من CSV">
      <div className="space-y-4">
        {templateAvailable && onDownloadTemplate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-950 mb-2">
                  استخدم القالب الرسمي
                </p>
                <p className="text-xs text-blue-700 mb-3">
                  لضمان نجاح الاستيراد، يجب استخدام القالب الرسمي الذي يحتوي على الأعمدة المطلوبة بالترتيب الصحيح
                </p>
                <Button
                  size="sm"
                  variant="outline"
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

        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center">
          <Upload className="h-12 w-12 mx-auto text-zinc-400 mb-3" />
          <p className="text-sm text-zinc-600 mb-2">اختر ملف CSV للاستيراد</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
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
            <p className="mt-3 text-sm text-zinc-950 font-medium">{file.name}</p>
          )}
        </div>

        {result && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-950">
                  تم استيراد {result.success} سجل بنجاح
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-950">
                    حدثت {result.errors.length} أخطاء
                  </p>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <p key={index} className="text-xs text-red-700">
                      • {error}
                    </p>
                  ))}
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
            <Button variant="primary" onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? 'جاري الاستيراد...' : 'استيراد'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
