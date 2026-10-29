import { afterEach, expect, test, vi } from 'vitest';
import type { Contract } from '../src/types';

const KEY = 'guardian-contracts-v2';
class MemoryStorage implements Storage {
  entries = new Map<string, string>();
  get length(): number { return this.entries.size; }
  key(index: number): string | null { return [...this.entries.keys()][index] ?? null; }
  getItem(key: string): string | null { return this.entries.get(key) ?? null; }
  setItem(key: string, value: string): void { this.entries.set(key, String(value)); }
  removeItem(key: string): void { this.entries.delete(key); }
  clear(): void { this.entries.clear(); }
}

// Full records exist only in tests; the product has no seeded contracts.
const record = (overrides: Partial<Contract> = {}): Contract => ({
  id: 'novo-preenchimento', company: 'Empresa de teste', initials: 'ET', color: '#123456',
  category: 'Tecnologia', scope: 'Escopo informado pelo usuário no teste.',
  start: '2026-01-01', end: '2027-12-31', monthly: 500, total: 12_000,
  signature: 'Assinado', renewal: 'Renovação mediante revisão.', createdAt: '2026-01-01',
  contractor: { name: 'Contratante de Teste Ltda.', cnpj: '00.000.000/0001-00', type: 'Matriz', city: 'Cidade de teste' },
  provider: { name: 'Prestadora de Teste Ltda.', cnpj: '00.000.000/0002-00', category: 'Tecnologia', email: 'teste@empresa.example', phone: '(11) 0000-0000' },
  ...overrides,
});

async function setup(storage: Storage = new MemoryStorage()) {
  vi.resetModules();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('sessionStorage', new MemoryStorage());
  const access = await import('../src/services/access-service');
  const store = await import('../src/hooks/useContracts');
  return { access, store, storage };
}

afterEach(() => vi.unstubAllGlobals());

test('o store inicia vazio e ignora v1 sem apagar preenchimentos anteriores', async () => {
  const storage = new MemoryStorage();
  storage.setItem('guardian-contracts-v1', JSON.stringify([record()]));
  const { store } = await setup(storage);
  expect(store.getContractsSnapshot()).toEqual({ contracts: [], storageAvailable: true });
  expect(store.getContractsSnapshot()).toBe(store.getContractsSnapshot());
  expect(storage.getItem('guardian-contracts-v1')).not.toBeNull();
  expect(storage.getItem(KEY)).toBeNull();
});

test('master cadastra uma cópia normalizada, persistida e com ID do ano atual', async () => {
  const { access, store, storage } = await setup();
  access.startPreview('master');
  const before = store.getContractsSnapshot();
  const changes = vi.fn();
  const unsubscribe = store.subscribeContracts(changes);
  const submitted = record();
  const saved = store.saveContract(submitted);
  const current = store.getContractsSnapshot();
  expect(current).not.toBe(before);
  expect(before.contracts).toEqual([]);
  expect(current.contracts).toHaveLength(1);
  expect(saved.company).toBe('Prestadora de Teste');
  const { TODAY } = await import('../src/domain/contracts');
  expect(saved.id).toMatch(new RegExp(`^CTR-${TODAY.slice(0, 4)}-`));
  expect(saved.createdAt).toBe(TODAY);
  expect(JSON.parse(storage.getItem(KEY) ?? '[]')).toEqual(current.contracts);
  submitted.provider.name = 'Mutação posterior do formulário';
  saved.provider.name = 'Mutação posterior do retorno';
  expect(current.contracts[0].provider.name).toBe('Prestadora de Teste Ltda.');
  expect(changes).toHaveBeenCalledTimes(1);
  unsubscribe();
});

