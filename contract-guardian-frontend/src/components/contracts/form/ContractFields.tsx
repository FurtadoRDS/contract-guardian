import { Icon } from '../../ui/Icon';
import { FormField } from './FormField';
import { categories, type ContractDraft } from './form-model';

interface ContractFieldsProps { draft: ContractDraft; onChange: (draft: ContractDraft) => void; extracted: boolean; needsReview: boolean; onSignatureReviewed: () => void }
export function ContractFields({ draft, onChange, extracted, needsReview, onSignatureReviewed }: ContractFieldsProps) {
  function update(key: 'category' | 'scope' | 'start' | 'end' | 'monthly' | 'total' | 'signature' | 'renewal', value: string) { onChange({ ...draft, [key]: value }); }
  return <section className="cf-section"><div className="cf-section-header"><span className="cf-step">03</span><div className="min-w-0"><h2>Dados do contrato</h2><p>Os detalhes que merecem a sua atenção.</p></div><Icon name="file" size={20} /></div><div className="cf-fields">
    <FormField label="Categoria do contrato" name="category" options={categories} wide value={draft.category} onChange={value => update('category', value)} extracted={extracted} />
    <FormField label="Objetivo / escopo" name="scope" placeholder="Descreva o serviço e as principais entregas deste contrato." textarea wide maxLength={2000} value={draft.scope} onChange={value => update('scope', value)} extracted={extracted} />
    <FormField label="Início da vigência" name="start" type="date" value={draft.start} onChange={value => update('start', value)} extracted={extracted} />
    <FormField label="Fim da vigência" name="end" type="date" value={draft.end} onChange={value => update('end', value)} extracted={extracted} />
    <FormField label="Valor mensal (R$)" name="monthly" type="number" placeholder="0,00" min="0.01" step="0.01" inputMode="decimal" value={draft.monthly} onChange={value => update('monthly', value)} extracted={extracted} />
    <FormField label="Valor total (R$)" name="total" type="number" placeholder="0,00" min="0.01" step="0.01" inputMode="decimal" value={draft.total} onChange={value => update('total', value)} extracted={extracted} />
    <FormField label="Status da assinatura" name="signature" options={['Assinado', 'Pendente', 'Em revisão']} emptyOption="Selecione o status da assinatura" wide manual hint="Você confirma este campo. A análise nunca seleciona o status automaticamente." needsReview={needsReview} value={draft.signature} onChange={value => { update('signature', value); onSignatureReviewed(); }} />
    <FormField label="Cláusula de renovação" name="renewal" placeholder="Descreva as condições de renovação previstas no documento." textarea wide maxLength={1500} value={draft.renewal} onChange={value => update('renewal', value)} extracted={extracted} />
  </div></section>;
}
