import type { Contract } from '../../types';
import { daysUntil,shortDate } from '../../domain/contracts';
import { Icon } from '../ui/Icon';

export function AlertItems({contracts,onSelect}:{contracts:Contract[];onSelect:(contract:Contract)=>void}) {
  return <>{contracts.map(contract=><button key={contract.id} className="alert-item" onClick={()=>onSelect(contract)}><span className="alert-symbol"><Icon name="clock"/></span><div className="alert-text"><strong>{contract.company}</strong><p>Vence em <span className="text-[var(--orange)]">{daysUntil(contract.end)} dias</span> · {shortDate(contract.end)}</p></div><Icon name="chevron"/></button>)}</>;
}
interface NotificationsProps { contracts:Contract[]; enabled:boolean; days:number; onClose:()=>void; onSelect:(contract:Contract)=>void }
export function NotificationsPanel({contracts,enabled,days,onClose,onSelect}:NotificationsProps) {
  const list=enabled?contracts:[];
  return <><button className="fixed inset-0 z-50 cursor-default" aria-label="Fechar notificações" onClick={onClose}/><section className="notification-panel" aria-label="Notificações de vencimento"><h3>Notificações<small>{list.length} {list.length===1?'aviso':'avisos'}</small></h3>{list.length?<div className="alert-list"><AlertItems contracts={list} onSelect={contract=>{onClose();onSelect(contract);}}/></div>:<p className="notification-empty">{enabled?'Tudo em dia! Nenhum vencimento próximo.':'As notificações estão desativadas. Você pode ativá-las em Configurações.'}</p>}<p>Vencimentos nos próximos {days} dias</p></section></>;
}
