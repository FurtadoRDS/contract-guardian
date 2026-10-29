import type {
  AccessChange, AccessRequest, AccessRequestInput, AccessSnapshot, AccessUser,
  Actor, AuditDetails, AuditEvent, Role, Session,
} from '../types';

/** Interface preview adapter, not authentication or security authorization.
 * Personas are explicit preview choices, never real accounts. A future backend
 * must establish identity and authorize every transition on the server.
 * Passwords are never compared, logged, or persisted by this adapter. */
export const ACCESS_MODE = 'preview' as const;
const STORAGE_KEY = 'guardian-access-preview-v1';
export type AccessListener = (change: AccessChange) => void;
const listeners = new Set<AccessListener>();
let nextId = 0;

interface PreviewState extends AccessChange {
  version: 1;
  mode: typeof ACCESS_MODE;
}

const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const emptyState = (): PreviewState => ({
  version: 1, mode: ACCESS_MODE, session: null, requests: [], users: [], audit: [],
});

export class AccessServiceError extends Error {
  readonly code: string;
  readonly field?: string;

  constructor(code: string, message: string, field = '') {
    super(message);
    this.name = 'AccessServiceError';
    this.code = code;
    if (field) this.field = field;
  }
}

function fail(code: string, message: string, field?: string): never {
  throw new AccessServiceError(code, message, field);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isRole(value: unknown): value is Role {
  return value === 'master' || value === 'reader';
}

function isActor(value: unknown): value is Actor {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.email === 'string';
}

function isSession(value: unknown): value is Session {
  return isActor(value) && 'role' in value && isRole(value.role) && 'isPreview' in value && value.isPreview === true;
}

function isRequest(value: unknown): value is AccessRequest {
  return isRecord(value) && isActor(value) && typeof value.department === 'string' &&
    typeof value.reason === 'string' && ['pending', 'approved', 'rejected'].includes(String(value.status)) &&
    typeof value.createdAt === 'string' && (value.reviewedAt === null || typeof value.reviewedAt === 'string') &&
    (value.reviewedBy === null || isActor(value.reviewedBy)) && typeof value.rejectionReason === 'string';
}

function isUser(value: unknown): value is AccessUser {
  return isRecord(value) && isActor(value) && typeof value.department === 'string' && isRole(value.role) &&
    value.status === 'active' && typeof value.requestId === 'string' && typeof value.approvedAt === 'string' && isActor(value.approvedBy);
}

function isAudit(value: unknown): value is AuditEvent {
  if (!isRecord(value) || typeof value.id !== 'string' ||
    !['access.approved', 'access.rejected', 'role.changed'].includes(String(value.action)) ||
    typeof value.targetId !== 'string' || typeof value.targetName !== 'string' || typeof value.targetEmail !== 'string' ||
    !isActor(value.actor) || typeof value.createdAt !== 'string' || !isRecord(value.details)) return false;
  const details = value.details;
  return (details.fromRole === null || isRole(details.fromRole)) && (details.toRole === null || isRole(details.toRole)) &&
    typeof details.reason === 'string' && typeof details.requestId === 'string';
}

function getStorage(): Storage | null {
  try { return globalThis.sessionStorage ?? null; }
  catch { return null; }
}

function loadPreview(): PreviewState {
  try {
    const serialized = getStorage()?.getItem(STORAGE_KEY);
    if (!serialized) return emptyState();
    const stored: unknown = JSON.parse(serialized);
    if (!isRecord(stored) || stored.version !== 1 || stored.mode !== ACCESS_MODE ||
      (stored.session !== null && !isSession(stored.session)) ||
      !Array.isArray(stored.requests) || !stored.requests.every(isRequest) ||
      !Array.isArray(stored.users) || !stored.users.every(isUser) ||
      !Array.isArray(stored.audit) || !stored.audit.every(isAudit)) return emptyState();
    // Recovery validates shape, not trust: browser data never establishes identity.
    return copy({ version: 1, mode: ACCESS_MODE, session: stored.session,
      requests: stored.requests, users: stored.users, audit: stored.audit });
  } catch { return emptyState(); }
}

let state = loadPreview();

function persist(): void {
  try { getStorage()?.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* Preview remains usable in memory if browser storage is blocked. */ }
}

function notifyListeners(): void {
  for (const listener of [...listeners]) {
    try { listener({ session: getSession(), ...getAccessSnapshot() }); }
    catch { /* Presentation errors do not roll back a completed transition. */ }
  }
}

function publish(): void {
  persist();
  notifyListeners();
}

function id(prefix: string): string {
  // Record identity only, with no authentication purpose.
  let candidate: string;
  do {
    nextId += 1;
    candidate = `${prefix}-${Date.now().toString(36)}-${nextId.toString(36)}`;
  } while ([...state.requests, ...state.users, ...state.audit].some(record => record.id === candidate));
  return candidate;
}

function requiredText(value: unknown, field: string, label: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) fail('VALIDATION_ERROR', `Informe ${label}.`, field);
  return text;
}

