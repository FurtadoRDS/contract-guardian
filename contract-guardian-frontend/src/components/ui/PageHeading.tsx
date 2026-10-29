import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface PageHeadingProps { title:string; subtitle:string; canManage:boolean; onCreate:()=>void; actions?:ReactNode; className?:string }
export function PageHeading({title,subtitle,canManage,onCreate,actions,className=''}:PageHeadingProps) {
  return <header className={`page-heading ${className}`}><div><h1>{title}</h1><p>{subtitle}</p></div><div className="page-heading-actions">{actions}{canManage&&<button className="btn btn-primary" onClick={onCreate}><Icon name="plus"/>Novo contrato</button>}</div></header>;
}
