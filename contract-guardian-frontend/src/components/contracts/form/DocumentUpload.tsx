import { useRef, useState } from 'react';
import { Icon } from '../../ui/Icon';
import type { DocumentMetadata } from './form-model';

interface DocumentUploadProps { busy: boolean; document: DocumentMetadata | null; stage: string; error: string; onFile: (file: File) => void }
export function DocumentUpload({ busy, document, stage, error, onFile }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  function choose() { if (!busy) inputRef.current?.click(); }
  return <section className="cf-upload-card"><div className="cf-aside-eyebrow">CADA INFORMAÇÃO, NO SEU LUGAR</div><div className="cf-upload-heading"><span className="cf-spark-icon"><Icon name="file" size={22} /></span><h2>Comece pelo<br />seu documento.</h2></div><p className="cf-upload-description">Selecione o contrato para preparar o cadastro e revise os dados no formulário.</p>
    <input ref={inputRef} type="file" id="cf-file-upload" className="cf-hidden-input" accept=".pdf,.jpg,.jpeg,.txt,application/pdf,image/jpeg,text/plain" aria-label="Selecionar contrato em PDF, JPG ou TXT" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) onFile(file); }} />
    <div className={`cf-dropzone ${dragging ? 'cf-is-dragging' : ''} ${busy ? 'cf-is-analyzing' : ''}`} tabIndex={busy ? -1 : 0} role="button" aria-label="Clique para enviar ou arraste um contrato em PDF, JPG ou TXT" aria-disabled={busy} onClick={choose} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } }} onDragEnter={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={event => { event.preventDefault(); setDragging(false); }} onDrop={event => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file && !busy) onFile(file); }}>
      <div className="cf-upload-illustration"><Icon name="upload" size={27} /></div><strong>Arraste seu contrato aqui</strong><span>ou <u>escolha um arquivo</u></span><small>PDF, JPG ou TXT · até 10 MB</small>
    </div>
    {document && <div className="cf-analysis-progress" aria-live="polite"><div className="cf-file-row"><span className="cf-file-icon"><Icon name="file" size={19} /></span><div className="min-w-0"><strong className="cf-file-name">{document.name}</strong><span className="cf-analysis-stage">{stage}</span></div>{busy && <span className="cf-spinner" aria-hidden="true" />}</div></div>}
    {error && <p className="cf-file-error" role="alert">{error}</p>}
    <div className="cf-simulation-note"><Icon name="info" size={15} /><p>A análise automática aguarda integração com o backend. Por enquanto, preencha os dados manualmente. O conteúdo do arquivo não é lido, armazenado ou enviado nesta versão.</p></div>
  </section>;
}
