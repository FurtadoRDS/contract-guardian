import { test, vi } from 'vitest';
import type { AccessChange, Session } from '../src/types';
type AccessModule = typeof import('../src/services/access-service');
import assert from 'node:assert/strict';

const KEY = 'guardian-access-preview-v1';


class MemoryStorage {
  entries = new Map<string, string>();
  getItem(key: string) { return this.entries.get(key) ?? null; }
  setItem(key: string, value: string) { this.entries.set(key, String(value)); }
  removeItem(key: string) { this.entries.delete(key); }
}

async function service({ storage = new MemoryStorage() }: { storage?: MemoryStorage } = {}) {
  Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true });
  vi.resetModules();
  const module = await import('../src/services/access-service');
  return { module, storage };
}

const requestInput = (suffix: string) => ({
  name: `Pessoa de Teste ${suffix}`,
  email: `pessoa${suffix}@empresa.example`,
  department: 'Operações',
  reason: 'Consultar os contratos do departamento.',
});

async function approve(module: AccessModule, suffix: string) {
  const request = await module.submitAccessRequest(requestInput(suffix));
  await module.reviewAccessRequest(request.id, 'approved');
  const user = module.getAccessSnapshot().users.find(user => user.requestId === request.id);
  assert.ok(user);
  return user;
}

test('a prévia começa sem sessão, solicitações, usuários ou histórico', async () => {
  const { module } = await service();
  assert.equal(module.ACCESS_MODE, 'preview');
  assert.equal(module.getSession(), null);
  assert.deepEqual(module.getAccessSnapshot(), { requests: [], users: [], audit: [] });
  assert.equal(module.roleLabel('master'), 'Master');
  assert.equal(module.roleLabel('reader'), 'Reader');
});

test('personas explícitas não criam contas; sessão e retorno são cópias', async () => {
  const { module } = await service();
  const session = module.startPreview('reader');
  assert.deepEqual(session, {
    id: 'preview-reader', name: 'Prévia reader', email: '', role: 'reader', isPreview: true,
  });
  session.role = 'master';
  assert.equal(module.getSession()?.role, 'reader');
  assert.equal(module.getAccessSnapshot().users.length, 0);
  assert.throws(() => module.startPreview('admin'), { code: 'INVALID_ROLE' });
  module.signOut();
  assert.equal(module.getSession(), null);
});

test('login real falha explicitamente e não armazena senha ou conta', async () => {
  const { module, storage } = await service();
  const credentials = { email: 'login@empresa.example', password: 'SENHA-QUE-NAO-PODE-PERSISTIR' };
  await assert.rejects(module.signIn(credentials), { code: 'BACKEND_NOT_CONFIGURED' });
  assert.equal(module.getSession(), null);
  assert.deepEqual(module.getAccessSnapshot(), { requests: [], users: [], audit: [] });
  assert.equal([...storage.entries.values()].join('').includes(credentials.password), false);
  assert.equal(storage.getItem(KEY), null);
  module.startPreview('reader');
  await assert.rejects(module.signIn(credentials), { code: 'BACKEND_NOT_CONFIGURED' });
  assert.equal(module.getSession()?.role, 'reader');
  assert.equal([...storage.entries.values()].join('').includes(credentials.password), false);
});

