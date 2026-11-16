import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { loggedOut } from '../store/authSlice';

export const API_URL: string = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(
  /\/+$/,
  '',
);
export const API_BASE = `${API_URL}/api`;

interface TokenState {
  auth: { token: string | null };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as TokenState).auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

/** Wraps the base query: any 401 clears the session (route guards redirect to /login). */
const baseQueryWithAuth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extra,
) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401) {
    api.dispatch(loggedOut());
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Ticket', 'Tickets', 'Users', 'Agents', 'Dashboard', 'Me'],
  endpoints: () => ({}),
});

/** Extracts the backend `{error}` message from an RTK Query error, if any. */
export function getErrorMessage(error: unknown): string | null {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'error' in data) {
      const msg = (data as { error?: unknown }).error;
      if (typeof msg === 'string') return msg;
    }
  }
  return null;
}

export function isNetworkError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error
    ? (error as { status: unknown }).status === 'FETCH_ERROR'
    : false;
}
