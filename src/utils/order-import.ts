export const IMPORT_SCHEMA = {
  columns: [
    { key: 'order_number', label: 'Order Number', labelAr: 'رقم الطلب', required: false },
    { key: 'date', label: 'Date', labelAr: 'التاريخ', required: false },
    { key: 'customer_name', label: 'Customer Name', labelAr: 'اسم العميل', required: true },
    { key: 'phone', label: 'Phone', labelAr: 'رقم الهاتف', required: true },
    { key: 'city', label: 'City', labelAr: 'المدينة', required: false },
    { key: 'address', label: 'Address', labelAr: 'العنوان', required: false },
    { key: 'sku', label: 'SKU', labelAr: 'رمز المنتج', required: true },
    { key: 'product', label: 'Product', labelAr: 'المنتج', required: false },
    { key: 'quantity', label: 'Quantity', labelAr: 'الكمية', required: true },
    { key: 'price', label: 'Price', labelAr: 'السعر', required: true },
    { key: 'status', label: 'Status', labelAr: 'الحالة', required: false },
    { key: 'notes', label: 'Notes', labelAr: 'ملاحظات', required: false },
  ],
} as const;

export type ColumnKey = typeof IMPORT_SCHEMA.columns[number]['key'];

export const ALLOWED_STATUSES = [
  'new', 'جديد',
  'confirmed', 'مؤكد',
  'processing', 'قيد التجهيز',
  'shipped', 'تم الشحن',
  'delivered', 'تم التسليم',
  'returned', 'مرتجع',
  'cancelled', 'ملغي',
] as const;

export interface ImportRowData {
  rowNumber: number;
  order_number?: string;
  date?: string;
  customer_name: string;
  phone: string;
  city?: string;
  address?: string;
  sku: string;
  product?: string;
  quantity: number;
  price: number;
  status?: string;
  notes?: string;
}

export interface RowValidationError {
  rowNumber: number;
  column: string;
  message: string;
  value?: string;
}

export interface HeaderValidationResult {
  isValid: boolean;
  missingRequired: string[];
  missingOptional: string[];
  foundColumns: string[];
  columnMapping: Map<number, ColumnKey>;
}

export interface RowValidationResult {
  isValid: boolean;
  data: ImportRowData | null;
  errors: RowValidationError[];
}

export interface ImportValidationResult {
  headerValidation: HeaderValidationResult;
  validRows: ImportRowData[];
  invalidRows: Array<{ rowNumber: number; errors: RowValidationError[] }>;
  totalRows: number;
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w\u0600-\u06FF]/g, '');
}

function matchColumn(header: string): ColumnKey | null {
  const normalized = normalizeHeader(header);

  const mappings: Record<string, ColumnKey> = {
    'order_number': 'order_number',
    'ordernumber': 'order_number',
    'رقم_الطلب': 'order_number',
    'رقمالطلب': 'order_number',

    'date': 'date',
    'order_date': 'date',
    'التاريخ': 'date',
    'تاريخ': 'date',

    'customer_name': 'customer_name',
    'customername': 'customer_name',
    'name': 'customer_name',
    'اسم_العميل': 'customer_name',
    'اسمالعميل': 'customer_name',
    'العميل': 'customer_name',
    'الاسم': 'customer_name',

    'phone': 'phone',
    'phone_number': 'phone',
    'phonenumber': 'phone',
    'mobile': 'phone',
    'رقم_الهاتف': 'phone',
    'رقمالهاتف': 'phone',
    'الهاتف': 'phone',
    'الموبايل': 'phone',
    'الجوال': 'phone',

    'city': 'city',
    'المدينة': 'city',
    'المحافظة': 'city',
    'governorate': 'city',

    'address': 'address',
    'العنوان': 'address',
    'city_address': 'address',
    'المدينةالعنوان': 'address',

    'sku': 'sku',
    'رمز_المنتج': 'sku',
    'رمزالمنتج': 'sku',
    'كود_المنتج': 'sku',
    'كودالمنتج': 'sku',
    'product_code': 'sku',
    'productcode': 'sku',
    'barcode': 'sku',
    'الباركود': 'sku',

    'product': 'product',
    'product_name': 'product',
    'productname': 'product',
    'المنتج': 'product',
    'اسم_المنتج': 'product',
    'اسمالمنتج': 'product',

    'quantity': 'quantity',
    'qty': 'quantity',
    'الكمية': 'quantity',
    'كمية': 'quantity',

    'price': 'price',
    'unit_price': 'price',
    'السعر': 'price',
    'سعر': 'price',

    'status': 'status',
    'الحالة': 'status',
    'حالة': 'status',

    'notes': 'notes',
    'note': 'notes',
    'ملاحظات': 'notes',
    'ملاحظة': 'notes',
  };

  return mappings[normalized] || null;
}

