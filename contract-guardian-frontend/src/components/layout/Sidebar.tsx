import type { Session } from '../../types';
import { roleLabel } from '../../services/access-service';
import { Icon } from '../ui/Icon';

const entries=[['dashboard','grid','Visão geral'],['contracts','file','Contratos'],['calendar','calendar','Calendário'],['reports','chart','Relatórios']] as const;
interface SidebarProps { session:Session; route:string; contractCount:number; open:boolean; navigate:(route:string)=>void; onHelp:()=>void; onLogout:()=>void }
export function Sidebar({session,route,contractCount,open,navigate,onHelp,onLogout}:SidebarProps) {
  const master=session.role==='master';
  const navItem=(target:string,name:string,label:string,count?:number)=><button key={target} className={`nav-item ${route===target||(['edit','new-contract'].includes(route)&&target==='contracts')?'active':''}`} aria-current={route===target?'page':undefined} onClick={()=>navigate(target)}><Icon name={name}/><span>{label}</span>{count!==undefined&&<span className="nav-badge">{count}</span>}</button>;
  return <aside className={`sidebar ${open?'is-open':''}`} aria-label="Menu principal">
    <a className="brand" href="#dashboard" aria-label="Contract Guardian início"><span className="brand-mark"><Icon name="shield"/></span><span className="brand-name">guardian<span>CONTRACT MANAGEMENT</span></span></a>
    <div className="workspace-switch"><span className="workspace-icon"><Icon name="shield"/></span><div className="workspace-name">Sua empresa<small>Gestão de contratos</small></div></div>
    <div className="sidebar-content" role="region" aria-label="Navegação e atalhos" tabIndex={0}>
      <nav>
        <p className="nav-label">WORKSPACE</p>
        {entries.map(([target,name,label])=>navItem(target,name,label,target==='contracts'?contractCount:undefined))}
        <div className="nav-separator"/>
        <p className="nav-label">PREFERÊNCIAS</p>
        {navItem('settings','settings','Configurações')}
        {master&&navItem('users','shield','Acessos e permissões')}
        <button className="nav-item" onClick={onHelp}><Icon name="help"/><span>Central de ajuda</span><Icon name="arrowUpRight" size={13} className="ml-auto"/></button>
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-promo"><Icon name="shield"/><h3>Clareza em cada decisão.</h3><p>{master?'Organize contratos e acompanhe os acessos da sua equipe.':'Consulte sua carteira e acompanhe os próximos vencimentos.'}</p><button onClick={()=>navigate(master?'users':'contracts')}>{master?'Gerenciar acessos':'Consultar contratos'}<Icon name="arrowUpRight"/></button></div></div>
    </div>
    <div className="profile"><span className="avatar">{master?'M':'R'}</span><div className="profile-name">{session.name}<small>{roleLabel(session.role)}</small></div><button className="icon-btn" onClick={onLogout} aria-label="Sair da prévia" title="Sair"><Icon name="arrow"/></button></div>
  </aside>;
}
