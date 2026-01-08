export const REQUIRED_ORDER_HEADERS = [
  'Customer Name',
  'Phone Number',
  'Governorate',
  'City/Address',
  'Product Name',
  'Quantity',
  'Price',
  'Notes',
] as const;

export const REQUIRED_ORDER_HEADERS_AR = [
  'اسم العميل',
  'رقم الهاتف',
  'المحافظة',
  'المدينة/العنوان',
  'اسم المنتج',
  'الكمية',
  'السعر',
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
  notes: string;
}

export function validateOrderHeaders(headers: string[]): { valid: boolean; missing: string[]; found: string[] } {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const missing: string[] = [];
  const found: string[] = [];

  for (const required of REQUIRED_ORDER_HEADERS) {
    const isFound = normalizedHeaders.some((h) => h === required.toLowerCase());
    if (!isFound) {
      missing.push(required);
    } else {
      found.push(required);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    found,
  };
}

export function generateOrderTemplate(): string {
  const BOM = '\uFEFF';

  const headers = REQUIRED_ORDER_HEADERS.join(',');

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

  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

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
        row.notes = value;
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

  return row as OrderImportRow;
}
