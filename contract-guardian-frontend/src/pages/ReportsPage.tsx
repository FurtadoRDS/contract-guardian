import type { CSSProperties } from 'react';
import type { Contract } from '../types';
import { TODAY, contractStatus, currency, monthlySeriesFor, monthlyVariation } from '../domain/contracts';
import { CostChart, type ChartPeriod } from '../components/dashboard/CostChart';
import { PageHeading } from '../components/ui/PageHeading';
import { Icon } from '../components/ui/Icon';
import { Footer } from '../components/layout/Footer';

interface ReportsPageProps { contracts: Contract[]; canManage: boolean; onCreate: () => void; onExport: () => void; period: ChartPeriod; onPeriodChange: (period: ChartPeriod) => void }
const colors = ['#c1f66b', '#a8c982', '#8fa875', '#c9b789', '#9dacbd', '#b6a2c9'];
export function ReportsPage({ contracts, canManage, onCreate, onExport, period, onPeriodChange }: ReportsPageProps) {
  const year = Number(TODAY.slice(0, 4)), month = Number(TODAY.slice(5, 7)) - 1;
  const active = contracts.filter(contract => contractStatus(contract) === 'Ativo');
  const total = active.reduce((sum, contract) => sum + contract.monthly, 0);
  const previousDate = new Date(year, month - 1, 1);
  const previous = monthlySeriesFor(contracts, previousDate.getFullYear())[previousDate.getMonth()].value;
  const current = monthlySeriesFor(contracts, year)[month].value;
  const change = monthlyVariation(current, previous);
  const costs: Record<string, number> = {};
  for (const contract of active) costs[contract.category] = (costs[contract.category] || 0) + contract.monthly;
  const categories = Object.entries(costs).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categories.map(([, value]) => value));
  return <>
    <PageHeading title="Relatórios" subtitle="Transforme os números da sua carteira em boas decisões." canManage={canManage} onCreate={onCreate} actions={<button type="button" className="btn btn-secondary" onClick={onExport}><Icon name="download" />Exportar CSV</button>} />
    <div className="stats-grid"><article className="stat-card lime-stat"><div className="stat-head">Custo mensal ativo<span className="stat-icon"><Icon name="chart" /></span></div><div className="stat-number text-[25px]">{currency(total)}</div><div className="stat-foot">{active.length} contratos na carteira ativa</div></article><article className="stat-card"><div className="stat-head">Projeção anualizada<span className="stat-icon"><Icon name="calendar" /></span></div><div className="stat-number text-[25px]">{currency(total * 12)}</div><div className="stat-foot">Custo mensal × 12, sem reajustes</div></article><article className="stat-card"><div className="stat-head">Variação mensal<span className="stat-icon"><Icon name={change !== null && change > 0 ? 'trendUp' : 'trendDown'} /></span></div><div className={`stat-number ${change !== null && change > 0 ? 'negative' : 'positive'}`}>{change === null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1).replace('.', ',')}%`}</div><div className="stat-foot">{change === null ? 'Sem base de comparação anterior' : 'Comparação dos compromissos mensais'}</div></article><article className="stat-card"><div className="stat-head">Ticket médio mensal<span className="stat-icon"><Icon name="file" /></span></div><div className="stat-number text-[25px]">{currency(total / Math.max(1, active.length))}</div><div className="stat-foot">Média dos contratos ativos</div></article></div>
    <div className="report-grid"><CostChart contracts={contracts} period={period} onPeriodChange={onPeriodChange} canManage={canManage} onCreate={onCreate} /><section className="panel"><div className="panel-header"><div><h2>Custos por categoria</h2><p>Distribuição da carteira ativa.</p></div></div><div className="category-list">{categories.length ? categories.map(([category, value], index) => <div className="category-item" key={category}><div className="category-label"><span>{category}</span><strong>{currency(value)}</strong></div><div className="category-track"><div className="category-bar" style={{ width: `${value / maxCategory * 100}%`, '--bar-color': colors[index % colors.length] } as CSSProperties} /></div></div>) : <div className="chart-empty"><Icon name="chart" /><h3>Sem custos por categoria.</h3><p>Cadastre contratos ativos para conhecer a distribuição da carteira.</p></div>}</div></section></div>
    <div className="report-note"><Icon name="info" />Valores calculados a partir dos contratos cadastrados. O gráfico considera cada mês de vigência sem rateio diário. A projeção anualizada usa a carteira ativa de hoje, sem prever vencimentos, contratações ou reajustes.</div><Footer />
  </>;
}