export function validateHeaders(headers: string[]): HeaderValidationResult {
  const columnMapping = new Map<number, ColumnKey>();
  const foundColumns: string[] = [];
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  for (let i = 0; i < headers.length; i++) {
    const matched = matchColumn(headers[i]);
    if (matched) {
      columnMapping.set(i, matched);
      foundColumns.push(matched);
    }
  }

  for (const col of IMPORT_SCHEMA.columns) {
    if (!foundColumns.includes(col.key)) {
      if (col.required) {
        missingRequired.push(`${col.label} (${col.labelAr})`);
      } else {
        missingOptional.push(`${col.label} (${col.labelAr})`);
      }
    }
  }

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    missingOptional,
    foundColumns,
    columnMapping,
  };
}

export function validateRow(
  rowNumber: number,
  values: string[],
  columnMapping: Map<number, ColumnKey>
): RowValidationResult {
  const errors: RowValidationError[] = [];
  const data: Partial<ImportRowData> = { rowNumber };

  for (const [index, key] of columnMapping.entries()) {
    const rawValue = values[index]?.trim() || '';

    switch (key) {
      case 'order_number':
        data.order_number = rawValue || undefined;
        break;

      case 'date':
        if (rawValue) {
          const parsedDate = parseDate(rawValue);
          if (parsedDate) {
            data.date = parsedDate;
          } else {
            errors.push({
              rowNumber,
              column: 'Date',
              message: 'تنسيق التاريخ غير صحيح',
              value: rawValue,
            });
          }
        }
        break;

      case 'customer_name':
        if (!rawValue) {
          errors.push({
            rowNumber,
            column: 'Customer Name',
            message: 'اسم العميل مطلوب',
          });
        } else if (rawValue.length < 2) {
          errors.push({
            rowNumber,
            column: 'Customer Name',
            message: 'اسم العميل قصير جداً',
            value: rawValue,
          });
        } else {
          data.customer_name = rawValue;
        }
        break;

      case 'phone':
        if (!rawValue) {
          errors.push({
            rowNumber,
            column: 'Phone',
            message: 'رقم الهاتف مطلوب',
          });
        } else {
          const cleanPhone = rawValue.replace(/[\s\-\(\)]/g, '');
          const digits = cleanPhone.replace(/\D/g, '');
          if (digits.length < 8) {
            errors.push({
              rowNumber,
              column: 'Phone',
              message: 'رقم الهاتف يجب أن يحتوي على 8 أرقام على الأقل',
              value: rawValue,
            });
          } else {
            data.phone = cleanPhone;
          }
        }
        break;

      case 'city':
        data.city = rawValue || undefined;
        break;

      case 'address':
        data.address = rawValue || undefined;
        break;

      case 'sku':
        if (!rawValue) {
          errors.push({
            rowNumber,
            column: 'SKU',
            message: 'رمز المنتج (SKU) مطلوب',
          });
        } else {
          data.sku = rawValue.trim();
        }
        break;

      case 'product':
        data.product = rawValue || undefined;
        break;

      case 'quantity':
        if (!rawValue) {
          errors.push({
            rowNumber,
            column: 'Quantity',
            message: 'الكمية مطلوبة',
          });
        } else {
          const qty = parseInt(rawValue, 10);
          if (isNaN(qty) || qty < 1) {
            errors.push({
              rowNumber,
              column: 'Quantity',
              message: 'الكمية يجب أن تكون رقم صحيح أكبر من 0',
              value: rawValue,
            });
          } else {
            data.quantity = qty;
          }
        }
        break;

      case 'price':
        if (!rawValue) {
          errors.push({
            rowNumber,
            column: 'Price',
            message: 'السعر مطلوب',
          });
        } else {
          const price = parseFloat(rawValue.replace(/[,،]/g, ''));
          if (isNaN(price) || price <= 0) {
            errors.push({
              rowNumber,
              column: 'Price',
              message: 'السعر يجب أن يكون رقم أكبر من 0',
              value: rawValue,
            });
          } else {
            data.price = price;
          }
        }
        break;

      case 'status':
        if (rawValue) {
          const normalizedStatus = rawValue.toLowerCase().trim();
          const isAllowed = ALLOWED_STATUSES.some(
            s => s.toLowerCase() === normalizedStatus
          );
          if (!isAllowed) {
            errors.push({
              rowNumber,
              column: 'Status',
              message: `الحالة غير معروفة: "${rawValue}"`,
              value: rawValue,
            });
          } else {
            data.status = rawValue;
          }
        }
        break;

      case 'notes':
        data.notes = rawValue || undefined;
        break;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, data: null, errors };
  }

  return {
    isValid: true,
    data: data as ImportRowData,
    errors: [],
  };
}

