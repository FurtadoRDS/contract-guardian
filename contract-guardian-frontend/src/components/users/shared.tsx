import { Icon } from '../ui/Icon';
import { roleLabel } from '../../services/access-service';
import type { AccessRequest, Role } from '../../types';
import { dateTime, requestLabels } from './accessView';

interface PersonIdentity { id?: string; name?: string; email?: string }
export function Identity({ person, showId = false, compact = false }: { person?: PersonIdentity | null; showId?: boolean; compact?: boolean }) {
  return <div className={`ug-identity ${compact ? 'ug-identity-compact' : ''}`}>
    <strong>{person?.name || 'Nome não informado'}</strong><span>{person?.email || 'E-mail não informado'}</span>{showId && <code>ID: {person?.id || 'Não registrado'}</code>}
  </div>;
}
export function RoleBadge({ role }: { role: Role }) {
  return <span className={`ug-role ug-role-${role} `}><Icon className="ug-icon" name={role === 'master' ? 'shield' : 'eye'} size={12} />{roleLabel(role)}</span>;
}
export function RequestStatus({ status }: { status: AccessRequest['status'] }) {
  return <span className={`ug-status ug-status-${status} `}><i />{requestLabels[status]}</span>;
}
export function ActorBlock({ label, actor, timestamp }: { label: string; actor?: PersonIdentity | null; timestamp?: string | null }) {
  return <section className="ug-review-actor"><span >{label}</span><Identity person={actor} showId />{timestamp && <time dateTime={timestamp}>{dateTime(timestamp)}</time>}</section>;
}
export function AccessEmptyState({ tab, filtered, onClear }: { tab: 'requests' | 'users' | 'audit'; filtered: boolean; onClear: () => void }) {
  const copy = tab === 'requests' ? { icon: 'inbox', title: 'Nenhuma solicitação por aqui', description: 'As solicitações enviadas pelo formulário de acesso da empresa aparecerão aqui. Ao aprovar, o novo usuário recebe o perfil de leitor.' } : tab === 'users' ? { icon: 'people', title: 'Sua lista de usuários começa aqui', description: 'Os usuários aparecerão após a aprovação de uma solicitação. Todo novo acesso começa como leitor e pode ser promovido por um master.' } : { icon: 'history', title: 'Cada decisão deixa um registro', description: 'Aprovações, recusas e mudanças de permissão aparecerão aqui com a identificação do master responsável e a data da ação.' };
  return <div className="ug-empty">
    <div className="ug-empty-art"><span /><span /><div><Icon className="ug-icon" name={filtered ? 'search' : copy.icon} size={25} /></div></div>
    <h2>{filtered ? 'Nenhum resultado encontrado' : copy.title}</h2><p>{filtered ? 'Experimente outro nome, e-mail ou ajuste o filtro para continuar.' : copy.description}</p>
    {filtered ? <button type="button" className="btn btn-secondary" onClick={onClear}>Limpar filtros</button> : <div className="ug-empty-caption"><Icon className="ug-icon" name="shield" size={12} />{tab === 'audit' ? 'O histórico identifica quem decidiu e quando.' : 'Acesso controlado, desde o primeiro dia.'}</div>}
  </div>;
}
