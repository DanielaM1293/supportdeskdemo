import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetTicketsQuery } from '../api/ticketsApi';
import { filtersFromParams } from '../utils/params';
import type { SortField } from '../types';
import { FiltersBar } from '../components/tickets/FiltersBar';
import { TicketsTable } from '../components/tickets/TicketsTable';
import { Pagination } from '../components/tickets/Pagination';
import { ExportButtons } from '../components/tickets/ExportButtons';
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from '../components/ui/Feedback';
import { PlusIcon } from '../components/ui/Icons';

export default function TicketsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const filters = filtersFromParams(params);
  const sort = filters.sort ?? 'created_at';
  const order = filters.order ?? 'desc';
  const { data, error, isLoading, isFetching, refetch } = useGetTicketsQuery(filters);

  const onSort = (field: SortField) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const nextOrder = sort === field && order === 'desc' ? 'asc' : 'desc';
        next.set('sort', field);
        next.set('order', nextOrder);
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const onPage = (page: number) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (page > 1) next.set('page', String(page));
        else next.delete('page');
        return next;
      },
      { replace: true },
    );

  return (
    <>
      <PageHeader
        title={t('tickets.title')}
        subtitle={t('tickets.subtitle')}
        actions={
          <>
            <ExportButtons filters={filters} />
            <Link to="/tickets/new" className="btn-primary">
              <PlusIcon />
              {t('tickets.new')}
            </Link>
          </>
        }
      />
      <section className="card overflow-hidden">
        <FiltersBar />
        <div
          aria-busy={isFetching}
          className={isFetching && !isLoading ? 'opacity-60 transition' : ''}
        >
          {isLoading ? (
            <TableSkeleton />
          ) : error ? (
            <ErrorState
              title={t('tickets.loadError')}
              error={error}
              onRetry={() => void refetch()}
            />
          ) : data && data.items.length === 0 ? (
            <EmptyState
              title={t('tickets.empty')}
              hint={t('tickets.emptyHint')}
              action={
                <Link to="/tickets/new" className="btn-primary mt-3">
                  {t('tickets.new')}
                </Link>
              }
            />
          ) : data ? (
            <>
              <TicketsTable items={data.items} sort={sort} order={order} onSort={onSort} />
              <Pagination
                page={data.page}
                pages={data.pages}
                total={data.total}
                perPage={data.per_page}
                onPageChange={onPage}
              />
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