function requireMaster(): Actor {
  const session = getSession();
  if (!session) fail('SESSION_REQUIRED', 'Abra a prévia master para administrar os acessos.');
  if (session.role !== 'master') fail('FORBIDDEN', 'Somente o perfil master pode realizar esta ação.');
  return { id: session.id, name: session.name, email: session.email };
}

function auditEvent(action: AuditEvent['action'], target: Actor, actor: Actor, details: Partial<AuditDetails>): void {
  state.audit.push({
    id: id('audit'), action, targetId: target.id, targetName: target.name, targetEmail: target.email,
    actor: copy(actor), createdAt: new Date().toISOString(),
    details: { fromRole: details.fromRole ?? null, toRole: details.toRole ?? null,
      reason: details.reason || '', requestId: details.requestId || '' },
  });
}

/** Independent copies prevent callers from changing the internal session. */
export function getSession(): Session | null {
  return state.session ? copy(state.session) : null;
}

/** Select an explicit interface persona. Does not create or authenticate an account. */
export function startPreview(role: string): Session {
  if (!isRole(role)) fail('INVALID_ROLE', 'Escolha o perfil master ou reader.');
  const session: Session = { id: `preview-${role}`, name: `Prévia ${role}`, email: '', role, isPreview: true };
  state.session = session;
  publish();
  return copy(session);
}

export function signOut(): void {
  state.session = null;
  publish();
}

export async function signIn({ email, password }: { email?: string; password?: string } = {}): Promise<Session> {
  void email;
  void password;
  fail('BACKEND_NOT_CONFIGURED', 'O login corporativo depende da conexão com o backend. Use a prévia de interface para explorar o MVP.');
}

/** Callers and observers never receive mutable references to the audit state. */
export function getAccessSnapshot(): AccessSnapshot {
  return copy({ requests: state.requests, users: state.users, audit: state.audit });
}

