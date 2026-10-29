import { expect, test, vi } from 'vitest';
import { analyzeContractDocument } from '../src/services/document-service';

test('documento selecionado informa integração ausente sem ler ou transmitir conteúdo', async () => {
  const file = new File(['conteúdo exclusivo do teste'], 'contrato.txt', { type: 'text/plain' });
  const read = vi.fn();
  Object.defineProperty(file, 'text', { value: read });
  const request = vi.spyOn(globalThis, 'fetch');
  await expect(analyzeContractDocument(file)).rejects.toMatchObject({ code: 'BACKEND_NOT_CONFIGURED' });
  expect(read).not.toHaveBeenCalled();
  expect(request).not.toHaveBeenCalled();
  request.mockRestore();
});

test('cancelamento é respeitado antes da análise e seleção vazia tem erro próprio', async () => {
  const controller = new AbortController();
  controller.abort();
  const file = new File(['teste'], 'contrato.txt', { type: 'text/plain' });
  await expect(analyzeContractDocument(file, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  await expect(analyzeContractDocument(null)).rejects.toThrow('Selecione um documento.');
});
