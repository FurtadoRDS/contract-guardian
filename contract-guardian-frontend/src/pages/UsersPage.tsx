import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../components/ui/Icon';
import { AccessSummary } from '../components/users/AccessSummary';
import { RequestsTable } from '../components/users/RequestsTable';
import { UsersTable } from '../components/users/UsersTable';
import { AuditTable } from '../components/users/AuditTable';
import { ReviewDialog } from '../components/users/ReviewDialog';
import { RoleDialog } from '../components/users/RoleDialog';
import { AccessEmptyState } from '../components/users/shared';
import { exportAuditCSV, filterAudit, filterRequests, filterUsers, type AccessFilters, type AccessTab } from '../components/users/accessView';
import { useAccess } from '../hooks/useAccess';
import { roleLabel } from '../services/access-service';
import type { Notify } from '../types';

interface UsersPageProps { onToast: Notify; onSessionChange?: () => void }
type SelectedDialog = { kind: 'request' | 'role'; id: string } | null;
const tabs: { key: AccessTab; label: string }[] = [{ key: 'requests', label: 'Solicitações' }, { key: 'users', label: 'Usuários' }, { key: 'audit', label: 'Histórico de ações' }];
const filterOptions: Record<AccessTab, [string, string][]> = {
  requests: [['all', 'Todos os status'], ['pending', 'Pendentes'], ['approved', 'Aprovadas'], ['rejected', 'Recusadas']],
  users: [['all', 'Todos os perfis'], ['reader', 'Leitores'], ['master', 'Masters']],
  audit: [['all', 'Todas as ações'], ['access.approved', 'Acessos aprovados'], ['access.rejected', 'Acessos recusados'], ['role.changed', 'Permissões alteradas']],
};

