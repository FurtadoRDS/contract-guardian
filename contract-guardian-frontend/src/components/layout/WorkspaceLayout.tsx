import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Contract,Session } from '../../types';
import type { Preferences } from '../../hooks/usePreferences';
import { roleLabel } from '../../services/access-service';
import { Sidebar } from './Sidebar';
import { NotificationsPanel } from './NotificationsPanel';
import { Icon } from '../ui/Icon';

export const routeNames:Record<string,string>={dashboard:'Visão geral',contracts:'Contratos',calendar:'Calendário',reports:'Relatórios',settings:'Configurações',users:'Acessos e permissões','new-contract':'Novo contrato',edit:'Editar contrato'};
interface WorkspaceLayoutProps { session:Session;route:string;contracts:Contract[];upcoming:Contract[];preferences:Preferences;navigate:(route:string)=>void;onLogout:()=>void;onHelp:()=>void;onTheme:()=>void;onSearch:(value:string)=>void;onSelect:(contract:Contract)=>void;children:ReactNode }
export function WorkspaceLayout({session,route,contracts,upcoming,preferences,navigate,onLogout,onHelp,onTheme,onSearch,onSelect,children}:WorkspaceLayoutProps) {
  const [menuOpen,setMenuOpen]=useState(false),[notificationsOpen,setNotificationsOpen]=useState(false),[search,setSearch]=useState('');
  const searchRef=useRef<HTMLInputElement>(null),mainRef=useRef<HTMLElement>(null);
  useEffect(()=>{setMenuOpen(false);setNotificationsOpen(false);window.scrollTo({top:0,behavior:'instant'});},[route]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){setMenuOpen(false);setNotificationsOpen(false);}
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(window.innerWidth<=1000){onSearch(search);}else searchRef.current?.focus();}
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[onSearch,search]);
  return <><a href="#main" className="skip-link" onClick={e=>{e.preventDefault();mainRef.current?.focus();}}>Ir para o conteúdo</a><div className={`mobile-overlay ${menuOpen?'is-open':''}`} onClick={()=>setMenuOpen(false)} aria-hidden="true"/><Sidebar session={session} route={route} contractCount={contracts.length} open={menuOpen} navigate={navigate} onHelp={onHelp} onLogout={onLogout}/><div className="app-main"><div className="workspace-preview-bar"><span><Icon name="info"/>Prévia de interface · {roleLabel(session.role)} · backend não conectado</span><button onClick={onLogout}>Trocar perfil <Icon name="arrowUpRight"/></button></div><header className="topbar"><button className="icon-btn mobile-menu" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)}><Icon name="menu"/></button><div className="breadcrumbs"><Icon name="home"/><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{routeNames[route]||'Visão geral'}</strong></div><div className="topbar-tools"><label className="global-search"><Icon name="search"/><input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){onSearch(search);e.currentTarget.blur();}}} type="search" placeholder="Buscar contratos..." aria-label="Buscar contratos e pressionar Enter"/><kbd className="shortcut">Ctrl K</kbd></label><span className="tool-separator"/><button className="icon-btn" onClick={onTheme} aria-label="Alternar tema" title="Alternar tema"><Icon name={preferences.theme==='dark'?'sun':'moon'}/></button><button className="icon-btn notification-trigger" onClick={()=>setNotificationsOpen(!notificationsOpen)} aria-label="Abrir notificações" aria-expanded={notificationsOpen}><Icon name="bell"/></button><span className="tool-separator"/><button className="avatar" onClick={()=>navigate('settings')} aria-label="Perfil da sessão">{session.role==='master'?'M':'R'}</button></div></header><main className="main-content" id="main" tabIndex={-1} ref={mainRef}>{children}</main></div>{notificationsOpen&&<NotificationsPanel contracts={upcoming} enabled={preferences.alerts} days={preferences.alertDays} onClose={()=>setNotificationsOpen(false)} onSelect={onSelect}/>}</>;
}
