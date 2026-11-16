import type { TicketFilters } from '../types';

export const FILTER_KEYS = [
  'q',
  'status',
  'priority',
  'category',
  'tier',
  'assigned_to',
  'sla',
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

export function filtersFromParams(params: URLSearchParams): TicketFilters {
  const filters: Record<string, string | number> = {};
  for (const key of [...FILTER_KEYS, 'sort', 'order']) {
    const v = params.get(key);
    if (v) filters[key] = v;
  }
  const page = Number(params.get('page'));
  filters.page = Number.isInteger(page) && page > 0 ? page : 1;
  filters.per_page = 10;
  return filters as TicketFilters;
}

/** Query string for the backend, skipping empty values. */
export function buildQuery(filters: TicketFilters): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  return sp.toString();
}
