import { currency, shortDate } from '../../../domain/contracts';
import { Icon } from '../../ui/Icon';
import type { ContractDraft } from './form-model';

export function ContractSummary({ draft }: { draft: ContractDraft }) {
  return <><section className="cf-summary-card"><div className="cf-summary-title"><span>Resumo do contrato</span><Icon name="file" size={17} /></div><h3 className="cf-summary-company">{draft.provider.name.trim() || 'Seu próximo contrato'}</h3><span className="cf-summary-category">{draft.category || 'Aguardando preenchimento'}</span><div className="cf-summary-amount"><span>Compromisso mensal</span><strong>{currency(Number(draft.monthly) || 0)}</strong></div><div className="cf-summary-details"><div><span>Valor total</span><strong className="cf-summary-total">{currency(Number(draft.total) || 0)}</strong></div><div><span>Vigência</span><strong className="cf-summary-period">{draft.start && draft.end ? `${shortDate(draft.start)} → ${shortDate(draft.end)}` : 'A definir'}</strong></div></div><div className={`cf-summary-signature ${draft.signature ? 'confirmed' : ''}`}><Icon name="pen" size={15} /><span>Status da assinatura <strong>{draft.signature || 'aguarda sua confirmação'}</strong></span></div></section>
    <div className="cf-help-tip"><span><Icon name="shield" size={20} /></span><div><strong>Uma boa revisão faz a diferença</strong><p>Confira valores, datas e renovação antes de salvar. Pequenos detalhes evitam grandes surpresas.</p></div></div>
  </>;
}