test('edição imutável mantém o ID e não altera snapshots anteriores', async () => {
  const { access, store } = await setup();
  access.startPreview('master');
  const saved = store.saveContract(record());
  const previous = store.getContractsSnapshot();
  const changed = store.saveContract({ ...saved, monthly: 750, total: 18_000 });
  expect(store.getContractsSnapshot().contracts).toHaveLength(1);
  expect(changed.id).toBe(saved.id);
  expect(changed.createdAt).toBe(saved.createdAt);
  expect(previous.contracts[0].monthly).toBe(500);
  expect(store.getContractsSnapshot().contracts[0].monthly).toBe(750);
});

test('reader e visitante não podem salvar ou limpar, mesmo chamando o store diretamente', async () => {
  const { access, store, storage } = await setup();
  expect(() => store.saveContract(record())).toThrowError(expect.objectContaining({ code: 'FORBIDDEN' }));
  expect(() => store.clearContracts()).toThrowError(expect.objectContaining({ code: 'FORBIDDEN' }));
  access.startPreview('master');
  const saved = store.saveContract(record());
  const persisted = storage.getItem(KEY);
  access.startPreview('reader');
  const session = access.getSession();
  if (session) session.role = 'master';
  expect(() => store.saveContract({ ...saved, monthly: 1 })).toThrowError(expect.objectContaining({ code: 'FORBIDDEN' }));
  expect(() => store.clearContracts()).toThrowError(expect.objectContaining({ code: 'FORBIDDEN' }));
  expect(storage.getItem(KEY)).toBe(persisted);
  expect(store.getContractsSnapshot().contracts[0].monthly).toBe(500);
});

test('carregamento recupera v2 e rejeita dados locais malformados', async () => {
  const storage = new MemoryStorage();
  storage.setItem(KEY, JSON.stringify([record({ id: 'existente' })]));
  const { store } = await setup(storage);
  expect(store.getContractsSnapshot().contracts[0].id).toBe('existente');
  storage.setItem(KEY, JSON.stringify([{ id: 'registro-incompleto', monthly: 500 }]));
  const { store: fresh } = await setup(storage);
  expect(fresh.getContractsSnapshot().contracts).toEqual([]);
});

test('armazenamento bloqueado mantém alterações em memória e informa a limitação', async () => {
  const blocked = new MemoryStorage();
  blocked.getItem = () => { throw new Error('bloqueado'); };
  blocked.setItem = () => { throw new Error('bloqueado'); };
  const { access, store } = await setup(blocked);
  expect(store.getContractsSnapshot().storageAvailable).toBe(false);
  access.startPreview('master');
  store.saveContract(record());
  expect(store.getContractsSnapshot().contracts).toHaveLength(1);
  expect(store.getContractsSnapshot().storageAvailable).toBe(false);
  store.clearContracts();
  expect(store.getContractsSnapshot().contracts).toEqual([]);
});

test('limpeza master afeta apenas contratos v2 e notifica os consumidores', async () => {
  const { access, store, storage } = await setup();
  access.startPreview('master');
  store.saveContract(record());
  storage.setItem('outros-dados', 'preservar');
  const changes = vi.fn();
  const unsubscribe = store.subscribeContracts(changes);
  store.clearContracts();
  expect(store.getContractsSnapshot().contracts).toEqual([]);
  expect(storage.getItem(KEY)).toBe('[]');
  expect(storage.getItem('outros-dados')).toBe('preservar');
  expect(access.getSession()?.role).toBe('master');
  expect(changes).toHaveBeenCalledOnce();
  unsubscribe();
});

test('alterações v2 de outra aba atualizam a carteira compartilhada', async () => {
  const { store } = await setup();
  const changes = vi.fn();
  const unsubscribe = store.subscribeContracts(changes);
  window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: JSON.stringify([record({ id: 'de-outra-aba' })]) }));
  expect(store.getContractsSnapshot().contracts[0].id).toBe('de-outra-aba');
  expect(changes).toHaveBeenCalledOnce();
  window.dispatchEvent(new StorageEvent('storage', { key: 'guardian-contracts-v1', newValue: '[]' }));
  expect(changes).toHaveBeenCalledOnce();
  unsubscribe();
});
