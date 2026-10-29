export type CsvValue = string | number | null | undefined;
interface DownloadCsvOptions { filename: string; headers: string[]; rows: CsvValue[][] }

/** Quote every cell and prevent spreadsheet formula interpretation of text. */
function csvCell(value: CsvValue): string {
  let text = String(value ?? '');
  if (/^[\t\r\n]|^\s*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

/** Excel-compatible UTF-8 BOM, semicolon-separated columns and CRLF records. */
export function downloadCsv({ filename, headers, rows }: DownloadCsvOptions): void {
  const content = '\ufeff' + [headers, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.hidden = true;
  document.body.append(link);
  try { link.click(); }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