test('solicitações normalizam dados, validam campos e ignoram atributos de autoridade', async () => {
  const { module, storage } = await service();
  for (const field of ['name', 'email', 'department', 'reason']) {
    await assert.rejects(module.submitAccessRequest({ ...requestInput('a'), [field]: '   ' }), {
      code: 'VALIDATION_ERROR', field,
    });
  }
  await assert.rejects(module.submitAccessRequest({ ...requestInput('a'), email: 'inválido' }), {
    code: 'VALIDATION_ERROR', field: 'email',
  });
  const submitted = {
    ...requestInput('a'), name: '  Pessoa  ', email: '  PESSOA@EMPRESA.EXAMPLE ',
    department: '  Financeiro ', reason: ' Revisar custos. ',
    password: 'NAO-ARMAZENAR', role: 'master', status: 'approved',
  };
  const request = await module.submitAccessRequest(submitted);
  assert.equal(request.name, 'Pessoa');
  assert.equal(request.email, 'pessoa@empresa.example');
  assert.equal(request.department, 'Financeiro');
  assert.equal(request.reason, 'Revisar custos.');
  assert.equal(request.status, 'pending');
  assert.equal(request.reviewedAt, null);
  assert.equal(request.reviewedBy, null);
  assert.equal('role' in request, false);
  assert.equal('password' in request, false);
  assert.equal((storage.getItem(KEY) || '').includes('NAO-ARMAZENAR'), false);
  assert.equal(module.getAccessSnapshot().users.length, 0);
});

test('solicitações pendentes e usuários ativos não podem duplicar o mesmo e-mail', async () => {
  const { module } = await service();
  const request = await module.submitAccessRequest(requestInput('dup'));
  await assert.rejects(module.submitAccessRequest({ ...requestInput('dup'), email: ' PESSOADUP@EMPRESA.EXAMPLE ' }), {
    code: 'DUPLICATE_REQUEST',
  });
  module.startPreview('master');
  await module.reviewAccessRequest(request.id, 'approved');
  await assert.rejects(module.submitAccessRequest(requestInput('dup')), { code: 'USER_ALREADY_ACTIVE' });
  assert.equal(module.getAccessSnapshot().users.length, 1);
});

test('revisões e alterações de perfil exigem master consultado na sessão interna', async () => {
  const { module } = await service();
  const request = await module.submitAccessRequest(requestInput('guard'));
  await assert.rejects(module.reviewAccessRequest(request.id, 'approved'), { code: 'SESSION_REQUIRED' });
  await assert.rejects(module.changeUserRole('qualquer', 'master'), { code: 'SESSION_REQUIRED' });
  const callerSession = module.startPreview('reader');
  callerSession.role = 'master';
  await assert.rejects(Reflect.apply(module.reviewAccessRequest, null, [request.id, 'approved', '', { id: 'spoof', role: 'master' }]) as Promise<unknown>, {
    code: 'FORBIDDEN',
  });
  await assert.rejects(module.changeUserRole('qualquer', 'master'), { code: 'FORBIDDEN' });
  assert.equal(module.getAccessSnapshot().requests[0].status, 'pending');
  assert.equal(module.getAccessSnapshot().audit.length, 0);
});

test('aprovação cria somente reader e registra responsável real da sessão', async () => {
  const { module } = await service();
  module.startPreview('master');
  const actor = { id: 'preview-master', name: 'Prévia master', email: '' };
  const request = await module.submitAccessRequest(requestInput('approval'));
  const reviewed = await (Reflect.apply(module.reviewAccessRequest, null, [request.id, 'approved', '', { id: 'spoof' }]) as Promise<import('../src/types').AccessRequest>);
  const snapshot = module.getAccessSnapshot();
  const user = snapshot.users[0];
  assert.equal(reviewed.status, 'approved');
  assert.deepEqual(reviewed.reviewedBy, actor);
  assert.equal(user.role, 'reader');
  assert.equal(user.status, 'active');
  assert.equal(user.requestId, request.id);
  assert.equal(user.approvedAt, reviewed.reviewedAt);
  assert.deepEqual(user.approvedBy, actor);
  assert.deepEqual(snapshot.audit[0].actor, actor);
  assert.equal(snapshot.audit[0].action, 'access.approved');
  assert.equal(snapshot.audit[0].targetId, user.id);
  assert.deepEqual(snapshot.audit[0].details, {
    fromRole: null, toRole: 'reader', reason: '', requestId: request.id,
  });
});

