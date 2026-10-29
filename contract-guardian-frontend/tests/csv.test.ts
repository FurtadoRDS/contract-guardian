import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { downloadCsv } from '../src/lib/csv';

const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
const createObjectURL = vi.fn((_blob: Blob) => 'blob:csv-test');
const revokeObjectURL = vi.fn();
beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
});
afterEach(() => { vi.useRealTimers(); });
afterAll(() => {
  if (originalCreate) Object.defineProperty(URL, 'createObjectURL', originalCreate);
  else Reflect.deleteProperty(URL, 'createObjectURL');
  if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', originalRevoke);
  else Reflect.deleteProperty(URL, 'revokeObjectURL');
});

async function contents(blob: Blob) {
  const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
  const data = new Uint8Array(bytes);
  expect([...data.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  return new TextDecoder('utf-8').decode(data);
}

test('CSV compartilhado conserva BOM, células vazias, separadores e descarte do link temporário', async () => {
  let downloadedName = '';
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloadedName = this.download; });
  vi.useFakeTimers();
  downloadCsv({ filename: 'carteira.csv', headers: ['Coluna A', 'Coluna B', 'Coluna C'], rows: [[null, undefined, '']] });
  vi.runAllTimers();
  vi.useRealTimers();
  expect(downloadedName).toBe('carteira.csv');
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv-test');
  expect(document.querySelector('a[download="carteira.csv"]')).toBeNull();
  const blob = createObjectURL.mock.calls[0][0];
  expect(blob.type).toBe('text/csv;charset=utf-8;');
  expect(await contents(blob)).toBe('"Coluna A";"Coluna B";"Coluna C"\r\n"";"";""');
});

test('CSV escapa aspas e impede fórmulas mesmo após espaços ou quebras de linha', async () => {
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.useFakeTimers();
  downloadCsv({
    filename: 'historico.csv',
    headers: ['Texto'],
    rows: [['=SUM(1,2)'], [' +1'], ['  -1'], [' @cmd'], ['\tformula'], ['\n=1'], ['nome; área "revisada"']],
  });
  vi.runAllTimers();
  vi.useRealTimers();
  const text = await contents(createObjectURL.mock.calls[0][0]);
  expect(text).toBe('"Texto"\r\n"\'=SUM(1,2)"\r\n"\' +1"\r\n"\'  -1"\r\n"\' @cmd"\r\n"\'\tformula"\r\n"\'\n=1"\r\n"nome; área ""revisada"""');
});
