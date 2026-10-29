import { Icon } from '../ui/Icon';
import type { AccessRequest, AccessUser } from '../../types';

export function AccessSummary({ requests, users }: { requests: AccessRequest[]; users: AccessUser[] }) {
  const active = users.filter(user => user.status === 'active');
  const stats = [
    { title: 'Solicitações pendentes', value: requests.filter(request => request.status === 'pending').length, description: 'Aguardando uma decisão do master', icon: 'inbox', highlight: true },
    { title: 'Usuários ativos', value: active.length, description: 'Acessos aprovados nesta sessão', icon: 'people', highlight: false },
    { title: 'Masters', value: active.filter(user => user.role === 'master').length, description: 'Usuários com permissão de administração', icon: 'shield', highlight: false },
  ];
  return <div className="ug-stats">{stats.map(stat => <article key={stat.title} className={`ug-stat ${stat.highlight ? 'ug-stat-highlight' : ''}`}>
    <div ><span>{stat.title}</span><span className="ug-stat-icon"><Icon className="ug-icon" name={stat.icon} size={16} /></span></div><strong >{stat.value}</strong><p >{stat.description}</p>
  </article>)}</div>;
}
