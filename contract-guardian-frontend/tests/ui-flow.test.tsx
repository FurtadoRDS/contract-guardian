import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { AuthPage } from '../src/pages/AuthPage';
import { UsersPage } from '../src/pages/UsersPage';
import { getAccessSnapshot, getSession, resetAccessPreview, startPreview, submitAccessRequest } from '../src/services/access-service';

// Native dialog is browser behavior; jsdom needs only an open/close shim here.
const dialogMethods = {
  showModal: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'),
  close: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close'),
};
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value(this: HTMLDialogElement) { this.open = true; },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value(this: HTMLDialogElement) { this.open = false; },
  });
});
afterAll(() => {
  for (const name of ['showModal', 'close'] as const) {
    const original = dialogMethods[name];
    if (original) Object.defineProperty(HTMLDialogElement.prototype, name, original);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
  }
});
beforeEach(() => { resetAccessPreview(); localStorage.clear(); });
afterEach(() => { cleanup(); resetAccessPreview(); });

const requestInput = {
  name: 'Pessoa do teste de interface',
  email: 'interface@empresa.example',
  department: 'Operações',
  reason: 'Consultar os contratos da área.',
};

test('login sem backend informa a integração pendente e apaga a senha, sem autenticar ou persistir credenciais', async () => {
  const user = userEvent.setup(), authenticated = vi.fn();
  render(<AuthPage view="login" onAuthenticated={authenticated} onToast={vi.fn()} />);
  await user.type(screen.getByLabelText('E-mail corporativo', { exact: true }), 'login@empresa.example');
  await user.type(screen.getByLabelText('Senha', { exact: true }), 'senha-apenas-do-teste');
  await user.click(screen.getByRole('button', { name: 'Entrar na plataforma' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('backend'));
  expect((screen.getByLabelText('Senha', { exact: true }) as HTMLInputElement).value).toBe('');
  expect(authenticated).not.toHaveBeenCalled();
  expect(getSession()).toBeNull();
  expect(getAccessSnapshot()).toEqual({ requests: [], users: [], audit: [] });
  expect(JSON.stringify({ ...localStorage, ...sessionStorage })).not.toContain('senha-apenas-do-teste');
});

test('solicitar acesso registra somente um pedido pendente e apresenta o protocolo da prévia', async () => {
  const user = userEvent.setup(), authenticated = vi.fn();
  render(<AuthPage view="request-access" onAuthenticated={authenticated} onToast={vi.fn()} />);
  await user.type(screen.getByLabelText('Nome completo', { exact: true }), requestInput.name);
  await user.type(screen.getByLabelText('E-mail corporativo', { exact: true }), requestInput.email);
  await user.type(screen.getByLabelText('Departamento', { exact: true }), requestInput.department);
  await user.type(screen.getByLabelText('Motivo da solicitação', { exact: true }), requestInput.reason);
  await user.click(screen.getByRole('button', { name: 'Solicitar acesso' }));
  expect(await screen.findByRole('heading', { name: /Seu pedido está\s*aguardando análise/i })).toBeTruthy();
  const snapshot = getAccessSnapshot();
  expect(snapshot.requests).toHaveLength(1);
  expect(snapshot.requests[0]).toMatchObject({ ...requestInput, status: 'pending', reviewedBy: null });
  expect(screen.getByText(snapshot.requests[0].id, { exact: true })).toBeTruthy();
  expect(snapshot.users).toHaveLength(0);
  expect(snapshot.audit).toHaveLength(0);
  expect(getSession()).toBeNull();
  expect(authenticated).not.toHaveBeenCalled();
});

test('aprovação pela interface cria reader, promoção é uma ação separada e ambas mantêm o responsável no histórico', async () => {
  const user = userEvent.setup();
  const request = await submitAccessRequest(requestInput);
  const actor = startPreview('master');
  render(<UsersPage onToast={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: `Revisar solicitação de ${requestInput.name}` }));
  const review = await screen.findByRole('dialog', { name: 'Revisar solicitação de acesso' });
  expect(within(review).getByText(actor.name, { exact: true })).toBeTruthy();
  await user.click(within(review).getByRole('button', { name: 'Aprovar como leitor' }));
  await waitFor(() => expect(getAccessSnapshot().users).toHaveLength(1));
  const approved = getAccessSnapshot().users[0];
  expect(approved.role).toBe('reader');
  expect(approved.approvedBy).toMatchObject({ id: actor.id, name: actor.name });
  expect(getAccessSnapshot().requests[0]).toMatchObject({ id: request.id, status: 'approved', reviewedBy: { id: actor.id } });
  expect(getAccessSnapshot().audit).toHaveLength(1);

  await user.click(screen.getByRole('tab', { name: /^Usuários\s*1$/ }));
  await user.click(screen.getByRole('button', { name: `Alterar permissão de ${requestInput.name}` }));
  const roleDialog = await screen.findByRole('dialog', { name: 'Alterar permissão' });
  await user.click(within(roleDialog).getByRole('radio', { name: /^Master\s*Cria e edita contratos/ }));
  await user.click(within(roleDialog).getByRole('button', { name: 'Salvar permissão' }));
  await waitFor(() => expect(getAccessSnapshot().users[0].role).toBe('master'));
  const audit = getAccessSnapshot().audit;
  expect(audit.map(event => event.action)).toEqual(['access.approved', 'role.changed']);
  expect(audit.every(event => event.actor.id === actor.id)).toBe(true);
  expect(audit[1].details).toMatchObject({ fromRole: 'reader', toRole: 'master', requestId: request.id });
  await user.click(screen.getByRole('tab', { name: /^Histórico de ações\s*2$/ }));
  const history = screen.getByRole('tabpanel', { name: /^Histórico de ações\s*2$/ });
  expect(within(history).getByText('Acesso aprovado', { exact: true })).toBeTruthy();
  expect(within(history).getByText('Permissão alterada', { exact: true })).toBeTruthy();
  expect(within(history).getAllByText(`ID: ${actor.id}`, { exact: true })).toHaveLength(2);
});

test('recusa pela interface mantém o pedido pendente sem motivo e registra a justificativa após confirmação', async () => {
  const user = userEvent.setup();
  const request = await submitAccessRequest(requestInput);
  startPreview('master');
  render(<UsersPage onToast={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: `Revisar solicitação de ${requestInput.name}` }));
  await user.click(screen.getByRole('button', { name: 'Recusar' }));
  const dialog = screen.getByRole('dialog', { name: 'Recusar solicitação de acesso' });
  await user.click(within(dialog).getByRole('button', { name: 'Confirmar recusa' }));
  expect(getAccessSnapshot().requests[0].status).toBe('pending');
  expect(getAccessSnapshot().audit).toHaveLength(0);
  await user.type(within(dialog).getByRole('textbox', { name: 'Motivo da recusa *' }), 'A solicitação precisa de revisão da equipe responsável.');
  await user.click(within(dialog).getByRole('button', { name: 'Confirmar recusa' }));
  await waitFor(() => expect(getAccessSnapshot().requests[0].status).toBe('rejected'));
  expect(getAccessSnapshot().requests[0]).toMatchObject({ id: request.id, rejectionReason: 'A solicitação precisa de revisão da equipe responsável.' });
  expect(getAccessSnapshot().audit[0]).toMatchObject({ action: 'access.rejected', actor: { id: 'preview-master' } });
  expect(getAccessSnapshot().users).toHaveLength(0);
});

test('reader não recebe controles de aprovação, edição de permissões ou exportação administrativa', () => {
  act(() => { startPreview('reader'); });
  render(<UsersPage onToast={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'Acesso reservado a masters' })).toBeTruthy();
  expect(screen.queryByRole('tablist', { name: 'Administração de acessos' })).toBeNull();
  expect(screen.queryByRole('button', { name: /Exportar histórico/i })).toBeNull();
  expect(screen.getByRole('link', { name: 'Voltar à visão geral' }).getAttribute('href')).toBe('#dashboard');
});
