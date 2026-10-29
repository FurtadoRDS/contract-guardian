import { useEffect, useRef, useState, type FormEvent } from 'react';
import { signIn } from '../../services/access-service';
import type { Session } from '../../types';
import { Icon } from '../ui/Icon';
import { SubmitArrow, validateAuthForm } from './AuthLayout';

export function LoginForm({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const mounted = useRef(true);
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (message) feedbackRef.current?.focus(); }, [message]);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !validateAuthForm(event.currentTarget)) return;
    setBusy(true); setMessage('');
    try {
      const session = await signIn({ email: email.trim(), password });
      if (mounted.current) { setPassword(''); onAuthenticated(session); }
    } catch (error) {
      if (mounted.current) {
        const code = error instanceof Error && 'code' in error ? error.code : '';
        setMessage(code === 'BACKEND_NOT_CONFIGURED' ? 'O login estará disponível quando o backend for conectado. Por enquanto, explore as telas pelos acessos de prévia abaixo.' : error instanceof Error ? error.message : 'Não foi possível entrar. Confira seus dados e tente novamente.');
      }
    } finally { if (mounted.current) { setPassword(''); setBusy(false); } }
  }
  return <>
    <div className="auth-card-intro"><span className="auth-card-symbol"><Icon name="shield" className="auth-icon" /></span><p className="auth-eyebrow">SEU WORKSPACE, SOB CONTROLE</p><h1 id="auth-title">Bem-vindo de volta.</h1><p>Um só lugar para cuidar de cada contrato.</p></div>
    <form className="auth-form" id="guardian-login-form" noValidate onSubmit={handleSubmit} aria-busy={busy}>
      {message && <div className="auth-feedback" ref={feedbackRef} role="alert" tabIndex={-1}>{message}</div>}
      <div className="auth-field"><label htmlFor="auth-email">E-mail corporativo</label><input id="auth-email" name="email" type="email" autoComplete="username" placeholder="Seu e-mail de trabalho" required maxLength={180} spellCheck={false} autoCapitalize="none" value={email} onChange={event => { event.currentTarget.setCustomValidity(''); setEmail(event.target.value); }} /></div>
      <div className="auth-field"><label htmlFor="auth-password">Senha</label><div className="auth-password-wrap relative"><input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" required maxLength={256} value={password} onChange={event => { event.currentTarget.setCustomValidity(''); setPassword(event.target.value); }} /><button type="button" className="auth-eye" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}><Icon name={showPassword ? 'eyeOff' : 'eye'} className="auth-icon" /></button></div></div>
      <p className="auth-field-note"><Icon name="lock" className="auth-icon" />Entrada exclusiva para usuários aprovados.</p>
      <button className="auth-submit" type="submit" disabled={busy}><span>{busy ? 'Um instante…' : 'Entrar na plataforma'}</span>{busy ? <span className="auth-loading" aria-hidden="true" /> : <SubmitArrow />}</button>
    </form>
    <p className="auth-account-link">Ainda não tem acesso? <a href="#request-access">Solicitar acesso <Icon name="arrow" className="auth-icon" /></a></p>
    <div className="auth-approval-note"><Icon name="shield" className="auth-icon" /><p>Cada novo acesso passa pela aprovação<br />de um administrador da sua empresa.</p></div>
  </>;
}
