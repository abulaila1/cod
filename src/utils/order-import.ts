export const REQUIRED_ORDER_HEADERS = [
  'Customer Name',
  'Phone Number',
  'Governorate',
  'City/Address',
  'Product Name',
  'Quantity',
  'Price',
] as const;

export const OPTIONAL_ORDER_HEADERS = [
  'Notes',
] as const;

export const ALL_ORDER_HEADERS = [
  ...REQUIRED_ORDER_HEADERS,
  ...OPTIONAL_ORDER_HEADERS,
] as const;

export const REQUIRED_ORDER_HEADERS_AR = [
  'اسم العميل',
  'رقم الهاتف',
  'المحافظة',
  'المدينة/العنوان',
  'اسم المنتج',
  'الكمية',
  'السعر',
] as const;

export const OPTIONAL_ORDER_HEADERS_AR = [
  'ملاحظات',
] as const;

export interface OrderImportRow {
  customerName: string;
  phoneNumber: string;
  governorate: string;
  cityAddress: string;
  productName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export function validateOrderHeaders(headers: string[]): {
  valid: boolean;
  missing: string[];
  found: string[];
  optional: string[];
} {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase().replace(/\s+/g, ' '));
  const missing: string[] = [];
  const found: string[] = [];
  const optional: string[] = [];

  const criticalColumns = ['customer name', 'product name', 'price'];
  const hasCritical = criticalColumns.every(col =>
    normalizedHeaders.some(h => h.includes(col))
  );

  if (!hasCritical) {
    const missingCritical = criticalColumns.filter(col =>
      !normalizedHeaders.some(h => h.includes(col))
    );
    return {
      valid: false,
      missing: missingCritical.map(col => {
        switch(col) {
          case 'customer name': return 'Customer Name';
          case 'product name': return 'Product Name';
          case 'price': return 'Price';
          default: return col;
        }
      }),
      found: headers,
      optional: [],
    };
  }

  for (const required of REQUIRED_ORDER_HEADERS) {
    const normalizedRequired = required.toLowerCase().trim().replace(/\s+/g, ' ');
    const isFound = normalizedHeaders.some((h) => h === normalizedRequired || h.includes(normalizedRequired.split(' ')[0]));
    if (isFound) {
      found.push(required);
    } else {
      missing.push(required);
    }
  }

  for (const opt of OPTIONAL_ORDER_HEADERS) {
    const normalizedOpt = opt.toLowerCase().trim().replace(/\s+/g, ' ');
    const isFound = normalizedHeaders.some((h) => h === normalizedOpt);
    if (isFound) {
      optional.push(opt);
    }
  }

  return {
    valid: hasCritical,
    missing,
    found,
    optional,
  };
}

export function generateOrderTemplate(): string {
  const BOM = '\uFEFF';

  const headers = ALL_ORDER_HEADERS.join(',');

  const exampleRow = [
    'أحمد محمد',
    '01234567890',
    'القاهرة',
    'مدينة نصر، شارع مصطفى النحاس',
    'منتج تجريبي',
    '2',
    '150.00',
    'ملاحظات تجريبية',
  ].map((cell) => `"${cell}"`).join(',');

  return BOM + headers + '\n' + exampleRow;
}

export function parseOrderImportRow(
  headers: string[],
  values: string[]
): OrderImportRow | null {
  const row: Partial<OrderImportRow> = {};

  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase().replace(/\s+/g, ' '));

  for (let i = 0; i < headers.length; i++) {
    const header = normalizedHeaders[i];
    const value = values[i]?.trim() || '';

    switch (header) {
      case 'customer name':
        row.customerName = value;
        break;
      case 'phone number':
        row.phoneNumber = value;
        break;
      case 'governorate':
        row.governorate = value;
        break;
      case 'city/address':
        row.cityAddress = value;
        break;
      case 'product name':
        row.productName = value;
        break;
      case 'quantity':
        row.quantity = parseInt(value) || 1;
        break;
      case 'price':
        row.price = parseFloat(value) || 0;
        break;
      case 'notes':
        row.notes = value || '';
        break;
    }
  }

  if (
    !row.customerName ||
    !row.phoneNumber ||
    !row.governorate ||
    !row.cityAddress ||
    !row.productName
  ) {
    return null;
  }

  if (!row.notes) {
    row.notes = '';
  }

  return row as OrderImportRow;
}
