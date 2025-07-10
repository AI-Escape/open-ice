import XLSX from 'sheetjs-style';
import { saveAs } from 'file-saver';

type Row = Record<string, string | number | boolean | null | undefined | Date>;

function fitToColumn<T extends Row>(data: T[]) {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  // get maximum character of each column
  const maxChars = data.reduce(
    (acc, row) => {
      Object.keys(row).forEach((key) => {
        const value = row[key] === null || row[key] === undefined ? '' : row[key].toString();
        acc[key] = Math.max(acc[key] ?? 0, value.length, key.length);
      });

      return acc;
    },
    {} as Record<string, number>,
  );

  // convert to column width
  return Object.keys(maxChars).map((key) => ({ wch: maxChars[key] + 1 }));
}

export function exportExcel<T extends Row>(data: T[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = fitToColumn(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
}
