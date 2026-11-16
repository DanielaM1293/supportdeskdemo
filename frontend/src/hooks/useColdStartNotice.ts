import { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { baseApi } from '../api/baseApi';
import type { RootState } from '../store';

const DELAY_MS = 4000;

interface ApiSlice {
  queries: Record<string, { status: string } | undefined>;
  mutations: Record<string, { status: string } | undefined>;
}

const selectApi = (s: RootState) => s[baseApi.reducerPath] as unknown as ApiSlice;

const selectPending = (s: RootState) => {
  const api = selectApi(s);
  return [...Object.values(api.queries), ...Object.values(api.mutations)].some(
    (e) => e?.status === 'pending',
  );
};

const selectAnySettled = (s: RootState) => {
  const api = selectApi(s);
  return [...Object.values(api.queries), ...Object.values(api.mutations)].some(
    (e) => e?.status === 'fulfilled' || e?.status === 'rejected',
  );
};

/**
 * True when the very first API request has been pending for more than 4 seconds
 * (free-tier backend cold start). Hides again as soon as any request settles.
 */
export function useColdStartNotice(delayMs: number = DELAY_MS): boolean {
  const pending = useAppSelector(selectPending);
  const settled = useAppSelector(selectAnySettled);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (settled || !pending) return;
    const id = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(id);
  }, [pending, settled, delayMs]);

  return slow && !settled;
}
