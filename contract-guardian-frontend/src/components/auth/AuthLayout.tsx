import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';

function Aurora({ login }: { login: boolean }) {
  const blurBounds = login ? { x: '-15%', y: '-30%', width: '130%', height: '160%' } : {};
  return <div className="auth-aurora" aria-hidden="true">
    <div className="auth-aurora-glow auth-aurora-glow-a" /><div className="auth-aurora-glow auth-aurora-glow-b" />
    <svg className="auth-ribbons" viewBox="0 0 1440 1100" preserveAspectRatio="xMidYMid slice"><defs>
      <linearGradient id="auth-ribbon-green" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#142900" stopOpacity="0" /><stop offset=".27" stopColor="#85e600" /><stop offset=".53" stopColor="#497d00" /><stop offset=".72" stopColor="#b2ff14" /><stop offset="1" stopColor="#173100" stopOpacity="0" /></linearGradient>
      <filter id="auth-blur-wide" {...blurBounds}><feGaussianBlur stdDeviation="23" /></filter><filter id="auth-blur-soft"><feGaussianBlur stdDeviation="6" /></filter>
    </defs>
      <path d="M-230 810C-95 420 245 804 415 501S869 481 945 154 1313-9 1577-174" fill="none" stroke="url(#auth-ribbon-green)" strokeWidth="105" filter="url(#auth-blur-wide)" opacity=".66" />
      <path d="M-190 805C-45 475 221 765 413 493S846 470 949 152 1285 20 1570-180" fill="none" stroke="url(#auth-ribbon-green)" strokeWidth="15" filter="url(#auth-blur-soft)" opacity=".57" />
      <path d="M-120 1110C139 818 381 1175 630 859S974 781 1072 502 1289 627 1570 472" fill="none" stroke="url(#auth-ribbon-green)" strokeWidth="100" filter="url(#auth-blur-wide)" opacity=".58" />
      <path d="M-120 1110C139 818 381 1175 630 859S974 781 1072 502 1289 627 1570 472" fill="none" stroke="url(#auth-ribbon-green)" strokeWidth="13" filter="url(#auth-blur-soft)" opacity=".35" />
    </svg><div className="auth-noise" />
  </div>;
}

interface AuthLayoutProps { request: boolean; success?: boolean; children: ReactNode; preview: ReactNode }
export function AuthLayout({ request, success = false, children, preview }: AuthLayoutProps) {
  return <section className={`auth-screen ${request ? 'auth-screen-request' : ''} ${success ? 'auth-screen-success' : ''}`} aria-labelledby="auth-title">
    <Aurora login={!request} />
    <header className="auth-topbar"><a className="auth-brand" href="#login" aria-label="Contract Guardian login"><span className="auth-brand-mark"><Icon name="shield" className="auth-icon" /></span><span>guardian<small>CONTRACT MANAGEMENT</small></span></a><span className="auth-exclusive"><Icon name="lock" className="auth-icon" />Acesso exclusivo da sua empresa</span></header>
    <div className="auth-center"><div className={`auth-card ${request ? 'auth-card-request' : ''}`}><div className="auth-card-body">{children}</div></div>{preview}</div>
    <footer className="auth-footer"><span>Contract Guardian</span><span>Mais clareza. Em cada contrato.</span></footer>
  </section>;
}

export function SubmitArrow() { return <span className="auth-submit-arrow"><Icon name="arrow" className="auth-icon" /></span>; }
export function PreviewNotice({ children }: { children: ReactNode }) {
  return <div className="auth-preview-notice"><Icon name="info" className="auth-icon" /><p>{children}</p></div>;
}

export function validateAuthForm(form: HTMLFormElement): boolean {
  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.setCustomValidity(element.required && !element.value.trim() ? 'Preencha este campo para continuar.' : '');
    }
  }
  return form.reportValidity();
}
