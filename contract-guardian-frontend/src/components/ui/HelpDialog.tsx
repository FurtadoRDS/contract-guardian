import { useState } from 'react';
import { Icon } from './Icon';
import { Modal } from './Modal';

const questions = [
  ['Como funciona o acesso da equipe?', 'Uma pessoa solicita acesso usando nome, e-mail corporativo, departamento e motivo. Um master analisa a solicitação, aprova ou recusa. Ao aprovar, a conta começa como Reader. A decisão registra quem a tomou e quando.'],
  ['Qual é a diferença entre Reader e Master?', 'Reader consulta contratos, indicadores, calendário e exporta dados. Master também cadastra e edita contratos, analisa solicitações e altera permissões. Na prévia, essas ações são locais; a autorização real dependerá do backend.'],
  ['Como funciona a análise de documentos?', 'O formulário aceita PDF, JPG ou TXT de até 10 MB. A seleção e validação do arquivo estão prontas. A extração automática aguarda integração com o serviço de análise; nenhum campo é preenchido com informações inventadas. Você pode cadastrar o contrato manualmente.'],
  ['Por que o status da assinatura é manual?', 'Essa confirmação depende de revisão humana. Selecione Assinado, Pendente ou Em revisão antes de salvar; a análise de documentos nunca deve confirmar esse campo automaticamente.'],
  ['Como os status e valores são calculados?', 'Ativo exige assinatura confirmada e vigência iniciada. Pendente considera assinatura ou início pendente. Expirado indica vigência encerrada. O gráfico soma os valores mensais de contratos assinados que se sobrepõem ao mês, sem rateio diário; meses futuros representam compromissos previstos.'],
  ['Onde os dados ficam nesta etapa?', 'Os contratos são armazenados no navegador. Solicitações, decisões e permissões da prévia ficam na sessão atual, sem sincronização entre pessoas ou dispositivos. Nenhuma senha é salva. Ao conectar o backend, a sessão e o histórico serão validados no servidor.'],
] as const;
function HelpQuestion({ question, answer, defaultOpen }: { question: string; answer: string; defaultOpen: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen);
  return <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}><summary>{question}</summary><p>{answer}</p></details>;
}
export function HelpDialog({ open, onClose, section = 0 }: { open: boolean; onClose: () => void; section?: number }) {
  return <Modal open={open} onClose={onClose} title="Como podemos ajudar?" className="help-dialog"><div className="help-dialog-header"><h2 id="help-title">Como podemos ajudar?</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar ajuda"><Icon name="close" /></button></div><p>Organize contratos, acompanhe os vencimentos e consulte as permissões de acesso da sua equipe.</p>{questions.map(([question, answer], index) => <HelpQuestion key={`${open}-${section}-${index}`} question={question} answer={answer} defaultOpen={index === section} />)}</Modal>;
}
