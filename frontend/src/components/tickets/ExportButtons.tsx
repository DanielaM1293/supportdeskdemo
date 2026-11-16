import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { exportTickets, type ExportFormat } from '../../api/ticketsApi';
import type { TicketFilters } from '../../types';
import { DownloadIcon } from '../ui/Icons';

/** Exports with the CURRENT filters (pagination is ignored by the export endpoint). */
export function ExportButtons({ filters }: { filters: TicketFilters }) {
  const { t } = useTranslation();
  const token = useAppSelector((s) => s.auth.token);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [failed, setFailed] = useState(false);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    setFailed(false);
    try {
      await exportTickets(filters, format, token);
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {(['csv', 'xlsx'] as const).map((f) => (
        <button
          key={f}
          type="button"
          className="btn-secondary"
          disabled={busy !== null}
          onClick={() => void run(f)}
        >
          <DownloadIcon />
          {busy === f
            ? t('tickets.exporting')
            : f === 'csv'
              ? t('tickets.exportCsv')
              : t('tickets.exportExcel')}
        </button>
      ))}
      {failed && (
        <span role="alert" className="w-full text-xs font-medium text-red-600 dark:text-red-400">
          {t('tickets.exportError')}
        </span>
      )}
    </>
  );
}
