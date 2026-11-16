import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, isNetworkError } from '../../api/baseApi';

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-ink-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <span className="text-sm">{label ?? t('common.loading')}</span>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-ink-200/70 dark:bg-ink-800 ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  const { t } = useTranslation();
  return (
    <div role="status" aria-label={t('common.loading')} className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-6 ${c === 1 ? 'flex-[3]' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-xl text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
        ∅
      </div>
      <p className="font-semibold text-ink-800 dark:text-ink-100">{title}</p>
      {hint && <p className="max-w-sm text-sm text-ink-500 dark:text-ink-400">{hint}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  error,
  onRetry,
}: {
  title: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  const detail = isNetworkError(error)
    ? t('common.networkError')
    : (getErrorMessage(error) ?? t('common.unknownError'));
  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <p className="font-semibold text-red-700 dark:text-red-300">{title}</p>
      <p className="max-w-md text-sm text-ink-500 dark:text-ink-400">{detail}</p>
      {onRetry && (
        <button type="button" className="btn-secondary mt-2" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
    </div>
  );
}

export function InlineError({ error, fallback }: { error: unknown; fallback?: string }) {
  const { t } = useTranslation();
  const msg = isNetworkError(error)
    ? t('common.networkError')
    : (getErrorMessage(error) ?? fallback ?? t('common.unknownError'));
  return (
    <p
      role="alert"
      className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
    >
      {msg}
    </p>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 dark:text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
