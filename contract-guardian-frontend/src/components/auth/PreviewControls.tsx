import type { Role } from '../../types';
import { Icon } from '../ui/Icon';

export function PreviewControls({ onPreview }: { onPreview: (role: Role) => void }) {
  return <section className="auth-preview" aria-labelledby="auth-preview-title"><p id="auth-preview-title"><span className="auth-preview-dot" />Prévia da interface <span>· backend ainda não conectado</span></p><div className="auth-preview-actions">
    <button type="button" onClick={() => onPreview('master')}>Visualizar como master <Icon name="arrow" className="auth-icon" /></button>
    <button type="button" onClick={() => onPreview('reader')}>Visualizar como reader <Icon name="arrow" className="auth-icon" /></button>
  </div></section>;
}
