import { test } from 'vitest';
import type { Contract } from '../src/types';
import assert from 'node:assert/strict';
import * as domain from '../src/domain/contracts';

const { contractStatus, daysUntil, monthlySeriesFor, monthlyVariation } = domain;

// Registros exclusivos de teste; não são importados pelo produto.
type Fixture = Pick<Contract, 'id' | 'signature' | 'start' | 'end' | 'monthly'>;
const contract = (overrides: Partial<Fixture> = {}): Fixture => ({
  id: 'contrato-de-teste',
  signature: 'Assinado',
  start: '2026-01-01',
  end: '2026-12-31',
  monthly: 1000,
  ...overrides,
});

test('o domínio não exporta contratos ou séries fictícias pré-cadastradas', () => {
  for (const name of ['seedContracts', 'sampleContract', 'monthlySeries']) {
    assert.equal(name in domain, false);
  }
  assert.match(domain.TODAY, /^\d{4}-\d{2}-\d{2}$/);
});

test('carteira vazia produz doze meses com valores e comparação zerados', () => {
  const series = monthlySeriesFor([], 2026, '2026-10-28');
  assert.equal(series.length, 12);
  assert.equal(series[0].label, 'Janeiro');
  assert.equal(series[11].label, 'Dezembro');
  assert.ok(series.every(month => month.value === 0 && month.comparison === 0));
});

test('qualquer sobreposição com o mês conta o valor mensal integral, sem rateio diário', () => {
  const series = monthlySeriesFor([
    contract({ start: '2026-02-28', end: '2026-03-01', monthly: 300 }),
    contract({ id: 'outro', start: '2026-03-31', end: '2026-03-31', monthly: 50 }),
  ], 2026, '2026-10-28');
  assert.equal(series[0].value, 0);
  assert.equal(series[1].value, 300);
  assert.equal(series[2].value, 350);
  assert.equal(series[3].value, 0);
});

test('sobreposição entre anos aparece no mês certo e na comparação do ano anterior', () => {
  const input = [contract({ start: '2025-12-20', end: '2026-01-10', monthly: 1200 })];
  const before = JSON.stringify(input);
  const series = monthlySeriesFor(input, 2026, '2026-10-28');
  assert.equal(series[0].value, 1200);
  assert.equal(series[11].value, 0);
  assert.equal(series[0].comparison, 0);
  assert.equal(series[11].comparison, 1200);
  assert.equal(JSON.stringify(input), before, 'o cálculo não altera os contratos recebidos');
});

test('fevereiro de ano bissexto inclui contrato iniciado no dia 29', () => {
  const input = [contract({ start: '2024-02-29', end: '2024-03-01', monthly: 450 })];
  const series = monthlySeriesFor(input, 2024, '2024-03-01');
  assert.equal(series[1].value, 450);
  assert.equal(series[2].value, 450);
  const followingYear = monthlySeriesFor(input, 2025, '2025-03-01');
  assert.equal(followingYear[1].comparison, 450);
});

test('contratos sem assinatura confirmada não compõem custos ou projeções', () => {
  const unsigned = (['Pendente', 'Em revisão', ''] satisfies Contract['signature'][]).map((signature, index) =>
    contract({ id: `nao-assinado-${index}`, signature, monthly: 5000 }));
  const series = monthlySeriesFor([...unsigned, contract({ monthly: 125 })], 2026, '2026-10-28');
  assert.ok(series.every(month => month.value === 125));
  assert.ok(series.every(month => month.comparison === 0));
});

test('meses futuros são projeções e o mês atual continua identificado como atual', () => {
  const series = monthlySeriesFor([contract()], 2026, '2026-10-28');
  assert.deepEqual(series.map(month => month.projected), [
    false, false, false, false, false, false, false, false, false, false, true, true,
  ]);
  assert.ok(monthlySeriesFor([], 2025, '2026-10-28').every(month => month.projected === false));
  assert.ok(monthlySeriesFor([], 2027, '2026-10-28').every(month => month.projected === true));
});

test('contrato futuro assinado permanece pendente, mas aparece como compromisso projetado', () => {
  const future = contract({ start: '2026-11-01', end: '2027-01-31', monthly: 700 });
  assert.equal(contractStatus(future, '2026-10-28'), 'Pendente');
  const series = monthlySeriesFor([future], 2026, '2026-10-28');
  assert.equal(series[9].value, 0);
  assert.equal(series[10].value, 700);
  assert.equal(series[10].projected, true);
  assert.equal(series[11].value, 700);
});

test('variação sem base anterior é nula; aumentos e reduções têm sinais corretos', () => {
  assert.equal(monthlyVariation(0, 0), null);
  assert.equal(monthlyVariation(100, 0), null);
  assert.equal(monthlyVariation(120, 100), 20);
  assert.equal(monthlyVariation(80, 100), -20);
  assert.equal(monthlyVariation(100, 100), 0);
  assert.equal(monthlyVariation(0, 100), -100);
});

test('status respeita assinatura e início/fim inclusivos da vigência', () => {
  const input = contract({ start: '2026-10-28', end: '2026-11-02' });
  assert.equal(contractStatus(input, '2026-10-27'), 'Pendente');
  assert.equal(contractStatus(input, '2026-10-28'), 'Ativo');
  assert.equal(contractStatus(input, '2026-11-02'), 'Ativo');
  assert.equal(contractStatus(input, '2026-11-03'), 'Expirado');
  assert.equal(contractStatus({ ...input, signature: 'Pendente' }, '2026-10-28'), 'Pendente');
  assert.equal(contractStatus({ ...input, signature: 'Em revisão' }, '2026-10-28'), 'Pendente');
  assert.equal(contractStatus({ ...input, start: '' }, '2026-10-28'), 'Pendente');
  assert.equal(contractStatus({ ...input, signature: 'Pendente' }, '2026-11-03'), 'Expirado');
});

test('dias até o vencimento não variam com horas locais e atravessam mês/ano', () => {
  assert.equal(daysUntil('2026-10-28', '2026-10-28'), 0);
  assert.equal(daysUntil('2026-10-29', '2026-10-28'), 1);
  assert.equal(daysUntil('2026-10-27', '2026-10-28'), -1);
  assert.equal(daysUntil('2027-01-02', '2026-12-31'), 2);
  assert.equal(daysUntil('2024-03-01', '2024-02-28'), 2);
});
