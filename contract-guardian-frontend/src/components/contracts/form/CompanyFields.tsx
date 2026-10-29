import { Icon } from '../../ui/Icon';
import { FormField } from './FormField';
import { categories, formatCnpj, type ContractDraft } from './form-model';

interface CompanyFieldsProps { draft: ContractDraft; onChange: (draft: ContractDraft) => void; extracted: boolean }
export function CompanyFields({ draft, onChange, extracted }: CompanyFieldsProps) {
  function contractor(key: keyof ContractDraft['contractor'], value: string) { onChange({ ...draft, contractor: { ...draft.contractor, [key]: value } }); }
  function provider(key: keyof ContractDraft['provider'], value: string) { onChange({ ...draft, provider: { ...draft.provider, [key]: value } }); }
  return <>
    <section className="cf-section"><div className="cf-section-header"><span className="cf-step">01</span><div className="min-w-0"><h2>Empresa contratante</h2><p>Quem está contratando o serviço.</p></div><Icon name="building" size={20} /></div><div className="cf-fields">
      <FormField label="Razão social" name="contractor.name" placeholder="Razão social da empresa contratante" wide maxLength={140} value={draft.contractor.name} onChange={value => contractor('name', value)} extracted={extracted} />
      <FormField label="CNPJ" name="contractor.cnpj" placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18} value={draft.contractor.cnpj} onChange={value => contractor('cnpj', formatCnpj(value))} extracted={extracted} />
      <FormField label="Tipo de unidade" name="contractor.type" options={['Matriz', 'Filial']} emptyOption="Selecione o tipo" value={draft.contractor.type} onChange={value => contractor('type', value)} extracted={extracted} />
      <FormField label="Cidade sede" name="contractor.city" placeholder="Cidade e estado da sede" wide maxLength={100} value={draft.contractor.city} onChange={value => contractor('city', value)} extracted={extracted} />
    </div></section>
    <section className="cf-section"><div className="cf-section-header"><span className="cf-step">02</span><div className="min-w-0"><h2>Empresa contratada</h2><p>Com quem sua empresa está fazendo negócio.</p></div><Icon name="building" size={20} /></div><div className="cf-fields">
      <FormField label="Razão social" name="provider.name" placeholder="Razão social da empresa contratada" wide maxLength={140} value={draft.provider.name} onChange={value => provider('name', value)} extracted={extracted} />
      <FormField label="CNPJ" name="provider.cnpj" placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18} value={draft.provider.cnpj} onChange={value => provider('cnpj', formatCnpj(value))} extracted={extracted} />
      <FormField label="Categoria da empresa" name="provider.category" options={categories} value={draft.provider.category} onChange={value => provider('category', value)} extracted={extracted} />
      <FormField label="E-mail" name="provider.email" type="email" placeholder="E-mail de contato da contratada" maxLength={180} value={draft.provider.email} onChange={value => provider('email', value)} extracted={extracted} />
      <FormField label="Telefone" name="provider.phone" type="tel" placeholder="Telefone com DDD" maxLength={20} value={draft.provider.phone} onChange={value => provider('phone', value)} extracted={extracted} />
    </div></section>
  </>;
}
