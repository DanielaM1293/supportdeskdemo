import { useTranslation } from 'react-i18next';
import type { Priority, SlaState, Status } from '../../types';
import { AlertIcon, CheckCircleIcon, ClockIcon, ShieldCheckIcon } from './Icons';

const SLA_STYLES: Record<SlaState, string> = {
  ok: 'bg-emerald-50 text-emerald-800 ring-emerald-600/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
  at_risk:
    'bg-amber-50 text-amber-900 ring-amber-600/30 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
  breached:
    'bg-red-50 text-red-800 ring-red-600/25 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30',
  met: 'bg-slate-100 text-slate-700 ring-slate-500/25 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/30',
};

const SLA_ICONS: Record<SlaState, typeof ClockIcon> = {
  ok: ClockIcon,
  at_risk: AlertIcon,
  breached: AlertIcon,
  met: ShieldCheckIcon,
};

/** SLA state: always icon + text, never colour alone. */
export function SlaBadge({ state }: { state: SlaState }) {
  const { t } = useTranslation();
  const Icon = SLA_ICONS[state];
  return (
    <span className={`badge ${SLA_STYLES[state]}`} data-state={state}>
      <Icon />
      {t(`sla.${state}`)}
    </span>
  );
}

const PRIORITY_STYLES: Record<Priority, string> = {
  baja: 'bg-ink-100 text-ink-600 ring-ink-300/50 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-600',
  media:
    'bg-sky-50 text-sky-800 ring-sky-600/25 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/30',
  alta: 'bg-orange-50 text-orange-800 ring-orange-600/25 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-400/30',
  critica:
    'bg-red-50 text-red-800 ring-red-600/30 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/30',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useTranslation();
  return (
    <span className={`badge ${PRIORITY_STYLES[priority]}`}>
      <span aria-hidden="true" className="text-[10px] leading-none">
        {{ baja: '▁', media: '▃', alta: '▅', critica: '▇' }[priority]}
      </span>
      {t(`priority.${priority}`)}
    </span>
  );
}

const STATUS_STYLES: Record<Status, string> = {
  abierto:
    'bg-brand-50 text-brand-800 ring-brand-600/25 dark:bg-brand-500/10 dark:text-brand-200 dark:ring-brand-400/30',
  en_progreso:
    'bg-violet-50 text-violet-800 ring-violet-600/25 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/30',
  esperando_usuario:
    'bg-amber-50 text-amber-900 ring-amber-600/30 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/30',
  resuelto:
    'bg-emerald-50 text-emerald-800 ring-emerald-600/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/30',
  cerrado:
    'bg-ink-100 text-ink-600 ring-ink-300/50 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-600',
};

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useTranslation();
  return (
    <span className={`badge ${STATUS_STYLES[status]}`}>
      {status === 'resuelto' || status === 'cerrado' ? (
        <CheckCircleIcon />
      ) : (
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {t(`status.${status}`)}
    </span>
  );
}
