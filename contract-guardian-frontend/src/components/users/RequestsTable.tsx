import { Icon } from '../ui/Icon';
import type { AccessRequest } from '../../types';
import { dateTime } from './accessView';
import { Identity, RequestStatus } from './shared';

export function RequestsTable({ rows, onReview }: { rows: AccessRequest[]; onReview: (id: string) => void }) {
  return <div className="ug-table-scroll"><table className="ug-table"><thead><tr><th scope="col">Solicitante</th><th scope="col">Departamento</th><th scope="col">Solicitado em</th><th scope="col">Status</th><th scope="col">Decisão</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead><tbody>{rows.map(request => <tr key={request.id}>
    <td><Identity person={request} /></td><td>{request.department || 'Não informado'}</td><td className="ug-date">{dateTime(request.createdAt)}</td><td><RequestStatus status={request.status} /></td><td>{request.status === 'pending' ? <span className="ug-muted">Aguardando revisão</span> : <div className="ug-decision"><strong>{request.reviewedBy?.name || 'Responsável não registrado'}</strong><span>{request.reviewedBy?.email || ''}</span><small>{dateTime(request.reviewedAt)}</small></div>}</td>
    <td className="ug-action-cell"><button type="button" className={`ug-row-button ${request.status === 'pending' ? 'ug-row-primary' : ''}`} onClick={() => onReview(request.id)} aria-label={`${request.status === 'pending' ? 'Revisar solicitação de' : 'Ver solicitação de'} ${request.name || request.email}`}>{request.status === 'pending' ? 'Revisar' : 'Ver detalhes'}<Icon className="ug-icon" name="arrow" size={12} /></button></td>
  </tr>)}</tbody></table></div>;
}
