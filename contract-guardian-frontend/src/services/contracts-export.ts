import type { Contract } from '../types';
import { TODAY, contractStatus } from '../domain/contracts';
import { downloadCsv } from '../lib/csv';

export function exportContractsCSV(contracts: Contract[]): void {
  downloadCsv({
    filename: `guardian-contratos-${TODAY}.csv`,
    headers: ['ID', 'Empresa contratante', 'CNPJ contratante', 'Tipo', 'Cidade sede', 'Empresa contratada', 'CNPJ contratada', 'Categoria da empresa', 'E-mail', 'Telefone', 'Categoria do contrato', 'Objetivo / Escopo', 'Início da vigência', 'Fim da vigência', 'Valor mensal (R$)', 'Valor total (R$)', 'Status da assinatura', 'Status da vigência', 'Cláusula de renovação'],
    rows: contracts.map(contract => [contract.id, contract.contractor.name, contract.contractor.cnpj, contract.contractor.type, contract.contractor.city, contract.provider.name, contract.provider.cnpj, contract.provider.category, contract.provider.email, contract.provider.phone, contract.category, contract.scope, contract.start, contract.end, contract.monthly.toFixed(2).replace('.', ','), contract.total.toFixed(2).replace('.', ','), contract.signature, contractStatus(contract), contract.renewal]),
  });
}
