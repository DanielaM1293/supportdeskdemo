import { useTranslation } from 'react-i18next';

interface Props {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

/** Compact list of page numbers with ellipses, e.g. 1 … 4 5 6 … 12. */
export function pageWindow(page: number, pages: number): (number | 'gap')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, 2, pages - 1, pages, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('gap');
    out.push(n);
  });
  return out;
}

export function Pagination({ page, pages, total, perPage, onPageChange }: Props) {
  const { t } = useTranslation();
  if (total === 0) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-200/70 px-4 py-3 dark:border-ink-800">
      <p className="text-sm text-ink-500 dark:text-ink-400">
        {t('tickets.summary', { from, to, total })}
      </p>
      <nav aria-label={t('tickets.pagination')} className="flex items-center gap-1">
        <button
          type="button"
          className={`${btn} hover:bg-ink-100 dark:hover:bg-ink-800`}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('tickets.previous')}
        </button>
        <span className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, pages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page ? 'page' : undefined}
                className={`${btn} ${
                  p === page ? 'bg-brand-600 text-white' : 'hover:bg-ink-100 dark:hover:bg-ink-800'
                }`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ),
          )}
        </span>
        <span className="px-2 text-sm text-ink-500 sm:hidden">
          {t('tickets.page', { page, pages })}
        </span>
        <button
          type="button"
          className={`${btn} hover:bg-ink-100 dark:hover:bg-ink-800`}
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('tickets.next')}
        </button>
      </nav>
    </div>
  );
}
