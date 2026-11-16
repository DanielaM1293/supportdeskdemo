export const ROLES = ['usuario', 'agente', 'admin'] as const;
export const STATUSES = [
  'abierto',
  'en_progreso',
  'esperando_usuario',
  'resuelto',
  'cerrado',
] as const;
export const CATEGORIES = ['hardware', 'software', 'red', 'accesos'] as const;
export const PRIORITIES = ['baja', 'media', 'alta', 'critica'] as const;
export const TIERS = [1, 2] as const;
export const SLA_STATES = ['ok', 'at_risk', 'breached', 'met'] as const;

export type Role = (typeof ROLES)[number];
export type Status = (typeof STATUSES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Tier = (typeof TIERS)[number];
export type SlaState = (typeof SLA_STATES)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface UserRef {
  id: number;
  name: string;
}

export interface AgentRef extends UserRef {
  role: Role;
}

export interface TicketSla {
  first_response_due: string | null;
  resolution_due: string | null;
  first_response_state: SlaState;
  resolution_state: SlaState;
  state: SlaState;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  tier: Tier;
  created_by: UserRef;
  assigned_to: UserRef | null;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  sla: TicketSla;
}

export interface Comment {
  id: number;
  body: string;
  internal: boolean;
  author: AgentRef;
  created_at: string;
}

export interface HistoryEntry {
  id: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  actor: UserRef;
  created_at: string;
}

export interface TicketDetail extends Ticket {
  comments: Comment[];
  history: HistoryEntry[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export type SortField = 'created_at' | 'updated_at' | 'priority' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface TicketFilters {
  page?: number;
  per_page?: number;
  q?: string;
  status?: Status | '';
  priority?: Priority | '';
  category?: Category | '';
  tier?: string;
  assigned_to?: string;
  sla?: SlaState | '';
  sort?: SortField;
  order?: SortOrder;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface DashboardStats {
  total: number;
  open_count: number;
  breached_count: number;
  by_status: Partial<Record<Status, number>>;
  by_category: Partial<Record<Category, number>>;
  by_priority: Partial<Record<Priority, number>>;
  avg_resolution_hours: number | null;
  sla_compliance_pct: number | null;
}

export interface UpdateTicketBody {
  status?: Status;
  priority?: Priority;
  category?: Category;
  tier?: Tier;
  assigned_to_id?: number | null;
}