function parseDate(value: string): string | null {
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
  ];

  for (const format of formats) {
    const match = value.match(format);
    if (match) {
      let year: number, month: number, day: number;

      if (format === formats[0]) {
        [, year, month, day] = match.map(Number) as [any, number, number, number];
      } else {
        [, day, month, year] = match.map(Number) as [any, number, number, number];
      }

      if (year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
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
  return result;
}

export function validateImportData(
  headers: string[],
  rows: string[][]
): ImportValidationResult {
  const headerValidation = validateHeaders(headers);

  if (!headerValidation.isValid) {
    return {
      headerValidation,
      validRows: [],
      invalidRows: [],
      totalRows: rows.length,
    };
  }

  const validRows: ImportRowData[] = [];
  const invalidRows: Array<{ rowNumber: number; errors: RowValidationError[] }> = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNumber = i + 2;
    const rowResult = validateRow(rowNumber, rows[i], headerValidation.columnMapping);

    if (rowResult.isValid && rowResult.data) {
      validRows.push(rowResult.data);
    } else {
      invalidRows.push({ rowNumber, errors: rowResult.errors });
    }
  }

  return {
    headerValidation,
    validRows,
    invalidRows,
    totalRows: rows.length,
  };
}

export function generateOrderTemplate(): string {
  const BOM = '\uFEFF';

  const headers = IMPORT_SCHEMA.columns.map(col => col.label);

  const exampleRows = [
    ['ORD-001', '2024-01-15', 'Ahmad Mohamed', '0501234567', 'Riyadh', 'Naseem District, Street 15', 'WATCH-001', 'Smart Watch', '2', '299.00', 'New', 'Urgent order'],
    ['ORD-002', '2024-01-15', 'Sara Ali', '0551234567', 'Jeddah', 'Safa District', 'EARBUDS-002', 'Bluetooth Earbuds', '1', '150.00', 'Confirmed', ''],
    ['', '', 'Mohamed Ahmed', '0561234567', 'Dammam', 'King Fahd Street', 'CHARGER-003', 'Wireless Charger', '3', '89.00', '', 'Office delivery'],
  ];

  const csvRows = [
    headers.join(','),
    ...exampleRows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ];

  return BOM + csvRows.join('\n');
}

export function generateOrderTemplateArabic(): string {
  const BOM = '\uFEFF';

  const headers = IMPORT_SCHEMA.columns.map(col => col.labelAr);

  const exampleRows = [
    ['ORD-001', '2024-01-15', 'أحمد محمد', '0501234567', 'الرياض', 'حي النسيم، شارع 15', 'WATCH-001', 'ساعة ذكية', '2', '299.00', 'جديد', 'طلب مستعجل'],
    ['ORD-002', '2024-01-15', 'سارة علي', '0551234567', 'جدة', 'حي الصفا', 'EARBUDS-002', 'سماعة بلوتوث', '1', '150.00', 'مؤكد', ''],
    ['', '', 'محمد أحمد', '0561234567', 'الدمام', 'شارع الملك فهد', 'CHARGER-003', 'شاحن لاسلكي', '3', '89.00', '', 'تسليم للمكتب'],
  ];

  const csvRows = [
    headers.join(','),
    ...exampleRows.map(row =>
      row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ];

  return BOM + csvRows.join('\n');
}
