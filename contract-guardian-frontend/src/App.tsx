import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Contract } from './types';
import { useAccess } from './hooks/useAccess';
import { getContractsSnapshot, useContracts } from './hooks/useContracts';
import { useHashRoute } from './hooks/useHashRoute';
import { usePreferences } from './hooks/usePreferences';
import { resetAccessPreview, signOut } from './services/access-service';
import { exportContractsCSV } from './services/contracts-export';
import { contractStatus,daysUntil,TODAY } from './domain/contracts';
import { WorkspaceLayout,routeNames } from './components/layout/WorkspaceLayout';
import { ContractDrawer } from './components/contracts/ContractDrawer';
import { emptyContractFilters } from './components/contracts/filters';
import type { ContractFilters } from './components/contracts/filters';
import type { ChartPeriod } from './components/dashboard/CostChart';
import { HelpDialog } from './components/ui/HelpDialog';
import { Modal } from './components/ui/Modal';
import { Icon } from './components/ui/Icon';
import { useToast } from './components/ui/ToastProvider';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContractsPage } from './pages/ContractsPage';
import { ContractFormPage } from './pages/ContractFormPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';

function editId(route:string):string {try{return decodeURIComponent(route.slice(5));}catch{return '';}}

export function App() {
  const {session}=useAccess(),{contracts,saveContract,clearContracts}=useContracts(),{route,navigate}=useHashRoute(),notify=useToast();
  const {preferences,setPreferences,toggleTheme}=usePreferences();
  const [filters,setFilters]=useState<ContractFilters>({...emptyContractFilters}),[chartPeriod,setChartPeriod]=useState<ChartPeriod>('year');
  const [calendarDate,setCalendarDate]=useState(()=>new Date(Number(TODAY.slice(0,4)),Number(TODAY.slice(5,7))-1,1));
  const [selectedId,setSelectedId]=useState<string|null>(null),[help,setHelp]=useState<number|null>(null),[resetOpen,setResetOpen]=useState(false),[focusRequest,setFocusRequest]=useState(0);
  const publicRoute=route==='login'||route==='request-access',view=route.startsWith('edit/')?'edit':route;
  const canManage=session?.role==='master',editing=route.startsWith('edit/')?contracts.find(contract=>contract.id===editId(route)):undefined;
  const selected=contracts.find(contract=>contract.id===selectedId)||null;
  const go=useCallback((next:string)=>{setSelectedId(null);setHelp(null);setResetOpen(false);navigate(next);},[navigate]);
  const create=useCallback(()=>go('new-contract'),[go]);
  const select=useCallback((contract:Contract)=>setSelectedId(contract.id),[]);
  const logout=useCallback(()=>{signOut();go('login');},[go]);
  const search=useCallback((value:string)=>{setFilters({...emptyContractFilters,search:value});setFocusRequest(n=>n+1);go('contracts');},[go]);
  const upcoming=useMemo(()=>contracts.filter(contract=>contractStatus(contract)==='Ativo'&&daysUntil(contract.end)>=0&&daysUntil(contract.end)<=preferences.alertDays).sort((a,b)=>a.end.localeCompare(b.end)),[contracts,preferences.alertDays]);

  useEffect(()=>{
    const auth=!session||publicRoute;
    document.body.classList.toggle('auth-mode',auth);
    document.title=`${auth?(route==='request-access'?'Solicitar acesso':'Entrar'):(routeNames[view]||'Visão geral')} — Contract Guardian`;
    return()=>document.body.classList.remove('auth-mode');
  },[session,publicRoute,route,view]);
  useEffect(()=>{
    if(!session&&!publicRoute){navigate('login',true);return;}
    if(!session||publicRoute)return;
    if(['users','edit','new-contract'].includes(view)&&!canManage){notify('Seu perfil Reader permite consultar e exportar contratos.','info');navigate('dashboard',true);return;}
    if(!routeNames[view]){navigate('dashboard',true);return;}
    if(view==='edit'&&!editing){notify('Contrato não encontrado.','error');navigate('contracts',true);}
  },[session,publicRoute,view,canManage,editing,navigate,notify]);

  function save(record:Contract) {
    try{
      const existing=contracts.some(contract=>contract.id===record.id);
      saveContract(record);setFilters({...emptyContractFilters});go('contracts');
      notify(existing?'Contrato atualizado com sucesso.':'Contrato salvo. Sua carteira já está atualizada.');
      if(!getContractsSnapshot().storageAvailable)notify('O navegador não permitiu salvar. Seus contratos ficam disponíveis nesta sessão.','info');
    }catch(error){notify(error instanceof Error?error.message:'Não foi possível salvar o contrato.','error');}
  }
  function exportRows(rows:Contract[]) {
    if(!rows.length){notify('Nenhum contrato para exportar com estes filtros.','info');return;}
    try{exportContractsCSV(rows);notify(`${rows.length} contratos exportados em CSV.`);}catch{notify('Não foi possível gerar a exportação.','error');}
  }
  function reset() {
    try{clearContracts();resetAccessPreview();setFilters({...emptyContractFilters});go('login');notify('Os dados locais da prévia foram removidos.');}
    catch(error){notify(error instanceof Error?error.message:'Não foi possível limpar os dados.','error');}
  }

  if(!session||publicRoute)return <AuthPage key={route==='request-access'?'request-access':'login'} view={route==='request-access'?'request-access':'login'} onAuthenticated={()=>go('dashboard')} onToast={notify}/>;

  let page:ReactNode=null;
  if(view==='dashboard')page=<DashboardPage contracts={contracts} upcoming={upcoming} alertDays={preferences.alertDays} canManage={canManage} onCreate={create} navigate={go} onSelect={select} onHealthHelp={()=>setHelp(4)} period={chartPeriod} onPeriodChange={setChartPeriod}/>;
  if(view==='contracts')page=<ContractsPage contracts={contracts} filters={filters} onFiltersChange={setFilters} canManage={canManage} onCreate={create} onSelect={select} onExport={exportRows} focusRequest={focusRequest}/>;
  if((view==='new-contract'||view==='edit')&&canManage&&(view==='new-contract'||editing))page=<ContractFormPage key={editing?.id||'new'} contract={editing} onSave={save} onCancel={()=>go('contracts')} onToast={notify}/>;
  if(view==='calendar')page=<CalendarPage contracts={contracts} canManage={canManage} onCreate={create} onSelect={select} date={calendarDate} onDateChange={setCalendarDate}/>;
  if(view==='reports')page=<ReportsPage contracts={contracts} canManage={canManage} onCreate={create} onExport={()=>exportRows(contracts)} period={chartPeriod} onPeriodChange={setChartPeriod}/>;
  if(view==='settings')page=<SettingsPage session={session} preferences={preferences} onPreferencesChange={next=>{setPreferences(next);if(next.alertDays!==preferences.alertDays)notify('Antecedência dos avisos atualizada.');if(next.alerts!==preferences.alerts)notify(next.alerts?'Notificações ativadas.':'Notificações desativadas.','info');}} onReset={()=>setResetOpen(true)} onLogout={logout} onCreate={create} canManage={canManage}/>;
  if(view==='users'&&canManage)page=<UsersPage onToast={notify}/>;
  return <><WorkspaceLayout session={session} route={view} contracts={contracts} upcoming={upcoming} preferences={preferences} navigate={go} onLogout={logout} onHelp={()=>setHelp(0)} onTheme={toggleTheme} onSearch={search} onSelect={select}>{page}</WorkspaceLayout><ContractDrawer contract={selected} onClose={()=>setSelectedId(null)} onEdit={contract=>go(`edit/${encodeURIComponent(contract.id)}`)} canManage={canManage}/><HelpDialog open={help!==null} onClose={()=>setHelp(null)} section={help??0}/><Modal open={resetOpen} onClose={()=>setResetOpen(false)} title="Limpar esta prévia?"><div className="help-dialog-header"><h2>Limpar esta prévia?</h2><button className="icon-btn" onClick={()=>setResetOpen(false)} aria-label="Cancelar"><Icon name="close"/></button></div><p>Os contratos, solicitações e histórico criados nesta prévia serão removidos do navegador. Exporte os registros que deseja preservar antes de continuar.</p><div className="flex flex-wrap gap-2.5"><button className="btn btn-secondary" onClick={()=>setResetOpen(false)}>Cancelar</button><button className="btn btn-secondary" onClick={()=>exportRows(contracts)}><Icon name="download"/>Exportar contratos</button><button className="btn btn-primary" onClick={reset}>Limpar prévia</button></div></Modal></>;
}
