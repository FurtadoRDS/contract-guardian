import { Icon } from '../ui/Icon';
import type { AccessUser } from '../../types';
import { dateTime } from './accessView';
import { Identity, RoleBadge } from './shared';

export function UsersTable({ rows, onChangeRole }: { rows: AccessUser[]; onChangeRole: (id: string) => void }) {
  return <div className="ug-table-scroll"><table className="ug-table"><thead><tr><th scope="col">Usuário</th><th scope="col">Departamento</th><th scope="col">Permissão</th><th scope="col">Aprovado por</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead><tbody>{rows.map(user => <tr key={user.id}>
    <td><Identity person={user} /></td><td>{user.department || 'Não informado'}</td><td><RoleBadge role={user.role} /></td><td><div className="ug-decision"><strong>{user.approvedBy?.name || 'Responsável não registrado'}</strong><span>{user.approvedBy?.email || ''}</span><small>{dateTime(user.approvedAt)}</small></div></td><td className="ug-action-cell"><button type="button" className="ug-row-button" onClick={() => onChangeRole(user.id)} aria-label={`Alterar permissão de ${user.name || user.email}`}><Icon className="ug-icon" name="adjust" size={12} />Alterar permissão</button></td>
  </tr>)}</tbody></table></div>;
}
