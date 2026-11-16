import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SortField, SortOrder, Ticket } from '../../types';
import { PriorityBadge, SlaBadge, StatusBadge } from '../ui/Badges';
import { ArrowDownIcon, ArrowUpIcon } from '../ui/Icons';
import { formatDateTime } from '../../utils/time';

interface Props {
  items: Ticket[];
  sort: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
}

const SORTABLE: Partial<Record<string, SortField>> = {
  priority: 'priority',
  status: 'status',
  created: 'created_at',
  updated: 'updated_at',
};

export function TicketsTable({ items, sort, order, onSort }: Props) {
  const { t, i18n } = useTranslation();
  const cols = [
    'id',
    'title',
    'category',
    'priority',
    'status',
    'tier',
    'assignee',
    'sla',
    'created',
  ] as const;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] border-collapse">
        <thead className="border-y border-ink-200/70 bg-ink-50/70 dark:border-ink-800 dark:bg-ink-950/40">
          <tr>
            {cols.map((c) => {
              const field = SORTABLE[c];
              const active = field && field === sort;
              return (
                <th
                  key={c}
                  scope="col"
                  className="th"
                  aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {field ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink-900 dark:hover:text-white"
                      aria-label={t('tickets.sortBy', { column: t(`tickets.columns.${c}`) })}
                      onClick={() => onSort(field)}
                    >
                      {t(`tickets.columns.${c}`)}
                      {active && (order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                    </button>
                  ) : (
                    t(`tickets.columns.${c}`)
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
          {items.map((tk) => (
            <tr key={tk.id} className="transition hover:bg-brand-50/40 dark:hover:bg-ink-800/40">
              <td className="td font-mono text-xs text-ink-500">#{tk.id}</td>
              <td className="td max-w-xs">
                <Link
                  to={`/tickets/${tk.id}`}
                  className="line-clamp-2 font-semibold text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
                >
                  {tk.title}
                </Link>
                <span className="text-xs text-ink-400">{tk.created_by.name}</span>
              </td>
              <td className="td">{t(`category.${tk.category}`)}</td>
              <td className="td">
                <PriorityBadge priority={tk.priority} />
              </td>
              <td className="td">
                <StatusBadge status={tk.status} />
              </td>
              <td className="td">{t(`tier.${tk.tier}`)}</td>
              <td className="td">
                {tk.assigned_to?.name ?? (
                  <span className="text-ink-400">{t('common.unassigned')}</span>
                )}
              </td>
              <td className="td">
                <SlaBadge state={tk.sla.state} />
              </td>
              <td className="td whitespace-nowrap text-ink-500">
                {formatDateTime(tk.created_at, i18n.language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
