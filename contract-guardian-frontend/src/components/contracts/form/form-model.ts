import type { Contract } from '../../../types';

export interface ContractDraft {
  contractor: { name: string; cnpj: string; type: string; city: string };
  provider: { name: string; cnpj: string; category: string; email: string; phone: string };
  category: string; scope: string; start: string; end: string; monthly: string; total: string; signature: string; renewal: string;
}
export interface DocumentMetadata { name: string; type: string; size: number }
export const categories = ['Tecnologia', 'Marketing', 'Energia', 'Serviços gerais', 'Consultoria', 'Infraestrutura', 'Contabilidade', 'Segurança', 'Telecomunicações', 'Recursos humanos', 'Jurídico', 'Logística', 'Imobiliário', 'Suprimentos', 'Outros'];
export function initialDraft(contract?: Contract | null): ContractDraft {
  return {
    contractor: contract ? { ...contract.contractor } : { name: '', cnpj: '', type: '', city: '' },
    provider: contract ? { ...contract.provider } : { name: '', cnpj: '', category: '', email: '', phone: '' },
    category: contract?.category || '', scope: contract?.scope || '', start: contract?.start || '', end: contract?.end || '', monthly: contract ? String(contract.monthly) : '', total: contract ? String(contract.total) : '', signature: contract?.signature || '', renewal: contract?.renewal || '',
  };
}
export function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}
export function trimDraft(draft: ContractDraft): ContractDraft {
  const trim = <T extends Record<string, string>>(values: T): T => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()])) as T;
  return { ...trim({ category: draft.category, scope: draft.scope, start: draft.start, end: draft.end, monthly: draft.monthly, total: draft.total, signature: draft.signature, renewal: draft.renewal }), contractor: trim(draft.contractor), provider: trim(draft.provider) };
}

/** Only known scalar form fields can be populated by a future extraction API. */
export function mergeExtraction(previous: ContractDraft, value: unknown): ContractDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('O serviço não retornou dados para revisão. Preencha os campos manualmente.');
  const result = 'fields' in value && value.fields && typeof value.fields === 'object' ? value.fields : value;
  const record = result as Record<string, unknown>;
  const scalar = (source: Record<string, unknown>, key: string, fallback: string) => typeof source[key] === 'string' || typeof source[key] === 'number' ? String(source[key]) : fallback;
  const nested = (key: string): Record<string, unknown> => record[key] && typeof record[key] === 'object' && !Array.isArray(record[key]) ? record[key] as Record<string, unknown> : {};
  const contractor = nested('contractor'), provider = nested('provider');
  return {
    contractor: { name: scalar(contractor, 'name', previous.contractor.name), cnpj: scalar(contractor, 'cnpj', previous.contractor.cnpj), type: scalar(contractor, 'type', previous.contractor.type), city: scalar(contractor, 'city', previous.contractor.city) },
    provider: { name: scalar(provider, 'name', previous.provider.name), cnpj: scalar(provider, 'cnpj', previous.provider.cnpj), category: scalar(provider, 'category', previous.provider.category), email: scalar(provider, 'email', previous.provider.email), phone: scalar(provider, 'phone', previous.provider.phone) },
    category: scalar(record, 'category', previous.category), scope: scalar(record, 'scope', previous.scope), start: scalar(record, 'start', previous.start), end: scalar(record, 'end', previous.end), monthly: scalar(record, 'monthly', previous.monthly), total: scalar(record, 'total', previous.total), signature: '', renewal: scalar(record, 'renewal', previous.renewal),
  };
}
