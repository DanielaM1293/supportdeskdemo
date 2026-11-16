import { baseApi, API_BASE } from './baseApi';
import { buildQuery } from '../utils/params';
import { fallbackFilename, filenameFromDisposition, saveBlob } from '../utils/download';
import type {
  Comment,
  Paginated,
  Ticket,
  TicketDetail,
  TicketFilters,
  UpdateTicketBody,
  Category,
  Priority,
} from '../types';

export type ExportFormat = 'csv' | 'xlsx';

export interface CreateTicketBody {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
}

export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTickets: build.query<Paginated<Ticket>, TicketFilters>({
      query: (filters) => `/tickets?${buildQuery(filters)}`,
      providesTags: (result) => [
        'Tickets',
        ...(result?.items ?? []).map((t) => ({ type: 'Ticket' as const, id: t.id })),
      ],
    }),
    getTicket: build.query<TicketDetail, number>({
      query: (id) => `/tickets/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Ticket', id }],
    }),
    createTicket: build.mutation<Ticket, CreateTicketBody>({
      query: (body) => ({ url: '/tickets', method: 'POST', body }),
      invalidatesTags: ['Tickets', 'Dashboard'],
    }),
    updateTicket: build.mutation<TicketDetail, { id: number; changes: UpdateTicketBody }>({
      query: ({ id, changes }) => ({ url: `/tickets/${id}`, method: 'PATCH', body: changes }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Ticket', id }, 'Tickets', 'Dashboard'],
    }),
    addComment: build.mutation<Comment, { ticketId: number; body: string; internal?: boolean }>({
      query: ({ ticketId, ...body }) => ({
        url: `/tickets/${ticketId}/comments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { ticketId }) => [{ type: 'Ticket', id: ticketId }, 'Tickets'],
    }),
  }),
});

export const {
  useGetTicketsQuery,
  useGetTicketQuery,
  useCreateTicketMutation,
  useUpdateTicketMutation,
  useAddCommentMutation,
} = ticketsApi;

/**
 * Downloads the filtered ticket list. Uses fetch + blob because the endpoint needs the
 * Bearer header, which a plain <a href> cannot send.
 */
export async function exportTickets(
  filters: TicketFilters,
  format: ExportFormat,
  token: string | null,
): Promise<string> {
  const { page: _page, per_page: _perPage, ...rest } = filters;
  void _page;
  void _perPage;
  const qs = buildQuery({ ...rest } as TicketFilters);
  const url = `${API_BASE}/tickets/export?${qs ? `${qs}&` : ''}format=${format}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const filename = filenameFromDisposition(
    res.headers.get('Content-Disposition'),
    fallbackFilename(format),
  );
  saveBlob(blob, filename);
  return filename;
}
