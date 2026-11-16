import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { useGetAgentsQuery } from '../../api/usersApi';
import { CATEGORIES, PRIORITIES, SLA_STATES, STATUSES, TIERS } from '../../types';
import { FILTER_KEYS, type FilterKey } from '../../utils/params';

export const SEARCH_DEBOUNCE_MS = 350;

/** Filters bar; all filter state lives in the URL search params. */
export function FiltersBar() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const role = useAppSelector((s) => s.auth.user?.role);
  const isStaff = role === 'agente' || role === 'admin';
  const { data: agents } = useGetAgentsQuery(undefined, { skip: !isStaff });

  const update = useCallback(
    (changes: Partial<Record<FilterKey, string>>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const urlQ = params.get('q') ?? '';
  const [q, setQ] = useState(urlQ);

  useEffect(() => setQ(urlQ), [urlQ]);
  useEffect(() => {
    if (q === urlQ) return;
    const id = setTimeout(() => update({ q: q.trim() }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q, urlQ, update]);

  const hasFilters = FILTER_KEYS.some((k) => params.get(k));

  const select = (key: FilterKey, label: string, options: { value: string; label: string }[]) => (
    <div className="min-w-[8.5rem] flex-1">
      <label htmlFor={`f-${key}`} className="label !mb-1 text-xs">
        {label}
      </label>
      <select
        id={`f-${key}`}
        className="input"
        value={params.get(key) ?? ''}
        onChange={(e) => update({ [key]: e.target.value })}
      >
        <option value="">{t('common.all')}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <form
      role="search"
      aria-label={t('tickets.filters')}
      onSubmit={(e) => e.preventDefault()}
      className="space-y-3 p-4"
    >
      <div>
        <label htmlFor="f-q" className="sr-only">
          {t('tickets.searchLabel')}
        </label>
        <input
          id="f-q"
          type="search"
          className="input"
          placeholder={t('tickets.searchPlaceholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        {select(
          'status',
          t('tickets.columns.status'),
          STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
        )}
        {select(
          'priority',
          t('tickets.columns.priority'),
          PRIORITIES.map((s) => ({ value: s, label: t(`priority.${s}`) })),
        )}
        {select(
          'category',
          t('tickets.columns.category'),
          CATEGORIES.map((s) => ({ value: s, label: t(`category.${s}`) })),
        )}
        {select(
          'tier',
          t('tickets.columns.tier'),
          TIERS.map((s) => ({ value: String(s), label: t(`tier.${s}`) })),
        )}
        {isStaff &&
          select('assigned_to', t('tickets.columns.assignee'), [
            { value: 'me', label: t('common.me') },
            { value: 'unassigned', label: t('common.unassigned') },
            ...(agents?.items ?? []).map((a) => ({ value: String(a.id), label: a.name })),
          ])}
        {select(
          'sla',
          t('tickets.columns.sla'),
          SLA_STATES.map((s) => ({ value: s, label: t(`sla.${s}`) })),
        )}
        {hasFilters && (
          <button
            type="button"
            className="btn-ghost !py-2"
            onClick={() => {
              setQ('');
              update(Object.fromEntries(FILTER_KEYS.map((k) => [k, ''])));
            }}
          >
            {t('common.clear')}
          </button>
        )}
      </div>
    </form>
  );
}
