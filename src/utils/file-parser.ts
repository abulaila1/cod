import { parseExcelFile } from './excel';

export interface ParsedFileData {
  rows: string[][];
  headers: string[];
  dataRows: string[][];
}

export async function parseImportFile(file: File): Promise<ParsedFileData> {
  const fileExtension = file.name.toLowerCase().split('.').pop();

  let rows: any[][] = [];

  if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    rows = await parseExcelFile(file);
  } else if (fileExtension === 'csv') {
    rows = await parseCSVFile(file);
  } else {
    throw new Error('نوع الملف غير مدعوم. الرجاء استخدام ملف CSV أو Excel');
  }

  if (rows.length < 2) {
    throw new Error('الملف فارغ أو لا يحتوي على بيانات');
  }

  const headers = rows[0].map((h) => String(h || '').trim());
  const dataRows = rows.slice(1).map((row) =>
    row.map((cell) => String(cell || '').trim())
  );

  return {
    rows,
    headers,
    dataRows,
  };
}

async function parseCSVFile(file: File): Promise<string[][]> {
  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim());

  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());

    return result.map((cell) => cell.replace(/^"|"$/g, ''));
  });
}
