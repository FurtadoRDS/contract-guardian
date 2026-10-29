export type Role = 'master' | 'reader';

export interface Actor {
  id: string;
  name: string;
  email: string;
}

export interface Session extends Actor {
  role: Role;
  isPreview: true;
}

export interface AccessRequestInput {
  name: string;
  email: string;
  department: string;
  reason: string;
}

export interface AccessRequest extends AccessRequestInput {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: Actor | null;
  rejectionReason: string;
}

export interface AccessUser extends Actor {
  department: string;
  role: Role;
  status: 'active';
  requestId: string;
  approvedAt: string;
  approvedBy: Actor;
}

export interface AuditDetails {
  fromRole: Role | null;
  toRole: Role | null;
  reason: string;
  requestId: string;
}

export interface AuditEvent {
  id: string;
  action: 'access.approved' | 'access.rejected' | 'role.changed';
  targetId: string;
  targetName: string;
  targetEmail: string;
  actor: Actor;
  createdAt: string;
  details: AuditDetails;
}

export interface AccessSnapshot {
  requests: AccessRequest[];
  users: AccessUser[];
  audit: AuditEvent[];
}

export interface AccessChange extends AccessSnapshot {
  session: Session | null;
}

export type AccessDecision = 'approved' | 'rejected';
export type SignatureStatus = '' | 'Assinado' | 'Pendente' | 'Em revisão';
export type ContractStatus = 'Ativo' | 'Pendente' | 'Expirado';

export interface Contractor {
  name: string;
  cnpj: string;
  type: '' | 'Matriz' | 'Filial';
  city: string;
}

export interface Provider {
  name: string;
  cnpj: string;
  category: string;
  email: string;
  phone: string;
}

export interface SourceDocument {
  name: string;
  type: string;
  size: number;
}

export interface Contract {
  id: string;
  company: string;
  initials: string;
  color: string;
  category: string;
  scope: string;
  start: string;
  end: string;
  monthly: number;
  total: number;
  signature: SignatureStatus;
  renewal: string;
  contractor: Contractor;
  provider: Provider;
  createdAt: string;
  sourceDocument?: SourceDocument;
}

export type ContractTiming = Pick<Contract, 'start' | 'end' | 'signature'>;
export type ContractMonthlyFields = Pick<Contract, 'start' | 'end' | 'signature' | 'monthly'>;

/** Signature is deliberately excluded: document extraction cannot confirm it. */
export type DocumentExtractedFields = Partial<Pick<Contract,
  'category' | 'scope' | 'start' | 'end' | 'monthly' | 'total' | 'renewal'
>> & {
  contractor?: Partial<Contractor>;
  provider?: Partial<Provider>;
};

export interface DocumentAnalysisResult {
  fields: DocumentExtractedFields;
}

export type ToastType = 'success' | 'error' | 'info';
export type Notify = (message: string, type?: ToastType) => void;

export interface MonthlyPoint {
  month: string;
  label: string;
  value: number;
  comparison: number;
  projected: boolean;
  year?: number;
}
