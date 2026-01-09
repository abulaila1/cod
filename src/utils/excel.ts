import * as XLSX from 'xlsx';

function excelSerialToDate(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isExcelDateSerial(value: unknown): boolean {
  return typeof value === 'number' && value > 25000 && value < 100000;
}

function processCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (isExcelDateSerial(value)) {
    return excelSerialToDate(value as number);
  }
  return String(value);
}

export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('فشل في قراءة الملف'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'array', cellDates: false });

        if (workbook.SheetNames.length === 0) {
          reject(new Error('الملف لا يحتوي على أي ورقة عمل'));
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: true });

        const processedData = (rawData as any[][]).map(row =>
          row.map(cell => processCell(cell))
        );

        resolve(processedData);
      } catch (error: any) {
        reject(new Error(`فشل في معالجة ملف Excel: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('فشل في قراءة الملف'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel(
  data: any[],
  filename: string,
  headers: { key: string; label: string }[]
): void {
  const headerRow = headers.map((h) => h.label);

  const dataRows = data.map((row) => {
    return headers.map((h) => {
      let value = row[h.key];

      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'boolean') {
        return value ? 'نعم' : 'لا';
      }

      return value;
    });
  });

  const worksheetData = [headerRow, ...dataRows];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const columnWidths = headers.map((h) => ({
    wch: Math.max(h.label.length + 5, 15),
  }));
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  XLSX.writeFile(workbook, filename);
}
