import { useTranslation } from 'react-i18next';
import { useColdStartNotice } from '../../hooks/useColdStartNotice';

export function ColdStartBanner() {
  const { t } = useTranslation();
  const show = useColdStartNotice();
  if (!show) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 w-[calc(100%-2rem)] max-w-xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-lg dark:border-amber-500/40 dark:bg-amber-950 dark:text-amber-200"
    >
      {t('banner.coldStart')}
    </div>
  );
}
