import { describe, expect, it } from 'vitest';
import { formatCnpj, initialDraft, mergeExtraction, trimDraft } from './form-model';

describe('contract form model', () => {
  it('starts empty, without seeded companies, values or signature', () => {
    const draft = initialDraft();
    expect(draft.provider.name).toBe('');
    expect(draft.contractor.name).toBe('');
    expect(draft.monthly).toBe('');
    expect(draft.signature).toBe('');
  });

  it('preserves manual fields in a partial extraction and never confirms a signature', () => {
    const previous = initialDraft();
    previous.contractor.city = 'Cidade preenchida manualmente';
    previous.provider.email = 'cadastro@example.test';
    previous.signature = 'Assinado';
    const next = mergeExtraction(previous, { fields: { provider: { name: 'Empresa de teste' }, monthly: 1500, signature: 'Assinado' } });
    expect(next.provider.name).toBe('Empresa de teste');
    expect(next.provider.email).toBe(previous.provider.email);
    expect(next.contractor.city).toBe(previous.contractor.city);
    expect(next.monthly).toBe('1500');
    expect(next.signature).toBe('');
    expect(previous.signature).toBe('Assinado');
  });

  it('rejects a malformed extraction instead of showing a successful result', () => {
    expect(() => mergeExtraction(initialDraft(), null)).toThrow('O serviço não retornou dados');
  });

  it('normalizes required text before validation and formats CNPJ length safely', () => {
    const draft = initialDraft();
    draft.contractor.name = '   ';
    draft.scope = ' Escopo informado ';
    expect(trimDraft(draft).contractor.name).toBe('');
    expect(trimDraft(draft).scope).toBe('Escopo informado');
    expect(formatCnpj('1234567800019099')).toBe('12.345.678/0001-90');
  });
});
