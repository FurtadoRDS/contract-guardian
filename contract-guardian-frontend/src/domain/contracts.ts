import type { ContractMonthlyFields, ContractStatus, ContractTiming, MonthlyPoint } from '../types';

/** Contract helpers. The application contains no seeded records. */
export const TODAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

export function currency(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}

export function shortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(date).replaceAll(' de ', ' ').replace('.', '');
}

export function contractStatus(contract: ContractTiming, referenceDate = TODAY): ContractStatus {
  if (contract.end && contract.end < referenceDate) return 'Expirado';
  if (contract.signature !== 'Assinado' || !contract.start || contract.start > referenceDate) return 'Pendente';
  return 'Ativo';
}

export function daysUntil(date: string | null | undefined, referenceDate = TODAY): number {
  if (!date) return 0;
  return Math.ceil((Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${referenceDate}T00:00:00Z`)) / 86_400_000);
}

/** Kept for text exports; React itself escapes rendered text. */
export function escapeHTML(value: unknown): string {
  const replacements: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };
  return String(value ?? '').replace(/[&<>"']/g, character => replacements[character] ?? character);
}

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** Any overlap counts the full monthly commitment, without daily proration.
 * Future months are commitments, not payments. Unsigned records are excluded. */
export function monthlySeriesFor(
  contracts: readonly ContractMonthlyFields[], year: number | string, referenceDate = TODAY,
): MonthlyPoint[] {
  function amount(index: number, selectedYear: number): number {
    const start = `${selectedYear}-${String(index + 1).padStart(2, '0')}-01`;
    const end = `${selectedYear}-${String(index + 1).padStart(2, '0')}-${new Date(Date.UTC(selectedYear, index + 1, 0)).getUTCDate()}`;
    return contracts.filter(contract => contract.signature === 'Assinado' && contract.start <= end && contract.end >= start)
      .reduce((sum, contract) => sum + Number(contract.monthly || 0), 0);
  }
  return monthNames.map((label, index) => ({
    month: label.slice(0, 3),
    label,
    value: amount(index, Number(year)),
    comparison: amount(index, Number(year) - 1),
    projected: `${year}-${String(index + 1).padStart(2, '0')}` > referenceDate.slice(0, 7),
  }));
}

export function monthlyVariation(current: number, previous: number): number | null {
  return previous > 0 ? (current - previous) / previous * 100 : null;
}
