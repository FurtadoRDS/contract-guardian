import type { Contract } from '../types';
import { TODAY, contractStatus, shortDate } from '../domain/contracts';
import { PageHeading } from '../components/ui/PageHeading';
import { Icon } from '../components/ui/Icon';
import { Footer } from '../components/layout/Footer';
import { ContractIdentity, StatusBadge } from '../components/contracts/ContractIdentity';

interface CalendarPageProps { contracts: Contract[]; canManage: boolean; onCreate: () => void; onSelect: (contract: Contract) => void; date: Date; onDateChange: (date: Date) => void }
const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
function localIso(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function CalendarPage({ contracts, canManage, onCreate, onSelect, date, onDateChange }: CalendarPageProps) {
  const year = date.getFullYear(), month = date.getMonth();
  const gridStart = new Date(year, month, 1 - new Date(year, month, 1).getDay());
  const monthContracts = contracts.filter(contract => contract.end.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).sort((a, b) => a.end.localeCompare(b.end));
  const title = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  function today() { const current = new Date(`${TODAY}T12:00:00`); onDateChange(new Date(current.getFullYear(), current.getMonth(), 1)); }
  return <>
    <PageHeading title="Calendário" subtitle="Antecipe vencimentos. Abra espaço para boas decisões." canManage={canManage} onCreate={onCreate} />
    <div className="calendar-toolbar"><div className="calendar-month"><h2>{title}</h2><button type="button" className="icon-btn" onClick={() => onDateChange(new Date(year, month - 1, 1))} aria-label="Mês anterior"><Icon name="chevron" className="rotate-180" /></button><button type="button" className="icon-btn" onClick={() => onDateChange(new Date(year, month + 1, 1))} aria-label="Próximo mês"><Icon name="chevron" /></button></div><button type="button" className="btn btn-secondary" onClick={today}>Hoje</button></div>
    <section className="panel calendar-panel" aria-label="Calendário de vencimentos"><div className="calendar-grid">
      {weekdays.map(day => <div className="calendar-day-label" key={day}>{day}</div>)}
      {Array.from({ length: 42 }, (_, index) => {
        const day = new Date(gridStart); day.setDate(day.getDate() + index);
        const iso = localIso(day), events = contracts.filter(contract => contract.end === iso);
        return <div className={`calendar-day ${day.getMonth() !== month ? 'other-month' : ''} ${iso === TODAY ? 'today' : ''}`} key={iso}><span className="calendar-day-number" aria-current={iso === TODAY ? 'date' : undefined}>{day.getDate()}</span>{events.map(contract => <button type="button" className={`calendar-event ${contractStatus(contract) === 'Expirado' ? 'event-expired' : ''}`} key={contract.id} title={`${contract.company}: vence em ${shortDate(contract.end)}`} onClick={() => onSelect(contract)}>{contract.company}</button>)}</div>;
      })}
    </div></section>
    <p className="calendar-note"><Icon name="info" />Clique em um contrato para consultar os detalhes da vigência.</p>
    <section className="panel calendar-upcoming"><div className="panel-header pb-[18px]"><h2>Vencimentos de {date.toLocaleDateString('pt-BR', { month: 'long' })}</h2><span className="muted small">{monthContracts.length} {monthContracts.length === 1 ? 'contrato' : 'contratos'}</span></div>{monthContracts.length ? monthContracts.map(contract => <div className="upcoming-row" key={contract.id}><ContractIdentity contract={contract} onSelect={onSelect} /><span className="upcoming-date">{shortDate(contract.end)}</span><StatusBadge contract={contract} /><button type="button" className="icon-btn" onClick={() => onSelect(contract)} aria-label={`Abrir ${contract.company}`}><Icon name="chevron" /></button></div>) : <p className="muted small px-5 pb-5">Nenhum vencimento neste mês. Tudo sob controle.</p>}</section>
    <Footer />
  </>;
}
