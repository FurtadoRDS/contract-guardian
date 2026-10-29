import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Contract, Notify } from '../types';
import { TODAY } from '../domain/contracts';
import { analyzeContractDocument } from '../services/document-service';
import { Icon } from '../components/ui/Icon';
import { CompanyFields } from '../components/contracts/form/CompanyFields';
import { ContractFields } from '../components/contracts/form/ContractFields';
import { DocumentUpload } from '../components/contracts/form/DocumentUpload';
import { ContractSummary } from '../components/contracts/form/ContractSummary';
import { initialDraft, mergeExtraction, trimDraft, type ContractDraft, type DocumentMetadata } from '../components/contracts/form/form-model';

interface ContractFormPageProps { contract?: Contract | null; onSave: (record: Contract) => void; onCancel: () => void; onToast: Notify }
export function ContractFormPage({ contract = null, onSave, onCancel, onToast }: ContractFormPageProps) {
  const [draft, setDraft] = useState<ContractDraft>(() => initialDraft(contract));
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [needsReview, setNeedsReview] = useState(false);
  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [stage, setStage] = useState('');
  const [fileError, setFileError] = useState('');
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controllerRef.current?.abort(); }; }, []);
  function showFileError(message: string) { setFileError(message); onToast(message, 'error'); }
  async function receiveFile(file: File) {
    if (busy) return;
    const extension = file.name.split('.').at(-1)?.toLowerCase() || '';
    const supported: Record<string, string[]> = { pdf: ['application/pdf'], jpg: ['image/jpeg', 'image/jpg'], jpeg: ['image/jpeg', 'image/jpg'], txt: ['text/plain'] };
    if (!supported[extension] || file.type && file.type !== 'application/octet-stream' && !supported[extension].includes(file.type)) { showFileError('Escolha um contrato em PDF, JPG ou TXT.'); return; }
    if (!file.size) { showFileError('O arquivo está vazio. Escolha outro documento.'); return; }
    if (file.size > 10 * 1024 * 1024) { showFileError('O arquivo excede 10 MB. Escolha um documento menor.'); return; }
    const controller = new AbortController(); controllerRef.current = controller;
    setBusy(true); setFileError(''); setNotice(null); setDocument({ name: file.name, type: file.type, size: file.size }); setStage('Consultando serviço de análise…'); setDraft(previous => ({ ...previous, signature: '' })); setNeedsReview(true);
    try {
      const result = await analyzeContractDocument(file, { signal: controller.signal });
      if (!mounted.current || controller.signal.aborted) return;
      if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('O serviço não retornou dados para revisão. Preencha os campos manualmente.');
      setDraft(previous => mergeExtraction(previous, result)); setExtracted(true); setStage('Análise concluída · revisão manual necessária'); setNotice({ title: 'Dados recebidos para revisão', message: 'Confira as informações retornadas e selecione manualmente o status da assinatura.' }); onToast('Revise os dados recebidos e informe o status da assinatura.', 'success');
    } catch (error) {
      if (!mounted.current || controller.signal.aborted || error instanceof Error && error.name === 'AbortError') return;
      const code = error instanceof Error && 'code' in error ? error.code : '';
      if (code === 'BACKEND_NOT_CONFIGURED') { setStage('Selecionado · análise aguarda integração'); setNotice({ title: 'Documento selecionado', message: 'A análise automática estará disponível após a integração com o backend. Preencha ou revise os campos manualmente.' }); }
      else { setStage('Análise não concluída · preencha manualmente'); showFileError(error instanceof Error ? error.message : 'Não foi possível analisar o documento. Você pode preencher os campos manualmente.'); }
    } finally { if (mounted.current) setBusy(false); }
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = event.currentTarget, clean = trimDraft(draft); setDraft(clean);
    for (const element of Array.from(form.elements)) {
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
        element.setCustomValidity(element.required && !element.value.trim() ? 'Preencha este campo para continuar.' : '');
        if (element.name.endsWith('cnpj')) element.setCustomValidity(element.value.replace(/\D/g, '').length === 14 ? '' : 'Informe um CNPJ com 14 dígitos.');
        if (element.name === 'end') element.setCustomValidity(clean.start && clean.end && clean.end < clean.start ? 'O fim da vigência deve ser igual ou posterior ao início.' : '');
      }
    }
    if (!form.reportValidity()) return;
    if (clean.signature !== 'Assinado' && clean.signature !== 'Pendente' && clean.signature !== 'Em revisão') return;
    if (clean.contractor.type !== 'Matriz' && clean.contractor.type !== 'Filial') return;
    const monthly = Number(clean.monthly), total = Number(clean.total);
    if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isFinite(total) || total <= 0) { onToast('Informe valores válidos maiores que zero.', 'error'); return; }
    onSave({ ...contract, ...clean, contractor: { ...clean.contractor, type: clean.contractor.type }, signature: clean.signature, monthly, total, id: contract?.id || '', company: clean.provider.name, initials: clean.provider.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(), color: contract?.color || '#b9ed72', createdAt: contract?.createdAt || TODAY, ...(document ? { sourceDocument: { ...document } } : {}) });
  }
  return <div className="contract-form-page">
    <header className="cf-page-header"><div><button type="button" className="cf-back-link" onClick={onCancel}><Icon name="back" size={15} />Voltar aos contratos</button><h1>{contract ? 'Editar contrato' : 'Novo contrato'}<span className="cf-header-dot" /></h1><p>{contract ? 'Revise as informações e mantenha tudo em dia.' : 'Preencha os dados e organize os próximos passos do seu contrato.'}</p></div><span className="cf-demo-label"><span />Cadastro de contratos</span></header>
    <div className="cf-layout"><form className="cf-main min-w-0" id="contract-form" noValidate onSubmit={handleSubmit} aria-busy={busy}>
      {notice && <div className="cf-extraction-notice" role="status"><Icon name="info" size={18} /><div><strong>{notice.title}</strong><span>{notice.message}</span></div></div>}
      <CompanyFields draft={draft} onChange={setDraft} extracted={extracted} /><ContractFields draft={draft} onChange={setDraft} extracted={extracted} needsReview={needsReview} onSignatureReviewed={() => setNeedsReview(false)} />
      <div className="cf-form-footer"><p><Icon name="shield" size={15} />Suas alterações ficam salvas neste navegador.</p><div><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button><button type="submit" className="btn btn-primary cf-save-btn" disabled={busy}><Icon name="check" size={17} />{contract ? 'Salvar alterações' : 'Salvar contrato'}</button></div></div>
    </form><aside className="cf-aside"><DocumentUpload busy={busy} document={document} stage={stage} error={fileError} onFile={file => { void receiveFile(file); }} /><ContractSummary draft={draft} /></aside></div>
  </div>;
}
