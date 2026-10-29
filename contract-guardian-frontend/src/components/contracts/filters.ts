import type { Contract,ContractStatus } from '../../types';
import { contractStatus } from '../../domain/contracts';

export interface ContractFilters { search:string; status:'Todos'|ContractStatus; category:string; sort:'default'|'date'|'value' }
export const emptyContractFilters:ContractFilters={search:'',status:'Todos',category:'Todas',sort:'default'};
export function filterContracts(contracts:Contract[],filters:ContractFilters):Contract[] {
  const query=filters.search.toLocaleLowerCase('pt-BR');
  const filtered=contracts.filter(contract=>(filters.status==='Todos'||contractStatus(contract)===filters.status)&&(filters.category==='Todas'||contract.category===filters.category)&&`${contract.company} ${contract.provider.name} ${contract.id} ${contract.category} ${contract.provider.cnpj}`.toLocaleLowerCase('pt-BR').includes(query));
  if(filters.sort==='date')filtered.sort((a,b)=>a.end.localeCompare(b.end));
  if(filters.sort==='value')filtered.sort((a,b)=>b.monthly-a.monthly);
  return filtered;
}