export function UsersPage({ onToast, onSessionChange }: UsersPageProps) {
  const { session, snapshot } = useAccess();
  const [tab, setTab] = useState<AccessTab>('requests');
  const [filters, setFilters] = useState<AccessFilters>({ requests: { search: '', value: 'all' }, users: { search: '', value: 'all' }, audit: { search: '', value: 'all' } });
  const [selectedDialog, setSelectedDialog] = useState<SelectedDialog>(null);
  const tabRefs = useRef<Partial<Record<AccessTab, HTMLButtonElement | null>>>({});
  const previousSession = useRef(`${session?.id}:${session?.role}`);
  useEffect(() => {
    const next = `${session?.id}:${session?.role}`;
    if (next !== previousSession.current) { previousSession.current = next; onSessionChange?.(); }
    if (session?.role !== 'master') setSelectedDialog(null);
  }, [session?.id, session?.role, onSessionChange]);
  const visibleRequests = useMemo(() => filterRequests(snapshot.requests, filters.requests), [snapshot.requests, filters.requests]);
  const visibleUsers = useMemo(() => filterUsers(snapshot.users, filters.users), [snapshot.users, filters.users]);
  const visibleAudit = useMemo(() => filterAudit(snapshot.audit, filters.audit), [snapshot.audit, filters.audit]);
  const counts = { requests: snapshot.requests.filter(request => request.status === 'pending').length, users: snapshot.users.length, audit: snapshot.audit.length };
  const total = snapshot[tab].length;
  const visibleCount = tab === 'requests' ? visibleRequests.length : tab === 'users' ? visibleUsers.length : visibleAudit.length;
  const request = selectedDialog?.kind === 'request' ? snapshot.requests.find(record => record.id === selectedDialog.id) || null : null;
  const user = selectedDialog?.kind === 'role' ? snapshot.users.find(record => record.id === selectedDialog.id) || null : null;
  const clearFilters = () => setFilters(previous => ({ ...previous, [tab]: { search: '', value: 'all' } }));
  const changeFilter = (key: 'search' | 'value', value: string) => setFilters(previous => ({ ...previous, [tab]: { ...previous[tab], [key]: value } }));
  function tabKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = tabs.findIndex(item => item.key === tab);
    const next = event.key === 'Home' ? tabs[0].key : event.key === 'End' ? tabs[tabs.length - 1].key : tabs[(current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length].key;
    setTab(next);
    tabRefs.current[next]?.focus();
  }
  function exportHistory() {
    if (session?.role !== 'master') return;
    if (!visibleAudit.length) { onToast('Nenhuma ação para exportar com estes filtros.', 'info'); return; }
    exportAuditCSV(visibleAudit);
    onToast(`${visibleAudit.length} ${visibleAudit.length === 1 ? 'ação exportada' : 'ações exportadas'} do histórico desta sessão.`, 'success');
  }
  if (session?.role !== 'master') return <section className="ug-page ug-denied"><div className="ug-empty-symbol"><Icon className="ug-icon" name="lock" size={27} /></div><span className="ug-eyebrow">ÁREA DE ADMINISTRAÇÃO</span><h1>Acesso reservado a masters</h1><p>Seu perfil de leitor permite consultar os contratos e o dashboard. Aprovações e alterações de permissões ficam com os responsáveis pela administração.</p><a className="btn btn-secondary" href="#dashboard"><Icon className="ug-icon" name="arrow" size={15}  />Voltar à visão geral</a></section>;

  return <div className="ug-page">
    <header className="ug-heading"><div><span className="ug-eyebrow">GESTÃO DO WORKSPACE</span><h1>Acessos e permissões</h1><p>As pessoas certas, com o acesso certo. Cada decisão registrada.</p></div><span className="ug-admin-label"><Icon className="ug-icon" name="shield" size={14} />Administração</span></header>
    <div className="ug-preview-banner"><Icon className="ug-icon" name="info" size={17} /><p ><strong>Prévia de interface</strong><span>Alterações de acesso apenas nesta sessão. Autorização real será validada pelo backend.</span></p><span className="ug-session-tag">Sessão local</span></div>
    <AccessSummary requests={snapshot.requests} users={snapshot.users} />
    <section className="ug-management"><div className="ug-panel-top"><div className="ug-tabs" role="tablist" aria-label="Administração de acessos" onKeyDown={tabKeyboard}>{tabs.map(item => <button key={item.key} ref={node => { tabRefs.current[item.key] = node; }} type="button" className={`ug-tab ${tab === item.key ? 'active' : ''}`} role="tab" id={`ug-tab-${item.key}`} aria-selected={tab === item.key} aria-controls="ug-tabpanel" tabIndex={tab === item.key ? 0 : -1} onClick={() => setTab(item.key)}>{item.label}<span>{counts[item.key]}</span></button>)}</div><button type="button" className="ug-export btn btn-secondary" onClick={exportHistory} disabled={!snapshot.audit.length} aria-label="Exportar histórico de ações"><Icon className="ug-icon" name="download" size={13} /><span>Exportar histórico</span></button></div>
      <div className="ug-filters"><label className="ug-search"><Icon className="ug-icon" name="search" size={15} /><input type="search" value={filters[tab].search} onChange={event => changeFilter('search', event.target.value)} placeholder={tab === 'audit' ? 'Buscar pessoa, ação ou responsável...' : 'Buscar por nome ou e-mail...'} aria-label={tab === 'audit' ? 'Buscar no histórico de ações' : 'Buscar pessoas'} /></label><label className="ug-filter-label" htmlFor="ug-filter">{tab === 'requests' ? 'Status' : tab === 'users' ? 'Perfil' : 'Ação'}</label><select id="ug-filter" className="ug-filter" value={filters[tab].value} onChange={event => changeFilter('value', event.target.value)} aria-label={tab === 'requests' ? 'Filtrar por status' : tab === 'users' ? 'Filtrar por perfil' : 'Filtrar por ação'}>{filterOptions[tab].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className="ug-results" id="ug-tabpanel" role="tabpanel" aria-labelledby={`ug-tab-${tab}`} tabIndex={0}>
        {!visibleCount ? <AccessEmptyState tab={tab} filtered={Boolean(total)} onClear={clearFilters} /> : <>{tab === 'requests' ? <RequestsTable rows={visibleRequests} onReview={id => setSelectedDialog({ kind: 'request', id })} /> : tab === 'users' ? <UsersTable rows={visibleUsers} onChangeRole={id => setSelectedDialog({ kind: 'role', id })} /> : <AuditTable rows={visibleAudit} />}<div className="ug-table-footer"><span>{visibleCount} {tab === 'requests' ? visibleCount === 1 ? 'solicitação' : 'solicitações' : tab === 'users' ? visibleCount === 1 ? 'usuário' : 'usuários' : visibleCount === 1 ? 'ação registrada' : 'ações registradas'}{visibleCount < total ? ` de ${total}` : ''}</span><span ><Icon className="ug-icon" name="clock" size={12} />Dados desta sessão</span></div></>}
      </div>
    </section>
    <div className="ug-permission-guide"><div className="ug-guide-label"><Icon className="ug-icon" name="lock" size={16} />Permissões em um olhar</div><article ><span className="ug-guide-icon"><Icon className="ug-icon" name="eye" size={16} /></span><div><h2>{roleLabel('reader')} <span>Acesso inicial</span></h2><p>Consulta o dashboard e os contratos. Toda solicitação aprovada começa com esse perfil.</p></div></article><article ><span className="ug-guide-icon ug-guide-master"><Icon className="ug-icon" name="shield" size={16} /></span><div><h2>{roleLabel('master')} <span>Administração</span></h2><p>Gerencia contratos, aprova ou recusa acessos e define as permissões dos usuários.</p></div></article></div>
    <p className="ug-audit-note"><Icon className="ug-icon" name="history" size={13} />Histórico desta sessão. A integração com o backend deverá preservar o registro imutável das ações e validar o responsável por cada decisão.</p>
    <ReviewDialog request={request} onClose={() => setSelectedDialog(null)} onToast={onToast} /><RoleDialog user={user} onClose={() => setSelectedDialog(null)} onToast={onToast} />
  </div>;
}
