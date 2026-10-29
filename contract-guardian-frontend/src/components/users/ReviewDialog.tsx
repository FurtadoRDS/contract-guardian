import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { getSession, reviewAccessRequest } from '../../services/access-service';
import type { AccessRequest, Notify } from '../../types';
import { dateTime } from './accessView';
import { ActorBlock, Identity, RequestStatus } from './shared';

interface ReviewDialogProps { request: AccessRequest | null; onClose: () => void; onToast: Notify }

export function ReviewDialog({ request, onClose, onToast }: ReviewDialogProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setRejecting(false); setReason(''); setError(''); setBusy(false); }, [request?.id]);
  useEffect(() => { if (rejecting) reasonRef.current?.focus(); }, [rejecting]);
  const pending = request?.status === 'pending';
  const title = pending ? rejecting ? 'Recusar solicitação de acesso' : 'Revisar solicitação de acesso' : 'Detalhes da solicitação';
  const close = () => { if (!busy) onClose(); };

  async function decide(decision: 'approved' | 'rejected') {
    if (!request || busy) return;
    if (getSession()?.role !== 'master') { onToast('Somente o perfil master pode decidir uma solicitação.', 'error'); onClose(); return; }
    const explanation = reason.trim();
    if (decision === 'rejected' && !explanation) { setReason(''); setError('Informe o motivo da recusa para continuar.'); reasonRef.current?.focus(); return; }
    setBusy(true);
    setError('');
    try {
      await reviewAccessRequest(request.id, decision, decision === 'rejected' ? explanation : '');
      onToast(decision === 'approved' ? 'Solicitação aprovada. O usuário recebeu o perfil de leitor nesta sessão.' : 'Solicitação recusada. Sua decisão e o motivo foram registrados.', 'success');
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Não foi possível concluir a ação. Tente novamente.';
      setError(message);
      onToast(message, 'error');
    } finally { setBusy(false); }
  }
  function reject(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void decide('rejected'); }

  return <Modal open={Boolean(request)} onClose={close} title={title} className="ug-dialog">
    {request && <div aria-busy={busy}>
      <div className="ug-dialog-top"><span className="ug-dialog-symbol"><Icon className="ug-icon" name="inbox" size={21} /></span><button type="button" className="icon-btn" onClick={close} disabled={busy} aria-label="Fechar janela"><Icon className="ug-icon" name="close" size={17} /></button></div><h2>{title}</h2>
      <p className="ug-dialog-description">{pending ? 'Confira as informações antes de liberar o acesso à empresa.' : 'A decisão e o responsável por esta solicitação.'}</p>
      <div className="ug-dialog-status"><RequestStatus status={request.status} /><time dateTime={request.createdAt}>{dateTime(request.createdAt)}</time></div>
      <div className="ug-applicant"><Identity person={request} /><div ><span>Departamento</span><strong>{request.department || 'Não informado'}</strong></div></div>
      <section className="ug-request-reason"><h3>Motivo da solicitação</h3><p>{request.reason || 'Não informado pelo solicitante.'}</p></section>
      {pending ? <>
        <div className="ug-grant-note"><Icon className="ug-icon" name="eye" size={17} /><div><strong>O acesso começa como leitor</strong><p>Permite consultar contratos e dashboard. Uma promoção para master deve ser feita depois, em Usuários.</p></div></div>
        <ActorBlock label="Sua decisão será registrada como" actor={getSession()} />
        {rejecting ? <form onSubmit={reject}>
          <div className="ug-reject-section"><label htmlFor="ug-rejection-reason">Motivo da recusa <span>*</span></label><textarea id="ug-rejection-reason" name="reason" ref={reasonRef} value={reason} onChange={event => { setReason(event.target.value); setError(''); }} rows={3} maxLength={1500} placeholder="Explique por que esta solicitação não pode ser aprovada." required disabled={busy} aria-invalid={Boolean(error)} aria-describedby={error ? 'ug-review-error' : 'ug-rejection-help'} /><p id="ug-rejection-help">Este motivo será incluído no histórico junto com sua identificação.</p></div>
          {error && <p className="ug-dialog-error" id="ug-review-error" role="alert">{error}</p>}
          <div className="ug-dialog-footer"><button type="button" className="btn btn-secondary" onClick={() => { setRejecting(false); setError(''); }} disabled={busy}>Voltar</button><button type="submit" className="btn ug-btn-danger-solid" disabled={busy}>{busy ? 'Registrando...' : 'Confirmar recusa'}</button></div>
        </form> : <>
          {error && <p className="ug-dialog-error" id="ug-review-error" role="alert">{error}</p>}
          <div className="ug-dialog-footer ug-review-default"><button type="button" className="btn ug-btn-danger" onClick={() => { setRejecting(true); setError(''); }} disabled={busy}>Recusar</button><button type="button" className="btn btn-primary" onClick={() => void decide('approved')} disabled={busy}><Icon className="ug-icon" name="check" size={15} />{busy ? 'Aprovando...' : 'Aprovar como leitor'}</button></div>
        </>}
      </> : <>
        <ActorBlock label={request.status === 'approved' ? 'Aprovada por' : 'Recusada por'} actor={request.reviewedBy} timestamp={request.reviewedAt} />
        {request.status === 'rejected' ? <section className="ug-rejection-detail"><h3>Motivo da recusa</h3><p>{request.rejectionReason || 'Não registrado.'}</p></section> : <div className="ug-grant-note"><Icon className="ug-icon" name="eye" size={17} /><div><strong>Acesso concedido como leitor</strong><p>O perfil atual pode ser consultado na aba Usuários.</p></div></div>}
        <div className="ug-dialog-footer"><button type="button" className="btn btn-secondary" onClick={close}>Fechar detalhes</button></div>
      </>}
      <p className="ug-dialog-preview"><Icon className="ug-icon" name="info" size={12} />Prévia local: alterações válidas apenas nesta sessão.</p>
    </div>}
  </Modal>;
}