test('rejeição exige motivo e permite nova solicitação posterior', async () => {
  const { module } = await service();
  module.startPreview('master');
  const request = await module.submitAccessRequest(requestInput('rejection'));
  await assert.rejects(module.reviewAccessRequest(request.id, 'rejected', '  '), { code: 'REJECTION_REASON_REQUIRED' });
  assert.equal(module.getAccessSnapshot().requests[0].status, 'pending');
  const reviewed = await module.reviewAccessRequest(request.id, 'rejected', '  Justificativa insuficiente. ');
  assert.equal(reviewed.rejectionReason, 'Justificativa insuficiente.');
  assert.equal(module.getAccessSnapshot().users.length, 0);
  assert.equal(module.getAccessSnapshot().audit[0].action, 'access.rejected');
  assert.equal(module.getAccessSnapshot().audit[0].details.reason, 'Justificativa insuficiente.');
  const second = await module.submitAccessRequest(requestInput('rejection'));
  assert.notEqual(second.id, request.id);
  assert.equal(second.status, 'pending');
});

test('revisão é uma transição única e chamadas concorrentes não duplicam contas', async () => {
  const { module } = await service();
  module.startPreview('master');
  const request = await module.submitAccessRequest(requestInput('once'));
  const results = await Promise.allSettled([
    module.reviewAccessRequest(request.id, 'approved'),
    module.reviewAccessRequest(request.id, 'approved'),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((results.find(result => result.status === 'rejected')?.reason as Error & { code: string }).code, 'STALE_REQUEST');
  await assert.rejects(module.reviewAccessRequest(request.id, 'rejected', 'Já analisado.'), { code: 'STALE_REQUEST' });
  await assert.rejects(module.reviewAccessRequest('ausente', 'approved'), { code: 'REQUEST_NOT_FOUND' });
  await assert.rejects(module.reviewAccessRequest(request.id, 'outra'), { code: 'INVALID_DECISION' });
  assert.equal(module.getAccessSnapshot().users.length, 1);
  assert.equal(module.getAccessSnapshot().audit.length, 1);
});

test('perfis só mudam manualmente após aprovação e a alteração deixa histórico', async () => {
  const { module } = await service();
  module.startPreview('master');
  const first = await approve(module, 'role1');
  const second = await approve(module, 'role2');
  assert.equal(first.role, 'reader');
  await assert.rejects(module.changeUserRole(first.id, 'admin'), { code: 'INVALID_ROLE' });
  await assert.rejects(module.changeUserRole('ausente', 'master'), { code: 'USER_NOT_FOUND' });
  await module.changeUserRole(first.id, 'master');
  await assert.rejects(module.changeUserRole(first.id, 'master'), { code: 'ROLE_UNCHANGED' });
  await assert.rejects(module.changeUserRole(first.id, 'reader'), { code: 'LAST_MASTER' });
  await module.changeUserRole(second.id, 'master');
  const demoted = await module.changeUserRole(first.id, 'reader');
  assert.equal(demoted.role, 'reader');
  const events = module.getAccessSnapshot().audit.filter(event => event.action === 'role.changed');
  assert.equal(events.length, 3);
  const latest = events.at(-1);
  assert.ok(latest);
  assert.deepEqual(latest.details, {
    fromRole: 'master', toRole: 'reader', reason: '', requestId: first.requestId,
  });
  assert.deepEqual(latest.actor, { id: 'preview-master', name: 'Prévia master', email: '' });
  module.startPreview('reader');
  await assert.rejects(module.changeUserRole(first.id, 'master'), { code: 'FORBIDDEN' });
});

test('um responsável não pode remover o próprio perfil master, mesmo havendo outro', async () => {
  const { module, storage } = await service();
  module.startPreview('master');
  const first = await approve(module, 'self1');
  const second = await approve(module, 'self2');
  await module.changeUserRole(first.id, 'master');
  await module.changeUserRole(second.id, 'master');
  // Fixture de sessão usada apenas no teste da proteção de autoalteração.
  const fixture = JSON.parse(storage.getItem(KEY) || '{}') as { session: Session | null };
  fixture.session = { id: first.id, name: first.name, email: first.email, role: 'master', isPreview: true };
  storage.setItem(KEY, JSON.stringify(fixture));
  const { module: restored } = await service({ storage });
  await assert.rejects(restored.changeUserRole(first.id, 'reader'), { code: 'SELF_DEMOTION' });
  assert.equal(restored.getAccessSnapshot().users.find(user => user.id === first.id)?.role, 'master');
});

test('retornos e notificações não permitem alterar usuários, solicitações ou histórico', async () => {
  const { module } = await service();
  module.startPreview('master');
  const notifications: AccessChange[] = [];
  const unsubscribe = module.subscribeAccess(snapshot => {
    notifications.push(snapshot);
    if (snapshot.session) snapshot.session.role = 'reader';
    snapshot.requests.splice(0);
    snapshot.audit.splice(0);
  });
  const request = await module.submitAccessRequest(requestInput('clones'));
  request.name = 'Nome externo';
  const reviewed = await module.reviewAccessRequest(request.id, 'approved');
  assert.ok(reviewed.reviewedBy);
  reviewed.reviewedBy.name = 'Responsável adulterado';
  const snapshot = module.getAccessSnapshot();
  snapshot.audit[0].actor.id = 'adulterado';
  snapshot.audit[0].details.toRole = 'master';
  snapshot.users[0].role = 'master';
  snapshot.requests[0].status = 'pending';
  const clean = module.getAccessSnapshot();
  assert.equal(clean.requests[0].name, requestInput('clones').name);
  assert.equal(clean.requests[0].status, 'approved');
  assert.equal(clean.requests[0].reviewedBy?.name, 'Prévia master');
  assert.equal(clean.users[0].role, 'reader');
  assert.equal(clean.audit[0].actor.id, 'preview-master');
  assert.equal(clean.audit[0].details.toRole, 'reader');
  assert.equal(module.getSession()?.role, 'master');
  assert.equal(notifications.length, 2);
  unsubscribe();
  module.signOut();
  assert.equal(notifications.length, 2);
});

test('a prévia recupera somente seu namespace e o reset não remove outros dados', async () => {
  const { module, storage } = await service();
  storage.setItem('contratos-de-outro-modulo', 'preservar');
  module.startPreview('master');
  await approve(module, 'restore');
  const { module: restored } = await service({ storage });
  assert.equal(restored.getSession()?.role, 'master');
  assert.equal(restored.getAccessSnapshot().users.length, 1);
  restored.signOut();
  assert.equal(restored.getAccessSnapshot().users.length, 1);
  restored.resetAccessPreview();
  assert.equal(restored.getSession(), null);
  assert.deepEqual(restored.getAccessSnapshot(), { requests: [], users: [], audit: [] });
  assert.equal(storage.getItem(KEY), null);
  assert.equal(storage.getItem('contratos-de-outro-modulo'), 'preservar');
});

test('armazenamento bloqueado ou corrompido mantém uma prévia vazia funcional', async () => {
  const blocked = new MemoryStorage();
  blocked.getItem = () => { throw new Error('bloqueado'); };
  blocked.setItem = () => { throw new Error('bloqueado'); };
  blocked.removeItem = () => { throw new Error('bloqueado'); };
  const { module } = await service({ storage: blocked });
  assert.equal(module.getSession(), null);
  module.startPreview('master');
  await approve(module, 'memory');
  assert.equal(module.getAccessSnapshot().users.length, 1);
  module.resetAccessPreview();
  assert.equal(module.getSession(), null);
  const corrupted = new MemoryStorage();
  corrupted.setItem(KEY, '{não é JSON');
  const { module: fresh } = await service({ storage: corrupted });
  assert.deepEqual(fresh.getAccessSnapshot(), { requests: [], users: [], audit: [] });
  corrupted.setItem(KEY, JSON.stringify({ version: 1, mode: 'preview', session: null, requests: [null], users: [], audit: [] }));
  const { module: invalidRecords } = await service({ storage: corrupted });
  assert.deepEqual(invalidRecords.getAccessSnapshot(), { requests: [], users: [], audit: [] });
});
