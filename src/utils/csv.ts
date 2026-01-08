export function exportToCSV(data: any[], filename: string, headers: { key: string; label: string }[]): void {
  const BOM = '\uFEFF';

  const headerRow = headers.map((h) => h.label).join(',');

  const dataRows = data.map((row) => {
    return headers
      .map((h) => {
        let value = row[h.key];

        if (value === null || value === undefined) {
          value = '';
        }

        if (typeof value === 'number') {
          value = value.toString();
        }

        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      })
      .join(',');
  });

  const csv = BOM + [headerRow, ...dataRows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
