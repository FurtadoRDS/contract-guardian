import { Icon } from '../ui/Icon';
import { roleLabel } from '../../services/access-service';
import type { AuditEvent } from '../../types';
import { actionLabels, dateTime } from './accessView';
import { Identity } from './shared';

export function AuditTable({ rows }: { rows: AuditEvent[] }) {
  return <div className="ug-table-scroll"><table className="ug-table ug-audit-table"><thead><tr><th scope="col">Ação</th><th scope="col">Pessoa</th><th scope="col">Master responsável</th><th scope="col">Data e hora</th><th scope="col">Detalhes</th></tr></thead><tbody>{rows.map(event => <tr key={event.id}>
    <td><span className={`ug-audit-action ug-action-${event.action === 'access.rejected' ? 'rejected' : event.action === 'role.changed' ? 'changed' : 'approved'}`}><Icon className="ug-icon" name={event.action === 'access.rejected' ? 'close' : event.action === 'role.changed' ? 'adjust' : 'check'} size={14} />{actionLabels[event.action]}</span><code className="ug-record-id">{event.id}</code></td>
    <td><Identity person={{ id: event.targetId, name: event.targetName, email: event.targetEmail }} showId /></td><td><Identity person={event.actor} showId compact /></td><td className="ug-date">{dateTime(event.createdAt)}</td>
    <td><div className="ug-audit-details">{event.action === 'role.changed' && <span className="ug-role-change">{roleLabel(event.details.fromRole)}<Icon className="ug-icon" name="arrow" size={12} /><strong>{roleLabel(event.details.toRole)}</strong></span>}{event.action === 'access.approved' && <span>Acesso inicial: <strong>{roleLabel(event.details.toRole || 'reader')}</strong></span>}{event.details.reason && <p>{event.details.reason}</p>}{event.details.requestId && <code>Solicitação: {event.details.requestId}</code>}</div></td>
  </tr>)}</tbody></table></div>;
}