/** Callback receives independent { session, requests, users, audit } after changes. */
export function subscribeAccess(callback: AccessListener): () => void {
  if (typeof callback !== 'function') fail('INVALID_SUBSCRIBER', 'O observador de acessos deve ser uma função.');
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

/** Request input never includes a password or grants a chosen role. */
export async function submitAccessRequest(
  { name, email, department, reason }: Partial<AccessRequestInput> = {},
): Promise<AccessRequest> {
  const normalized: AccessRequestInput = {
    name: requiredText(name, 'name', 'seu nome'),
    email: requiredText(email, 'email', 'seu e-mail corporativo').toLowerCase(),
    department: requiredText(department, 'department', 'sua área ou departamento'),
    reason: requiredText(reason, 'reason', 'o motivo da solicitação'),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) fail('VALIDATION_ERROR', 'Informe um e-mail válido.', 'email');
  if (state.requests.some(request => request.email === normalized.email && request.status === 'pending')) {
    fail('DUPLICATE_REQUEST', 'Já existe uma solicitação pendente para este e-mail.', 'email');
  }
  if (state.users.some(user => user.email === normalized.email && user.status === 'active')) {
    fail('USER_ALREADY_ACTIVE', 'Este e-mail já possui um acesso ativo.', 'email');
  }
  const request: AccessRequest = {
    id: id('request'), ...normalized, status: 'pending', createdAt: new Date().toISOString(),
    reviewedAt: null, reviewedBy: null, rejectionReason: '',
  };
  state.requests.push(request);
  publish();
  return copy(request);
}

/** Review actor always comes from the internal session, never caller input. */
export async function reviewAccessRequest(requestId: string, decision: string, reason = ''): Promise<AccessRequest> {
  const actor = requireMaster();
  if (decision !== 'approved' && decision !== 'rejected') fail('INVALID_DECISION', 'Escolha aprovar ou rejeitar a solicitação.');
  const request = state.requests.find(item => item.id === requestId);
  if (!request) fail('REQUEST_NOT_FOUND', 'Solicitação não encontrada.');
  if (request.status !== 'pending') fail('STALE_REQUEST', 'Esta solicitação já foi analisada. Atualize a lista de acessos.');
  const explanation = typeof reason === 'string' ? reason.trim() : '';
  if (decision === 'rejected' && !explanation) fail('REJECTION_REASON_REQUIRED', 'Informe o motivo da rejeição.', 'reason');
  if (decision === 'approved' && state.users.some(user => user.email === request.email && user.status === 'active')) {
    fail('USER_ALREADY_ACTIVE', 'Este e-mail já possui um acesso ativo.');
  }
  const reviewedAt = new Date().toISOString();
  request.status = decision;
  request.reviewedAt = reviewedAt;
  request.reviewedBy = copy(actor);
  request.rejectionReason = decision === 'rejected' ? explanation : '';
  if (decision === 'approved') {
    const user: AccessUser = {
      id: id('user'), name: request.name, email: request.email, department: request.department,
      role: 'reader', status: 'active', requestId: request.id, approvedAt: reviewedAt, approvedBy: copy(actor),
    };
    state.users.push(user);
    auditEvent('access.approved', user, actor, { toRole: 'reader', reason: explanation, requestId: request.id });
  } else auditEvent('access.rejected', request, actor, { reason: explanation, requestId: request.id });
  publish();
  return copy(request);
}

export async function changeUserRole(userId: string, newRole: string): Promise<AccessUser> {
  const actor = requireMaster();
  if (!isRole(newRole)) fail('INVALID_ROLE', 'Escolha o perfil master ou reader.');
  const user = state.users.find(item => item.id === userId);
  if (!user) fail('USER_NOT_FOUND', 'Usuário não encontrado.');
  if (user.status !== 'active') fail('USER_NOT_ACTIVE', 'O acesso deste usuário não está ativo.');
  if (user.role === newRole) fail('ROLE_UNCHANGED', 'Este usuário já possui o perfil selecionado.');
  if (user.id === actor.id && user.role === 'master' && newRole === 'reader') fail('SELF_DEMOTION', 'Você não pode remover o próprio perfil master.');
  const masters = state.users.filter(item => item.status === 'active' && item.role === 'master');
  if (user.role === 'master' && newRole === 'reader' && masters.length <= 1) {
    fail('LAST_MASTER', 'Mantenha pelo menos um usuário master entre os acessos aprovados.');
  }
  const fromRole = user.role;
  user.role = newRole;
  auditEvent('role.changed', user, actor, { fromRole, toRole: newRole, requestId: user.requestId });
  publish();
  return copy(user);
}

export function roleLabel(role: unknown): string {
  return role === 'master' ? 'Master' : role === 'reader' ? 'Reader' : 'Sem perfil';
}

/** Remove this namespace only, without affecting contracts or other browser data. */
export function resetAccessPreview(): void {
  state = emptyState();
  try { getStorage()?.removeItem(STORAGE_KEY); }
  catch { /* State in memory is already empty. */ }
  notifyListeners();
}
