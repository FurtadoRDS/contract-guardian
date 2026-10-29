import { useEffect, useRef, useState, type FormEvent } from 'react';
import { submitAccessRequest } from '../../services/access-service';
import type { AccessRequest } from '../../types';
import { Icon } from '../ui/Icon';
import { PreviewNotice, SubmitArrow, validateAuthForm } from './AuthLayout';

interface RequestDraft { name: string; email: string; department: string; reason: string }
export function AccessRequestForm({ onRegistered }: { onRegistered: (request: AccessRequest) => void }) {
  const [draft, setDraft] = useState<RequestDraft>({ name: '', email: '', department: '', reason: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const feedbackRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (message) feedbackRef.current?.focus(); }, [message]);
  function update(key: keyof RequestDraft, value: string) { setDraft(previous => ({ ...previous, [key]: value })); }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !validateAuthForm(event.currentTarget)) return;
    setBusy(true); setMessage('');
    try {
      const request = await submitAccessRequest({ name: draft.name.trim(), email: draft.email.trim(), department: draft.department.trim(), reason: draft.reason.trim() });
      if (mounted.current) onRegistered(request);
    } catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'Não foi possível registrar a solicitação. Tente novamente.'); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <>
    <a className="auth-back" href="#login"><Icon name="back" className="auth-icon" />Voltar para o login</a>
    <div className="auth-card-intro auth-request-intro"><span className="auth-card-symbol"><Icon name="user" className="auth-icon" /></span><p className="auth-eyebrow">ACESSO EXCLUSIVO DA SUA EMPRESA</p><h1 id="auth-title">Seu próximo acesso<br />começa aqui.</h1><p>Solicite uma conta para o seu workspace.<br />Um usuário master analisará seu pedido.</p></div>
    <PreviewNotice><strong>Prévia de interface</strong>Este formulário registra o pedido apenas nesta sessão. O envio à empresa será habilitado com o backend.</PreviewNotice>
    <form className="auth-form" id="guardian-request-form" noValidate onSubmit={handleSubmit} aria-busy={busy}>
      {message && <div className="auth-feedback" ref={feedbackRef} role="alert" tabIndex={-1}>{message}</div>}
      <div className="auth-field"><label htmlFor="request-name">Nome completo</label><input id="request-name" name="name" autoComplete="name" placeholder="Como você se chama?" required maxLength={140} value={draft.name} onChange={event => { event.currentTarget.setCustomValidity(''); update('name', event.target.value); }} /></div>
      <div className="auth-field"><label htmlFor="request-email">E-mail corporativo</label><input id="request-email" name="email" type="email" autoComplete="email" placeholder="Seu e-mail de trabalho" required maxLength={180} spellCheck={false} autoCapitalize="none" value={draft.email} onChange={event => { event.currentTarget.setCustomValidity(''); update('email', event.target.value); }} /></div>
      <div className="auth-field"><label htmlFor="request-department">Departamento</label><input id="request-department" name="department" autoComplete="organization-title" placeholder="Em qual área você trabalha?" required maxLength={80} value={draft.department} onChange={event => { event.currentTarget.setCustomValidity(''); update('department', event.target.value); }} /></div>
      <div className="auth-field"><label htmlFor="request-reason">Motivo da solicitação</label><textarea id="request-reason" name="reason" placeholder="Conte brevemente como você usará o Contract Guardian." rows={3} required maxLength={1000} value={draft.reason} onChange={event => { event.currentTarget.setCustomValidity(''); update('reason', event.target.value); }} /></div>
      <p className="auth-field-note auth-reader-note"><Icon name="shield" className="auth-icon" />Contas aprovadas começam como <strong>reader</strong>.</p>
      <button className="auth-submit" type="submit" disabled={busy}><span>{busy ? 'Um instante…' : 'Solicitar acesso'}</span>{busy ? <span className="auth-loading" aria-hidden="true" /> : <SubmitArrow />}</button>
    </form><p className="auth-account-link">Já tem uma conta aprovada? <a href="#login">Entrar <Icon name="arrow" className="auth-icon" /></a></p>
  </>;
}

export function AccessRequestSuccess({ request }: { request: AccessRequest }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.createdAt));
  return <div className="auth-success"><span className="auth-success-mark"><Icon name="check" className="auth-icon" /></span><p className="auth-eyebrow">SOLICITAÇÃO REGISTRADA NA PRÉVIA</p><h1 id="auth-title" ref={headingRef} tabIndex={-1}>Seu pedido está<br />aguardando análise.</h1><p>Um usuário master poderá aprovar ou recusar a solicitação na tela de acessos.</p><span className="auth-status"><Icon name="clock" className="auth-icon" />Aguardando análise</span><dl className="auth-ticket">
    <div><dt>Solicitante</dt><dd>{request.name}</dd></div><div><dt>E-mail</dt><dd>{request.email}</dd></div><div><dt>Departamento</dt><dd>{request.department}</dd></div><div><dt>Protocolo</dt><dd>{request.id}</dd></div><div><dt>Registrado em</dt><dd>{date}</dd></div>
  </dl><PreviewNotice>Solicitação registrada apenas nesta prévia. O envio à empresa será habilitado ao conectar o backend.</PreviewNotice><a className="auth-submit" href="#login"><span>Voltar para o login</span><SubmitArrow /></a><p className="auth-success-hint">Para revisar este pedido, use<br /><strong>“Visualizar como master”</strong> abaixo.</p></div>;
}
