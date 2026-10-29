import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { changeUserRole, getSession, roleLabel } from '../../services/access-service';
import type { AccessUser, Notify, Role } from '../../types';
import { ActorBlock, Identity, RoleBadge } from './shared';

interface RoleDialogProps { user: AccessUser | null; onClose: () => void; onToast: Notify }
const roleOptions: { role: Role; icon: string; description: string }[] = [
  { role: 'reader', icon: 'eye', description: 'Consulta o dashboard e os contratos, sem editar dados ou gerenciar acessos.' },
  { role: 'master', icon: 'shield', description: 'Cria e edita contratos, aprova ou recusa solicitações e altera permissões.' },
];

export function RoleDialog({ user, onClose, onToast }: RoleDialogProps) {
  const [selected, setSelected] = useState<Role>('reader');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setSelected(user?.role || 'reader'); setBusy(false); setError(''); }, [user?.id]);
  const changed = Boolean(user && selected !== user.role);
  const close = () => { if (!busy) onClose(); };
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !changed || busy) return;
    if (getSession()?.role !== 'master') { onToast('Somente o perfil master pode alterar permissões.', 'error'); onClose(); return; }
    setBusy(true);
    setError('');
    try {
      await changeUserRole(user.id, selected);
      onToast(`Permissão atualizada para ${roleLabel(selected)} nesta sessão.`, 'success');
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível alterar a permissão. Tente novamente.';
      setError(message);
      onToast(message, 'error');
    } finally { setBusy(false); }
  }
  return <Modal open={Boolean(user)} onClose={close} title="Alterar permissão" className="ug-dialog">
    {user && <div aria-busy={busy}><div className="ug-dialog-top"><span className="ug-dialog-symbol"><Icon className="ug-icon" name="shield" size={21} /></span><button type="button" className="icon-btn" onClick={close} disabled={busy} aria-label="Fechar janela"><Icon className="ug-icon" name="close" size={17} /></button></div><h2>Alterar permissão</h2><p className="ug-dialog-description">Defina o que esta pessoa pode fazer no workspace.</p>
      <div className="ug-role-person"><Identity person={user} /><RoleBadge role={user.role} /></div>
      <form onSubmit={save}><fieldset className="ug-role-options" disabled={busy}><legend>Novo perfil de acesso</legend>{roleOptions.map(option => <label className="ug-role-option" key={option.role}>
        <input type="radio" name="role" value={option.role} checked={selected === option.role} onChange={() => { setSelected(option.role); setError(''); }} /><span className="ug-role-option-icon"><Icon className="ug-icon" name={option.icon} size={16} /></span><span ><strong >{roleLabel(option.role)}{user.role === option.role && <small>Perfil atual</small>}</strong><span>{option.description}</span></span><i />
      </label>)}</fieldset>
      <div className="ug-role-confirm-note"><Icon className="ug-icon" name="info" size={14} /><p>{changed ? selected === 'master' ? 'Ao confirmar, este usuário poderá gerenciar contratos, decidir solicitações e alterar permissões nesta sessão.' : 'Ao confirmar, este usuário terá apenas acesso de consulta e perderá as funções de administração nesta sessão.' : 'Selecione um perfil diferente para continuar. A alteração será registrada com sua identificação.'}</p></div>
      <ActorBlock label="Alteração realizada por" actor={getSession()} />
      {error && <p className="ug-dialog-error" role="alert">{error}</p>}
      <div className="ug-dialog-footer"><button type="button" className="btn btn-secondary" onClick={close} disabled={busy}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={busy || !changed}><Icon className="ug-icon" name="check" size={15} />{busy ? 'Salvando...' : 'Salvar permissão'}</button></div></form>
      <p className="ug-dialog-preview"><Icon className="ug-icon" name="info" size={12} />Prévia local: alterações válidas apenas nesta sessão.</p>
    </div>}
  </Modal>;
}
