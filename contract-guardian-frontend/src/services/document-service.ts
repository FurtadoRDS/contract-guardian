import type { DocumentAnalysisResult } from '../types';

export class DocumentServiceError extends Error {
  readonly code = 'BACKEND_NOT_CONFIGURED';

  constructor() {
    super('Documento selecionado. A análise automática estará disponível após a integração com o backend. Preencha ou revise os campos manualmente.');
    this.name = 'DocumentServiceError';
  }
}

/** Replace with the company document extraction API. No file contents are read,
 * stored or transmitted here. Signature must ALWAYS be confirmed manually. */
export async function analyzeContractDocument(
  file: File | null | undefined,
  { signal }: { signal?: AbortSignal } = {},
): Promise<DocumentAnalysisResult> {
  if (signal?.aborted) throw new DOMException('Operação cancelada', 'AbortError');
  if (!file) throw new Error('Selecione um documento.');
  throw new DocumentServiceError();
}
