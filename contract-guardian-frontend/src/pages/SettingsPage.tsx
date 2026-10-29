import type { Session } from '../types';
import type { Preferences } from '../hooks/usePreferences';
import { roleLabel } from '../services/access-service';
import { PageHeading } from '../components/ui/PageHeading';
import { Icon } from '../components/ui/Icon';
import { Footer } from '../components/layout/Footer';

interface SettingsPageProps { session: Session; preferences: Preferences; onPreferencesChange: (preferences: Preferences) => void; onReset: () => void; onLogout: () => void; onCreate: () => void; canManage: boolean }
export function SettingsPage({ session, preferences, onPreferencesChange, onReset, onLogout, onCreate, canManage }: SettingsPageProps) {
  return <>
    <PageHeading title="Configurações" subtitle="Um espaço de trabalho que funciona do seu jeito." canManage={canManage} onCreate={onCreate} />
    <div className="settings-grid"><section className="panel settings-section"><h2>Preferências do workspace</h2><p>Seus ajustes são salvos neste navegador.</p>
      <div className="setting-row"><div><strong>Tema escuro</strong><p>Uma interface confortável para o seu dia a dia.</p></div><button type="button" className="switch" role="switch" aria-label="Tema escuro" aria-checked={preferences.theme === 'dark'} onClick={() => onPreferencesChange({ ...preferences, theme: preferences.theme === 'dark' ? 'light' : 'dark' })} /></div>
      <div className="setting-row"><div><strong>Notificações de vencimento</strong><p>Mostrar alertas no sino de notificações.</p></div><button type="button" className="switch" role="switch" aria-label="Notificações de vencimento" aria-checked={preferences.alerts} onClick={() => onPreferencesChange({ ...preferences, alerts: !preferences.alerts })} /></div>
      <div className="setting-row"><div><label htmlFor="alert-days">Antecedência dos avisos</label><p>Período considerado nos alertas do dashboard.</p></div><select className="panel-select" id="alert-days" value={preferences.alertDays} onChange={event => onPreferencesChange({ ...preferences, alertDays: Number(event.target.value) })}>{[7, 15, 30, 60, 90].map(days => <option value={days} key={days}>{days} dias</option>)}</select></div>
      <div className="setting-row"><div><strong>Moeda e localização</strong><p>Real brasileiro (R$) · Português do Brasil</p></div><span className="status-badge">Brasil</span></div>
      {canManage && <><button type="button" className="btn btn-secondary settings-reset" onClick={onReset}><Icon name="reset" />Limpar dados locais da prévia</button><p className="settings-note">Remove contratos, solicitações e histórico desta prévia. Exporte antes de limpar.</p></>}
    </section><section className="panel settings-section"><div className="settings-company"><span className="workspace-icon"><Icon name="shield" /></span><div><h3>Seu workspace</h3><p>Gestão corporativa de contratos</p></div></div>
      <div className="info-row"><span>Sessão atual</span><strong>{session.name}</strong></div><div className="info-row"><span>Permissão</span><strong>{roleLabel(session.role)}</strong></div><div className="info-row"><span>Armazenamento de contratos</span><strong>Neste navegador</strong></div><div className="info-row"><span>Solicitações e histórico</span><strong>Nesta sessão de prévia</strong></div><div className="info-row"><span>Backend</span><strong>Aguardando integração</strong></div>
      <div className="tip-card mt-[25px]"><div className="tip-heading"><Icon name="shield" />Acesso exclusivo da sua empresa</div><p>Novas contas dependem da aprovação de um master. A autenticação, a primeira conta master e o histórico definitivo serão conectados ao backend.</p></div><button type="button" className="btn btn-secondary mt-5" onClick={onLogout}>Sair da prévia</button>
    </section></div><Footer />
  </>;
}
