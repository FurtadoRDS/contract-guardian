import { roleLabel } from '../../services/access-service';
import { downloadCsv } from '../../lib/csv';
import type { AccessRequest, AccessUser, AuditEvent } from '../../types';

export type AccessTab = 'requests' | 'users' | 'audit';
export interface AccessFilter { search: string; value: string }
export type AccessFilters = Record<AccessTab, AccessFilter>;
export const requestLabels: Record<AccessRequest['status'], string> = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Recusada' };
export const actionLabels: Record<AuditEvent['action'], string> = { 'access.approved': 'Acesso aprovado', 'access.rejected': 'Acesso recusado', 'role.changed': 'Permissão alterada' };
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const contains = (values: unknown[], search: string) => values.some(value => normalize(value).includes(normalize(search.trim())));
export const newestFirst = <T extends { createdAt?: string; approvedAt?: string }>(a: T, b: T) => (b.createdAt || b.approvedAt || '').localeCompare(a.createdAt || a.approvedAt || '');

export function dateTime(value?: string | null): string {
  if (!value) return 'Não registrado';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Não registrado' : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(parsed);
}
export function filterRequests(rows: AccessRequest[], filter: AccessFilter): AccessRequest[] {
  return rows.filter(row => (filter.value === 'all' || row.status === filter.value) && contains([row.id, row.name, row.email, row.department, row.reason], filter.search)).sort(newestFirst);
}
export function filterUsers(rows: AccessUser[], filter: AccessFilter): AccessUser[] {
  return rows.filter(row => (filter.value === 'all' || row.role === filter.value) && contains([row.id, row.name, row.email, row.department], filter.search)).sort(newestFirst);
}
export function filterAudit(rows: AuditEvent[], filter: AccessFilter): AuditEvent[] {
  return rows.filter(row => (filter.value === 'all' || row.action === filter.value) && contains([row.id, row.targetId, row.targetName, row.targetEmail, actionLabels[row.action], row.actor.id, row.actor.name, row.actor.email, row.details.reason, row.details.requestId, row.details.fromRole ? roleLabel(row.details.fromRole) : '', row.details.toRole ? roleLabel(row.details.toRole) : ''], filter.search)).sort(newestFirst);
}
export function exportAuditCSV(rows: AuditEvent[]): void {
  const headers = ['ID da ação', 'Ação', 'ID da pessoa', 'Nome da pessoa', 'E-mail da pessoa', 'ID do responsável', 'Nome do responsável', 'E-mail do responsável', 'Data e hora (ISO)', 'Perfil anterior', 'Novo perfil', 'Motivo', 'ID da solicitação'];
  downloadCsv({
    filename: `guardian-historico-acessos-${new Date().toISOString().slice(0, 10)}.csv`,
    headers,
    rows: rows.map(row => [row.id, actionLabels[row.action], row.targetId, row.targetName, row.targetEmail, row.actor.id, row.actor.name, row.actor.email, row.createdAt, row.details.fromRole ? roleLabel(row.details.fromRole) : '', row.details.toRole ? roleLabel(row.details.toRole) : '', row.details.reason, row.details.requestId]),
  });
}
