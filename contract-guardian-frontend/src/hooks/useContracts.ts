import { useSyncExternalStore } from 'react';
import { TODAY } from '../domain/contracts';
import { AccessServiceError, getSession } from '../services/access-service';
import type { Contract } from '../types';

const STORAGE_KEY = 'guardian-contracts-v2';
type Listener = () => void;
const listeners = new Set<Listener>();

export interface ContractsStoreSnapshot {
  contracts: Contract[];
  storageAvailable: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Validate persisted input while preserving the exact v2 storage format. */
function isContract(value: unknown): value is Contract {
  if (!isRecord(value)) return false;
  const textFields = ['id', 'company', 'initials', 'color', 'category', 'scope', 'start', 'end', 'renewal', 'createdAt'];
  if (!textFields.every(field => typeof value[field] === 'string') || !value.id ||
    typeof value.monthly !== 'number' || !Number.isFinite(value.monthly) ||
    typeof value.total !== 'number' || !Number.isFinite(value.total) ||
    !['', 'Assinado', 'Pendente', 'Em revisão'].includes(String(value.signature))) return false;
  const contractor = value.contractor, provider = value.provider;
  if (!isRecord(contractor) || !['name', 'cnpj', 'city'].every(field => typeof contractor[field] === 'string') ||
    !['', 'Matriz', 'Filial'].includes(String(contractor.type)) || !isRecord(provider) ||
    !['name', 'cnpj', 'category', 'email', 'phone'].every(field => typeof provider[field] === 'string')) return false;
  if (value.sourceDocument !== undefined) {
    const source = value.sourceDocument;
    if (!isRecord(source) || typeof source.name !== 'string' || typeof source.type !== 'string' ||
      typeof source.size !== 'number' || !Number.isFinite(source.size)) return false;
  }
  return true;
}

function parseContracts(serialized: string | null): Contract[] {
  if (!serialized) return [];
  try {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed) && parsed.every(isContract) ? parsed : [];
  } catch { return []; }
}

function storage(): Storage | null {
  try { return globalThis.localStorage ?? null; }
  catch { return null; }
}

function initialSnapshot(): ContractsStoreSnapshot {
  try {
    const target = storage();
    if (!target) return { contracts: [], storageAvailable: false };
    // v1 is intentionally neither read nor deleted, preserving previous user input.
    return { contracts: parseContracts(target.getItem(STORAGE_KEY)), storageAvailable: true };
  } catch { return { contracts: [], storageAvailable: false }; }
}

let snapshot = initialSnapshot();

function emit(): void {
  for (const listener of [...listeners]) listener();
}

function update(contracts: Contract[]): void {
  let storageAvailable = false;
  try {
    const target = storage();
    if (target) {
      target.setItem(STORAGE_KEY, JSON.stringify(contracts));
      storageAvailable = true;
    }
  } catch { /* User input remains available in this session's shared memory. */ }
  snapshot = { contracts, storageAvailable };
  emit();
}

function requireMaster(): void {
  if (getSession()?.role !== 'master') throw new AccessServiceError('FORBIDDEN', 'Apenas masters podem alterar contratos.');
}

/** Stable identity until a mutation; consumers should use the store's mutators. */
export function getContractsSnapshot(): ContractsStoreSnapshot {
  return snapshot;
}

export function subscribeContracts(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function saveContract(record: Contract): Contract {
  requireMaster();
  const cloned = structuredClone(record);
  const normalized: Contract = {
    ...cloned,
    company: cloned.provider.name.replace(/\s+(Ltda\.?|S\.?A\.?)$/i, ''),
    monthly: Number(cloned.monthly),
    total: Number(cloned.total),
  };
  const existing = snapshot.contracts.findIndex(contract => contract.id === record.id);
  let contracts: Contract[];
  if (existing >= 0) contracts = snapshot.contracts.map((contract, index) => index === existing ? normalized : contract);
  else {
    let identifier: string;
    do {
      const suffix = globalThis.crypto?.randomUUID?.().slice(0, 8).toUpperCase() ??
        `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
      identifier = `CTR-${TODAY.slice(0, 4)}-${suffix}`;
    } while (snapshot.contracts.some(contract => contract.id === identifier));
    normalized.id = identifier;
    normalized.createdAt = TODAY;
    contracts = [normalized, ...snapshot.contracts];
  }
  update(contracts);
  return structuredClone(normalized);
}

export function clearContracts(): void {
  requireMaster();
  update([]);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    if (event.storageArea && event.storageArea !== storage()) return;
    snapshot = { contracts: parseContracts(event.newValue), storageAvailable: true };
    emit();
  });
}

/** Every component observes the same canonical store and immutable updates. */
export function useContracts(): ContractsStoreSnapshot & {
  saveContract: typeof saveContract;
  clearContracts: typeof clearContracts;
} {
  const state = useSyncExternalStore(subscribeContracts, getContractsSnapshot, getContractsSnapshot);
  return { ...state, saveContract, clearContracts };
}
