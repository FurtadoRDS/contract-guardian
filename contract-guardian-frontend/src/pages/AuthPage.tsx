import { useEffect, useState } from 'react';
import { startPreview } from '../services/access-service';
import type { AccessRequest, Notify, Role, Session } from '../types';
import { AuthLayout } from '../components/auth/AuthLayout';
import { PreviewControls } from '../components/auth/PreviewControls';
import { LoginForm } from '../components/auth/LoginForm';
import { AccessRequestForm, AccessRequestSuccess } from '../components/auth/AccessRequestForm';

interface AuthPageProps { view: 'login' | 'request-access'; onAuthenticated: (session: Session) => void; onToast: Notify }
export function AuthPage({ view, onAuthenticated, onToast }: AuthPageProps) {
  const [request, setRequest] = useState<AccessRequest | null>(null);
  useEffect(() => { setRequest(null); }, [view]);
  function preview(role: Role) {
    try { onAuthenticated(startPreview(role)); }
    catch (error) { onToast(error instanceof Error ? error.message : 'Não foi possível abrir a prévia.', 'error'); }
  }
  return <AuthLayout request={view === 'request-access'} success={!!request} preview={<PreviewControls onPreview={preview} />}>
    {view === 'login' ? <LoginForm onAuthenticated={onAuthenticated} /> : request ? <AccessRequestSuccess request={request} /> : <AccessRequestForm onRegistered={setRequest} />}
  </AuthLayout>;
}
