import type { CSSProperties } from 'react';
import type { Contract } from '../../types';
import { contractStatus } from '../../domain/contracts';

export function CompanyMark({contract,className=''}:{contract:Contract;className?:string}) {
  const color=/^#[0-9a-f]{6}$/i.test(contract.color)?contract.color:'#c1f66b';
  return <span className={`company-mark ${className}`} style={{'--company-color':color} as CSSProperties}>{contract.initials}</span>;
}
export function ContractIdentity({contract,onSelect}:{contract:Contract;onSelect:(contract:Contract)=>void}) {
  return <div className="company-cell"><CompanyMark contract={contract}/><div><button className="contract-link" onClick={()=>onSelect(contract)} aria-label={`Abrir contrato de ${contract.company}`}><strong>{contract.company}</strong></button><small>{contract.id}</small></div></div>;
}
export function StatusBadge({contract}:{contract:Contract}) {
  const status=contractStatus(contract);
  return <span className={`status-badge status-${status.toLocaleLowerCase('pt-BR')}`}>{status}</span>;
}
